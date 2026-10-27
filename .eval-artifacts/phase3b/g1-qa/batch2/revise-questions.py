from pathlib import Path
from html.parser import HTMLParser
import json,subprocess,gzip,hashlib,datetime,zoneinfo,copy
REV='8bd6bb8ce07bbed5b6b4f06b60b4e93772729c41';ROOT=Path('.eval-artifacts/phase3b/g1-qa')
def blob(p):return subprocess.check_output(['git','show',REV+':'+p])
oldq=json.loads(blob(str(ROOT/'questions.json')));oldbytes=blob(str(ROOT/'answers.candidate.json'));assert (ROOT/'answers.candidate.json').read_bytes()==oldbytes
olda=json.loads(oldbytes);pages={p['id']:p for p in oldq['pages']}
english=[
'Does the page say they have private rooms, and for how many people?',
'Which credit cards does the page say they accept?',
'Can I pay by QR code?',
'What is the smoking policy on the page?',
'What time does dinner start on Saturdays?',
'What service charge does the page list?',
'What cancellation fee does the Nishiikebukuro branch list for a cancellation on the day?',
'How many seats does the Nishiikebukuro branch have?',
'What are the Ooyama branch\'s Tuesday opening hours?',
'Does the page say I can choose how the eel is grilled?',
'How long does the PARIS kaiseki course take, and what if I am in a hurry?',
'How much is the Casual dinner 5 courses without a drinks add-on, and does it include tax and service?',
'What is the last order time?',
'Do they offer a vegan course with no egg, dairy, or fish stock?',
'Is there a minimum spend or an extra fee for a private room?',
'Is there free Wi-Fi?',
'Do they have high chairs for children?',
'Do they accept American Express?',
'What percentage is refunded if I cancel the course?',
'What is the last order time for the course?',
'How many seats do they have?',
'Is the restaurant wheelchair accessible?',
'Do they charge a service fee at lunch?',
'How much is the dinner course?',
'How much is the lunch course?',
'Is the 10% service charge also added to lunch orders that are not a course? Please check both the English and the original Japanese.',
'Can the JPY 3,980 lunch mentioned in a review be treated as a price on the restaurant\'s current bookable menu?',
'The page says allergy information is available. Does that guarantee it is safe for someone with a severe peanut allergy?',
'Can a wheelchair user enter the Ooyama branch, and is the toilet also guaranteed to be accessible?',
'Is this beef dinner a halal-certified course?',
]
CURRENT='phase3b-g1-eval-current';PREVIOUS='phase3b-g1-eval-previous';started='2026-10-27T00:00:00+01:00';observed='2026-10-27T00:00:01+01:00'
questions=[];answers=[];confirmed=set(range(1,21))|set(range(26,31))
def bind(q,page):
 target=q.pop('outlet')
 q['displayedOutlet']={'candidateId':target['id'],'name':target['name'],'sourceUrl':target['sourceUrl']}
 q['readContext']={'runId':CURRENT,'startedAt':started}
 q['providedPage']={'pageId':page['id'],'candidateId':page['outlet']['id'],'sourceUrl':page['outlet']['sourceUrl'],'pageSha256':page['pageSha256'],'readRunId':PREVIOUS if q['id'] in ['G1-Q24','G1-Q25'] else CURRENT,'readId':q['id']+'-provided-read','observedAt':observed,'identityObservedAt':started,'metadataOrigin':'LOCAL_CONSTRUCTED_OFFLINE_BINDING_SCENARIO'}
 q['language']='en'
 # The late previous-run read uses a current timestamp: runId, not age alone,
 # must reject it. No claim that the historical website was fetched again.
