"""Append per-item facts and synchronize their current/monthly navigation."""
from pathlib import Path
import json,re,sys
spec=json.loads(Path(sys.argv[1]).read_text()); key=spec['key']; text=spec['text']; item=spec['item']
entries=[('docs/STATUS.md',f'- **2026-10-25-{key}:** {text} [报告](../.eval-artifacts/phase3a-prime/{item}/report.md)。\n\n'),('docs/history/DEVLOG.md',f'\n## DEV-2026-10-25-{key}\n\n{spec["development"]} [报告](../../.eval-artifacts/phase3a-prime/{item}/report.md)。\n'),('docs/history/TEST-LOG.md',f'\n## TEST-2026-10-25-{key}\n\n{spec["verification"]} [报告](../../.eval-artifacts/phase3a-prime/{item}/report.md)。\n'),('docs/history/monthly/2026-10.md',f'- 10/25 {text} [报告](../../../.eval-artifacts/phase3a-prime/{item}/report.md)。\n\n')]
for filename,entry in entries:
 p=Path(filename);s=p.read_text();assert key not in s,filename
 s=re.sub(r'Last updated: \d{4}-\d{2}-\d{2}', 'Last updated: 2026-10-25', s, count=1)
 s=re.sub(r'(Document revision: \d+\.)(\d+)',lambda m:m[1]+str(int(m[2])+1),s,count=1)
 if filename.endswith('STATUS.md'): pos=s.index('\n- **')+1;s=s[:pos]+entry+s[pos:]
 elif '/monthly/' in filename:
  s=s.replace('截至10月24日','截至10月25日').replace('Recorded period: 2026-10-01—2026-10-24','Recorded period: 2026-10-01—2026-10-25')
  pos=s.index('\n- 10/')+1;s=s[:pos]+entry+s[pos:]
 else:s=s.rstrip()+'\n'+entry
 p.write_text(s)
p=Path('docs/history/monthly/2026-10-index.md');s=p.read_text();assert key not in s
s=re.sub(r'Last updated: \d{4}-\d{2}-\d{2}', 'Last updated: 2026-10-25', s, count=1)
s=re.sub(r'(Document revision: \d+\.)(\d+)',lambda m:m[1]+str(int(m[2])+1),s,count=1)
for label,prefix,file in [('开发','DEV','DEVLOG'),('验证','TEST','TEST-LOG')]:
 s=re.sub(r'('+label+r'记录（)(\d+)(条）)',lambda m:m[1]+str(int(m[2])+1)+m[3],s,count=1)
 anchor=f'{prefix}-2026-10-25-{key}'.lower();row=f'| 2026-10-25 | [{prefix}-2026-10-25-{key}](../{file}.md#{anchor}) |\n'
 section=s.index('## '+label+'记录');pos=s.index('| --- | --- |\n',section)+len('| --- | --- |\n');s=s[:pos]+row+s[pos:]
p.write_text(s)
