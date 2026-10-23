from pathlib import Path
import json,re,hashlib
b=Path('.eval-artifacts/phase2c-location-semantic-20261023');o=b/'semantic-followup-220'
old=json.loads((b/'semantic/results.json').read_text())['rows'];new=json.loads((o/'results.json').read_text())['rows'];inputs=json.loads((o/'replay-inputs.json').read_text())['cases']
assert len(new)==54
key=lambda r:(r['caseId'],r['repetition'])
before={key(r):r for r in old if r['version']=='before'};v22={key(r):r for r in old if r['version']=='after'}
def cond(r):
 p=(r.get('compiled') or {}).get('patch',{})
 return {'criteria':p.get('addCriteria',[]),'budgetPerPerson':p.get('budgetPerPerson')}
rows=[]
for r in new:
 a=before[key(r)];mid=v22[key(r)];inp=next(i for i in inputs if i['id']==r['caseId'])
 rows.append({'caseId':r['caseId'],'repetition':r['repetition'],'message':r['message'],'originalProposal':inp['originalSemanticProposal'],'beforeV21':cond(a),'previousV22':cond(mid),'afterV23':cond(r),'beforeProposal':a['result'].get('proposal'),'afterProposal':r['result'].get('proposal'),'changedPatch':a.get('compiled')!=r.get('compiled'),'status':r['result']['status'],'compiledStatus':(r.get('compiled') or {}).get('status'),'beforeSourceId':a['id'],'afterSourceId':r['id']})
# Fixed user oracle: sit-down is allowed; invented with-tables narrowing is not.
soba=[r for r in rows if 'sit-down' in r['message']]
for r in soba:
 c=r['afterV23']['criteria'];r['focusPass']=not any(re.search(r'with\s+(?:a\s+)?tables?',x['text'],re.I) for x in c) and any('sit-down' in x['text'].lower() and x['polarity']=='POSITIVE' for x in c) and any('standing' in x['text'].lower() and x['polarity']=='NEGATIVE' and x['strength']=='HARD' for x in c)
numeric=[r for r in rows if re.search(r'\bunder\b|\bat most\b|no more than|\bbelow\b',r['message'],re.I)]
for r in numeric:
 if 'ideally under' in r['message'].lower():r['numericFocusPass']=any(x['strength']=='SOFT' and re.search(r'\bunder\b',x['text'],re.I) and ('6,000' if '6,000' in r['message'] else '4,000') in x['text'] for x in r['afterV23']['criteria']) and r['afterV23']['budgetPerPerson'] is None
 else:r['numericFocusPass']=r['afterV23']['budgetPerPerson']==r['beforeV21']['budgetPerPerson']
finished=json.loads((o/'finished.json').read_text());calls=finished['modelCalls'];out={'status':'PASS_FOCUS_PENDING_FULL_REVIEW' if all(r['focusPass'] for r in soba) and all(r['numericFocusPass'] for r in numeric) else 'NOT_SATISFIED_NO_FURTHER_PROMPT_EDITS','newCalls':calls,'priorCalls':108,'chainCalls':108+calls,'chainCap':220,'sobaPassed':sum(r['focusPass'] for r in soba),'sobaTotal':len(soba),'numericPassed':sum(r['numericFocusPass'] for r in numeric),'numericTotal':len(numeric),'noMoreThanBelow':'No such literal in the frozen18 inputs; same general rule but not independently sampled. at most and under are sampled.','rows':rows}
(o/'comparison.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
lines=['# Final semantic replay comparison','',f"Status: {out['status']}; new calls{calls}, chain{108+calls}/220.",'','Same18 exposed requests x3. Before v21 is reused, previous v22 shown separately; no new before calls.','',out['noMoreThanBelow'],'','## All54 paired condition lists','']
for r in rows:
 lines.extend([f"### {r['caseId']} / repetition{r['repetition']}",'',r['message'].strip(),'','```json',json.dumps({k:r[k] for k in ['beforeV21','previousV22','afterV23']},ensure_ascii=False,indent=2),'```',''])
(o/'comparison.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({k:v for k,v in out.items() if k!='rows'}))
