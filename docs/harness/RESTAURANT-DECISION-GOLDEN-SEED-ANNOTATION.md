# Restaurant Decision Golden Seed Annotation Guide

- Status: Draft
- Version: 0.8
- Last updated: 2026-08-10
- Source of truth for: Restaurant Progressive Decision Eval v2首批Golden Seed人工标注流程
- Related ADRs: [ADR-0002](../decisions/0002-deepseek-model-runtime.md)
- Related documents: [Eval v2 Plan](RESTAURANT-DECISION-EVAL-V2.md), [Harness Design](HARNESS-DESIGN.md), [Eval Skill](../skills/eval/SKILL.md)

## 当前标注包

机器可读Source位于[`restaurant-decision-eval-seed.ts`](../../src/eval/restaurant-decision-eval-seed.ts)，Contract位于[`restaurant-decision-eval-contract.ts`](../../src/eval/restaurant-decision-eval-contract.ts)。当前Golden Seed v0.7包含：

- 7个Episode、17个Turn；E1 3个、E2 2个、E3 2个；
- `OPEN` 2个、`CATEGORY` 2个、`BRAND` 2个、`RESTAURANT` 1个；
- 7个Candidate Pool、29个虚构Restaurant/Outlet Fixture、417个结构化Fact Ref；
- 7个Episode、17个Turn均已完成人工Gold；Draft与严格Preflight均为`READY_FOR_EVALUATOR`。Eval-only Reducer与S1–S8 Fixture Oracle及18个S0–S8单点Mutation已可运行；Harness-only Model Contract已完成，完整Episode Runner与真实模型Baseline尚未完成。

运行结构检查：

```bash
npm run eval:decision:preflight
```

仅在全部标注完成后运行严格检查：

```bash
npm run eval:decision:preflight:complete
```

严格检查在任一Turn仍待标注、Gold引用悬空、动作冲突或候选Oracle不可满足时返回非零退出码。

## 标注单位

逐Turn标注，不写固定回复文案。每个Turn需要确定：

1. `statePatch`：本轮明确新增、修正、否定或删除的内容；
2. `accumulatedState`：把本轮Patch应用到上一轮Gold State后的完整语义状态；
3. `readiness`：`NOT_READY / RECOMMENDATION_READY / AVAILABILITY_READY`；
4. `acceptableNextActions`：一个或多个合理动作；
5. `forbiddenActionTypes`：本轮明确不应出现的动作；
6. `clarification`：只有需要追问时填写，限定Topic、最多问题数和不得重复的问题；
7. `retrieval`：只有进入候选阶段时填写Eligible Candidate ID；
8. `recommendation`：只有需要展示或收敛候选时填写数量、允许/禁止候选和多样性轴；
9. `grounding`：允许引用的State Fact、Candidate Fact以及明确禁止声称的现实事实；如人工确认卡片必须显示安全提示，再写`requiredCandidateDisclosures`。

数组值采用简洁、规范化的英文语义标签，例如`quiet`、`non-spicy meal`、`severe peanut allergy`。不要把场景常识补进Gold；只有用户明确表达的事实才进入State。

## 批量审阅流程

当前规模采用“Episode批量预标注 → 人工审阅 → 一次性编译写回”：

1. 实现者一次提供完整Episode的所有Turn、累计语义状态、Readiness、下一步、合格/不合格候选和推荐差异；
2. 人工只审核产品判断：需求提取是否正确、Readiness、下一步、候选合格性和推荐差异；预标注完全正确时只需回复“`DGSxx 全部同意`”；
3. `statePatch`代码结构、`forbiddenActionTypes`、Grounding Fact Ref、Candidate ID映射和格式校验由实现者从已确认语义机械编译，不要求人工逐字段标注；
4. 整个Episode确认前不写回Dataset、不运行Preflight；确认后一次性更新Contract、文档和标注进度，再运行Draft Preflight；
5. 人工判断与机械编译发生冲突时，以人工确认的产品语义为准，修正编译或Contract，不能让Schema反向决定Gold。

验证按改动范围分级：

- 纯Gold数据和文案、现有Contract足够：只运行Draft Preflight和定向Eval Contract测试；
- Contract/Schema、Preflight、Reducer、Scorer或生产代码变化：运行Typecheck、Build和全量稳定基线；
- `eval:decision:preflight:complete`只在全部Gold完成、准备Reducer/Scorer或Baseline门禁时运行，不在每个Episode后重复确认已知Pending。

当数据扩到36个以上Episode时，再以本地标注页面替代对话审阅，提供候选勾选、累计状态、冲突提示和一键导出；当前不提前建设该UI。

## Seed目录

