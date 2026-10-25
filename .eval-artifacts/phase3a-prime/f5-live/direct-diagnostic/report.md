# Tabelog直连与健康检查计时排查

- 时间：2026-10-25 CET UTC+1；已暴露开发诊断，不是Live能力通过证据。
- 用户授权：“tabelog我网页打开正常，不知道又是什么问题。。。你试试直连或者什么”。本项只增加1次公开GET，已在budget.json单独记账；不加载.env、不使用Cookie、不跟随重定向、不调用模型、不重跑Live。

当前结论：项目CLI从开始就是--no-proxy，健康检查接收相同的有效环境，两项项目代理均清空。独立公开HTTP直连可用；健康检查末端快照与截止计时存在可复现竞争，但历史两次CHECK_TIMEOUT没有内部快照起止记录，精确归因仍为HYPOTHESIS。

## 直接观察

先提交ccc378df冻结采集器和SHA，随后GET同一来源流程已观察的公开地区页https://tabelog.com/en/tokyo/A1301/。ProxyHandler({})显式禁代理，HTTP200，3.658948秒、286733字节。原始响应无损gzip、SHA和安全元数据均保留；这仅证明本次HTTP文档连通，不证明浏览器JS或查位成功。

slot2第一次与第二次健康检查都记录Tabelog HTTP200但CHECK_TIMEOUT；第三次在不改变配置的情况下HEALTHY。三次原始attempt见../slots/2/后续归档或原始live-source-health目录。

## 本地构造控制（不是网站回放）

98d2b77c先冻结脚本与已保存HTTP文档SHA；使用实际runLiveSourceHealth入口和其既有fixture timeout override=1000ms。HTTP/页面内容不变，所有网络传输替身会拒绝外发。快快照组三次Tabelog全部HEALTHY；在后段让末次snapshot多耗220ms，三次全部CHECK_TIMEOUT。新网络／模型／Google／Live／环境重跑均0。

生产固定10000ms计时器与timeoutMs-100ms才判就绪的读取循环并存。该控制证明：已可解析且返回200的同一页面，也能被最后一次快照跨过截止点而记UNHEALTHY/CHECK_TIMEOUT。它没有测量历史健康检查里的实际快照时长，因此不冒充确定根因，也未改生产检查或绕过门禁。

## 本批收敛

当前F5包继续使用原冻结规则与额度；不因单次HTTP可用就改判健康或补记Live通过。若后续被此门禁阻断，最小后续工作是单独审查健康检查的末次观察和截止合同，补真实Chromium计时控制，区分检查器耗时与明确来源失败，保持403／5xx／挑战／繁忙页拒绝。该修复不在本批暗改。
