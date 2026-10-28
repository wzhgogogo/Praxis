# G4 nr010 HTML entity name decoding

验收PASS：nr010完整生产前缀正确接纳；原23/23保持，nr010/022/026三家均正确，错认0。最新main整合后五门禁1203/175与G2 4/4全绿，10步前后净树；本轮GET/模型/Google/Live0。按用户已批准流程发布main。

Evidence: frozen exposed regression. Vienna CET UTC+1.

切片承诺：只在店名比较前做标准HTML实体解码。保留原大小写、NFKC、标点、包含关系、最小长度、分数与身份接纳门槛；地址、电话、详情排序、Prompt/Schema/State与评分不改。共享详情所有权检查与Tabelog/TableCheck名称匹配使用同一标准解码语义。HTML名称行只解码一遍；不把实体解码引入地址/电话处理。

使用已缓存entities7.0.1的decodeHTMLStrict（有分号的标准named/decimal/hex字符引用，单次解码），npm --offline --ignore-scripts --no-audit --no-fund安装；无HTTP或模型调用。避免维护手写实体表，不扩大名称模糊匹配规则。

先把nr010已保存页原字节及其断网渲染快照置于模块fixture，取得原解析器红灯，再修复；同名异店、分店、楼层/门牌冲突及名称不足最小长度均保留拒绝。已批准的7份不退化和nr022/026继续用冻结语料做完整生产前缀回放，nr010应首次正确接纳；认证ID只供原独立评分器事后读取。

本轮GET/模型/Google/Live0，不加载.env。修复后同步最新main（已fetch到eb1518f1，包含用户指定54b3dd2b及后续G1修复），保留双方文档和账本。冻结整合源码/输入后重跑五门禁及test:dom-change，每步前后净树；通过后按用户已明确批准合main并推送，ls-remote核对，合入后停止。

已同步main eb1518f1ad3f4fa8da4469c993b02d1b9f15ccf8（含54b3dd2b与B G1质量修复）。产品源码无冲突，A时序/G1代码均保留；仅三份历史/账本冲突按双方内容和id并集处理。账本441个唯一id、同id差异0，计数{"fullLive": 0, "realModelCalls": 152, "environmentReruns": 0, "evaluationPublicGET": 242, "googleRequests": 11, "restaurantWebsiteRequests": 242}；本批所有新调用0。冲突前后Git和SHA见integration.json。

3个有效红灯已保存在f1c9e859（nr010原页结构拒绝＋两站编码名称正常对照）；65d796e7只解码的修复后9项绿，40dd1d30整合最新main后再次9项绿。原页与源字段不改，源JS的HTML名称行只解码一次。接下来全部门禁与41份生产前缀回放同一冻结源码上执行，每步前后净树。

## 完整验证（2026-10-28T15:26:55.117273+01:00）

冻结源码 `a9c4abe88357988e6d663a7d7ad45dcbce83e871`、main基线eb1518f1（包含54b3dd2b），1171项SHA在运行前后保持。五门禁：typecheck、arch、npm test 1203/1203、build、真实本地Chromium 175/175；额外test:dom-change 4/4，固定G2 8 PASS/4诚实退化口径不变。integrity、五门禁、G2、41份Replay、独立评分和结束完整性，共10步每步前后git status为空。无跳过、无豁免、无门禁修复重跑。

nr010真实原页fixture由旧解析器结构拒绝红灯，解码后9项相关测试绿；同名异店、同名不同区、相邻门牌、不同楼层、名称单独证据不足等反例保留，两站都不以解码名称直接授予HIGH。标准实体解码不改NFKC/大小写/标点/包含关系/最小长度，地址电话及排序/门槛逐字保护见verify.mjs；原source字段/引用拼写不改。实体库仅离线缓存安装，单次严格解码避免递归解码。

完整生产Tabelog身份前缀Replay：nr010正确接纳认证ID13196218，原因HIGH_EXACT_PHONE；nr022/026继续正确，既有23/23保持、错认0。未批准补取的5份缺页及5份原网络失败在41份视图中照旧保留，不冒充完整Live或库存验证。旧红灯、补页前后结果和新结果分别保存；Gold仅原独立评分子进程读取。模型只Replay旧响应，新增真实调用0。

主链代码同步后无文件归属冲突；B的G1与A时序源码均保留。441条账本按id并集、同id差异0，累计模型152/GET242/Google11/Live0来自双方历史记录，本轮四项增量都是0。元数据来源SHA见integration.json，解码前后边界检查及全量结果重算通过。

## 交付

用户已批准验收通过后合main并推送；此处记录已验证的交付源码，最终合入SHA以Git合并提交与ls-remote核对为准。合入后按要求停止，不开始G3或其他后续工作。只读复核：`node .eval-artifacts/phase3b/g4-name-entities/verify.mjs`。
