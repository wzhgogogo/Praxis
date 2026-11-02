from pathlib import Path
from datetime import datetime
import base64,gzip,json,re
R=Path(__file__).parent;log=(R/'gates/test.log').read_text();O=R/'final-observations';O.mkdir(exist_ok=True)
frames={};legacy={}
for prefix,target in [('B1_RESERVE_RAW',frames),('B1_TERMS_COMPOSITION_RAW',legacy)]:
 for match in re.finditer(prefix+r' ([A-Za-z0-9+/=]+)',log):
  raw=base64.b64decode(match[1]);v=json.loads(raw);assert v['label'] not in target
  target[v['label']]=v;(O/(prefix.lower()+'-'+v['label']+'.json.gz')).write_bytes(gzip.compress(raw,mtime=0))
expected={'boundary-20001','boundary-20000','between-models','before-language-navigation','early-abort','assistant-wait-0','assistant-wait-40'}
assert frames.keys()==expected,(frames.keys(),expected)
ms=lambda s:datetime.fromisoformat(s.replace('Z','+00:00')).timestamp()*1000
rows=[]
for name,f in frames.items():
 events=[x for x in f['timeline'] if x['turn']=='SELECTED'];begin=next(x for x in events if x['event']=='TERMS_BEGIN');end=next(x for x in events if x['event']=='TERMS_END')
 deadline=ms(begin['detail']['deadlineAt'])
 starts=[x for x in events if begin['elapsedMs']<=x['elapsedMs']<=end['elapsedMs'] and (x['event'] in {'FACTS_SESSION_BEGIN','FACTS_PAGE_BEGIN'} or x['event']=='MODEL_BEGIN')]
 remaining=[round(deadline-ms(x['clockAtCET'])) for x in starts]
 assert all(x>20000 for x in remaining),(name,remaining)
 h=f['view']['restaurant']['bookingHandoffs'];assert len(h)==1 and h[0]['sourceSelection']=='UNKNOWN'
 q=[x for x in starts if x['event']=='MODEL_BEGIN' and x['detail']['purpose']=='restaurant_page_question'];nav=[x for x in starts if x['event']=='FACTS_PAGE_BEGIN']
 if name=='boundary-20001':assert nav and begin['detail']['remainingMs']==20001
 if name=='boundary-20000':assert not starts and not h[0]['terms'] and begin['detail']['remainingMs']==20000
 if name=='between-models':assert len(q)==1 and not h[0]['terms']
 if name=='before-language-navigation':assert len(nav)==1 and not q and not h[0]['terms']
 if name=='early-abort':
  abort=next(x for x in events if x['event']=='FACTS_ABORT')
  assert abort['detail']['reasonCode']=='DELIVERY_RESERVE_REACHED' and abort['elapsedMs']-begin['elapsedMs']<1000
  assert not q and not h[0]['terms']
 finish=next(x for x in events if x['event']=='READ_FINISHED');append=next(x for x in events if x['event']=='ASSISTANT_APPENDED')
 ready=next(x for x in events if x['event']=='RESULTS_VISIBLE' and x['detail']['selected'] and x['detail']['active'])
 assert ready['elapsedMs']<=begin['elapsedMs']<=end['elapsedMs']<=finish['elapsedMs']<=append['elapsedMs']
 rows.append({'case':name,'readStarts':len(starts),'minimumRemainingAtStartMs':min(remaining) if remaining else None,'questionStarts':len(q),'pageStarts':len(nav),'terms':len(h[0]['terms']),'linkPreserved':True,'termsMs':end['elapsedMs']-begin['elapsedMs'],'assistantAfterReadyMs':append['elapsedMs']-ready['elapsedMs'],'appendAfterTermsMs':append['elapsedMs']-end['elapsedMs'],'result':'PASS'})
# Reviewed C behavior is compared on public observable DTOs, not random internal IDs or production verdicts.
assert len(legacy)==14
for name,f in legacy.items():
 old=json.loads(gzip.decompress((R.parent/'b1-card-terms-20261101/final-compositions'/(name+'.json.gz')).read_bytes()))
 assert f['view']['restaurant']['bookingHandoffs']==old['view']['restaurant']['bookingHandoffs'],name
 assert f['realCalls']==0
result={'status':'PASS','scope':'Actual production assembly integration regressions with fixed external I/O, not new Live/G6 capability signoff','layer1':{'reserveCases':7,'reviewedBehaviorFramesUnchanged':14,'rows':rows},'layer2':{'noNewReadInLast20000ms':'PASS','perModelAndLanguageNavigationRecheck':'PASS','earlyReadCancellation':'PASS','durableAssistantAfterTerms':'PASS','G1OriginalExplicitQuestionAndHandoffBehavior':'PASS'},'layer3':{'lateReadStartsInControlledRuns':0,'realSourceAndRealModel':'NOT_RUN'},'layer4':{'cause':'Optional terms used whole deadline and capture had no per-step reserve guard','fix':'Existing reserve constant, shortened child deadline and per-transport guard through G1 factory'},'realCalls':{'model':0,'google':0,'websiteGET':0,'live':0}}
(R/'independent-evaluation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'PASS','reserveCases':7,'legacyFramesUnchanged':14,'lateReadStarts':0,'realCalls':0}))
for row in rows:print(json.dumps(row))