| Episode | Clarity | Target | 标注进度 | 主要覆盖 |
|---|---|---|---:|---|
| `DGS01-e1-category-ginza-western` | E1 | CATEGORY | 1/1 Labeled | Core-ready、Daypart、Category Recommendation |
| `DGS02-e1-brand-kinshicho` | E1 | BRAND | 1/1 Labeled | Exact Time、Brand Outlet Resolution |
| `DGS03-e2-restaurant-sora-dining` | E2 | RESTAURANT | 2/2 Labeled | Outlet先发现、近似时间、Availability后过滤 |
| `DGS04-e2-team-izakaya` | E2 | CATEGORY | 3/3 Labeled | Team Dinner、最小追问、容量过滤、安静/禁烟反馈 |
| `DGS05-e3-date-ebisu` | E3 | OPEN | 4/4 Labeled | 开放约会、核心字段闭合即推荐、推荐后收敛 |
| `DGS06-e3-friends-correction-allergy` | E3 | OPEN | 4/4 Labeled | 位置锚点、Party修正、严重过敏、敏感披露Consent |
| `DGS07-e1-brand-zero-result-relaxation` | E1 | BRAND | 2/2 Labeled | 严格零结果、单约束Fallback、用户明确选择 |

首批Gold已完成。下一步实现Eval-only Decision State Reducer与S1–S9阶段Scorer；任何真实模型Baseline仍须在它们和Mutation验证完成后单独运行。

## Labeled结构模板

将Turn中的Pending对象：

```ts
expected: {
  annotationStatus: "PENDING_HUMAN_LABEL",
  annotationFocus: ["..."],
}
```

替换为以下结构。模板只说明字段，不提供该Turn的答案：

```ts
expected: {
  annotationStatus: "LABELED",
  statePatch: {
    set: {},
    add: {},
    remove: {},
  },
  accumulatedState: {
    target: { kind: "OPEN" },
    positivePreferences: [],
    negativePreferences: [],
    hardConstraints: [],
  },
  readiness: "NOT_READY",
  acceptableNextActions: [],
  forbiddenActionTypes: [],
  clarification: {
    allowedTopics: [],
    maxTopics: 1,
    mustNotAsk: [],
  },
  retrieval: {
    eligibleCandidateIds: [],
    allowEmpty: true,
    minimumExpected: 0,
  },
  recommendation: {
    minCandidates: 0,
    maxCandidates: 0,
    allowedCandidateIds: [],
    forbiddenCandidateIds: [],
    requiredDiversityAxes: [],
    mustExplainInsufficientCandidates: false,
  },
  grounding: {
    allowedStateFactRefs: [],
    allowedCandidateFactRefs: [],
    forbiddenClaims: [],
    requiredCandidateDisclosures: [
      {
        candidateId: "candidate-id",
        type: "ALLERGY_CONFIRMATION_REQUIRED",
        factRef: "candidate-id.attributes",
      },
    ],
  },
}
```

不适用的可选块应删除，不用空对象占位。`requiredCandidateDisclosures`只在人工已经确认“该候选卡必须明确餐厅仍需确认”的场景出现；具体Candidate ID和`attributes` Fact Ref由实现者机械编译。它不实现Consent Card、Authorization或预约提交。`acceptableNextActions`必须至少包含一个动作；`ASK_CORE_FIELD`一次只能包含1–2个核心Topic。

## 人工判断边界

- 标注者决定语义与允许动作；实现者只负责把判断转成Contract并指出结构矛盾；
- 多个动作都合理时全部写入`acceptableNextActions`，不强迫单一答案；
- Candidate事实只来自对应Fixture，不使用真实地图、评价、空位或品牌知识；
- `visibleOptionIds`表示用户在本轮前已经看到的Fixture候选，不等于本轮Gold Eligible集合；
- 不标注模型偏好的回复措辞，不根据DeepSeek输出回改Gold；
- 宽泛`DAYPART`下可以在推荐卡展示Fixture已提供的Slot，但它只是帮助用户选择时间，不代表Slot符合用户尚未给出的确切用餐时间；此时Gold动作仍是`SHOW_RECOMMENDATIONS`，不是`CHECK_AVAILABILITY`；
- 不把Fixture Availability描述成真实空位；`booking completed`、`real-time availability verified`等无Evidence声明必须进入禁止项。

## 已确认Gold：DGS01-T01

- 东京参考时间为`2026-08-10T10:00:00+09:00`，因此“Tomorrow”解析为`2026-08-11`；东京为UTC+9，北京为UTC+8；
- “evening”保留为`DAYPART / DINNER`，不补猜确切时间；4人是Exact Party；Ginza是`AREA`；Western food是`CATEGORY`；
- Core字段已足够，Readiness为`RECOMMENDATION_READY`，不得重复询问日期、时间、人数、地点或菜系；
- Ginza、Yurakucho near Ginza和Marunouchi的4个Western Fixture均为Eligible，展示3–4家，优先形成价格带和西餐子类型差异；同Pool的日料Fixture是明确Forbidden干扰项，用于判定违反Western类别约束；
- 可展示Fixture的Availability Slot并建议用户从中选择，但不得声称任何Slot符合用户的确切用餐时间、代表真实世界空位或已保证可订。

## 已确认Gold：DGS02与DGS07

