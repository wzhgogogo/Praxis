# 对话B允许读取的G1输入

只读白名单：questions.json及其pages列出的8份保存原页。题面为英文，questionZh只供对照；传给核心时使用question。displayedOutlet是已展示目标店，providedPage记录实际提供页的候选身份/来源/runId/readId/SHA。绑定场景元数据为本地构造；HTML本身为固定历史保存页，不声称新读取或当前库存。

禁止读取answers.candidate.json（历史原字节）、answers.reviewed.json（混合复核状态）、history目录、batch2/revise-questions.py及其他含答案脚本、引用核对明细或评分报告。不要运行这些脚本绕过隔离。允许读取评分器通用接口与标明本地构造的控制测试。正式验收由复核者在G1实现冻结后运行。

All 34 questions are now reviewer-confirmed exposed offline acceptance inputs. Answer files remain evaluator-only. The historical candidate file is not the current reference. Q24/Q25 prohibit fresh reads in this offline evaluation.

pagePath是仓库保存路径，pageSha256为原始HTML SHA；storageEncoding=gzip时先解压，storageSha256核对存储字节。片段未说明不扩大成完整网站未写。历史捕获日期不代表当前菜单/库存。
