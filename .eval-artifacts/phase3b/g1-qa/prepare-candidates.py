from pathlib import Path
from html.parser import HTMLParser
import json,subprocess,tarfile,io,gzip,hashlib,datetime,zoneinfo
REV='cc12732020256f22e1827bf62fb4b66ccc3cb0ba'
ROOT=Path('.eval-artifacts/phase3b/g1-qa');ROOT.mkdir(parents=True,exist_ok=True)
def sha(b):return hashlib.sha256(b).hexdigest()
def blob(p):return subprocess.check_output(['git','show',REV+':'+p])
def gz(b):
 out=io.BytesIO()
 with gzip.GzipFile(filename='',fileobj=out,mode='wb',mtime=0) as f:f.write(b)
 return out.getvalue()
class Text(HTMLParser):
 def __init__(self,html):
  super().__init__(convert_charrefs=True);self.html=html;self.nodes=[];self.stack=[];self.lines=[0]+[i+1 for i,c in enumerate(html) if c=='\n'];self.feed(html)
 def handle_starttag(self,t,a):
  if t not in ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']:self.stack.append(t)
 def handle_endtag(self,t):
  if t in self.stack:self.stack=self.stack[:len(self.stack)-1-self.stack[::-1].index(t)]
 def handle_data(self,d):
  if not any(t in ['script','style','noscript','template'] for t in self.stack) and d.strip():
   line,column=self.getpos();self.nodes.append({'text':d,'normalized':' '.join(d.split()),'line':line,'column':column+1,'textNodeRawStart':self.lines[line-1]+column,'tags':list(self.stack)})
 def evidence(self,q,section,occurrence=0):
  matches=[(i,n) for i,n in enumerate(self.nodes) if q==n['normalized']] or [(i,n) for i,n in enumerate(self.nodes) if q in n['text'] or q in n['normalized']]
  if len(matches)<=occurrence:raise ValueError(('quote missing',q,len(matches)))
  i,n=matches[occurrence];return {'quote':q,'section':section,'location':{'textNodeIndex':i,'textNodeStartLine':n['line'],'textNodeStartColumn':n['column'],'textNodeRawStart':n['textNodeRawStart'],'quoteOffsetInNormalizedNode':n['normalized'].find(q),'enclosingTags':n['tags']},'normalization':'HTML entities decoded; whitespace collapsed only if quote crosses layout whitespace'}
prices='src/harness/browser/fixtures/restaurant-prices/'
c18='.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-18-attempt-1/recordings/hybrid-1792599832794/'
c11='.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-11-attempt-1/recordings/hybrid-1792595954054/'
archive='.eval-artifacts/phase3a-prime/f5-live-rerun/evidence/slot-1-recording.tar.gz'
tarbytes=blob(archive);tar=tarfile.open(fileobj=io.BytesIO(tarbytes));tarroot=tar.getnames()[0].split('/')[0]
pages=[];parsers={}
def page(id,site,name,url,path,date,scope='FULL_SAVED_DOCUMENT',member=None):
 body=tar.extractfile(tarroot+'/'+member).read() if member else blob(path)
 if member:
  path=str(ROOT/'pages'/(id+'.html.gz'));Path(path).parent.mkdir(parents=True,exist_ok=True);Path(path).write_bytes(gz(body))
 row={'id':id,'site':site,'outlet':{'id':id,'name':name,'sourceUrl':url},'pagePath':path,'pageSha256':sha(body),'storageEncoding':'gzip' if member else 'utf8','storageSha256':sha(Path(path).read_bytes()) if member else sha(body),'capturedOn':date,'dateTimezone':'UTC','scope':scope,'sourceGit':REV,'source':{'archive':archive,'archiveSha256':sha(tarbytes),'member':tarroot+'/'+member} if member else {'path':path},'evidenceStatus':'exposed saved public page; not current inventory or Clean Baseline'}
 pages.append(row);parsers[id]=Text(body.decode());return row
