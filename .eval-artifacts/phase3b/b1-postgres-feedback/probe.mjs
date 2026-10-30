import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import {NodePostgresDatabase} from '../../../src/infrastructure/postgres/node-postgres-database.ts';
import {applyPostgresMigrations} from '../../../src/infrastructure/postgres/migrations.ts';
import {PostgresAgentWorkspaceStore} from '../../../src/infrastructure/postgres/postgres-agent-workspace-store.ts';
import {PostgresTaskRuntime} from '../../../src/infrastructure/postgres/postgres-task-runtime.ts';
import {restaurantBookingTaskDefinition} from '../../../src/domains/restaurant/task-definition.ts';
import {PersistentRestaurantAgentApplication,WorkspaceCaseNotFoundError} from '../../../src/application/persistent-restaurant-agent.ts';

const root='.eval-artifacts/phase3b/b1-postgres-feedback';
const load=p=>JSON.parse(readFileSync(p,'utf8')),save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const cluster=load(root+'/cluster.json'),phase=process.argv[2];
assert(['red','green','resume'].includes(phase));
assert(/^\/private\/tmp\/praxis-b1-pg-[A-Za-z0-9_-]+$/.test(cluster.root));
assert.equal(realpathSync(cluster.socket),resolve(cluster.root,'socket'));
assert.equal(load(cluster.root+'/probe-owner.json').runId,cluster.runId);
for(const f of load(root+'/freeze.json').files)assert.equal(hash(readFileSync(f.path)),f.sha256,f.path);
globalThis.fetch=async()=>{throw Error('EXTERNAL_NETWORK_FORBIDDEN');};
const all=[];
function database(name,tag){
 assert(['postgres','b1_feedback_red','b1_feedback_green'].includes(name));
 const db=new NodePostgresDatabase({host:cluster.socket,port:cluster.port,user:cluster.user,database:name,max:1,
  application_name:'b1-local:'+tag,connectionTimeoutMillis:5000,options:'-c statement_timeout=5000 -c lock_timeout=5000 -c idle_in_transaction_session_timeout=15000'});
 all.push(db);return db;
}
const NOW='2026-10-29T12:10:00.000Z',clock={now:()=>new Date(NOW)};
const forbidden=async()=>{throw Error('MODEL_SOURCE_OR_BOOKING_CALL_FORBIDDEN');};
function app(db,at=NOW){return new PersistentRestaurantAgentApplication({database:db,clock:{now:()=>new Date(at)},
 semanticInterpreter:{interpret:forbidden},agentDecision:{decide:forbidden},restaurantSearch:{search:forbidden},restaurantAvailability:{check:forbidden},
 executionRouterOptions:{structuredReadTimeoutMs:5000,browserReadTimeoutMs:5000},agentLoopOptions:{maxSteps:1,maxRejectedActions:1,timeoutMs:5000}});}
