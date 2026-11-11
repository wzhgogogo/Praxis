# 三个图片 fixture 同步

2026-11-04 CET（UTC+1）；current local fixture regression，非 Live。

基于 B `c1c1187af13941815eb10756416054708922984d`，用户已批准只同步图片保留声明。切片：恢复原三个图片相关行为检查，不更改产品资源策略、业务断言或超时。真实模型、Google、网站、公开 GET、Live、环境重跑新增均为 0；不读取 `.env`，共享账本不变。

- outstanding image：本地 origin 精确 `/image`，仅 `image`。
- redirect：仅图片变体传入保留开关，本地 origin 精确 `/asset`、`/asset-hop` 两个同图重定向跳；foreign origin 不在保留集合。原零跨源到达和 REDIRECT_BLOCKED 断言不变。
- replay optional image：本地 origin 精确 `/not-recorded`，仅 `image`。原缺失记录 MISSING_RESPONSE、零真实网络到达和不编造 bytes 断言不变。

输入和原断言行 SHA 见 `inputs-sha256.json`，三个文件的全部原断言行逐字相同。没有生产站点例外、Pack 或 Guard 代码改动。

## 红绿

未修 B 路径三条原断言均失败，原始日志 `red-three.log.gz`；同样命令修后三条 3/3 通过，`green-three.log.gz`。`red.log.gz` 是首次正则漏选重定向测试的 2 失败日志，不冒充三条红灯。全部为真实本地 Chromium；合成 HAR 不称网站回放。

## 完整验证

净树候选 `d419bfede780ad5891b1e44d06b48582fc194331`：typecheck、arch:check、build 通过；默认 1410/1410、Chromium 188/188；严格 G2 5/5（12 页均 PASS）。全部六步前后 git status 为空，没有跳过/取消/重试。详情见 `gates.json` 与逐项原始压缩日志；最终归档仅补文档/日志，不改变三个 fixture 的已冻 SHA。git diff --check 通过。仅推工作分支，不合 main，通知 B。

此结果关闭三个 fixture 与已批准资源策略的配置不匹配，不证明真实 Tabelog 超时根因，也没有执行 Live 或公开 GET。
