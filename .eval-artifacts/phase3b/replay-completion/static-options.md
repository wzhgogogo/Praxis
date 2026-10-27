# 静态资源与DOM-only回放方案（仅提议）

Evidence status：draft / not integrated。时间2026-10-26T23:54:36.400389+01:00（CET）。输入固定Git cc127320；不请求网站、不改变Guard、Source Pack、Recorder或脱敏。逐页明细[static-audit.json](static-audit.json)含94页及origin+path，不含query。

## 已保存证据

F5初轮5槽metrics合并24个未捕获脚本路径。重跑槽1已有其中10个脚本原始安全字节（包括9个Tabelog、TableCheck的index-m1GDPVCL.js），不能继续全部写成“未捕获”。该槽实际ADMITTED但HAR缺失的脚本只有index-DUt7bgp8.js，涉及75个快照；Adobe及umami为Guard BLOCKED，不能把被拒路径当成已获读取许可。其余旧清单在该槽未观察，不能宣称当前仍缺或已修。

原资格19/94（20.21%），75为UNCAPTURED_STATIC_DEPENDENCY。深入检查75页还缺cdn0.tablecheck.com/common/css/tablekit-font-faces.v1.min.css，71页另有动态响应路径未见HAR；其中3页还有tabelog.com/en/search_form。记录的请求可能跨活动页面累积，按这些快照受影响计数，**不把TableCheck依赖写成Tabelog页面本身需要**。现有first-failure原因码不会展示所有缺项。路径级存在不证明该次query/版本字节准确；trace没有query值，不能据此提升资格。

## 方案比较与合格率

| 方案 | 作用与代价 | 安全条件 | 当前归档 / 未来预期 |
| --- | --- | --- | --- |
| (a) 审核必要静态资源 | 有机会恢复真实JS、控件与事件；仍须CSS及动态读取的完整字节，不能只补脚本 | 仅实际观察的origin/path/query语法与GET/HEAD；保持Guard全部方法、路径、query/body边界；Recorder仍原字节、UTF-8、2.5MB、凭据检查，不改代码以凑可执行 | 当前仍19/94，缺字节无法离线补回。未来该槽75页全部静态补齐后仍有71页动态缺项，按保存证据最多额外4页可进入下一道核对；23/94仅“静态缺项不再单独阻断”的理论上界，不是合格预测。完整动态及精确响应仍需另验 |
| (b) 不执行脚本，只读保存DOM | 可检验当时已有的可见原文、链接、控件；无法重建尚未渲染内容、异步读取、JS交互或未序列化状态 | 独立DOM诊断模式，禁脚本/服务工作线程/外部传输；不产生库存或完整任务成功声明，不改变网络Replay资格 | 94/94有诊断DOM，只是可尝试读取上限。已实际读取6/6，见dom-only-proposal.json；其中初始TC列表仅121字符，无结果内容。当前网络资格仍19/94，不能把94/94当成可执行Replay |
| (c) 两者结合（提议） | 网络完整页执行原样回放；另有明确DOM诊断通道供观察/问答回归。需要维护两种模式、各自输入与指标 | 两种模式不能静默混用或把DOM页升格；脚本审核与动态响应脱敏边界继续独立核对 | 当前19/94不变。未来(a)解决可执行输入、(b)提供有界观察；达到完整回放仍依赖匹配版本、完整数据与原交互，不能承诺100% |

方案(a)的23/94算术为19个原合格 +4个仅缺静态的快照。它不是运行验证：缺失脚本正文尚无法检查是否满足现有扫描；后续JS也可能需要其他未记录依赖。并且历史合格页比例与当前执行消费0/94是两个指标。方案(b)探针只禁脚本读正文，未做动作或库存确认，6页的网络资格均未改变。

提议(c)进入后续实现复核，先集中必要商家脚本、CSS与已批准动态读取，保留DOM诊断以核对公开语义。对Guard阻止或未观察的脚本不为提高数字而直接放行。本批不实现任何方案，不增加静态规则，不放宽Recorder扫描。

## 历史清单（完整origin+path，无query）

- `https://assets.adobedtm.com/3687940b53f7a560587a33c8bb748b9253ff5ea9/satelliteLib-15b13f3fd03e00e11fcd40b9f97c8b58a9ca6e66.js`（重跑槽1已观察但无字节）
- `https://browser.sentry-cdn.com/6.18.2/bundle.min.js`（重跑槽1未观察，不能推定当前状态）
- `https://static.parastorage.com/services/pro-gallery-tpa/1.1535.0/WixProGalleryViewerWidget.bundle.min.js`（重跑槽1未观察，不能推定当前状态）
- `https://static.parastorage.com/services/tag-manager-client/1.1075.0/siteTags.bundle.min.js`（重跑槽1未观察，不能推定当前状态）
- `https://static.parastorage.com/services/wix-thunderbolt/dist/main.693e1c6a.bundle.min.js`（重跑槽1未观察，不能推定当前状态）
- `https://static.parastorage.com/services/wix-thunderbolt/dist/main.renderer.b325a058.bundle.min.js`（重跑槽1未观察，不能推定当前状态）
- `https://static.parastorage.com/services/wix-thunderbolt/dist/thunderbolt-commons.edd84710.bundle.min.js`（重跑槽1未观察，不能推定当前状态）
- `https://static.parastorage.com/unpkg/lodash@4.18.1/lodash.min.js`（重跑槽1未观察，不能推定当前状态）
- `https://static.parastorage.com/unpkg/react-dom@18.3.1/umd/react-dom.production.min.js`（重跑槽1未观察，不能推定当前状态）
- `https://static.parastorage.com/unpkg/react@18.3.1/umd/react.production.min.js`（重跑槽1未观察，不能推定当前状态）
- `https://tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/commons.js`（重跑槽1 HAR已有字节）
- `https://tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/rst/inbound/inbound_restaurant_detail/index.js`（重跑槽1 HAR已有字节）
- `https://tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/rst/inbound/inbound_restaurant_detail/menu.js`（重跑槽1未观察，不能推定当前状态）
- `https://tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/rst/inbound/inbound_restaurant_detail/top.js`（重跑槽1 HAR已有字节）
- `https://tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/rst/inbound/inbound_restaurant_list/index.js`（重跑槽1 HAR已有字节）
- `https://tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/rst/inbound_restaurant_list.js`（重跑槽1 HAR已有字节）
- `https://tblg.k-img.com/javascripts/assets/sentry_initializer.js`（重跑槽1 HAR已有字节）
- `https://tblg.k-img.com/javascripts/lib/jquery-3.4.1.min.js`（重跑槽1 HAR已有字节）
- `https://tblg.k-img.com/javascripts/lib/jquery_ujs-3.4.1.js`（重跑槽1 HAR已有字节）
- `https://tblg.k-img.com/javascripts/s_code.js`（重跑槽1 HAR已有字节）
- `https://umami-next.post.tablecheck.com/script.js`（重跑槽1已观察但无字节）
- `https://www.1bangai.org/_partials/wix-thunderbolt/dist/clientWorker.1634c378.bundle.min.js`（重跑槽1未观察，不能推定当前状态）
- `https://www.tablecheck.com/portal/assets/index-DUt7bgp8.js`（重跑槽1已观察但无字节）
- `https://www.tablecheck.com/portal/assets/index-m1GDPVCL.js`（重跑槽1 HAR已有字节）