for i,(oq,oa) in enumerate(zip(oldq['questions'],olda['answers']),1):
 q=copy.deepcopy(oq);q['questionZh']=q['question'];q['question']=english[i-1];q['questionRevision']='NATURAL_QUESTION_WITH_WRONG_SOURCE' if 21<=i<=25 else 'ENGLISH_TRANSLATION';bind(q,pages[q['pageId']]);questions.append(q)
 a=copy.deepcopy(oa);a['status']='REVIEWER_CONFIRMED' if i in confirmed else 'CANDIDATE'
 a['reviewer']='independent reviewer (Claude), 2026-10-27' if i in confirmed else None
 a['reviewBasis']='User-supplied independent review: all quoted source text and absence counter-searches checked; per-ID confirmation' if i in confirmed else 'Rewritten scenario pending independent review'
 a['reviewerDecision']='CONFIRMED' if i in confirmed else None
 a['expectedStatus']='UNVERIFIED' if 21<=i<=25 else 'ANSWERED' if a['answerKind']=='CONFLICT' else a['answerKind']
 a['questionRevision']=q['questionRevision']
 if 21<=i<=25:
  a['answerKind']='MISMATCH';a['candidateAnswer']='Unable to verify this information from a page bound to the displayed restaurant and this run.'
  a['requiredQuotes']=[];a['forbiddenAnswerFragments']={21:['56'],22:['Wheelchair access'],23:['10%','10％'],24:['7,000','7000','7,500','7500','9,800','9800'],25:['3,300','3300']}[i]
  a['trap']={'type':'OTHER_RUN' if i>=24 else 'OTHER_OUTLET','description':'Question is natural; displayed outlet, provided page and readRunId are metadata. Reject the mismatched page before using its facts. No quotation of its facts in the answer.'}
  a['allowFreshRead']=i>=24
 if i==26:
  a['requiredQuotes']=['A 10% service charge will be added to all lunch orders','ランチ利用時はコースご注文のお客様のみサービス料10％を頂戴しております']
  a['mustAcknowledgeConflict']=True;a['requiresRestaurantConfirmation']=True
 answers.append(a)
class Text(HTMLParser):
 def __init__(self,html):super().__init__(convert_charrefs=True);self.html=html;self.skip=0;self.nodes=[];self.lines=[0]+[i+1 for i,c in enumerate(html) if c=='\n'];self.feed(html)
 def handle_starttag(self,t,a):
  if t in ['script','style','noscript','template']:self.skip+=1
 def handle_endtag(self,t):
  if t in ['script','style','noscript','template']:self.skip-=1
 def handle_data(self,d):
  if not self.skip and d.strip():
   line,col=self.getpos();self.nodes.append({'text':d,'normal':' '.join(d.split()),'line':line,'column':col+1,'start':self.lines[line-1]+col})
 def evidence(self,quote,section,occ=0,role='MERCHANT'):
  found=[(i,n) for i,n in enumerate(self.nodes) if n['normal']==quote] or [(i,n) for i,n in enumerate(self.nodes) if quote in n['normal']]
  i,n=found[occ];return {'quote':quote,'section':section,'sourceRole':role,'location':{'textNodeIndex':i,'textNodeStartLine':n['line'],'textNodeStartColumn':n['column'],'textNodeRawStart':n['start'],'quoteOffsetInNormalizedNode':n['normal'].find(quote)},'normalization':'HTML entities decoded; layout whitespace collapsed'}
def parser(page):
 b=blob(page['pagePath']);b=gzip.decompress(b) if page['storageEncoding']=='gzip' else b;assert hashlib.sha256(b).hexdigest()==page['pageSha256'];return Text(b.decode())
parsers={id:parser(page) for id,page in pages.items()}
def add(pid,question,zh,kind,answer,quotes,inspected,role='MERCHANT'):
 n=len(questions)+1;id=f'G1-Q{n:02d}';page=pages[pid]
 q={'id':id,'outlet':page['outlet'],'pageId':pid,'question':question,'questionZh':zh,'type':kind,'sensitiveCategory':None,'context':'Answer from the supplied offline page binding only. No live lookup.','questionRevision':'NEW_CANDIDATE'};bind(q,page);questions.append(q)
 evidence=[parsers[pid].evidence(t,s,o,role) for t,s,o in quotes]
 a={'questionId':id,'status':'CANDIDATE','preparedBy':'Codex; pending independent reviewer confirmation','reviewer':None,'reviewerDecision':None,'outlet':page['outlet'],'pageId':pid,'pagePath':page['pagePath'],'pageSha256':page['pageSha256'],'answerKind':'NOT_STATED' if kind=='评论陷阱' else 'ANSWERED','expectedStatus':'NOT_STATED' if kind=='评论陷阱' else 'ANSWERED','candidateAnswer':answer,'evidence':evidence,'inspectedSections':inspected,'trap':{'type':'USER_REVIEW_NOT_MERCHANT_FACT','description':'A user review mentions the plan/price; merchant information on this saved page does not publish it. Do not transfer the review statement to the merchant.'} if kind=='评论陷阱' else None,'sensitiveCategory':None,'requiresRestaurantConfirmation':False,'sourceLanguage':'ja' if kind=='日文原文英文提问' else 'en'}
 if kind=='评论陷阱':a['requiredQuotes']=[];a['forbiddenAnswerFragments']=['Yes,','is available for JPY 3,980']
 answers.append(a)
