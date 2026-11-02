# 诊断报告停止点2：复核补充

- 状态：三项复核补充已按用户最后更正完成，候选待复核；不合main。基线1d590c05，正式执行源码3c9f328999eea9d8cfaf5533b96524a0af812387。时间一律CET（UTC+1）。
- 切片承诺：完成E1见证跨来源身份全量盘点；让单次报告开头直接显示结论、链路和关键时间；让跨运行汇总保留已交付运行的见证覆盖信号。仅诊断/输入证据与测试，不改产品或评测器判断。
- 验收：独立页面逐字证据决定是否补全；Markdown顺序/原记录保留的正常反例；可行与可行性未确认的覆盖分层计数；现有5例只读报告/校准；五门禁每项前后净树。真实模型/Google/网站/Live为0，不读.env，不访问业务网络。
- 用户2026-11-02补充更正：Konya“同店”原结论只有店名与地区推断，缺独立身份证据。Tabelog电话+81-3-3266-1611、streetAddress空；TableCheck摘录只有050-3184-1511、没有地址。不得补别名，列缺证；校准只写“疑似见证匹配问题，缺独立身份证据，未确认”。若全量盘点无任何可补项，登记不变，不重跑评测器。
- 原停止点2报告、输出、比较oracle、人工标签和所有历史SHA原件保留。本批另存来源盘点与校准说明，不回写旧归因。

## 当前失败类型与检查

| 失败类型 | 对应检查 | 预期证据 | 未覆盖边界 |
| --- | --- | --- | --- |
| 名称/地区或脱敏占位符被当作同店证据 | 三份登记44条记录、27个来源门店的原始页面/原始摘录对照 | 两源电话或完整日文地址逐字一致才允许补，缺证逐店列出 | 不联网补采，不确认号码不同一定异店 |
| 首点被大块JSON埋住、移动附录时删掉原记录 | diagnosis.test.ts实际保存报告渲染 | 开头40行含结论、三栏、13环节、关键时间与未评计数；附录原记录精确保持 | 不证明任意屏幕尺寸视觉布局 |
| 已交付运行的覆盖信号在首点汇总消失 | 实际h001/h002/中目黑评价及重复观察对照 | 单列覆盖表，已交付也计；独立门店数/运行门店次数分别计数，可行性未确认不升为可行 | 见证集外餐厅和缺独立Gold仍未评 |
| 疑似见证问题被报告为已确认评测器缺陷 | 新复核输入→比较入口 | 原始2/5不变，归因明确HYPOTHESIS/未确认，不改诊断首点 | Konya需一致电话或完整日文地址才能确认 |

## 三项交付与实际结果

| 补充项 | 修复前具体反例 | 实际修改与正常/反例结果 | 证据与完成情况 |
| --- | --- | --- | --- |
| 2a全量盘点 | Konya只凭相似名称和地区被称为已确认的见证匹配缺陷；实际上两个号码不同、缺地址 | 3份登记含备用共44条、27个来源门店；盘点既有HTML、原始JSON-LD和E1页面摘录。没有任何可接纳的两源逐字对照，27家均列具体缺证；3份登记原SHA不变，没有生成伪修订版，不重跑评测器。新比较输入将归因明确为HYPOTHESIS/未确认 | [逐店表](identity-audit.md)、[全量路径/SHA/缺证JSON](identity-audit.json)、[来源文件索引](source-corpus-sha256.json.gz)。**完成全量盘点，按追加指令0补全/0重评**；身份缺证尚未解决 |
| 结论在开头 | 首点被严重程度原始JSON推到约143行之后 | 新Markdown第3行结果/交付，第4行首点，第6–8行三栏，第10–24行完整13节点表，第26行关键时间，第27行未评计数；原始严重程度、漏斗、条件与全部引用移到附录。正文每店一行七列漏斗简表。13份报告摘要均在第27行结束，附录数据精确保持 | [修前目标红灯](reporting-red.json)、[修后15项正常/反例绿灯](reporting-final-green.json)、[h001实际Markdown](verification/primary-reports/p1fA-kf-h001-a1.diagnosis.md)。**完成** |
| 覆盖观察汇总 | 已交付运行首点为无确认偏离，单看首点表看不到见证覆盖信号 | 新增独立覆盖表；已交付也纳入，按环节/可行性分层。独立门店数与运行×门店次数分开，重复运行正常对照2家/4次；h002/中目黑的6家缺发现可见，但NOT_EVALUATED不冒充可行或确认偏离。首点表和判定不变 | [覆盖目标红灯](coverage-red.log.gz)、[实际汇总Markdown](verification/primary-reports/summary.md)、[完整JSON](verification/primary-reports/summary.json)。**完成** |

