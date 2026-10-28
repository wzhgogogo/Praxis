# G4 nr010 HTML entity name decoding

Evidence: frozen exposed regression. Vienna CET UTC+1.

切片承诺：只在店名比较前做标准HTML实体解码。保留原大小写、NFKC、标点、包含关系、最小长度、分数与身份接纳门槛；地址、电话、详情排序、Prompt/Schema/State与评分不改。共享详情所有权检查与Tabelog/TableCheck名称匹配使用同一标准解码语义。HTML名称行只解码一遍；不把实体解码引入地址/电话处理。

使用已缓存entities7.0.1的decodeHTMLStrict（有分号的标准named/decimal/hex字符引用，单次解码），npm --offline --ignore-scripts --no-audit --no-fund安装；无HTTP或模型调用。避免维护手写实体表，不扩大名称模糊匹配规则。

先把nr010已保存页原字节及其断网渲染快照置于模块fixture，取得原解析器红灯，再修复；同名异店、分店、楼层/门牌冲突及名称不足最小长度均保留拒绝。已批准的7份不退化和nr022/026继续用冻结语料做完整生产前缀回放，nr010应首次正确接纳；认证ID只供原独立评分器事后读取。

本轮GET/模型/Google/Live0，不加载.env。修复后同步最新main（已fetch到eb1518f1，包含用户指定54b3dd2b及后续G1修复），保留双方文档和账本。冻结整合源码/输入后重跑五门禁及test:dom-change，每步前后净树；通过后按用户已明确批准合main并推送，ls-remote核对，合入后停止。