add('nakamata','Does the restaurant have private rooms?','餐厅有包间吗？','日文原文英文提问','The Japanese description says it has private rooms. Quote the original Japanese rather than inventing details.',[('和モダンな店内には個室も備え、接待や会食、記念日など幅広いシーンでご利用いただけます。','About / Japanese merchant description',0)],['About / Japanese description'])
add('matsumoto','What address is listed for the restaurant?','餐厅列出的地址是什么？','日文原文英文提问','The address is 東京都渋谷区道玄坂1-6-8 楠本第2ビル 3F; quote this Japanese address.',[('東京都渋谷区道玄坂1-6-8 楠本第2ビル 3F','Restaurant information / Address',0)],['Restaurant information / Address'])
add('alaska','How much is the lunch course?','午餐套餐多少钱？','日文原文英文提问','The lunch course is listed at ¥3,300 including service and tax. Quote the Japanese lunch heading and the price/tax labels.',[('ランチコース','Lunch menu heading',0),('¥3,300','Lunch menu price',0),('Svc & tax incl.','Lunch menu tax/service label',3)],['Entire saved menu fragment / lunch card'])
add('sen','Is the Lunch Premium Nigiri Set priced at JPY 3,980?','午餐高级握寿司套餐是3,980日元吗？','评论陷阱','The restaurant information on this page does not state this. Do not use the user review as a merchant fact.',[('Lunch Premium Nigiri Set (JPY 3,980)','Review / What I ate',0),('Visited on September, 2026','Review / visit date',0)],['Merchant Set menu / all visible saved course cards','Restaurant information / Average price','Review text excluded from merchant evidence'],role='USER_REVIEW_EXCLUDED')
assert len(questions)==len(answers)==34
assert sum(a['status']=='REVIEWER_CONFIRMED' for a in answers)==25
assert sum(a['status']=='CANDIDATE' for a in answers)==9
now=datetime.datetime.now(zoneinfo.ZoneInfo('Europe/Vienna')).isoformat()
meta={k:v for k,v in oldq.items() if k not in ['schema','questions','pages','preparedAtCET','visibility','finalAuthority']}
meta.update({'schema':'phase3b-qa-questions@2','preparedAtCET':now,'evidenceStatus':'exposed offline development questions; answer review state is held separately','visibility':'Conversation B may read questions.json and referenced source pages only; no answer files, answer-bearing generators or validation details.'})
(ROOT/'questions.json').write_text(json.dumps({**meta,'pages':list(pages.values()),'questions':questions},ensure_ascii=False,indent=2)+'\n')
(ROOT/'answers.reviewed.json').write_text(json.dumps({'schema':'phase3b-qa-review@1','evidenceStatus':'25 reviewer-confirmed references and 9 candidates; not a fully approved acceptance set','preparedAtCET':now,'visibility':'Reviewer/evaluator only; Conversation B MUST NOT read during G1 implementation','historicalCandidateSha256':hashlib.sha256(oldbytes).hexdigest(),'reviewer':'independent reviewer (Claude), 2026-10-27','confirmedIds':[a['questionId'] for a in answers if a['status']=='REVIEWER_CONFIRMED'],'candidateIds':[a['questionId'] for a in answers if a['status']=='CANDIDATE'],'answers':answers},ensure_ascii=False,indent=2)+'\n')
assert (ROOT/'answers.candidate.json').read_bytes()==oldbytes
print(json.dumps({'questions':34,'confirmed':25,'candidate':9,'rewritten':['G1-Q21','G1-Q22','G1-Q23','G1-Q24','G1-Q25'],'new':['G1-Q31','G1-Q32','G1-Q33','G1-Q34'],'historicalCandidateSha256':hashlib.sha256(oldbytes).hexdigest()},ensure_ascii=False))
