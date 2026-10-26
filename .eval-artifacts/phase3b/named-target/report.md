# 具名目标丢失：Prompt修订及离线验证

Status: current candidate / exposed regression；真实模型验证未运行。本批真实调用0。

## 有效红灯与首个失效层

先冻结并使用3a主轮005/006的实际模型提议，仅用fixture替代传输，经过当前生产Interpreter→Compiler→Task Runtime/Reducer。第一轮Sushi Dai进入权威Draft及第二轮模型Context；第二轮提议在进入Compiler前已经变为泛化query且scope为OPEN_ENDED。独立断言“补充时间/人数后仍为Sushi Dai”失败，见baseline-red.json/log。

Compiler生成的target与该提议相同，Reducer写入的target又与patch相同。保留Sushi Dai/SPECIFIC_OUTLET的反事实提议可通过同一真实下游链，见reference-control.prompt25.json/log。这证明先在模型提议层丢失，不能归为Compiler/Reducer丢字段；也不单凭这一对对照声称Prompt是唯一因果。

## 最小修订

按用户“先报告再改”已在修改前报告：仅Semantic Prompt25→26。新增通用指令：具名SPECIFIC_OUTLET后续补充/修正到访条件仍保留query/scope；推荐变查位只改goal；当前用户明确换店/撤销点名时可替换。goalBasis仅引用当前消息的新到访信息，保留的店名来自权威上下文，不伪造当前引用。

Proposal Schema4、State23、TaskDefinition21、Compiler和Reducer不变；不增加静默query覆盖、订位关键词或店名词表，不改Gold。新增的同文件测试覆盖具名推荐→查位、实际日期/时段/人数、明确换店及撤销具名后开放找店。Prompt wire在旧25缺指令时有效红灯，新26发送到模型后绿灯；定向8/8。已有不在当前消息中的引用拒绝与目标不入State的覆盖继续有效。

**证明范围：** fixture只证明新指令确实发送及合规提议的内部状态链。原来那份坏提议仍然是合同有效的坏语义；Prompt改动不会使一个固定fixture响应自行改变，不能声称已在代码层阻断所有丢店名输出。真实模型遵循率与实际预约前的具名店效果留到后续批次。本批没有用Prompt关键词驱动fixture输出伪造语义绿灯，也没有把反事实控制当成修复后模型结果。

## 验证与停止点

源文件仅C拥有的semantic-interpreter.ts、semantic-proposal.ts及同文件测试；A/B产品、harness/eval、Gold、身份/检索代码不变。完整五门禁及固定开发Fixture结果见../c-batch1/gates.json。当前是等待复核的工作分支，不合main。
