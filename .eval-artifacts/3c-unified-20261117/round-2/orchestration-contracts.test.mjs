import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../live.mjs',import.meta.url),'utf8');
const helpers=source.slice(source.indexOf('function trackPhotoRead('),source.indexOf('const snapshot='));
const inspect=source.slice(source.indexOf('async function inspectArtifacts()'),source.indexOf('\ntry{\n for(const key'));
function context(value){return vm.createContext({row:{photoSnapshots:[],photoContentLoads:[],evaluatorSeverity:{},independentS0:'NOT_EVALUATED'},pendingPhotoReads:new Set(),existsSync:()=>true,readdir:async()=>['result.evaluation.json'],readFile:async()=>JSON.stringify(value),before:new Set(),tmp:'fixture'});}
for(const key of ['S0','S0_DECLARATION','S0_BOUNDARY'])test('Live stops on actual evaluator '+key+' PRESENT',async()=>{
 const scope=context({severity:{[key]:{status:'PRESENT'}}});vm.runInContext(inspect,scope);await assert.rejects(scope.inspectArtifacts(),/SUSPECTED_S0/);assert.equal(scope.row.evaluatorSeverity['result.evaluation.json'][key],'PRESENT');
});
test('Live retains NOT_EVALUATED without inventing an independent review',async()=>{
 const scope=context({severity:{S0:{status:'NOT_EVALUATED'},S0_DECLARATION:{status:'NOT_EVALUATED'},S0_BOUNDARY:{status:'NOT_EVALUATED'}}});vm.runInContext(inspect,scope);await scope.inspectArtifacts();assert.equal(scope.row.evaluatorSeverity['result.evaluation.json'].S0,'NOT_EVALUATED');assert.equal(scope.row.independentS0,'NOT_EVALUATED');
});
test('Live waits for captured photo JSON and distinguishes an eight-item list from one successfully loaded image',async()=>{
 const scope=context({});vm.runInContext(helpers,scope);let release;const delayed=new Promise(r=>release=r);scope.trackPhotoRead(delayed.then(()=>{scope.row.photoSnapshots.push({candidateId:'one',scope:'gallery',status:'READY',photos:Array.from({length:8},(_,i)=>({id:String(i)})),requests:{googleDetails:1,googleMedia:2,websitePages:0,websiteImages:0}});}));
 scope.row.photoContentLoads=[{path:'/one/content',status:200,bodyCompleted:true},{path:'/one/content',status:200,bodyCompleted:true},{path:'/bad/content',status:410,bodyCompleted:true}];
 let settled=false;const done=scope.settlePhotoReads().then(()=>settled=true);await Promise.resolve();assert.equal(settled,false);release();await done;scope.row.enteredAbout=true;scope.row.photoSnapshots.push({candidateId:'one',scope:'cover',photos:[{id:'0'}]});scope.summarizePhotos();assert.equal(scope.row.photoListCount,8);assert.equal(scope.row.photoContentHttp200Count,2);assert.equal(scope.row.photoContentHttp200DistinctCount,1);
});
for(const [phase,kind,expected]of [['NEEDS_INPUT','OTHER_FAILURE','NEEDS_INPUT'],['NEEDS_INPUT','NO_QUALIFIED_RESULTS','NEEDS_INPUT'],['NO_VERIFIED_RESULT','ALL_SOURCES_FAILED','ALL_SOURCES_FAILED'],['NEEDS_INPUT','MODEL_FAILURE','MODEL_FAILURE'],['NO_VERIFIED_RESULT','NO_QUALIFIED_RESULTS','NO_QUALIFIED_RESULTS']])test('Live terminal reason preserves '+phase+'/'+kind,()=>{
 const scope=context({});vm.runInContext(helpers,scope);assert.equal(scope.terminalBlock({case:{phase},restaurant:{readStatus:{kind}}}),expected);
});
