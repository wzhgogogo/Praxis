// Offline reconciliation. Counts failed paid requests; never reads private holdouts.
import {readFileSync,writeFileSync} from 'node:fs';
import {sha,base} from './freeze.mjs';
const get=p=>JSON.parse(readFileSync(p,'utf8'));
const sources=[];
function source(path,models,fullLiveRuns=0,scope='PHASE2'){sources.push({path,sha256:sha(readFileSync(path)),models,fullLiveRuns,scope});}
const discovery='.eval-artifacts/p2-1-discovery-20261016/';
for(const file of ['baseline-ledger.json','network-restored-20261019/baseline-ledger.json','checkpoint-a-20261019/ledger.json','checkpoint-a-corrected-20261019/ledger.json','checkpoint-a-dom-20261019/ledger.json','checkpoint-b-20261019/ledger.json','checkpoint-b-corrected-20261019/ledger.json'])source(discovery+file,get(discovery+file).models);
const replay=discovery+'p21a-dom-replay-20261019/replay/progress.json';
const progress=get(replay);const replayCalls=progress.calls;
if(replayCalls!==14)throw Error('REPLAY_14_SOURCE_COUNT_CHANGED');source(replay,14);
const p21c='.eval-artifacts/p2-1c-region-20261020/live-probes/ledger.json';source(p21c,get(p21c).models);
const discoveryModels=sources.reduce((n,s)=>n+s.models,0);if(discoveryModels!==347||get(p21c).cumulative.models!==347)throw Error('DISCOVERY_CUMULATIVE_MISMATCH');
for(const path of ['.eval-artifacts/p2-2-selection-20261019/model-ledger.json','.eval-artifacts/p2-2-selection-20261019/followup/model-ledger.json','.eval-artifacts/checkpoint-c-integration-20261020/selection-recheck/ledger.json'])source(path,get(path).calls.length);
const benchmark='.eval-artifacts/name-resolution-benchmark-20261019/live-20261020/ledger.json';source(benchmark,get(benchmark).modelCalls.length);
const p20='.eval-artifacts/p2-0-hardening-20261015/prep/ledger.json',p20Report='.eval-artifacts/p2-0-hardening-20261015/report.md';
// Literal independent historical cutoff from the accepted P2-0 report; do not charge its cumulative 1086 twice.
if(!readFileSync(p20Report,'utf8').includes('起点1014/1500模型、37累计Live')||get(p20).models!==1086||get(p20).formalRuns!==2)throw Error('P20_CUTOFF_NOT_RECONCILED');
source(p20,1086-1014,2);source(p20Report,1014,0,'PRIOR_PHASE_MODEL_CARRY');
const p23='.eval-artifacts/p2-3-conditions-20261019/model-ledger.json';source(p23,get(p23).modelsStarted,get(p23).fullLiveRuns);
const phase2ModelCalls=sources.filter(s=>s.scope==='PHASE2').reduce((n,s)=>n+s.models,0),priorPhaseModelCalls=1014,totalModelCalls=phase2ModelCalls+priorPhaseModelCalls;
if(phase2ModelCalls!==469||totalModelCalls!==1483)throw Error('PHASE2_LITERAL_TOTAL_MISMATCH');
const ledger={schema:'checkpoint-c-phase2-budget@1',status:'RECONCILED',reconciledBy:'CODEX_OFFLINE_EVIDENCE_RECONCILIATION',phase2ModelCalls,priorPhaseModelCalls,totalModelCalls,totalFullLiveRuns:2,environmentReruns:0,limits:{fullLiveRuns:100,modelCalls:4000,environmentReruns:10},remaining:{fullLiveRuns:98,modelCalls:2517,environmentReruns:10},subtotals:{P20:{models:72,fullLiveRuns:2,environmentReruns:0},P21:{models:347,discoveryProbes:59,decisionReplays:14,fullLiveRuns:0},P22AndBenchmark:{models:50,selectionReplays:15,benchmarkModels:35,fullLiveRuns:0},P23:{models:0,fullLiveRuns:0}},accountingNotes:['Phase2 starts with P2-0; its two full Live runs and 72 calls are counted.','1014 calls preceding P2-0 are carried separately against the conservative shared 4000 ceiling. The playbook 1086 checkpoint already includes P2-0; never add 1086 and 72.','14 P2-1 model decision replays are included inside 347; 15 P2-2 selection replays and 35 benchmark calls are additional. Failed paid calls remain charged.','environmentReruns counts restarted formal full-Live samples only. Source preflight failures/retries are separate diagnostic counters, not extra full Live.','Earlier 39 historical full Live = prior-phase37 + P2-0 two. Only the latter two count in the phase2 Live<=100 allocation.'],diagnostics:{recordedSourcePreflightStopCounters:12,scope:'P2-1 source-only preflight counters (1 restored baseline+2 A+1 DOM-A+2 first B+6 corrected B); failures are not themselves retries'},priorStageSafety:{reviewed:false,status:'NOT_EVALUATED',reason:'Budget reconciliation is not an independent retrospective S0 certification',refs:[]},sources};
writeFileSync(base+'/phase2-ledger.json',JSON.stringify(ledger,null,2)+'\n');console.log(JSON.stringify({phase2ModelCalls,totalModelCalls,fullLiveRuns:2,environmentReruns:0,remaining:ledger.remaining}));