page('sen','TABELOG','Shibuya Sushi Sen','https://tabelog.com/en/tokyo/A1303/A130301/13275802/','src/harness/browser/fixtures/tabelog-sen-no-slots-20261010.html','2026-10-10')
page('nishi','TABELOG','Kushi Katsu Tanaka Nishiikebukuro ten','https://tabelog.com/en/tokyo/A1322/A132202/13155817/',None,'2026-10-25',member='snapshot-0006.html')
page('ooyama','TABELOG','Kushi Katsu Tanaka Ooyama ten','https://tabelog.com/en/tokyo/A1322/A132203/13168736/',None,'2026-10-25',member='snapshot-0007.html')
page('nakamata','TABLECHECK','Specializing in Nodoguro Ginza Nakamata','https://www.tablecheck.com/en/nakamata-nodoguro-ginza',c18+'snapshot-0004.html','2026-10-21')
page('takahashiya','TABLECHECK','Ginza Yondaime Takahashiya','https://www.tablecheck.com/en/takahashiya-ginza',c18+'snapshot-0005.html','2026-10-21')
page('aloft','TABLECHECK','Aloft Tokyo Ginza','https://www.tablecheck.com/en/aloft-tokyo-ginza',prices+'aloft-public-20261019.html','2026-10-19','EXTRACTED_MENU_FRAGMENT')
page('alaska','TABLECHECK','Restaurant Alaska Asahi','https://www.tablecheck.com/en/alaska-asahi',prices+'tablecheck-recorded-menu.html','2026-10-12','EXTRACTED_MENU_FRAGMENT')
page('matsumoto','TABELOG','Shibuya Sushi Matsumoto','https://tabelog.com/en/tokyo/A1303/A130301/13261619/',c11+'snapshot-0040.html','2026-10-21')
questions=[];answers=[]
def add(pid,kind,question,answer,quotes,answerKind='ANSWERED',sections=None,trap=None,sensitive=None,target=None):
 id='G1-Q%02d'%(len(questions)+1);p=next(p for p in pages if p['id']==pid)
 questions.append({'id':id,'outlet':target or p['outlet'],'pageId':pid,'question':question,'type':kind,'sensitiveCategory':sensitive,'context':'Answer only from this saved page at its capture date. No live lookup.'})
 evidence=[parsers[pid].evidence(q,section,occurrence) for q,section,occurrence in quotes]
 answers.append({'questionId':id,'status':'CANDIDATE','preparedBy':'Codex; model-assisted candidate, NOT human-confirmed','outlet':target or p['outlet'],'pageId':pid,'pagePath':p['pagePath'],'pageSha256':p['pageSha256'],'answerKind':answerKind,'candidateAnswer':answer,'evidence':evidence,'inspectedSections':sections or [],'trap':trap,'sensitiveCategory':sensitive,'requiresRestaurantConfirmation':bool(sensitive) or answerKind=='CONFLICT','reviewerDecision':None})
