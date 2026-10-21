"""Audit production source against saved 2026-10-21 pages; no web access."""
import hashlib
import json
import pathlib
import re
import subprocess
import sys
from html.parser import HTMLParser

root=pathlib.Path(__file__).resolve().parents[3]
source=pathlib.Path(sys.argv[1])
batch=pathlib.Path(__file__).resolve().parent
prefix=pathlib.Path('.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/quick-live-results')
class Classes(HTMLParser):
    def __init__(self, html):
        super().__init__();self.values=[];self.feed(html)
    def handle_starttag(self, tag, attrs):
        value=dict(attrs).get('class')
        if value is not None:self.values.append(value)
pages=[]
for p in sorted((source/prefix).glob('*/recordings/*/recording.json')):
    recording=json.loads(p.read_text())
    for d in recording['documents']:
        host='TABELOG' if d['url'].startswith('https://tabelog.com/') else 'TABLECHECK' if re.match(r'https://(?:www\.)?tablecheck.com/',d['url']) else None
        if not host:continue
        f=p.parent/d['file'];data=f.read_bytes()
        pages.append({'provider':host,'url':d['url'],'path':str(f.relative_to(source)),'sha256':hashlib.sha256(data).hexdigest(),
                      'classes':Classes(data.decode()).values})
paths=sorted(list((root/'src/integrations/tabelog').glob('*.ts'))+list((root/'src/integrations/tablecheck').glob('*.ts'))+[root/'src/integrations/restaurant-search/source-packs.ts'])
paths=[p for p in paths if not p.name.endswith('.test.ts')]
dependencies=[]
exact=re.compile(re.escape('class=["\']')+r'([\w -]+)'+re.escape('["\']'))
for p in paths:
    rel=str(p.relative_to(root));old=subprocess.check_output(['git','show',f'54383f8f:{rel}'],cwd=root,text=True)
    current=p.read_text()
    for line_no,line in enumerate(old.splitlines(),1):
        markers=[('JS_TOKEN',v) for v in sorted(set(re.findall(r'js-[\w-]+',line)))]
        markers += [('EXACT_CLASS_ATTRIBUTE',v) for v in sorted(set(exact.findall(line)))]
        for kind,marker in markers:
            provider='TABLECHECK' if '/tablecheck/' in rel else 'TABELOG'
            covered=[page for page in pages if page['provider']==provider]
            hits=[page for page in covered if any(marker==v if kind=='EXACT_CLASS_ATTRIBUTE' else marker in v.split() for v in page['classes'])]
            state='仍存在' if hits else '已消失' if covered else '未覆盖'
            current_lines=[i for i,l in enumerate(current.splitlines(),1) if marker in l]
            dependencies.append({'provider':provider,'kind':kind,'marker':marker,'baselinePath':rel,'baselineLine':line_no,
               'baselineExpression':line.strip(),'currentLines':current_lines,'status':state,'coveredPages':len(covered),'matchingPages':len(hits),
               'evidence':[{k:v for k,v in page.items() if k!='classes'} for page in hits[:3]],
               'criticalPath':p.name=='tabelog-query-controls.ts','action':'FIXED' if p.name=='tabelog-query-controls.ts' and not current_lines else 'REPORT_ONLY'})
# Token comparisons are deliberately listed separately from whole-class equality.
supplement=[]
for marker in ['menu-item','CalendarSkeleton','skeleton']:
    covered=[page for page in pages if page['provider']=='TABLECHECK']
    hits=[page for page in covered if any(marker in v.split() for v in page['classes'])]
    supplement.append({'marker':marker,'provider':'TABLECHECK','kind':'TOKEN_OR_GENERIC_STATE_NOT_WHOLE_CLASS',
       'path':'src/integrations/tablecheck/tablecheck-page-parser.ts','status':'仍存在' if hits else '未覆盖',
       'matchingPages':len(hits),'reason':'No private js- hook or whole-class equality in TableCheck production source; legacy menu-item reservation DOM is not covered by allowed public-guide snapshots.'})
inventory=[{k:v for k,v in p.items() if k!='classes'} for p in pages]
output={'schema':'saved-source-private-class-audit@1','baselineCommit':'54383f8f','sourceCommit':'e95de8cd053b85f659f6a17a30e299eb59d5352d',
        'scope':[str(p.relative_to(root)) for p in paths],
        'rules':'All js- literal dependencies and whole-class-attribute equality patterns in production site code, including source-packs. Supplemental individual token/generic state comparisons are separate.',
        'pages':inventory,'dependencies':dependencies,'tableCheckSupplement':supplement,'sourceRequests':0,'modelCalls':0}
(batch/'private-class-audit.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
lines=['# 站点私有 class 离线审计','', '2026-10-21 已保存页面；原始来源提交 e95de8cd。未访问网站。基线 54383f8f，保留逐行表达式及证据 SHA，见 private-class-audit.json。','',
       '| 来源 | 基线位置 | 依赖 | 状态 | 命中页面 | 处置 |','|---|---|---|---|---:|---|']
for d in dependencies:lines.append(f"| {d['provider']} | {d['baselinePath']}:{d['baselineLine']} | `{d['marker']}` | {d['status']} | {d['matchingPages']}/{d['coveredPages']} | {d['action']} |")
lines += ['', 'TableCheck 生产来源代码没有 js- 钩子或整串 class 精确匹配。额外审计其单 token / 通用 loading 状态：']
for d in supplement:lines.append(f"- `{d['marker']}`：{d['status']}（{d['matchingPages']} 页）。未出现的旧预约菜单结构列为未覆盖，不能据公开 guide 页面宣称已消失。")
lines += ['', '本次关键路径额外发现：运行时 GET 为 `/en/booking/calendar/find_vacancy`，旧监听只接受带末尾 `/` 的路径。19 个终末快照的捕获响应均为 0；现同时监听两种明确路径，不新增 Guard 权限。旧 Live 录制不回填。',
          '', '课程列表和列表日期的剩余私有钩子仅报告；今天有实存证据，本次不扩展修改。静态审计不覆盖没有保存的页面、未来改版、网络可用性或实时库存。']
(batch/'private-class-audit.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'pages':{p:sum(x['provider']==p for x in pages) for p in ['TABELOG','TABLECHECK']},'dependencies':len(dependencies),'statuses':{s:sum(d['status']==s for d in dependencies) for s in ['仍存在','已消失','未覆盖']}},ensure_ascii=False))