可读性检查另发现LOCATION已到达但引用被过滤为空：新目标断言先红，修后指向已有 `finalSnapshot.domainState.searchContinuation.locationContext`。仅补来源指针，不变到达/判断或首点。[红灯](location-pointer-red.json)、[全部13份前后核对](verification/output-integrity.json)。

## 2a证据边界与不重评的依据

扫描索引包含5839个已有文件（当前工作树、用户共享主仓库的公共页面归档和20份E1原result），形成4883条来源记录，其中655条是E1原始visibleTextExcerpt。重复页面只算观察，不扩大44条登记或27个来源门店分母。正文/JSON列原页面路径、原SHA、字段指针、逐字电话与原地址字段；外部工作树绝对路径仅作为原始归档出处，不作为诊断/测试运行输入。

排除 `[REDACTED]`、名称/地区相似、电话号码格式归一、候选合成字段，以及ENTITY_MATCH/resolver/eligibility。HTML和已保存原始JSON-LD中的电话没有跨来源逐字相同的配对；可用主要JSON-LD街址没有完整日文地址。Tiffany的原始摘录有日文地址串，但包含同串的保存HTML仍为同一Tabelog来源，没有第二来源对照；不据此建立跨来源身份。

Konya逐字对照：Tabelog [原始JSON-LD](../../../checkpoint-c-live-20261020/witness-completion-20261020/capture/p2l-kagurazaka-kaiseki-20261105/13011403.attempt-1.source.json) `telephone=+81-3-3266-1611`、`streetAddress=""`；TableCheck原result的 `/diagnostics/browserTrace/314/detail/observation/visibleTextExcerpt` 只有 `050-3184-1511`，无地址。URL指针为同原件的 `/diagnostics/browserTrace/307/detail/url`，对应konya预约页。不能确认同店，也不能断言一定异店。缺：TableCheck完整日文地址，或两源一致电话。

三份登记的旧/现SHA逐项相同，见 [output-integrity.json](verification/output-integrity.json)。按用户最后追加的明确例外，不修改 `observedSourceIdentities`，不生成新见证SHA，不运行22次重评；因此新旧漏斗/blocker/结果/严重程度重评差异**不适用，未重评**，不能报告为“22条新评分全相同”。[historical-preservation.json](historical-preservation.json)逐次列22条原评价路径/SHA，与1d590c05原字节一致，所有result/中断包也按原manifest校验。没有用新时间戳包装库存。

## 五例校准：原始分数保留，撤回过度归因

本次只用同5份已保存的evaluator@29/rubric@25输出重新生成诊断和比较，不重跑Evaluator。报告和新比较输出见 [verification/calibration/comparison.md](verification/calibration/comparison.md)／[JSON](verification/calibration/comparison.json)。

| 用例 | 原人工环节 | 本次首点 | 与上一批比较及复核解释 |
| --- | --- | --- | --- |
| h001 | 无卡点 | 无确认偏离 | 不变，原始一致 |
| h004 | 语义 | 理解请求 | 不变，原始一致 |
| h002 | 发现 | 无确认偏离 | 不变。10/12人工标签把见证覆盖观察和首个偏离混在一起；按已确认口径，合格交付且无确认偏离。原人工标签保留 |
| Nakameguro | 发现，其次查位 | 无确认偏离 | 与h002相同；新口径认可报告，原标签不回写 |
| 神乐坂 | 查位读取 | 发现（覆盖观察） | 首点不变；**疑似见证匹配问题，缺独立身份证据，未确认**。旧“已归因到评测器”的结论撤回，不宣称已证明评测器缺陷 |

