from pathlib import Path
import json,collections,re,csv,hashlib
root=Path('.eval-artifacts/phase3b/test-suite-review')
cards=json.loads((root/'static-cards.json').read_text());cardBy={c['id']:c for c in cards}
mapping=json.loads((root/'runtime-map.json').read_text());assert not mapping['unbound']
notes=dict(line.split('\t',1) for line in (root/'file-notes.tsv').read_text().splitlines())
proposals=json.loads((root/'proposals.json').read_text())['items'];proposed={p['source']:p for p in proposals}
for p in proposals:
 assert p['source'] in cardBy
 assert all(x in cardBy for x in p['coveredBy'])
byfile=collections.defaultdict(list)
for c in cards:byfile[c['file']].append(c)
children=collections.defaultdict(list)
for c in cards:
 if c.get('parentId'):children[c['parentId']].append(c)

protectedFiles={
 'src/core/execution/side-effect-ledger.test.ts':'IDEMPOTENCY',
 'src/core/policy/policy-engine.test.ts':'AUTHORIZATION',
 'src/domains/restaurant/booking-verifier.test.ts':'WRONG_SUCCESS_OUTCOME',
 'src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts':'INDEPENDENT_S0_EVALUATOR',
 'src/eval/restaurant/agent-loop/diagnostic-evaluator-hard.test.ts':'INDEPENDENT_S0_EVALUATOR',
 'src/eval/restaurant/agent-loop/fact-qa-scoring.test.ts':'INDEPENDENT_FALSE_CLAIM_SCORING',
 'src/harness/browser/fact-qa-scoring.test.ts':'INDEPENDENT_VISIBLE_TEXT_FALSE_CLAIM',
 'src/infrastructure/browser/playwright-read-network-guard.test.ts':'GUARD_NEGATIVE_AND_NORMAL_CONTROLS',
 'src/harness/browser/read-network-redirect.test.ts':'GUARD_REAL_CHROMIUM_BOUNDARY',
 'src/harness/browser/page-question-budget.test.ts':'GUARD_AND_PAGE_BUDGET',
 'src/harness/browser/replay-missing-response.test.ts':'REPLAY_ZERO_NETWORK_ESCAPE',
 'src/harness/browser/runner-interruption.test.ts':'POST_INTERRUPTION_S0',
 'src/harness/browser/runner-post-exit.test.ts':'LIVE_FAILURE_AND_POST_EXIT_S0',
 'src/harness/restaurant-time-reserve.test.ts':'F6_LIVE_FAILURE_REDS',
 'src/harness/browser/dom-change.test.ts':'REVIEWED_CPU_LIFETIME_RED',
 'src/harness/browser/live-source-health.test.ts':'REVIEWED_CPU_LATE_BUSY_RED',
 'src/integrations/restaurant-search/directory-region-selection.test.ts':'F5_R1_G1_G3_A3_N1_N4',
 'src/harness/browser/browser-read-request-binding.test.ts':'H003_DOM_REF_AND_OPERATION_CEILING_LIVE_FAILURE',
 'src/harness/browser/browser-read-search-controls.test.ts':'COVERED_LINK_AND_SEARCH_LAYER_REGRESSIONS',
 'src/eval/restaurant/agent-loop/recording-keys.test.ts':'CREDENTIAL_SAFETY',
 'src/harness/browser/recording-keys.test.ts':'CREDENTIAL_AND_PARTIAL_REPLAY',
 'src/eval/shared/diagnostic-run.test.ts':'IMMUTABLE_EVIDENCE_AND_SECRET',
}
siteFiles={'src/integrations/tabelog/tabelog-browser-availability.test.ts','src/integrations/tablecheck/tablecheck-browser-availability.test.ts'}
# Caller-specific coverage may survive G3. Ownership here never means permission to delete it.
g3Calls=re.compile(r'parse(?:Tabelog|TableCheck)|tabelog(?:Query|Requested|Booking|Availability|Calendar|Source)|tableCheck(?:Availability|Selected|Requested|Read)|hasTabelogSelected|createTabelogRegion|bookingRegions',re.I)
history=re.compile(r'\b(?:F5c?|F6|R1 D1|G1/G3 D1|F3-034|W12|H003)\b',re.I)
def protection(c):
 out=[]
 if c['file'] in protectedFiles:out.append(protectedFiles[c['file']])
 if re.search(r'authoriz|idempoten|OUTCOME_UNKNOWN|another attempt|wrong attempt|duplicate.*(?:commit|submit)|unauthenticated|cross.user',c['title'],re.I):out.append('AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME')
 if history.search(c['title']):out.append('EXPLICIT_HISTORICAL_REGRESSION')
 return out

def oracles(c):
 values=c['assertions']
 if not values:
  values=[a for child in children[c['id']] for a in child['assertions']]
 if not values and c['file'].endswith('/recording-keys.test.ts'):
  return ['runRecordingKeyScenario: record and replay real local Chromium, all files scanned for credentials, unqualified page stops before source traffic (fixtures/recording-key-scenario.ts:37-74)']
 # Lead with both normal/negative behavioral results; keep every exact original separately in static-cards.
 ranked=sorted(enumerate(values),key=lambda pair:(-int(bool(re.search(r'status|reason|outcome|allowed|rejected|offers|candidates|evidence|phase|confidence|readId|exhausted|code|calls|selected|source',pair[1],re.I))),pair[0]))
 return [v for _,v in ranked[:3]] or ['Delegates mandatory child tests: '+', '.join(x['id'] for x in children[c['id']])]

