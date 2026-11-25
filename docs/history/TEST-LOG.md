# 验证日志

早期验证保存在 [2026 年 8–11 月测试日志](TEST-LOG-2026-08-to-11.md)。

<a id="phase-3c-closeout-20261125"></a>

## 2026-11-25 · Phase 3c 主线八项门禁

代码验收提交 `fb9c307a9f1d6f99598fa62ef98dddf3daf4d506`，全部命令在同一净树上执行。依合并锁文件执行 `npm ci`，按 HEAD 精确恢复四份初始 G6 夹具、49 份指定夹具及定向回归发现的 G1 页面和独立评审。dist C1 在 Build 之后将 `src/domains/restaurant/fixtures/booking-handoff/source.json` 复制到 `dist/domains/restaurant/fixtures/booking-handoff/source.json` 再运行。

| 命令 | 结果 | 退出码 | 耗时 |
| --- | --- | ---: | ---: |
| `npm run check:worktree` | 通过，非 cone 稀疏检出 | 0 | 0.177 秒 |
| `npm run test:worktree` | 2/2 | 0 | 2.414 秒 |
| `npm run typecheck` | 通过，后端与浏览器严格类型检查 | 0 | 0.740 秒 |
| `npm run arch:check` | 通过 | 0 | 0.315 秒 |
| `npm run build` | 通过，后端与浏览器构建 | 0 | 0.687 秒 |
| `npm test` | 1,995/1,995 | 0 | 85.723 秒 |
| `npm run test:browser:fixture` | G2 5/5、Chromium 609/609，合计 614/614，另有 G6 159/159 | 0 | 503.335 秒 |
| `PRAXIS_CDP_DIST=1 node --import tsx --test src/harness/browser/cloudflare-cdp-isolation.test.ts` | 4/4 | 0 | 17.142 秒 |

测试使用 Offline、Fixture 和录制回放。模型、网站、真实 PostgreSQL 和预约写入未在门禁中调用。真实 DeepSeek 日期抽测另计有效提议 10/10、编译 9/10。D04 修复后同一批回包离线回放 10/10，新增真实请求 0 次。2026-11-25 局域网 4312 用户走查单列，未纳入门禁分母。规模化 Live Read-only 与 Controlled Live-write 尚待验收。[状态及证据](../STATUS.md#验收证据)
