import { PGlite, type Transaction } from "@electric-sql/pglite";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { PersistentRestaurantAgentApplication, PilotSessionService } from "../../../../application/persistent-restaurant-agent.js";
import { RunBoundedModelGateway } from "../../../../application/run-bounded-model-gateway.js";
import { DeliveryReservedModelGateway } from "../../../../application/delivery-reserved-model-gateway.js";
import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET, type LiveReadInvestigationBudget } from "../../../../application/live-read-investigation-budget.js";
import type { RestaurantCaseView } from "../../../../application/agent-workspace.js";
import { withBookingHandoffs } from "../../../../application/restaurant-booking-handoff.js";
import type { ModelGateway, ModelRequest, ModelResponse } from "../../../../core/model/contracts.js";
import type { RuntimeClock } from "../../../../core/task-runtime/contracts.js";
import { RestaurantSemanticInterpreter } from "../../../../domains/restaurant/semantic-interpreter.js";
import { RestaurantPartySizeSupplementResolver } from "../../../../domains/restaurant/party-size-supplement-resolver.js";
import { RestaurantAgentDecision } from "../../../../domains/restaurant/agent-decision.js";
import { applyPostgresMigrations } from "../../../../infrastructure/postgres/migrations.js";
import type { SqlDatabase, SqlExecutor, SqlQueryResult } from "../../../../infrastructure/postgres/sql-database.js";
import { createLiveReadAssembly, type LiveReadTransports } from "../../../../integrations/restaurant-search/live-read-assembly.js";
import type { DiscoverySourcePack } from "../../../../integrations/restaurant-search/source-packs.js";
import { createLocalWebServer } from "../../../../server/local-web-server.js";

export const G6_LIMITS: LiveReadInvestigationBudget = { ...LIVE_READ_DEBUG_INVESTIGATION_BUDGET, maxGoogleRequests:40 };
export const G6_USER = "g6-development-user";
export interface G6ModelCall { request:ModelRequest; response?:ModelResponse; error?:string; startedAt:string; elapsedMs:number; }

class LocalDatabase implements SqlDatabase {
  constructor(private readonly database:PGlite) {}
  async query<Row>(sql:string,parameters:readonly unknown[]=[]):Promise<SqlQueryResult<Row>> {
    const r=await this.database.query<Row>(sql,[...parameters]);return {rows:r.rows,affectedRows:r.affectedRows??0};
  }
  transaction<T>(callback:(tx:SqlExecutor)=>Promise<T>):Promise<T> {
    return this.database.transaction((tx:Transaction)=>callback({async query<Row>(sql:string,parameters:readonly unknown[]=[]) {
      const r=await tx.query<Row>(sql,[...parameters]);return {rows:r.rows,affectedRows:r.affectedRows??0};
    }}));
  }
}

/** Shared eval/Runner composition. No business Port, State or accepted-evidence override. */
export async function createG6Session(input:Omit<LiveReadTransports,"currentTaskId"|"remainingModelCalls"> & {
  packs?:readonly DiscoverySourcePack[];limits?:LiveReadInvestigationBudget;
}) {
  const clock:RuntimeClock=input.clock,limits=input.limits??G6_LIMITS;
  const raw=await PGlite.create(),database=new LocalDatabase(raw);await applyPostgresMigrations(database);
  const calls:G6ModelCall[]=[];
  const transport:ModelGateway={async complete(request){
    const call:G6ModelCall={request:structuredClone(request),startedAt:clock.now().toISOString(),elapsedMs:0};calls.push(call);
    const start=performance.now();try{const response=await input.model.complete(request);call.response=structuredClone(response);return response;}
    catch(error){call.error=error instanceof Error?error.message:"MODEL_TRANSPORT_FAILED";throw error;}
    finally{call.elapsedMs=performance.now()-start;}
  }};
  const budget=new RunBoundedModelGateway(transport,limits.maxModelCalls,limits.maxAutomaticBrowserMs,()=>clock.now().valueOf());
  const model=new DeliveryReservedModelGateway(budget);
  const assembly=createLiveReadAssembly({...limits,...(input.packs?{packs:input.packs}:{})}, {
    ...input,model,clock,currentTaskId:()=>budget.currentTaskId(),remainingModelCalls:id=>budget.remainingCalls(id),
  });
  const application=new PersistentRestaurantAgentApplication({database,clock,
    semanticInterpreter:new RestaurantSemanticInterpreter(model),partySizeSupplementResolver:new RestaurantPartySizeSupplementResolver(model),agentDecision:new RestaurantAgentDecision(model),
    restaurantSearch:assembly.search,restaurantAvailability:assembly.availability,restaurantFacts:assembly.facts,restaurantQuestions:assembly.questions,
    executionRouterOptions:assembly.router,agentLoopOptions:assembly.loop,modelRunBudget:budget,workspaceMode:"LIVE_READ",liveReadLimits:assembly.runCeilings});
  await application.store.upsertUser({id:G6_USER,displayName:"G6 development fixture"},clock.now().toISOString());
  const project=(view:RestaurantCaseView)=>withBookingHandoffs(view,assembly.bookingHandoffs.readPrepared(view),clock.now().toISOString());
  async function finished<T>(work:()=>Promise<T>,timeoutMs=limits.maxAutomaticBrowserMs+1_000):Promise<T> {
    let resolve!:()=>void;const done=new Promise<void>(r=>{resolve=r;});
    const unsubscribe=application.subscribeReadFinished(()=>resolve());let timer:ReturnType<typeof setTimeout>|undefined;
    try {const result=await work();await Promise.race([done,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("G6 read lifecycle did not finish")),timeoutMs);})]);return result;}
    finally{unsubscribe();if(timer)clearTimeout(timer);}
  }
  return {application,assembly,budget,model,calls,clock,database,project,finished,
    async view(caseId:string){return project(await application.getCase(G6_USER,caseId));},
    async create(request:string,id="g6-create") {const created=await finished(()=>application.createCase(G6_USER,request,id));return project(await application.getCase(G6_USER,created.case.caseId));},
    async close(){await application.stopActiveReads();await raw.close();},
    async web(){
      const sessions=new PilotSessionService(application.store,[{id:G6_USER,displayName:"G6 development fixture",accessToken:"g6-local-eval-token"}],clock);
      const server=createLocalWebServer({application,sessions,readAssembly:assembly});server.listen(0,"127.0.0.1");await once(server,"listening");
      return {baseUrl:`http://127.0.0.1:${(server.address() as AddressInfo).port}`,async close(){const stopped=once(server,"close");server.close();server.closeAllConnections();await stopped;}};
    },
  };
}

export type G6Session=Awaited<ReturnType<typeof createG6Session>>;