- DGS02把`2026-08-11 19:00`、6人、Kinshicho区域和Mori Burger品牌保存为明确状态，Readiness为`AVAILABILITY_READY`；两个满足品牌、Exact Time和容量的门店为Eligible，容量不足及其他品牌候选为Forbidden；
- 严格候选非空时不得触发Fallback，不要求BRAND场景凑足3–5家，门店比较以位置、容量和设施为主；
- DGS07在相同需求下把严格Eligible固定为空，只展示两条实际存在的单约束选项：扩大地点但保留品牌，或保留地点但改为Burger类别；时间与人数始终不放宽；
- 用户选择“保留Mori Burger，Kameido可以”后，只把Location改为Kameido，保留时间、人数和品牌，再检查对应门店；选择前不得静默修改状态。

## 已确认Gold：DGS03

- T01先保存`2026-08-11 / DINNER / Sora Dining`，Readiness为`NOT_READY`；明确Restaurant后先执行Outlet Discovery，工具返回后才可展示Ginza和Shinjuku，随后询问Party和更具体时间；
- Candidate Pool是Oracle世界，不是检索前可见Context。搜索前提到Ginza或Shinjuku属于Process Grounding错误；
- T02把3人保存为Exact Party，把“around 7:30pm”保存为`APPROXIMATE / preferred 19:30`，不得编译成Exact或发明有界Window；
- 已解析的Outlet集合可以替代用户预先提供Location。T02为`RECOMMENDATION_READY`，可展示两个Sora Dining分店及其Fixture Slot，但不能声称Slot匹配用户的确切时间；其他相似名称餐厅为Forbidden。

## 已确认Gold：DGS04

- T01保存`2026-08-10 / DINNER / TEAM / Izakaya`，人数和地点仍缺失，因此为`NOT_READY`；只追问Party和Location Strategy，不提前检索或展示餐厅；
- T02保存Exact Party 8和Shimbashi `AREA`后达到`RECOMMENDATION_READY`。Kado、Nagi和Hachi容量合格，Roji最多6人，必须排除；初步推荐体现价格、居酒屋子类型、氛围、连锁属性和相对位置差异；
- T03把`quiet`作为排序偏好，把`fully non-smoking`作为硬约束。Kado因有吸烟区被排除，Roji仍受容量限制；Nagi和Hachi进入收敛结果，并解释严格条件下只有两家；
- Nagi有明确`quiet` Fact；Hachi只有`relaxed / semi-private`及半包间Fact，只能作为更有私密性的备选，不得声称其已被证实安静；宽泛Dinner下仍不得声称展示Slot匹配确切用餐时间。

## 已确认Gold：DGS05

- T01只知道约会场景，因此先问日期和人数；不从“约会”自行推断2人，也不在缺少日期、人数和地点时推荐餐厅；
- T02确认`2026-08-11 / DINNER / Party 2`后，只追问地点；T03确认Ebisu `AREA`即达到`RECOMMENDATION_READY`，不等待菜系、预算、安静或口味等额外偏好；
- T03四家Fixture均为Eligible。辣味川菜只是待比较的菜系差异，用户从未表达“不吃辣”，不得把它排除或伪造为用户偏好；宽泛Dinner下展示Slot不等于匹配确切时间或真实可订；
- T04将`intimate`作为正向偏好，将`tasting menu`作为明确排除项；Lantern Room是唯一同时保留的收敛结果。Atelier仅套餐而排除，Verde和Rouge Spice不满足本轮新增的亲密氛围偏好；必须说明为何只剩一家。

## 已确认Gold：DGS06

- T01保留朋友聚餐和宽泛`DINNER`，但日期、人数和地点仍未知，只问日期与人数；`DAYPART`可以没有日期，避免丢失用户已说出的晚餐时段；
- T02保存`2026-08-15 / DINNER / Party 6–8`和愿意出行的`FLEXIBLE`意向，但没有地理锚点仍为`NOT_READY`，只追问出发点或优先区域；
- T03把人数修正为5，以Ueno为出发点并保留可出行策略；严重花生过敏成为Hard Constraint。明确不支持的Yakitori Matsu排除；Kappo Haru、Garden Room与可提交过敏请求的Sakana Table均可展示，但卡片必须明确仍需餐厅确认，任何一家都不得被表述为安全保证；
- T04新增日料正向偏好和不正式负向偏好。Kappo、Sakana与Garden分别代表日料但正式、轻松日料但待餐厅确认、轻松且有流程但非日料的真实取舍；不得伪造完美匹配或把内部证据分级交给用户决策；
- T03/T04的三张候选卡均带`ALLERGY_CONFIRMATION_REQUIRED`结构化披露，并引用各自`attributes` Fact；因此必须明确“仍需餐厅确认”，而不是把来源流程或可提交请求说成安全保证。
- 用户选择带严重过敏要求的候选后，未来预订流程必须先显示单独Consent Card，明确餐厅、日期、时间、人数、将披露的严重过敏信息及仍待餐厅确认的事实。未确认前不得提交预约或过敏请求；具体产品规则见[Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md#过敏与特殊要求)。

标注发生分歧时先记录争议，不通过放宽所有动作来消除分歧。涉及核心字段或Readiness规则的争议应回到Eval Plan统一处理，再提升Dataset版本。
