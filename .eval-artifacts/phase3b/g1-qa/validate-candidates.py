# Reviewer/evaluator only: this checks references, never feeds answers to G1.
from pathlib import Path
import json,gzip,hashlib,html,datetime,zoneinfo,subprocess
root=Path('.eval-artifacts/phase3b/g1-qa')
questions=json.loads((root/'questions.json').read_text());answers=json.loads((root/'answers.reviewed.json').read_text())
assert len(questions['questions'])==len(answers['answers'])==34
assert len({q['id'] for q in questions['questions']})==34
for qid in ['G1-Q24','G1-Q25']:
 a=next(a for a in answers['answers'] if a['questionId']==qid)
 assert a['allowFreshRead'] is False, 'OFFLINE_FRESH_READ_MUST_BE_DISABLED: '+qid
 assert a['expectedStatus']=='UNVERIFIED'
confirmed={f'G1-Q{i:02d}' for i in range(1,35)}
assert {a['questionId'] for a in answers['answers'] if a['status']=='REVIEWER_CONFIRMED'}==confirmed
assert all(a['status']=='CANDIDATE' for a in answers['answers'] if a['questionId'] not in confirmed)
assert all(a['reviewer']=='independent reviewer (Claude), 2026-10-27' for a in answers['answers'] if a['questionId'] in confirmed)
historical=subprocess.check_output(['git','show','8bd6bb8ce07bbed5b6b4f06b60b4e93772729c41:'+str(root/'answers.candidate.json')])
assert (root/'answers.candidate.json').read_bytes()==historical
pages={}
for p in questions['pages']:
 stored=Path(p['pagePath']).read_bytes();body=gzip.decompress(stored) if p['storageEncoding']=='gzip' else stored
 assert hashlib.sha256(stored).hexdigest()==p['storageSha256']
 assert hashlib.sha256(body).hexdigest()==p['pageSha256']
 pages[p['id']]=(p,body.decode())
for q in questions['questions']:
 assert q['language']=='en' and q['question'].isascii() and q['questionZh']
 assert not {'expectedStatus','candidateAnswer','requiredQuotes','status','reviewer'}.intersection(q)
 p=pages[q['pageId']][0];given=q['providedPage']
 assert given['pageId']==p['id'] and given['pageSha256']==p['pageSha256'] and given['candidateId']==p['outlet']['id']
 assert given['metadataOrigin']=='LOCAL_CONSTRUCTED_OFFLINE_BINDING_SCENARIO'
 n=int(q['id'][-2:])
 if 21<=n<=23:assert q['displayedOutlet']['candidateId']!=given['candidateId']
 elif 24<=n<=25:assert q['readContext']['runId']!=given['readRunId']
 else:assert q['displayedOutlet']['candidateId']==given['candidateId'] and q['readContext']['runId']==given['readRunId']
quotes=0
for a in answers['answers']:
 p,text=pages[a['pageId']];assert a['pagePath']==p['pagePath'] and a['pageSha256']==p['pageSha256']
 for e in a['evidence']:
  loc=e['location'];start=loc['textNodeRawStart'];before=text[:start]
  assert before.count('\n')+1==loc['textNodeStartLine']
  assert len(before.rsplit('\n',1)[-1])+1==loc['textNodeStartColumn']
  raw=text[start:text.find('<',start) if '<' in text[start:] else len(text)]
  decoded=' '.join(html.unescape(raw).split());assert e['quote'] in decoded,(a['questionId'],e['quote'])
  assert decoded.find(e['quote'])==loc['quoteOffsetInNormalizedNode']
  quotes+=1
 for required in a.get('requiredQuotes',[]):assert any(required in e['quote'] for e in a['evidence'])
 if a['answerKind']=='NOT_STATED':assert a['inspectedSections']
 if a['trap'] is not None:assert a['trap']['description']
q26=next(a for a in answers['answers'] if a['questionId']=='G1-Q26')
assert q26['expectedStatus']=='ANSWERED' and len(q26['requiredQuotes'])==2 and q26['requiresRestaurantConfirmation'] and q26['mustAcknowledgeConflict']
print(json.dumps({'timeCET':datetime.datetime.now(zoneinfo.ZoneInfo('Europe/Vienna')).isoformat(),'questions':34,'reviewerConfirmed':34,'candidateQuestions':0,'pagesShaVerified':len(pages),'literalQuotesAndLocationsVerified':quotes,'historicalCandidateSha256':hashlib.sha256(historical).hexdigest(),'acceptanceGoldStatus':'REVIEWER_CONFIRMED_EXPOSED_OFFLINE_SET','newRealCalls':0},ensure_ascii=False,indent=2))