原始环节一致率仍为**2/5**，不修改10/12标签或从分母删分歧，不另造“4/5”的原始一致率。归因修订前后逐条保留在 [output-integrity.json](verification/output-integrity.json)。4组8个时间点和上一批完全相同、均≤2秒，无超差；人工确定性未标注仍未评。首点观察的确定性与“原因是否确认”分开，新比较输出对神乐坂明确 `reviewAttribution.certainty=HYPOTHESIS`。

比较oracle另存 [comparison-oracle.json](comparison-oracle.json)，格式@2要求显式归因级别，缺失则拒绝，不默认确认；`supersedes`绑定原oracle SHA，复核/用户更正来源也绑定SHA。旧oracle及旧比较输出原样保留，诊断生成器不读取人工归类或labels.yaml。

## 汇总的实际信号

与“首点×严重程度”并列，未合并或重判：

| 环节 | 既有评价可行性 | 独立门店/运行×门店 | 运行 |
| --- | --- | --- | --- |
| 发现 | SUPPORTED | 3 / 3 | 神乐坂 |
| 发现 | NOT_EVALUATED | 7 / 7 | h002、h004、中目黑 |
| 事实/HARD | SUPPORTED | 2 / 2 | h001（已合格交付） |

这里是历史评价原范围下的覆盖度量，不是当前Live可行性或因果判断。未知可行性单独展示，避免h002/中目黑信号消失；不将其计入已确认可行缺口或首点。每条观察有原漏斗指针，跨run的唯一门店数按sourceId去重。

## 正式命令与五门禁

源码与输入先提交3c9f3289再执行，冻结 [code-and-inputs-freeze.json](code-and-inputs-freeze.json) 共862项。2026-11-02 09:28–09:30 CET；本地Node v24.4.1/npm11.4.2，复用既有锁定依赖，没有联网安装。

三条只读生成/比对命令的完整参数在 [execution.json](verification/execution.json)；入口分别是 `node --import tsx src/eval/restaurant/diagnosis/files.ts <原primary-inputs.json> <全新primary-reports>`、相同入口读取原multiturn-inputs、`node --import tsx src/eval/restaurant/diagnosis/compare-recorded.ts <新summary> <本批@2 oracle> <全新calibration>`，均exit0。没有执行历史Evaluator入口。

| 实际命令 | 结果 | 原始完整压缩日志 |
| --- | --- | --- |
| `npm run typecheck` | exit0 | [typecheck](verification/typecheck.log.gz) |
| `npm run arch:check` | exit0 | [arch](verification/arch-check.log.gz) |
| `npm test` | 1342/1342，失败/跳过/todo均0 | [默认测试](verification/npm-test.log.gz) |
| `npm run build` | exit0 | [build](verification/build.log.gz) |
| `npm run test:browser:fixture` | 187/187，失败/跳过/todo均0；外层131.367秒，Runner131.174秒 | [本地Chromium](verification/browser-fixture.log.gz) |

八步（含三条生成）各项前后status为空、HEAD不变、862项SHA不变；五门禁各一次，没有过滤、重试或豁免。源码仅改diagnosis四个文件；Evaluator判断/版本、产品、Prompt、State/Schema、Gold、见证、组装入口、Runner和Skill均未改。之后仅整理文档证据。

13份报告的summary、firstPoint、witnessFunnel、experience与逐节点状态均与上一批深相等；严重程度/漏斗/条件原始JSON在附录保留；557个自产证据引用可定位。见output-integrity。原114项交付SHA全部保持。

## 未覆盖与停止

身份缺证不是同店通过，也不是异店断言。真实模型理解、自由文本语义与当前网站兼容性未由本批证明；真实用户发送/渲染时长与缺Gold的追问仍未评。A真实多回合独立grader的B1/条款/取页红灯对接继续未完成，按既定决定延期。HARD未核对却合格的旧评价口径保留，按用户要求不在本批修改。

本批真实调用0，外部业务网络0，历史运行/历史Evaluator重执行0，不读取.env或labels；只推工作分支，停下交独立复核，不合main。
