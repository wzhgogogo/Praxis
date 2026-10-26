from pathlib import Path
import json,gzip,hashlib,html,datetime,zoneinfo
root=Path('.eval-artifacts/phase3b/g1-qa')
questions=json.loads((root/'questions.json').read_text());answers=json.loads((root/'answers.candidate.json').read_text())
assert len(questions['questions'])==len(answers['answers'])==30
assert len({q['id'] for q in questions['questions']})==30
assert all(a['status']=='CANDIDATE' and a['reviewerDecision'] is None for a in answers['answers'])
pages={}
for p in questions['pages']:
 stored=Path(p['pagePath']).read_bytes();body=gzip.decompress(stored) if p['storageEncoding']=='gzip' else stored
 assert hashlib.sha256(stored).hexdigest()==p['storageSha256']
 assert hashlib.sha256(body).hexdigest()==p['pageSha256']
 pages[p['id']]=(p,body.decode())
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
 if a['answerKind']=='NOT_STATED':assert a['inspectedSections']
 if a['trap'] is not None:assert a['trap']['description']
print(json.dumps({'timeCET':datetime.datetime.now(zoneinfo.ZoneInfo('Europe/Vienna')).isoformat(),'candidateQuestions':30,'pagesShaVerified':len(pages),'literalQuotesAndLocationsVerified':quotes,'types':{t:sum(q['type']==t for q in questions['questions']) for t in ['有答案','页面未说明','陷阱','敏感类别']},'allAnswers':'CANDIDATE','acceptanceGoldStatus':'NOT_READY','newRealCalls':0},ensure_ascii=False,indent=2))
