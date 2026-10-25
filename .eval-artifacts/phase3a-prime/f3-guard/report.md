# F3 脚本读取与预检实施报告

- Evidence status: current implementation / exposed local fixtures；不是Clean Baseline或Live验收。
- 用户批准：停止点4自包含复核第1–7条；route/Omotesando留3f。F6不实施。
- 执行时区：Europe/Vienna，CET UTC+1；复核编号20261026。起点main d3f3d312。
- 独立分支：codex/fix-phase3a-prime-script-read-boundary。

## 行为与范围

共享Guard将fetch/xhr按页面脚本类核对，静态、文档、Other、WebSocket不合并。端点、方法、query及POST完整body限制保留。浏览器预检只核已批准实际读取的可观察投影；实际POST仍须通过完整四字符串规则。未知方法/header/origin/path/query/body拒绝，敏感路径、reserve来源撤销和逐跳重定向优先。

两来源声明、当前独立字面量审核、Runner默认审核输入、独立POST审计和独立Evaluator@36／Rubric@31同片同步；不导入生产Guard作为评价oracle。Recorder@5和trace保留外层body绑定、类型及握手事实；原始CDP与Playwright分别记录，不按URL猜测配对。原Prompt、action/state Schema未受影响，历史审核、录制和评价原字节保留。

## 检错与离线绿灯

| 失效机制 | 测试入口／独立预期 | 修前证据 | 修后证据与边界 |
| --- | --- | --- | --- |
| CDP类型回退误拒 | read-network-redirect.test.ts的E1；真实Chromium与独立接收器 | red.log：Network=Fetch、Fetch=XHR，缓存延迟80ms，目标断言false!=true | green.log：两次实际body分别到达，外层MATCH/MISMATCH与哈希独立核验；不是当前网站 |
| POST自动预检被GET-only拒绝 | 同文件TableCheck browser preflight；真实自动CORS、来源声明、独立接收器 | red.log：calendar-post预期到达实际未到达 | green.log：GET/fetch/XHR与日历POST/fetch/XHR到达；非法方法/header/path/query/缺字段/多字段/类型的实际请求0到达 |
| 审计/录制未同步 | 独立审计fixture、真实POST、Recorder产物后独立postBodyStop | 原Recorder省略body绑定；用目标产物断言补缺 | 154项相关默认回归绿，完整trace/Recorder核验通过；预检不能代替body；缺body仍未评价 |
| 原副作用边界 | 原Guard/真实浏览器reserve、提交/支付、多跳、DOM stale-ref回归 | 复用既有行为覆盖 | 五门禁统一收据；不把类型扩展为新授权 |

预检由独立CDP记录浏览器Other/preflight；Playwright会本地履行OPTIONS，接收器看到实际POST，不伪造接收端OPTIONS。合法预检后非法body的POST0到达，不能反推握手也必须0到达。

## 验证与限制

两个有效红灯在未修Guard的6bfc852b之前测试候选d50e28eb取得；最初缺node_modules的启动失败已排除，不计红灯。两个同断言真实Chromium本地fixture绿灯见green.log。五门禁以提交后的干净候选执行，结果另附gates.json；每门禁前后git status须为空。

page-parser/query-controls与Pack、budget SHA按baseline.json复核，来源声明修改不增加两站点行数。真实模型／Google／餐厅网站／Live新增0；不读取.env。Mock、本地真实Chromium不证明当前网站连接、空位或F5合格率。历史OPTIONS41/95仍缺当时协议事实，不能追认全部误拦；Linux原事件顺序未录，机制关闭不等于历史归因完全确定。POST/CORS完整重放未实现，录制如实NOT_REPLAYABLE，不补网。

最终验收：提交`28963ca8`的五门禁全部PASS，默认1054／Chromium161；每项前后status为空，日志与`gates.json`在本目录。`git diff --check`通过；两来源只改声明、增删行相抵；四个保护文件与budget SHA一致。此后仅归档日志／文档，不改已验证源码。按用户批准合main并推送工作分支，远端以实际ls-remote核对。