def q(text,section,occurrence=0):return(text,section,occurrence)
add('sen','有答案','保存页写明有没有包间、适合几人？','页面写有包间，列出2、4、6、8人。原文：“Private rooms”“Available”“For 2 people, For 4 people, For 6 people, For 8 people”。',[q('Private rooms','Seats/facilities'),q('Available','Private rooms row'),q('For 2 people, For 4 people, For 6 people, For 8 people','Private rooms row')])
add('sen','有答案','保存页支持哪些信用卡？','页面写可刷卡，列出VISA、Master、JCB、AMEX、Diners。原文：“Credit card accepted”“(VISA, Master, JCB, AMEX, Diners)”。',[q('Credit card accepted','Payment methods'),q('(VISA, Master, JCB, AMEX, Diners)','Payment methods')])
add('sen','有答案','能否用二维码支付？','页面写不接受二维码支付。原文：“QR code payments not accepted”。',[q('QR code payments not accepted','Payment methods')])
add('sen','有答案','保存页的吸烟规定是什么？','页面写禁烟。原文：“Non smoking”。',[q('Non smoking','Seats/facilities / Non-smoking/smoking')])
add('sen','有答案','星期六晚餐几点开始？','保存页列星期六、星期日及公众假期晚餐16:00开始。原文：“Sat, Sun, Public Holiday”“4:00 PM - 11:00 PM”。',[q('Sat, Sun, Public Holiday','Business hours'),q('4:00 PM - 11:00 PM','Business hours')])
add('sen','有答案','保存页写要加收多少服务费？','页面写加收10%服务费。原文：“A service charge of 10% will be added.”；日文：“サービス料10％を頂戴しております。”。',[q('A service charge of 10% will be added.','Service charge & fee'),q('サービス料10％を頂戴しております。','Original text')])
add('nishi','有答案','西池袋店当天取消，页面列的费用是多少？','保存页列当天取消无通知每人3000日元，有通知也是每人3000日元。原文：“On-the-day cancellation (no notice): 3,000 yen (per person)”“On-the-day cancellation (with notice): 3,000 yen (same as above)”。',[q('On-the-day cancellation (no notice): 3,000 yen (per person)','Reservation availability'),q('On-the-day cancellation (with notice): 3,000 yen (same as above)','Reservation availability')])
add('nishi','有答案','西池袋店有多少座位？','保存页写56席。原文：“56 seats”。',[q('56 seats','Number of seats')])
add('ooyama','有答案','大山店周二的营业时间是什么？','保存页周二至周五为17:00至次日01:00，并提示时间可能变化。原文：“Tue, Wed, Thu, Fri”“5:00 PM - 1:00 AM”“Please note that business hours may change. For the latest updates, kindly contact the restaurant.”。',[q('Tue, Wed, Thu, Fri','Business hours'),q('5:00 PM - 1:00 AM','Business hours'),q('Please note that business hours may change. For the latest updates, kindly contact the restaurant.','Business hours notice')])
add('takahashiya','有答案','页面说烤鳗鱼方式可以选吗？','页面列Kansai Jiyaki和Kanto Steam Grill，并说告知偏好后可以按偏好准备。原文：“Kansai Jiyaki, Kanto Steam Grill”“If you inform us of your preference, we will be happy to prepare it for you.”。',[q('Kansai Jiyaki, Kanto Steam Grill','Featured menu / grilling technique'),q('If you inform us of your preference, we will be happy to prepare it for you.','Featured menu / grilling technique')])
add('takahashiya','有答案','PARIS怀石套餐页面写通常要多久、赶时间怎么办？','页面写可用3小时，赶时间时1.5小时上菜。原文：“Plenty of time for 3 hours, Kaiseki course”“(If you are in a hurry, we will serve it in 1.5 hours)”。',[q('Plenty of time for 3 hours, Kaiseki course','Featured menu / PARIS Kaiseki'),q('(If you are in a hurry, we will serve it in 1.5 hours)','Featured menu / PARIS Kaiseki')])
add('aloft','有答案','不带饮料附加选项的Casual dinner 5 courses在这份保存菜单标价多少？含税和服务费吗？','保存菜单标价7000日元，含税和服务费。原文：“Casual dinner 5 courses”“¥7,000”“Svc & tax incl.”。这是保存菜单，不保证当前仍在售。',[q('Casual dinner 5 courses','First menu card'),q('¥7,000','First menu card'),q('Svc & tax incl.','First menu card')])
# Eight not-stated cases: absence is bounded by the exact saved page/fragment.
add('sen','页面未说明','最后点单时间是几点？','页面未说明最后点单时间；营业结束时间不能当作最后点单。',[q('Business hours','Restaurant information')],'NOT_STATED',['Restaurant information / Business hours','Menu / lunch courses','Service and page notices'])
add('sen','页面未说明','有不含蛋奶、也不用鱼高汤的纯素套餐吗？','页面未说明是否提供符合这些条件的纯素套餐，不能从寿司菜单推断。',[q('We will serve you the freshest seasonal nigiri of the day.','Lunch Omakase Course')],'NOT_STATED',['Menu / all saved course summaries','Food','Service','Restaurant introduction'])
add('sen','页面未说明','包间有最低消费或额外包间费吗？','页面未说明包间最低消费或额外包间费；不能把10%服务费当成包间费。',[q('For 2 people, For 4 people, For 6 people, For 8 people','Private rooms row')],'NOT_STATED',['Private rooms','Service charge & fee','Restaurant introduction','Set menu'])
add('nakamata','页面未说明','店内有免费Wi-Fi吗？','页面未说明是否有免费Wi-Fi。',[q('Specializing in Nodoguro Ginza Nakamata','Page identity')],'NOT_STATED',['About','Featured menu','Location & Info / address and cuisine','Footer / page notices'])
add('nakamata','页面未说明','有儿童高脚椅吗？','页面未说明儿童高脚椅是否提供。',[q('最高級のどぐろを心ゆくまで味わう専門店','About')],'NOT_STATED',['About','Featured menu','Location & Info','Page notices'])
add('takahashiya','页面未说明','可以刷美国运通信用卡吗？','页面未说明是否接受美国运通信用卡。',[q('Ginza Yondaime Takahashiya','Page identity')],'NOT_STATED',['About','Featured menu / tax notices','Location & Info','Footer / page notices'])
add('aloft','页面未说明','这份页面有没有说明取消套餐的退款比例？','页面未说明取消退款比例；提供的只是菜单片段，不代表完整官网或预约条款。',[q('Casual dinner 5 courses','First menu card')],'NOT_STATED',['Entire saved fragment / four menu cards','Prices and tax/service labels'])
add('alaska','页面未说明','套餐最晚点单时间几点？','页面未说明最晚点单时间；提供的只是菜单片段。',[q('ディナーコース','Dinner menu heading')],'NOT_STATED',['Entire saved fragment / three dinner and one lunch card','Menu examples and price labels'])
# Seven traps, with actual same-chain/near-name source identities and bilingual conflict.
other=next(p['outlet'] for p in pages if p['id']=='ooyama')
add('nishi','陷阱','我问大山店。这张页面写的56席能当作大山店的座位数吗？','不能。提供页面属于Kushi Katsu Tanaka Nishiikebukuro ten，56席是西池袋店的信息，不能用于大山店。',[q('Kushi Katsu Tanaka Nishiikebukuro ten','Restaurant name'),q('東京都豊島区西池袋5-8-9','Address'),q('56 seats','Number of seats')],'MISMATCH',trap={'type':'OTHER_BRANCH','description':'同一连锁西池袋页冒充大山店；不得转移座位事实。'},target=other)
other=next(p['outlet'] for p in pages if p['id']=='nishi')
add('ooyama','陷阱','我问西池袋店。这张大山店页面的无障碍说明能证明西池袋店也一样吗？','不能。提供的是Kushi Katsu Tanaka Ooyama ten页面，不能把大山店信息移作西池袋店事实。',[q('Kushi Katsu Tanaka Ooyama ten','Restaurant name'),q('東京都板橋区大山東町60-15 クルーズ大山','Address')],'MISMATCH',trap={'type':'OTHER_BRANCH','description':'同连锁不同分店；有无障碍文字也不得跨店绑定。'},target=other)
other=next(p['outlet'] for p in pages if p['id']=='sen')
add('matsumoto','陷阱','我刚才看的是Shibuya Sushi Sen；这个名字也以Shibuya Sushi开头，可以继续当作同一家吗？','不能。该页店名是Shibuya Sushi Matsumoto，不能只因Shibuya Sushi相同就当作Shibuya Sushi Sen。',[q('Shibuya Sushi Matsumoto','Restaurant name')],'MISMATCH',trap={'type':'SIMILAR_NAME','description':'渋谷两家Sushi的共同名称前缀不是同店证据。'},target=other)
add('aloft','陷阱','10月19日保存的7000日元晚餐菜单，能保证11月7日仍按这个价格供应吗？','不能保证。保存菜单写“¥7,000”，但没有证明11月7日的有效价格或仍供应；需要餐厅当前信息确认。',[q('¥7,000','First menu card')],'NOT_STATED',['Entire saved fragment / menu validity and dates'],{'type':'HISTORICAL_MENU','description':'历史保存菜单冒充未来有效价格；没有明确到期日，不能反称它已经过期。'})
add('alaska','陷阱','10月12日保存的午餐3300日元套餐，现在可直接说还在售吗？','不能。保存菜单写“ランチコース”“¥3,300”，没有当前在售或有效期证据。',[q('ランチコース','Lunch menu card'),q('¥3,300','Lunch menu card')],'NOT_STATED',['Entire saved fragment / menu validity and dates'],{'type':'HISTORICAL_MENU','description':'旧菜单不等于当前菜单；本页没有明确到期日期，不伪造已过期结论。'})
add('matsumoto','陷阱','午餐不点套餐也要加10%服务费吗？请同时看英文和日文原文。','页面日英说法不一致，不能给确定收费结论。英文：“A 10% service charge will be added. (A 10% service charge will be added to all lunch orders.)”；日文：“サービス料10％を頂戴しております。 （ランチ利用時はコースご注文のお客様のみサービス料10％を頂戴しております）”，日文把午餐收费限于点套餐的客人。请向餐厅确认。',[q('A 10% service charge will be added. (A 10% service charge will be added to all lunch orders.)','Service charge & fee / English'),q('サービス料10％を頂戴しております。 （ランチ利用時はコースご注文のお客様のみサービス料10％を頂戴しております）','Service charge & fee / Original text')],'CONFLICT',trap={'type':'JAPANESE_ENGLISH_CONFLICT','description':'英文all lunch orders与日文午餐仅套餐有实质范围差异；保留双方原文，不挑一方给确定结论。'})
add('sen','陷阱','评论里的3980日元午餐能当成页面当前商家菜单的可订价格吗？','不能。3980日元来自2026年9月到店评论，不是当前可订菜单的凭据；保存页商家另列Lunch Omakase Course及“6,980”。不能把两者视为同一套餐或保证当前价格。',[q('Lunch Premium Nigiri Set (JPY 3,980)','Review / What I ate'),q('Visited on September, 2026','Review visit date'),q('6,980','Merchant Lunch Omakase Course')],'NOT_STATED',['Merchant Set menu','Review / visit date and quoted price'],{'type':'DATED_REVIEW_VS_MENU','description':'过去评论价格冒充商家当前菜单；评论不是现售证明。'})
add('nishi','敏感类别','页面写有过敏信息，能保证花生严重过敏的人放心吃吗？','不能作安全保证。页面原文只写“Allergy information available”，没有花生或交叉接触保证；请向餐厅确认。',[q('Allergy information available','Menu / Food')],'NOT_STATED',['Food / Allergy information available','Menu summaries','Service and notices'],sensitive='ALLERGY')
add('ooyama','敏感类别','轮椅使用者是否可以进入大山店？能否保证厕所也无障碍？','页面原文列“Counter seating, Wheelchair access”，可转述为页面提到轮椅通行；未说明通道尺寸或厕所无障碍，请向餐厅确认。',[q('Counter seating, Wheelchair access','Space/facilities')],'ANSWERED',['Seats/facilities','Space/facilities','Service and notices'],sensitive='ACCESSIBILITY')
add('aloft','敏感类别','这份牛肉晚餐是清真认证套餐吗？','页面未说明清真认证。菜单原文有“Beef short rib steak”，牛肉名称不能证明清真认证；请向餐厅确认。',[q('Beef short rib steak','First menu card')],'NOT_STATED',['Entire saved fragment / ingredients','Menu titles and price labels'],sensitive='HALAL')
assert len(questions)==30
now=datetime.datetime.now(zoneinfo.ZoneInfo('Europe/Vienna')).isoformat()
meta={'schema':'phase3b-qa-candidates@1','evidenceStatus':'draft / not integrated; exposed candidate set, NOT acceptance Gold','preparedAtCET':now,'sourceGit':REV,'finalAuthority':'Reviewer per-question record; all current answers are CANDIDATE','newRealCalls':0}
(ROOT/'questions.json').write_text(json.dumps({**meta,'visibility':'Conversation B may read this file and the referenced pages; MUST NOT read answers.candidate.json','pages':pages,'questions':questions},ensure_ascii=False,indent=2)+'\n')
(ROOT/'answers.candidate.json').write_text(json.dumps({**meta,'visibility':'Conversation A / reviewer only; Conversation B MUST NOT read during G1 implementation','answers':answers},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'questions':len(questions),'types':{t:sum(q['type']==t for q in questions) for t in ['有答案','页面未说明','陷阱','敏感类别']},'pages':len(pages)},ensure_ascii=False))
