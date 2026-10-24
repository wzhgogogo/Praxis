"""Offline arithmetic only. Independent eight-wave check catches average-load underestimation."""
from pathlib import Path
import json,math,sys
root=Path(__file__).resolve().parent;data=json.loads((root/'inputs.json').read_text())
def schedule(count,seconds,red=False):
    if red:return count*seconds/2
    workers=[0.0,0.0]
    for _ in range(count):
        lane=min(range(2),key=lambda i:workers[i]);workers[lane]+=seconds
    return max(workers)
red='--red' in sys.argv
assert schedule(15,500,red)==4000,'A 15-run deadline round needs eight waves, not 15/2 complete waves'
rows=[]
for scenario in data['scenarios']:
    wait={origin:count*(2*data['originIntervalSeconds']+data['assumedPeerResponseSeconds']) for origin,count in scenario['sharedRequestsByOrigin'].items()}
    uncapped=scenario['baseLiveSeconds']+sum(wait.values())
    formal=min(500,uncapped)
    live=policyLive=scenario['healthyPreflightSeconds']+formal
    replay=scenario['replaySeconds'];fixed=data['fixedRoundSeconds']
    full=schedule(15,live)+schedule(15,replay)+fixed
    within=schedule(6,live)+schedule(15,replay)+fixed
    rows.append({'id':scenario['id'],'waitSecondsByOrigin':wait,'waitSecondsPerRun':sum(wait.values()),'uncappedFormalSeconds':uncapped,'cappedFormalSeconds':formal,'deadlinePressure':uncapped>500,'fresh15LiveAnd15ReplaySeconds':full,'fresh15Minutes':full/60,'sixF5LiveAnd15ReplaySeconds':within,'sixF5LiveAnd15ReplayMinutes':within/60,'fullFreshReferenceUnderHour':full<=3600,'currentAllowanceConditionalUnderHour':within<=3600})
result={'status':'ESTIMATE_ONLY_NOT_MEASURED','parallelLimit':2,'waves15':8,'deadlineOnlyLowerBoundSeconds':schedule(15,500),'currentKnownComplete15RecordingCoverage':False,'recordingCoverageIsRequired':True,'realModelCalls':0,'googleCalls':0,'websiteCalls':0,'liveRuns':0,'rows':rows}
(root/'estimate.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
