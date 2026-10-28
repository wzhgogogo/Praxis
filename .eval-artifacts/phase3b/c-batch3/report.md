# 3b C 批次3：结构化地址与有界具名检索

- Evidence status: draft / not integrated；已暴露开发数据，非Clean Baseline。
- Timezone: Vienna CET UTC+01:00。
- Base: branch bf12aaf0；开始前以9181eee9整合main/90b464d8，保留双方原提交与文档、88条账本；同ID的C批次1准备快照仅由C自己的已完成记录承接，计数和共同字段相同，main原账本由sourceSnapshot和Git保留。

## 切片与验收

用户可观察结果：Google候选的原名检索未确认同店时，只增加一种经逐字核对的替代检索；完整日文地址不再把建筑数字、缺失楼层或B1拼写误当门牌冲突。身份仍由既有resolver接纳，邮编/明确门牌/明确楼层冲突拒绝，名称或检索命中不构成身份。

完成证据：有效红灯→绿灯；29份原保存页复算；批次2保存检索响应离线组合；两项获批G2原页基线更新、独立G2与五门禁全部绿，逐项前后净树；输入和脚本先提交并冻结SHA。Mock/Replay/真实调用单列，具名Prompt26真实24/24沿用批次2，不添加代码保名。

停止：门禁两次修复仍红、S0、身份规则放宽或未获批跨归属/版本冲突、额度/基础设施失败。可选旧样本GET超时仅停可选阶段，不影响本批离线工作。完成后推工作分支供复核，不合main。

### 数量去重（用户已确认，需复核者知晓）

旧12家已经包含nr-004/016/024，不能再加三次；nr-020因邮编冲突明确保持UNKNOWN。用户确认按“三家恢复、nr-002接纳、nr-020/029拒绝、错认0且无新增退化”验收；冻结29份已访问页的正确接纳预期至少12/29，而非16/29。未访问的详情和认证页不进入此分母。

## 修改前范围（9181eee9行号）

- `src/integrations/restaurant-availability/outlet-identity.ts`：postalCode/withoutPostal 8–15、UNIT_PATTERN及unitTokens/withoutUnits 17–43、streetNumbers/tokens/sameSequence 45–56、possibleFloorPostalVariation/hasSufficientAddress 58–77、compareCompleteOutletAddress/sameCompleteOutletAddress 79–109。按字段比较，只把可比字段的明确矛盾作为CONFLICT；楼层规范化、结构门牌、建筑辅助，不新增电话或名称豁免。
- G2例外仅`src/harness/browser/fixtures/dom-change/baseline.json`中tabelog-detail-01/02原页identity:address：分别改为`1710021 東京都豊島区西池袋5-8-9`、`1730014 東京都板橋区大山東町60-15 クルーズ大山`；其他字段/页、变异期望、评分器和变异规则不改。
- Review record: independent reviewer (Claude), 2026-10-28；用户转达已核对两地址在对应原保存页，与Q21/Q22原文位置一致。实施方不读取G1答案文件。
- 生产接线范围：两站具名发现/身份解析、source-pack构造上下文、LiveBrowserAvailability中同一模型预算，替代检索独立对象，不改B的Agent Prompt/State或G3日历读取。

## 授权与输入隔离

本批最多模型20、Google10、公开GET12（仅可选旧15例），Live0；共享3b仍为模型1000/GET40/Live18/环境重跑4，批次开始累计40/18/0/0，Google11。实际逐次记账、按ID并集，不占用3a′。

必须离线验证可用已保存响应完成，新增调用只在必要且预算许可时使用。凭据若需使用，仅Node runner `--env-file=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env`注入；不独立读取、打印、复制、哈希或暂存该文件。Gold rst_id只用于事后核对，不进入检索提议/Prompt。

## 结果

待实施与验证。

### 检索对象与实施预告（修改前）

批次2实验`phase3b-fragment-proposal@1`/`source_search_fragments@1`含模型UTF-16偏移，本批以独立生产对象`restaurant-named-source-query@2`/`restaurant_named_source_query@2`承接：单店输出只含field与fragment，代码用indexOf在对应Google原文字段定位并验证。实验原请求/结果只读保留；不保留生产旧偏移路径。Semantic Prompt26、Proposal4、Agent Prompt、State、TaskDefinition和通用discovery retrieval Prompt6/Schema3不变，不与B抢版本。

用户已确认每家具名店、每个来源至多原名和一种替代两次检索；两站分别计数，需复核者知晓。每来源详情总上限跨两次检索合用，不重置；先达到详情上限则不再做无可验证详情的检索。先确认同店的原名结果不调用片段模型。

生产选择获准的模型片段路径，不新增Google日文名接口或Google请求；每店增量Google请求/费用均为0。每run同一原候选至多一次片段模型，跨来源复用，计入现有共享模型预算。批次2的7/8是片段/日文名混合探针，不能用来宣称此生产路径的真实命中率；离线组合分别报告可由保存片段驱动的子集与其余混合探针范围。独立比较器不借检索词改写候选的身份字段。

### 局部验证发现与处置

- 地址三家和B1别名有效红灯保留于ac93a97b；检索未触发替代的红灯保留于4b14fd1f。
- 初轮118项相关测试之前的116项中有3红：英文municipality前缀误包含Marunouchi（取明确City紧邻词修正）；新fixture未提供当前列表解析器能读的列表标记（修fixture，未改G3解析器）；Kazen旧测试依赖把Building2F数字当门牌。Kazen现按批准原则得到完整同名/同地址证明，旧“应非HIGH”实现细节断言退役，改断言地址MATCH及既有name/address接纳；电话冲突诊断保留，未降低任何真实分店反例。
- 新增无空格Building7F/Building8F反例，798d312f有效红灯后修楼层边界；建筑数字85不参与门牌，但明确F楼层仍作字段比较。日本市区/町域同时有值的矛盾也保留拒绝。
- TWO ROOMS既有高层楼层邮编拼写情形仍为INSUFFICIENT（不作MATCH，仍需独立身份）；没有新增豁免。nr-020普通邮编1500043/1500002仍为CONFLICT，不走该既有情形。