function barrier(n){let count=0,release;const ready=new Promise(r=>release=r);return {async arrive(){if(++count===n)release();await ready;},get count(){return count;}};}
function concurrentDatabase(db,gate,pids){return {query:db.query.bind(db),transaction:cb=>db.transaction(async tx=>{
 const r=await tx.query('SELECT pg_backend_pid() AS pid');pids.add(r.rows[0].pid);await gate.arrive();return cb(tx);
})};}
async function seedCase(db,id,user){
 const store=new PostgresAgentWorkspaceStore(db);await store.upsertUser({id:user,displayName:'Synthetic database test user'},NOW);
 const runtime=new PostgresTaskRuntime(db,restaurantBookingTaskDefinition,clock,p=>p+':'+randomUUID());
 await runtime.createTask(id,{}, {runId:'run:'+id});
 await store.createConversation({id:'conversation:'+id,userId:user,rootTaskId:id,createRequestId:'create:'+id,title:'Synthetic B1 persistence fixture',now:NOW});
}
const departure=(caseId,user,requestId,now=NOW)=>({userId:user,caseId,expectedVersion:0,requestId,candidateId:'fixture:candidate',offerId:'fixture:offer',provider:'TABELOG',now});
async function snapshotTasks(db){
 const tasks=(await db.query('SELECT * FROM tasks ORDER BY id')).rows;
 const events=(await db.query('SELECT * FROM task_events ORDER BY task_id, task_version')).rows;
 const commands=(await db.query('SELECT * FROM task_commands ORDER BY id')).rows;
 return {tasks,events,commands};
}
async function inspectSchema(db){
 const migrations=(await db.query('SELECT id FROM praxis_schema_migrations ORDER BY id')).rows;
 assert.equal(migrations.length,10);assert.equal(migrations.at(-1).id,'0010-restaurant-booking-handoff-feedback');
 const columns=(await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='restaurant_booking_departures' ORDER BY ordinal_position")).rows.map(r=>r.column_name);
 assert.deepEqual(columns,['id','conversation_id','request_id','candidate_id','offer_id','provider','departed_at','prompted_at','answer','answered_at','provenance']);
 const indexes=(await db.query("SELECT indexdef FROM pg_indexes WHERE tablename='restaurant_booking_departures' ORDER BY indexname")).rows;
 assert.ok(indexes.some(r=>/CREATE UNIQUE INDEX restaurant_booking_feedback_once_per_case_idx/.test(r.indexdef)&&/WHERE \(prompted_at IS NOT NULL\)/.test(r.indexdef)));
 const before=hash({migrations,columns,indexes});await applyPostgresMigrations(db);
 const afterRows=(await db.query('SELECT id FROM praxis_schema_migrations ORDER BY id')).rows;assert.deepEqual(afterRows,migrations);
 return {migrations,columns,indexes,repeatApply:'UNCHANGED',schemaHash:before};
}
async function indexControl(db,mutant){
 const id='case:index-control';await seedCase(db,id,'index-user');const store=new PostgresAgentWorkspaceStore(db);
 const a=await store.recordBookingDeparture(departure(id,'index-user','index-a'));
 const b=await store.recordBookingDeparture(departure(id,'index-user','index-b'));
 if(mutant)await db.query('DROP INDEX restaurant_booking_feedback_once_per_case_idx');
 const gate=barrier(2),pids=new Set();
 const workers=[0,1].map(i=>database(mutant?'b1_feedback_red':'b1_feedback_green','index-'+i));
 const results=await Promise.allSettled([a,b].map((receipt,i)=>concurrentDatabase(workers[i],gate,pids).transaction(tx=>tx.query('UPDATE restaurant_booking_departures SET prompted_at=$2 WHERE id=$1 RETURNING id',[receipt.id,NOW]))));
 assert.equal(pids.size,2);
 const count=Number((await db.query('SELECT COUNT(*) AS count FROM restaurant_booking_departures WHERE conversation_id=$1 AND prompted_at IS NOT NULL',['conversation:'+id])).rows[0].count);
 const result={mode:'REAL_POSTGRES_INDEX_GUARD_CONTROL_NOT_PRODUCT_REPRODUCTION',indexPresent:!mutant,backendPIDs:[...pids],barrierArrivals:gate.count,
  successfulTransactions:results.filter(r=>r.status==='fulfilled').length,rejectedSQLStates:results.filter(r=>r.status==='rejected').map(r=>r.reason.code),promptedRows:count,expectedAtMost:1};
 save(root+'/'+(mutant?'red':'index-green')+'.json',result);console.log(JSON.stringify(result));
 assert.equal(count,1,'at most one prompted departure per Case');
 assert.equal(result.successfulTransactions,1);assert.deepEqual(result.rejectedSQLStates,['23505']);
}
async function green(db){
 const schema=await inspectSchema(db);await indexControl(db,false);
 const cases=[['case:A','user-a'],['case:B','user-a'],['case:C','user-b'],['case:D','user-a']];
 for(const [id,user] of cases)await seedCase(db,id,user);
 const stateBefore=await snapshotTasks(db),store=new PostgresAgentWorkspaceStore(db),base=app(db);
 const workers=Array.from({length:8},(_,i)=>database('b1_feedback_green','product-'+i));
 const duplicateGate=barrier(8),duplicatePIDs=new Set();
 const duplicates=await Promise.all(workers.map(w=>new PostgresAgentWorkspaceStore(concurrentDatabase(w,duplicateGate,duplicatePIDs)).recordBookingDeparture(departure('case:A','user-a','same-departure','2026-10-29T12:00:00.000Z'))));
 assert.equal(duplicatePIDs.size,8);assert.equal(new Set(duplicates.map(r=>r.id)).size,1);
 await assert.rejects(store.recordBookingDeparture({...departure('case:A','user-a','same-departure'),candidateId:'different'}),/another handoff/);
 await assert.rejects(store.recordBookingDeparture({...departure('case:A','user-a','stale'),expectedVersion:99}));
 const latest=await store.recordBookingDeparture(departure('case:A','user-a','newer-departure','2026-10-29T12:01:00.000Z'));
 await assert.rejects(base.answerBookingFeedback({userId:'user-a',caseId:'case:A',departureId:latest.id,answer:'YES'}),/claimed departure prompt/);
 const claimGate=barrier(8),claimPIDs=new Set();
 const claims=await Promise.all(workers.map(w=>app(concurrentDatabase(w,claimGate,claimPIDs)).claimBookingFeedback('user-a','case:A')));
 assert.equal(claimPIDs.size,8);assert.equal(claimGate.count,8);assert.equal(claims.filter(Boolean).length,1);
 const prompt=claims.find(Boolean);assert.equal(prompt.departure.id,latest.id);assert.equal(prompt.question,'Did you get the booking?');assert.deepEqual(prompt.options,['YES','NO','SKIP']);
 await assert.rejects(base.claimBookingFeedback('user-b','case:A'),e=>e instanceof WorkspaceCaseNotFoundError);
 await assert.rejects(base.answerBookingFeedback({userId:'user-b',caseId:'case:A',departureId:latest.id,answer:'YES'}),e=>e instanceof WorkspaceCaseNotFoundError);
 await assert.rejects(store.recordBookingDeparture(departure('case:A','user-b','foreign-user')),/not available/);
 const answerGate=barrier(8),answerPIDs=new Set();
 const answers=await Promise.all(workers.map(w=>app(concurrentDatabase(w,answerGate,answerPIDs)).answerBookingFeedback({userId:'user-a',caseId:'case:A',departureId:latest.id,answer:'YES'})));
 assert.equal(answerPIDs.size,8);assert.ok(answers.every(a=>JSON.stringify(a)===JSON.stringify(answers[0])));
 await assert.rejects(base.answerBookingFeedback({userId:'user-a',caseId:'case:A',departureId:latest.id,answer:'NO'}),/already been recorded/);
 const receipts={'case:A':answers[0]};
 for(const [id,user] of cases.slice(1)){
  await store.recordBookingDeparture(departure(id,user,'depart-'+id));const p=await base.claimBookingFeedback(user,id);assert.ok(p);
  if(id==='case:B')await assert.rejects(base.answerBookingFeedback({userId:user,caseId:id,departureId:latest.id,answer:'NO'}),/this Case/);
  receipts[id]=id==='case:D'?p.departure:await base.answerBookingFeedback({userId:user,caseId:id,departureId:p.departure.id,answer:id==='case:B'?'NO':'SKIP'});
 }
 await assert.rejects(base.answerBookingFeedback({userId:'user-a',caseId:'case:B',departureId:receipts['case:B'].id,answer:'MAYBE'}),/Yes, No or Skip/);
 await assert.rejects(db.query("UPDATE restaurant_booking_departures SET provenance='PROVIDER_CONFIRMED' WHERE id=$1",[latest.id]),{code:'23514'});
 await assert.rejects(db.query("UPDATE restaurant_booking_departures SET answer='YES',answered_at=$2 WHERE id=$1",[duplicates[0].id,NOW]),{code:'23514'});
 const stateAfter=await snapshotTasks(db);assert.deepEqual(stateAfter,stateBefore);
 const rows=(await db.query('SELECT conversation_id,COUNT(*) FILTER (WHERE prompted_at IS NOT NULL) AS prompts FROM restaurant_booking_departures GROUP BY conversation_id ORDER BY conversation_id')).rows;
 assert.ok(rows.every(r=>Number(r.prompts)===1));
 const server=(await db.query('SELECT version() AS version,pg_postmaster_start_time() AS started,inet_server_addr() AS tcp')).rows[0];assert.match(server.version,/^PostgreSQL 17\.10/);assert.equal(server.tcp,null);
 const result={schema,server,nodePID:process.pid,duplicateDeparturePIDs:[...duplicatePIDs],claimPIDs:[...claimPIDs],answerPIDs:[...answerPIDs],claimWinners:1,
  duplicateDepartures:8,duplicateAnswers:8,firstDeparture:duplicates[0],rows,receipts,cases,taskSnapshot:stateBefore,taskSnapshotHash:hash(stateBefore),checks:{crossUser:'REJECTED',crossCase:'REJECTED',changedAnswer:'REJECTED',invalidEnum:'REJECTED',staleTask:'REJECTED',PIIColumns:'ABSENT',provenance:'USER_REPORTED_ONLY',taskStateOutcomeEventsCommands:'UNCHANGED'},externalCalls:0};
 save(root+'/green.json',result);console.log(JSON.stringify({phase:'green',status:'PASS',independentClaimConnections:claimPIDs.size,claimWinners:1,newExternalCalls:0}));
}
async function resume(db){
 const prior=load(root+'/green.json'),base=app(db,'2026-10-29T12:30:00.000Z'),store=new PostgresAgentWorkspaceStore(db),schema=await inspectSchema(db);
 assert.notEqual(process.pid,prior.nodePID);
 const server=(await db.query('SELECT pg_postmaster_start_time() AS started,inet_server_addr() AS tcp')).rows[0];assert.equal(server.tcp,null);assert.notEqual(new Date(server.started).toISOString(),prior.server.started);
 for(const [id,user] of prior.cases){
  assert.equal(await base.claimBookingFeedback(user,id),undefined);
  assert.equal(await store.hasUnpromptedBookingDeparture('conversation:'+id),false);
  const old=prior.receipts[id];
  if(old.answer){const again=await base.answerBookingFeedback({userId:user,caseId:id,departureId:old.id,answer:old.answer});assert.deepEqual(again,old);}
 }
 const duplicate=await store.recordBookingDeparture(departure('case:A','user-a','same-departure','2026-10-29T12:30:00.000Z'));
 assert.deepEqual(duplicate,prior.firstDeparture,'repeat departure after restart retains its original id and time');
 await store.recordBookingDeparture(departure('case:A','user-a','post-restart-departure'));
 assert.equal(await base.claimBookingFeedback('user-a','case:A'),undefined,'another handoff in same Case cannot re-ask');
 const after=await snapshotTasks(db);assert.equal(hash(after),prior.taskSnapshotHash);
 const counts=(await db.query('SELECT conversation_id,COUNT(*) FILTER(WHERE prompted_at IS NOT NULL) AS count FROM restaurant_booking_departures GROUP BY conversation_id')).rows;
 assert.ok(counts.every(r=>Number(r.count)===1));
 const result={status:'PASS',nodePID:process.pid,priorNodePID:prior.nodePID,server,priorPostmasterStarted:prior.server.started,schema,
  casesNotReasked:4,answeredCases:3,unansweredCases:1,laterDepartureSameCase:'NOT_REASKED',taskSnapshotHash:hash(after),externalCalls:0};
 save(root+'/resume.json',result);console.log(JSON.stringify(result));
}
let failure;
try{
 if(phase!=='resume'){
  const admin=database('postgres','admin');await admin.query('CREATE DATABASE '+(phase==='red'?'b1_feedback_red':'b1_feedback_green'));
 }
 const db=database(phase==='red'?'b1_feedback_red':'b1_feedback_green',phase);
 await applyPostgresMigrations(db);
 if(phase==='red')await indexControl(db,true);else if(phase==='green')await green(db);else await resume(db);
}catch(e){failure=e;console.error(JSON.stringify({phase,status:'FAILED',name:e.name,code:e.code??null,message:e.message,actual:e.actual,expected:e.expected}));}
finally{await Promise.all(all.map(db=>db.close()));}
if(failure)process.exitCode=1;
