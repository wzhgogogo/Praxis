# B 证据索引

## 模式与冻结

- 本目录是Live Read-only探查及其离线解析；不是D02-V成绩。源代码逐字等于32b97ed8。
- 初始脚本/config/新账本提交495878006575426e3b00239d671672068115f051；初始账本SHA见preflight-hashes.json。
- 摘要回调修正提交b0dccffca67066857aa5051a6596dcd14a603551：先保留第1次原始输出，再本地Chromium验证。运行时未改任何文件；更新的是已经结束的阶段的后继冻结。
- 分类继续阶段ab45e4e14b507acf0c704c3c2165d17a28509036：起点逐字来自runtime-02/stages.json最后已观察到的URL；只跟随其Other链接及新出现的Robatayaki链接。
- config里的源页面属性/ID/类目词是此探查的公开、已录制定位元数据，未进入src/Prompt/Skill，也没有新增生产站点规则或词表。当前唯一探查脚本probe.ts，历史版本由Git保留。

## 问题1：原生表单

- [runtime-02/stages.json](runtime-02/stages.json) 第6个对象（`label=native-form-submitted`）：完整原生提交URL、来源标题、地点面包屑及读取后的表单.value。响应200由同次recording.json的RESPONSE_OMITTED元数据及URL哈希独立绑定，见evidence-audit.json chargedDocuments[2]。
- [runtime-02/scripted-decisions.json](runtime-02/scripted-decisions.json) sequence1/2：现有目标的`availableActions:CHOOSE_OPTION:PARTY_SIZE/TIME`，原执行器实际发出CHOOSE_OPTION，选择8/2030；[probe-events.json](runtime-02/probe-events.json) 的NATIVE_SELECT_EXECUTOR两条status=COMPLETED。它们是脚本化Proposal，不是实际模型输出，真实模型计数0。
- 预提交原生select通过property改变；HTML的默认selected属性可能仍为初始2/1900，故不拿预提交page.content中的旧属性当失败或成功依据。live form.value投影和提交后新文档的selected属性都用于核验；最终新文档为8/2030。
- 原生提交页DOM未保存：原Recorder发现未声明的utf8/lid/commit查询形状，DOCUMENT_SANITIZATION.reason=UNREVIEWED_DOCUMENT_QUERY_SHAPE、urlAccepted=false、documentAccepted=true。没有伪造或恢复该正文，也没有放宽URL清洗。runtime-02/pages6/7的简略UNSAFE_DOCUMENT标签须与此详细原因一起读。
- 保持相同空位过滤参数的来源分类列表仍可保存：[runtime-02/directory-probe/snapshot-0008.html](runtime-02/directory-probe/snapshot-0008.html)（Washoku，20卡）、snapshot-0010.html（Japanese Cuisine，9卡）。两者均有来源生成的Reservations available筛选摘要、日期人数和逐店时间控件；逐卡解析见evidence-audit.json。

## 问题2：精确分类路径

- 每一步目标链接记录于各runtime的probe-events.json：kind=OBSERVED_CATEGORY_LINK_CLICK，URL取自可见链接的真实href；CATEGORY_LINKS记录当时所有面板链接。
- [runtime-03/directory-probe/snapshot-0004.html](runtime-03/directory-probe/snapshot-0004.html)：Other页面，title第2行、h1第31行；分类面包屑第185行；第220行可见Robatayaki链接，包含完整既有日期/人数/时段查询。
- [runtime-03/stages.json](runtime-03/stages.json) 最后对象exact-cuisine-result：真实URL、Best Robatayaki in Nakano、Tokyo/Nakano地点面包屑及All→Restaurants→Washoku→Other→Robatayaki分类面包屑。
- 精确目标不在Japanese Cuisine目录下；探查中该目录只是中间检查，不以其广泛含义判请求满足。最后从页面已有的Other链接进入正确分支，不拼RC编码，不用宽类目替代。

## 问题3：叠加与显示边界

- [runtime-03/directory-probe/snapshot-0005.html](runtime-03/directory-probe/snapshot-0005.html) 及同目录replay.har：该精确分类文档HTTP200，final recording为REPLAYABLE。
- DOM：title第2行，h1第31行；地点面包屑第70/133行、分类第185行；svd第241行，svps第683行，svt第984行；筛选摘要第1036行。原文`Reservations available(December 10, 2026 (Thu) 8 people 8:30 PM)`。
- 第1078行起唯一列表卡片13309182（sumika），日期人数文本在其子树；时间20:00/20:30/21:00分别在1169/1175/1181行为a，20:15/20:45在1172/1178行为带禁用样式的span。只是来源UI显示及可操作性描述；未点任何时段，不把私有class当作产品库存判定依据。
- 没有生成Offer，没有身份HIGH核对、B1或下单。源时间为JST，未换成CET。

## 原始产物和审计

- runtime/：第1次入口读取与摘要脚本错误，2份入口DOM，原HAR与layout-only截图保留；1文档GET。
- runtime-02/：原生表单和第一阶段分类检查；4文档GET、11次观察（2次DOM拒录如上）。
- runtime-03/：从已观察的Japanese Cuisine URL继续Other/Robatayaki；3文档GET、5次观察，全部可回放。
- 所有8次文档响应均200，没有Guard规则改动。非GET预转发拒绝计数0。页面资源请求形状在request-shapes.json中另记，现有Guard的NETWORK轨迹保留在recording.json内；没有保存请求头/Cookie。
- [audit-recording.mjs](audit-recording.mjs) 是运行结束后的独立本地HTML/HAR解析；[audit.log](audit.log)及[evidence-audit.json](evidence-audit.json)含输入SHA与行列。不是运行脚本或评价器修改。
- [active-budget-seed-probe-20261112.json](active-budget-seed-probe-20261112.json) 最终8/8GET、0/20模型、0Full-Live、0环境重跑。protected-before/after及final-audit证明主草稿与四旧账本不变、阶段脚本/config在各自执行期未改。达到GET上限后无更多网站读取。
