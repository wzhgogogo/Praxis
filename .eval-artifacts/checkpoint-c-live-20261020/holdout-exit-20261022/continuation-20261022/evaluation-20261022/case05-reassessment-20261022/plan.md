# 例05：经批准的无损格式恢复与补评

Status: frozen regression; exposed holdout, pending independent signoff.

依据：19941c4e 的独立复核及用户批准。只对 h-05、h-11、h-17 的 `materializedCase.acceptance.required_claims[1]`，将单键、字符串值对象逐字连接为 `键: 值`，不 trim、不改内容。记录原始值、字段路径、原产物 SHA、恢复前后 materializedCase SHA；按原键长度拆回后须严格还原。其他字段必须完全相同，原 holdout.yaml 和承诺、运行与旧 NOT_EVALUATED 不改。

执行：准备三份精确 SHA 绑定输入，提交脚本/输入并冻结；网络阻断下复用 @33/rubric@29 的 goldCorrection 接口、原条件对应、原独立 HARD/库存/见证/Guard 证据，只补评三次。先保存自动评价，再加载原评价作并列报告；不更改预算语义、不将 h-11 的非等价 SOFT 措辞改成等价。

验收：恢复可逆且唯一差异为该字段类型；原始/旧评价字节和两次既有冻结均不变；三份新评价与旧 NE 并列；全18次汇总只替换例05的新参考评价，逐条重判退出2/3/4/5/6，数值门槛与第一卡点条款分别检查。H005两种口径保留。

0 网站、0 模型、0 Live、0 账本增量。生产/Prompt/评测器无变化，按不变 SHA 复用门禁和22/22校准，不追加付费回放。异常或新的 S0 阳性如实报告，不扩大修复范围。完成后提交推送准备分支，停下等签收。
