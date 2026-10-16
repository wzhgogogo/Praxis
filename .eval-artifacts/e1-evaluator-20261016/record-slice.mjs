// Generate small auditable documentation patches; apply with apply_patch.
import fs from 'node:fs';
const [id, title, summary, results] = process.argv.slice(2);
if (!id || !title || !summary || !results) throw Error('id title summary results required');
const base = '.eval-artifacts/e1-evaluator-20261016';
let patch = '*** Begin Patch\n';
function append(path, content) {
  const last = fs.readFileSync(path, 'utf8').trimEnd().split('\n').at(-1);
  patch += `*** Update File: ${path}\n@@\n ${last}\n+\n${content.split('\n').map(line=>'+'+line).join('\n')}\n`;
}
const status = fs.readFileSync('docs/STATUS.md','utf8');
const revision = status.match(/- Document revision: (\d+)\.(\d+)/)[0];
const [major,minor] = revision.match(/(\d+)\.(\d+)/).slice(1).map(Number);
patch += `*** Update File: docs/STATUS.md\n@@\n-${revision}\n+- Document revision: ${major}.${minor+1}\n@@\n ## 当前门槛\n+\n+- **2026-10-16 E1-${id} ${title}：** ${summary} ${results} 证据${base}/report.md；其余切片继续，仅离线，无模型／Live／见证GET，人工表待复核者导出。\n`;
append('docs/history/DEVLOG.md', `## DEV-2026-10-16-E1-${id}\n\n${title}。${summary} 详见${base}/report.md，仅离线，不修改生产资格或历史输入。`);
append('docs/history/TEST-LOG.md', `## TEST-2026-10-16-E1-${id}\n\n${results} ${summary} 原始日志见${base}/report.md，不把测试总数当能力证明。`);
append('docs/history/monthly/2026-10-index.md', `- [E1-${id} ${title}](../DEVLOG.md#dev-2026-10-16-e1-${id}) · [验证](../TEST-LOG.md#test-2026-10-16-e1-${id})`);
append(`${base}/report.md`, `## ${id} ${title}\n\n${summary}\n\n${results}`);
console.log(patch+'*** End Patch');
