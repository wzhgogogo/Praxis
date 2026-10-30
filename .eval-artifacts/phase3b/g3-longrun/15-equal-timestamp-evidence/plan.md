# 等时戳查位事实引用修复

2026-10-29 CET，draft / not integrated；用户已批准本切片。基础G3分支51b0d3de；A诊断cf20522e，仅在隔离临时clone运行，不导入或修改A四个评测文件。

承诺：调查→查位时，当前查位引用的同店原文事实保留；反向查位→调查时，同来源旧查位事实仍被替代。相等时间戳不定义顺序；显式superseded优先，身份、范围、新鲜度和HARD核对不变。

现有顺序信息：CANDIDATE_FACTS_CHECKED Reducer按事件接纳顺序扫描已有readEvidence，累积supersededEvidenceIds；之后AVAILABILITY_CHECKED追加自己的事实并引用，不改该集合。因此使用当前查位引用及该Reducer-owned集合即可确定适用性，无需依赖时间戳，也不把Map首次插入位置误当最新事件顺序。State24、TaskDefinition22及其Reducer不改。若证明不足需新增字段，先停下报告。

先冻红：新增领域单测经真实Reducer构造等时戳两个顺序，检查current facts及展示引用，并保留显式superseded/后续UNKNOWN反例；A原H001首批单例在cf20522e干净隔离clone取得原独立断言红。后仅更换read-assessment.ts为冻结修复文件，同一A单例/评分/Gold/模型/时钟全部字节不变，再跑绿。测试自身不手填当前/替代结论。

验证：typecheck、arch:check、默认套件、build、真实本地Chromium及严格G2，逐项前后干净；默认中A待同步fixture已知失败保留，修复不得绕过这些断言。此处关闭产品引用缺陷，G3c完整fixture同步/总验收继续由A完成，不把本局部通过称为整批完成。冻结输入、脚本SHA；全部新增真实调用0；不读.env/QA答案。报告、推G3分支、按用户授权通知A，然后等A。
