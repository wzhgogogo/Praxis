"""Review documents only; no network, credentials, product execution or scoring changes."""
from pathlib import Path
import hashlib,json,re,subprocess
r=Path('.eval-artifacts/phase3b/g4-japanese-wiring')
assert not subprocess.check_output(['git','status','--porcelain'],text=True).strip()
for frozen in json.loads((r/'review-freeze.json').read_text())['files']:
 assert hashlib.sha256(Path(frozen['path']).read_bytes()).hexdigest()==frozen['sha256'],frozen['path']
for name in ['google-request-for-review.json','request-review.md','attribution-source-comparison.json','per-store.md']:assert not (r/name).exists(),name
def load(p):return json.loads(Path(p).read_text())
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
plan=load(r/'request-plan.json');config=load(r/'inputs.json');beef=next(row for row in config['rows'] if row['id']=='nr-007')
request={**plan['googleRequest'],'status':'PENDING_REVIEW_NO_EXECUTION','timeoutMs':20000,'cookie':False,'followRedirect':False,'retries':0,
 'sourceGooglePlaceId':{'path':beef['sourceExecutionPath'],'sha256':sha(beef['sourceExecutionPath'])},
 'batchCeilings':{'google':1,'websiteGET':0,'realModel':0,'Live':0},
 'afterApprovedRead':'Freeze original Google response and SHA, verify original Place ID and actual language, materialize literal Beef Japanese first-screen URL; submit website list before any website request.'}
(r/'google-request-for-review.json').write_text(json.dumps(request,ensure_ascii=False,indent=2)+'\n')
lines=['# Scheme one request review — source dependency remains','',
 '**NOT EXECUTABLE.** No real request has been sent. All eight known URLs below come from observed, frozen search pages; no Gold is read by the manifest generator.','',
 '| Request | Store / stage | Exact source-observed URL | Original SHA-256 |','| --- | --- | --- | --- |']
for row in plan['knownDetailURLs']:lines.append(f"| {row['id']} | {row['subjectId']} / {row['phase']} | {row['url']} | {row['observedSha256']} |")
lines+=['','Beef causal dependency: same-ID Google ja name → literal search URL → observed first-screen detail URLs. Neither the name nor first screen exists in the saved source inputs. Gold/certified-page names cannot replace that missing Google evidence. Therefore a final precise website list, including Beef, cannot be produced offline; null fields are explicitly unmaterialized, not executable templates.','',
 f"Exact one-request Google submanifest: `{request['url']}`, GET, mask `id,displayName`, expected ID `{request['expectedPlaceId']}`. [Request for separate review](google-request-for-review.json). This is a proposal only; review must precede this request as well.",'',
 'After its approval/read, freeze the returned original name and literal Beef search URL and submit the website list; after the approved Beef first screen, freeze the actual ordered ≤5 detail URLs before continuation. Do not infer URLs from certified IDs.','',
 'Numerical authorization: known details8 + Beef first screen1 + Beef details≤5 = websiteGET≤14, Google≤1, models0, Live0; shared GET244/260 leaves16, maximum planned14 leaves2. The numbers fit; the source-dependent exact URLs remain unavailable. Website reads remain20 seconds,≥30-second gaps, noCookie/noRedirect/noRetry, stop3 consecutive network failures.','',
 'T remains a safety control. Its certified outlet is sixth in the saved Japanese listing, outside the remaining fifth slot; no sorting/identity rule is changed to force it into the plan. Its original fragment proposal was not captured, so the corresponding branch remains NOT_EVALUATED.']
(r/'request-review.md').write_text('\n'.join(lines)+'\n')
paths=['src/integrations/restaurant-availability/availability-source-resolver.ts','src/domains/restaurant/booking-handoff.ts','src/integrations/tabelog/tabelog-booking-handoff-reader.ts']
equal=[]
for p in paths:
 base=subprocess.check_output(['git','show','74afd956:'+p]);current=Path(p).read_bytes();assert base==current
 equal.append({'path':p,'sha256':hashlib.sha256(base).hexdigest(),'equalsPublishedMain':True})
(r/'attribution-source-comparison.json').write_text(json.dumps({'status':'UNCHANGED_COMPONENTS_SUPPORT_PREEXISTING_GAP','files':equal,'runtimeEvidence':'attribution-diagnostic.json','scope':'No isolated original-main runtime replay was performed. G4 reaches results; the unchanged source attribution/reader/admission paths produce the observed B1 refusal.','proposedPatch':'source-provider-proposal.patch','approval':'PENDING_NO_PRODUCT_BINDING_EDIT'},indent=2)+'\n')
# Per-store source/first-screen/detail inventory from the already frozen simulation.
gold={row['id']:row['rstId'] for row in load('.eval-artifacts/phase3b/g4-e2e/gold.json')['rows']}
rows=['# Frozen 37-store query and detail inventory','',
 'Offline simulation only; independent production-prefix results are separate. Old23 includes19 first-attempt acceptances plus4 separate reruns. Missing source inputs/pages remain NOT_EVALUATED.','',
 '| View / store | Query and source | Certified outlet on first screen | Planned details (in order) | Conclusion |','| --- | --- | --- | --- | --- |']
eval_by={x['key']:x for x in load(r/'evaluation.json')['rows']}
for subject in config['rows']:
 ex=load(r/'execution'/f"{subject['key']}.json");ev=eval_by[subject['key']]
 queries=' → '.join(q['kind']+': '+q['query'] for q in ex['searches'])
 def rst(url):
  m=re.search(r'/(\d+)/?$',url);return m[1] if m else None
 ranks=[]
 for q in ex['searches']:
  rank=next((i+1 for i,o in enumerate(q['ordered']) if rst(o['sourceUrl'])==gold[subject['id']]),None)
  source=next((read for read in ex['reads'] if read['kind']=='SEARCH' and read['query']==q['query']),None)
  observed=bool(source and source.get('bodyPath'))
  ranks.append(q['kind']+': '+('YES / sorted rank '+str(rank) if rank else 'NO' if observed else 'NOT_EVALUATED'))
 details='; '.join(f"{i+1}. [{rst(d['url'])}]({d['url']})"+(' ('+d['problem']+')' if d.get('problem') else '') for i,d in enumerate(ex['details'])) or '0'
 rows.append(f"| {subject['key']} | {queries} | {'; '.join(ranks)} | {details} | {ev['verdict']} |")
(r/'per-store.md').write_text('\n'.join(rows)+'\n')
print(json.dumps({'knownDetailURLs':len(plan['knownDetailURLs']),'preciseBeefWebsiteURL':False,'googleSubmanifestMaterialized':True,'allRealRequests':0}))
