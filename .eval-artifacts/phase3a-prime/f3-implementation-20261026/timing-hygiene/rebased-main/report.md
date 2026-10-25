# 新 main 上的时序卫生组合

状态：completed / frozen regression；2026-10-26 CET（UTC+1）。新组合验证源码a84c09220e4e6283aac196151901000d412cfeaa，继承并行 main c5ec9ddf。原 d3f3d312 上的1054/161卫生门禁只保留为旧组合冻结回归，不用于替代本轮验收。

并行main带入已批准的脚本类型/预检、独立审核catalog和Evaluator36、显式通用列表等39份src修改。源码自动合并无冲突；五份文档先完整保留main，再恢复本分支历史记录，双方记录未删。A的源码差异仅9个测试文件，B四生产文件按新main逐字相同，page-parser/query-controls/Pack未变。新BrowserSnapshot仅增加原始网络类型观察，没有新增日期状态、隐藏slot归属或菜单scope引用。

重新冻结605项并独立重跑严格五门禁：typecheck、arch:check、npm test1060/1060、build、真实本地Chromium161/161全exit0；Chromium106.432668秒，每门禁前后git status为空，无E1例外。完整输入/日志/源SHA见freeze.json、gates及boundaries.json。原有效红灯与时序清单留在上级目录，正常/超时行为和全部原断言在新组合再绿。未声称新增Linux或Live结论。

两个站点非测试TS仍3864，source-packs473；本卫生切片减行0。新增真实模型/Google/来源网站/Live调用0，不读.env。按授权合main推送后，按原11项分别实施可证明的等价整理或保留证据不足延期。