def judgement(c,caseName):
 guard=protection(c)
 owned='B_G3_SITE_TEST_OWNER' if c['file'] in siteFiles else 'A_AUDIT_ONLY'
 if c['cohort']=='FROZEN_PROBE':decision='OUTSIDE_DEFAULT_FROZEN_PROBE'
 elif c['container']:decision='GROUP_NOT_A_TEST'
 elif c['id'] in proposed:
  p=proposed[c['id']];decision='KEEP_SPEEDUP_PROPOSED' if p['proposedTestReduction']==0 else 'RETIRE_OR_MERGE_PROPOSED'
 elif owned=='B_G3_SITE_TEST_OWNER':decision='DEFER_TO_B_G3_KEEP_UNTIL_REPLACED'
 elif guard:decision='KEEP_PROTECTED'
 elif any(g3Calls.search(call) for call in c['calls']):decision='KEEP_G3_COORDINATION'
 else:decision='KEEP_DISTINCT_CONTRACT'
 checks=oracles(c)
 # The reason is the actual case/input condition and its own falsifiable result,
 # not a shared sentence saying that all current tests are useful.
 reason=(proposed[c['id']]['reason'] if c['id'] in proposed else caseName+' → '+' ; '.join(checks))
 return {'decision':decision,'reason':reason,'protectedReasons':guard,'ownership':owned,'requiredOracles':checks,'fileReview':notes[c['file']], 'replacementProposal':proposed[c['id']]['id'] if c['id'] in proposed else None}

sourceRows=[]
for c in cards:
 runtimes=[r for r in mapping['rows'] if r['declarationId']==c['id']]
 sourceRows.append({'declarationId':c['id'],'file':c['file'],'line':c['line'],'end':c['end'],'title':c['title'],'sourceSha256':c['sourceSha256'],'cohort':c['cohort'],'runtimeCases':[r['name'] for r in runtimes],'assertionCount':len(c['assertions']),'calls':c['calls'],'inputEvidence':c['inputStatements'][:4],**judgement(c,c['title'])})
rows=[]
for r in mapping['rows']:
 c=cardBy[r['declarationId']]
 rows.append({**r,'sourceLine':c['line'],'sourceSha256':c['sourceSha256'],**judgement(c,r['name'])})
for name,items in [('declaration-review.json',sourceRows),('runtime-review.json',rows)]:
 (root/name).write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n')
counts=collections.Counter(r['decision'] for r in rows if r['testType']=='test')
reasons=[r['reason'] for r in rows if r['testType']=='test']
assert len(reasons)==len(set(reasons)),'duplicate whole case rationale'
assert all(row['reason'] and row['requiredOracles'] for row in rows)
assert all(c['cohort']=='FROZEN_PROBE' or any(r['declarationId']==c['id'] for r in rows) for c in cards)
summary={'baselineMain':'ba466eb3eff89cc3f934bafc2134a39c4b6d84ed','sourceFiles':len(byfile),'sourceDeclarations':len(cards),'containers':sum(c['container'] for c in cards),'probeOnlyNotRun':8,'runtimeTestCases':1378,'defaultTests':1203,'chromiumTests':175,'defaultSuitesNotTestCount':5,'unboundRuntimeCases':0,'duplicateCompleteReasons':0,'decisions':dict(counts),'proposals':len(proposals),'proposedReduction':{'default':3,'chromium':1},'testEdits':0,'productEdits':0,'realCalls':0,'reductionAchieved':False}
(root/'inventory-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
with (root/'runtime-review.csv').open('w',newline='') as out:
 fields=['id','cohort','name','declarationId','testType','durationMs','result','decision','ownership','replacementProposal','reason']
 writer=csv.DictWriter(out,fieldnames=fields,extrasaction='ignore');writer.writeheader();writer.writerows(rows)
lines=['# Per-file and per-case review','', 'Status: proposed review list, no test edits; current baseline main ba466eb3. Source and each exact assertion are frozen in static-cards.json; 1,378 runtime test cases + 5 suites map with zero gaps. Reasons below use the individual input/contract and falsifiable assertions, with 128 separately reviewed file notes. A retained test has no proven same-input/path/consequence replacement in this proposal; it does not assert that no future consolidation is possible.','', 'The source declaration list includes 8 frozen PostgreSQL probes which were not run and are not counted in either current gate. Parser extraction is mechanical; ownership, protection and the five change proposals are review judgments, not a test-coverage or model-generated Gold score.','']
for file,cs in byfile.items():
 lines.extend(['## '+file,'',notes[file],''])
 for c in cs:
  j=judgement(c,c['title']);variants=[r for r in rows if r['declarationId']==c['id']]
  lines.extend(['### '+str(c['line'])+' — '+c['title'],'', '**'+j['decision']+'**'+(' · '+j['replacementProposal'] if j['replacementProposal'] else ''),''])
  if c['id'] in proposed:lines.extend([j['reason'],''])
  for v in variants:
   lines.append('- '+v['cohort']+' / '+v['name']+' / '+format(v['durationMs'],'.3f')+' ms / '+v['result'])
  lines.append('')
  lines.extend(['检错依据（精确原断言；全文见 source card）：',''])
  for oracle in j['requiredOracles']:lines.append('- `'+oracle.replace('`','\\`').replace('\n',' ')+'`')
  if j['protectedReasons']:lines.extend(['','保护：'+', '.join(j['protectedReasons'])])
  if c['cohort']=='FROZEN_PROBE':lines.extend(['','NOT_RUN：冻结探针独立入口，不计默认缩减收益。'])
  lines.append('')
(root/'review-list.md').write_text('\n'.join(lines)+'\n')
print(json.dumps(summary,ensure_ascii=False,indent=2))
