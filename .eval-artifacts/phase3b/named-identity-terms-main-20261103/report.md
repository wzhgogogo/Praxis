# C 身份前三家与条款就绪：B 后合入验证

Status: approved integration candidate / fresh verification pending。时间均为 Vienna CET（UTC+1）。真实模型、Google、网站、Live、环境重跑及评测GET新增均0，不读取或注入.env。

用户在对话A的最新原始消息批准fd07f44e合入，并要求B先合；已通过read_thread核实（authorization.json），没有把Agent转述当作独立人类授权。B随后发布main f0bee7d7f31c91a0c064f38790a9b6eddbd6f11a，远端fetch和祖先核对证实含d58d377a；此后才创建本合入分支codex/chore-phase3b-named-identity-terms-main。

## 合并范围

普通合并fd07f44e，不改已复核工作分支，不重放/改写其历史。源码重叠仅两个文件：

- native-source-facts.ts自动合并，保留B的bindRestaurantFactSourceRoles及C的capturePagesOnly稳定性观察，两种模式互不替代。
- read-assessment.ts唯一源码冲突是import：同时保留B的acceptedPositiveHardEvidence和C的namedOutletIdentityPrefix，函数体自动合并，无新实现取舍。

另外四处冲突是账本、STATUS和两份月度导航。文档同时保留双方新增原文，Domain/PRD/Flows共享文档revision递增，历史不删除。冲突原样另存merge-conflicts/；merge-resolution.json记录处理。

账本为B main744行与C741行按ID并集，原同ID值全部一致，加入C原零调用记录及本合入零调用记录后746行。限额和累计与B main逐字值相同：Live8、真实模型347、评测GET277、Google36、网站请求5843；本轮均新增0。未经批准的额度快照不采用。

verify.py将所有源码、fixture、脚本及依赖逐文件与已复核双方比较：单边变更必须逐字相同，两处重叠必须等于三方合并（只解上述import）。原C全部产物逐字不动；不运行旧C的“相对旧main源码不变”校验器来误判B的已批准变化。

## 不变的承诺

D2五家候选中原顺序前三家只查身份，全部前三完成现有HIGH核对后恰一绑定来源全名才能继续；否则反问，不读库存/选店/展示。身份规则不放宽，identityOnly仍是原批准13行。D3仅capturePagesOnly复用既有有界稳定性观察；G1完整页守卫、普通事实读取、20秒保留、预算、取消、B1两次链接检查照旧。原D3页没有取消/预约要卡原文，因此问答可达后仍省略，不能称Live条款填卡成功。

B的正向HARD来源角色规则与C的名称守卫同时保留。State25、TaskDefinition23、Prompt/Schema及SQL没有新变化。没有改A工作区、追加Gold、调用网站或模型，也没有预约提交。

## 验证计划与停止条件

冻结合并候选、完整输入SHA和外层Runner；每项前后git status为空。适用五门禁与严格G2重新执行，而非复用各分支旧绿灯。默认测试包含B的HARD控制及原A/G6、C名称/连续性/选店/条款测试。再重采C的22组装测试/26帧，复用其独立oracle核原始页、精确链接、先身份后库存、歧义故障关闭及退出诊断。原红灯、预检失败和Live D6 S0=1保留；不当作新37家通过率或真实模型选路验证。

全绿后仅归档与文档，不改源码；推main前再次核对远端未前移，正常推送，不强推。ls-remote核对最终提交后通知A。任何门禁不全绿不发布。实际执行与最终SHA待记录。
