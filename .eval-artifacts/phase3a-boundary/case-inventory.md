# Goal Gold inventory — Proposed annotations

- Status: draft / not integrated; generated 2026-10-25T09:54:56+01:00 CET (UTC+1).
- Contamination: public/exposed development or retrospective evidence; not a Clean Baseline.
- 原文件未改。每个 source + pointer 是一条独立 Gold 记录；同一句历史副本保留其各自旧目标，按 G 编号引用同一拟分类。
- 分类是本批人工清单，不是产品关键词解析器。A/B 锚点只有在请求已有到访日期或时段时固定 AVAILABILITY；完全无时间时固定 RECOMMENDATION。
- 多轮修正按累计请求分类；当前消息无时间不清空旧时间/目标。引用核验仍只对当前消息；无 TARGET 新提议时不制造新依据。此细化提交停止点 1 复核。

共 121 条记录：108 条已有 target.goal，另 13 条开发 turn 未标目标；70 种原话；14 个不同灰区 turn。

## 来源与冻结 SHA

| 来源 | 记录数 | 状态 | SHA-256 |
| --- | ---: | --- | --- |
| `.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/runner-input.yaml` | 6 | frozen regression / exposed | `9ddfc60bbf2209d4cc2e8d183eba03c7a59ca6a9a37fd89eaae3ebd76a7eb8f2` |
| `.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/runner-input.yaml` | 6 | frozen regression / exposed | `79d899407c464daea2541733685e65084b5d1d045e56223e070d3dd345cb5a16` |
| `.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/holdout-inputs/runner-input.yaml` | 6 | frozen regression / exposed | `c7f9a821277fdef17dec3a3f7c36b51eb2867771ca4222dd2e1dad4174d07832` |
| `.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/holdout-inputs-fallback/runner-input.yaml` | 6 | frozen regression / exposed | `276910da0c43b501f4e68327cca7e4ba8514090a8910ad33ab2873f5a4cbaa48` |
| `.eval-artifacts/checkpoint-c-live-20261020/runner-input.yaml` | 6 | frozen regression / exposed | `571c673070b517795f6eddfb9fd3b1e9c31a7607ff670fda8adb9ed28448c1f4` |
| `.eval-artifacts/p1-f-20261011/variants.rev2.yaml` | 8 | frozen regression / exposed | `1879c3189f90134f2ddb4cc78b12fcc31a0cd68e7b806a2baec43270e6f9f753` |
| `.eval-artifacts/p1-f-20261011/variants.yaml` | 8 | superseded retrospective / exposed | `447aaf3992014be8bb29736c179cb511aff31d0a69fad022f1c659ac5760ff27` |
| `.eval-artifacts/p1-f-20261014/variants.draft.yaml` | 8 | draft / not integrated / exposed | `26b0c944e4d4dffedfd834e40d162ff1fa32c636901a9b42ebf93d94b27874fc` |
| `.eval-artifacts/p2-0-hardening-20261015/prep/h001-tomorrow-20261016.yaml` | 1 | frozen regression / exposed | `52c29ed3d2edf740c984f05b7ca32891c5d53b308196e0f9abc79e170a50e39f` |
| `.eval-artifacts/p2-1-discovery-20261016/variants.yaml` | 6 | frozen regression / exposed | `94d1383d71e6b1e4f589a7ceaab99826ec7a2a0aaa8bf38de8dd52d84d4ad4e7` |
| `.eval-artifacts/p2-live-set-20261019/variants.yaml` | 6 | frozen regression / exposed | `910ba0fdf755392ab1d2a1b0c2da5f9fa8d66a32217c109e8eb5f3b3ee24e8b6` |
| `.eval-artifacts/phase2-holdout/holdout.yaml` | 6 | frozen regression / exposed | `cb0efa949f21fc0c19c7a6fd48e6a51c1848bb722c795b0ccd51213c43ecb98e` |
| `.eval-artifacts/phase2b-exit-pipeline-20261022/old-exposed-recovered.yaml` | 6 | frozen regression / exposed | `7f3ffd66e5138e06309debeb88438ee22ca9fbd4e04dd50776cce9dc3aeb6b76` |
| `.eval-artifacts/phase2b-exit-pipeline-20261022/rehearsal-inputs/runner-input.yaml` | 6 | frozen regression / exposed | `4d33146ecf79268dcfe894e98ed7d8d67a9d91563fe1e74cf9363f4dacb46ed2` |
| `.eval-artifacts/phase2b-holdout/holdout.yaml` | 6 | frozen regression / exposed | `358beff858fd1008dda513ea6835e5ec49b1acafa779c819054bf7b8c8659979` |
| `docs/superseded/eval/restaurant-read-pre-alignment-2026-09-15/e2e-cases.yaml` | 5 | superseded retrospective / exposed | `2e32c2c3642a9d480f81c6ba06641925be98981b16d6f8235e461b4d9adac98b` |
| `src/eval/restaurant/agent-loop/cases/e2e-cases.gold7.yaml` | 5 | current executable / exposed | `b346150074493e5a82e3d0dfb5ea5d18b3dbef17bb06d5101dfb15dfeb3ea40e` |
| `src/eval/restaurant/agent-loop/cases/e2e-cases.yaml` | 5 | frozen regression / exposed | `00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6` |
| `src/eval/restaurant/semantic/fixtures.ts` | 15 | current executable / exposed | `fa4a8e52a82806af6d507a06f4ba16426e6c28376936363c777c4e981cf3ca72` |

## 逐条 Gold 记录

| Source / pointer | Case | 原目标（灰区亦原样保留） | 拟分类 | 原话组 |
| --- | --- | --- | --- | --- |
| `.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/runner-input.yaml#document/0` | p2-holdout-01 | AVAILABILITY | A | G001 |
| `.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/runner-input.yaml#document/1` | p2-holdout-02 | AVAILABILITY | B | G002 |
| `.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/runner-input.yaml#document/2` | p2-holdout-03 | AVAILABILITY | A | G003 |
| `.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/runner-input.yaml#document/3` | p2-holdout-04 | AVAILABILITY | A | G004 |
| `.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/runner-input.yaml#document/4` | p2-holdout-05 | AVAILABILITY | B | G005 |
| `.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/runner-input.yaml#document/5` | p2-holdout-06 | AVAILABILITY | B | G006 |
| `.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/runner-input.yaml#document/0` | p2-holdout-01 | AVAILABILITY | A | G001 |
| `.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/runner-input.yaml#document/1` | p2-holdout-02 | AVAILABILITY | B | G007 |
| `.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/runner-input.yaml#document/2` | p2-holdout-03 | AVAILABILITY | A | G003 |
| `.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/runner-input.yaml#document/3` | p2-holdout-04 | AVAILABILITY | A | G004 |
| `.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/runner-input.yaml#document/4` | p2-holdout-05 | AVAILABILITY | B | G005 |
| `.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/runner-input.yaml#document/5` | p2-holdout-06 | AVAILABILITY | B | G006 |
| `.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/holdout-inputs/runner-input.yaml#document/0` | p2b-holdout-01 | AVAILABILITY | A | G008 |
| `.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/holdout-inputs/runner-input.yaml#document/1` | p2b-holdout-02 | AVAILABILITY | B | G009 |
| `.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/holdout-inputs/runner-input.yaml#document/2` | p2b-holdout-03 | AVAILABILITY | B | G010 |
| `.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/holdout-inputs/runner-input.yaml#document/3` | p2b-holdout-04 | AVAILABILITY | A | G011 |
| `.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/holdout-inputs/runner-input.yaml#document/4` | p2b-holdout-05 | AVAILABILITY | A | G012 |
| `.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/holdout-inputs/runner-input.yaml#document/5` | p2b-holdout-06 | AVAILABILITY | B | G013 |
| `.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/holdout-inputs-fallback/runner-input.yaml#document/0` | p2b-holdout-01 | AVAILABILITY | A | G008 |
| `.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/holdout-inputs-fallback/runner-input.yaml#document/1` | p2b-holdout-02 | AVAILABILITY | B | G014 |
| `.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/holdout-inputs-fallback/runner-input.yaml#document/2` | p2b-holdout-03 | AVAILABILITY | B | G010 |
| `.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/holdout-inputs-fallback/runner-input.yaml#document/3` | p2b-holdout-04 | AVAILABILITY | A | G011 |
| `.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/holdout-inputs-fallback/runner-input.yaml#document/4` | p2b-holdout-05 | AVAILABILITY | A | G012 |
| `.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/holdout-inputs-fallback/runner-input.yaml#document/5` | p2b-holdout-06 | AVAILABILITY | B | G013 |
| `.eval-artifacts/checkpoint-c-live-20261020/runner-input.yaml#document/0` | p2l-kf-h001-20261103 | AVAILABILITY | B | G015 |
| `.eval-artifacts/checkpoint-c-live-20261020/runner-input.yaml#document/1` | p2l-kf-h002-20261107 | AVAILABILITY | B | G016 |
| `.eval-artifacts/checkpoint-c-live-20261020/runner-input.yaml#document/2` | p2l-kf-h003-20261106 | AVAILABILITY | 灰区 | G017 |
| `.eval-artifacts/checkpoint-c-live-20261020/runner-input.yaml#document/3` | p2l-kf-h005-20261105 | AVAILABILITY | A | G018 |
| `.eval-artifacts/checkpoint-c-live-20261020/runner-input.yaml#document/4` | p2l-kagurazaka-kaiseki-20261105 | AVAILABILITY | B | G019 |
| `.eval-artifacts/checkpoint-c-live-20261020/runner-input.yaml#document/5` | p2l-kichijoji-tempura-20261103 | AVAILABILITY | A | G020 |
| `.eval-artifacts/p1-f-20261011/variants.rev2.yaml#document/0` | p1f-kf-h001-20261020 | AVAILABILITY | B | G021 |
| `.eval-artifacts/p1-f-20261011/variants.rev2.yaml#document/1` | p1f-kf-h002-20261024 | AVAILABILITY | B | G022 |
| `.eval-artifacts/p1-f-20261011/variants.rev2.yaml#document/2` | p1f-kf-h003-20261023 | AVAILABILITY | 灰区 | G023 |
| `.eval-artifacts/p1-f-20261011/variants.rev2.yaml#document/3` | p1f-kf-h004-20261019 | RECOMMENDATION | 灰区 | G024 |
| `.eval-artifacts/p1-f-20261011/variants.rev2.yaml#document/4` | p1f-kf-h005-20261022 | AVAILABILITY | A | G025 |
| `.eval-artifacts/p1-f-20261011/variants.rev2.yaml#document/5` | p1f-novel-kagurazaka-kaiseki-20261022 | AVAILABILITY | B | G026 |
| `.eval-artifacts/p1-f-20261011/variants.rev2.yaml#document/6` | p1f-novel-nakameguro-yakiniku-20261023 | AVAILABILITY | B | G027 |
| `.eval-artifacts/p1-f-20261011/variants.rev2.yaml#document/7` | p1f-novel-kichijoji-tempura-20261020 | AVAILABILITY | A | G028 |
| `.eval-artifacts/p1-f-20261011/variants.yaml#document/0` | p1f-kf-h001-20261020 | AVAILABILITY | B | G021 |
| `.eval-artifacts/p1-f-20261011/variants.yaml#document/1` | p1f-kf-h002-20261024 | AVAILABILITY | B | G022 |
| `.eval-artifacts/p1-f-20261011/variants.yaml#document/2` | p1f-kf-h003-20261023 | AVAILABILITY | 灰区 | G023 |
| `.eval-artifacts/p1-f-20261011/variants.yaml#document/3` | p1f-kf-h004-20261019 | RECOMMENDATION | 灰区 | G024 |
| `.eval-artifacts/p1-f-20261011/variants.yaml#document/4` | p1f-kf-h005-20261022 | AVAILABILITY | A | G025 |
| `.eval-artifacts/p1-f-20261011/variants.yaml#document/5` | p1f-novel-kagurazaka-kaiseki-20261022 | AVAILABILITY | B | G026 |
| `.eval-artifacts/p1-f-20261011/variants.yaml#document/6` | p1f-novel-nakameguro-yakiniku-20261023 | AVAILABILITY | B | G027 |
| `.eval-artifacts/p1-f-20261011/variants.yaml#document/7` | p1f-novel-kichijoji-tempura-20261020 | AVAILABILITY | A | G028 |
| `.eval-artifacts/p1-f-20261014/variants.draft.yaml#document/0` | p1f-kf-h001-20261026 | AVAILABILITY | B | G029 |
| `.eval-artifacts/p1-f-20261014/variants.draft.yaml#document/1` | p1f-kf-h002-20261024 | AVAILABILITY | B | G022 |
| `.eval-artifacts/p1-f-20261014/variants.draft.yaml#document/2` | p1f-kf-h003-20261023 | AVAILABILITY | 灰区 | G023 |
| `.eval-artifacts/p1-f-20261014/variants.draft.yaml#document/3` | p1f-kf-h004-20261027 | RECOMMENDATION | 灰区 | G030 |
| `.eval-artifacts/p1-f-20261014/variants.draft.yaml#document/4` | p1f-kf-h005-20261028 | AVAILABILITY | A | G031 |
| `.eval-artifacts/p1-f-20261014/variants.draft.yaml#document/5` | p1f-novel-kagurazaka-kaiseki-20261022 | AVAILABILITY | B | G026 |
| `.eval-artifacts/p1-f-20261014/variants.draft.yaml#document/6` | p1f-novel-nakameguro-yakiniku-20261023 | AVAILABILITY | B | G027 |
| `.eval-artifacts/p1-f-20261014/variants.draft.yaml#document/7` | p1f-novel-kichijoji-tempura-20261027 | AVAILABILITY | A | G032 |
| `.eval-artifacts/p2-0-hardening-20261015/prep/h001-tomorrow-20261016.yaml#document/0` | h001 | AVAILABILITY | B | G033 |
| `.eval-artifacts/p2-1-discovery-20261016/variants.yaml#document/0` | p2-kf-h001-20261027 | AVAILABILITY | B | G034 |
| `.eval-artifacts/p2-1-discovery-20261016/variants.yaml#document/1` | p2-kf-h002-20261031 | AVAILABILITY | B | G035 |
| `.eval-artifacts/p2-1-discovery-20261016/variants.yaml#document/2` | p2-kf-h005-20261029 | AVAILABILITY | A | G036 |
| `.eval-artifacts/p2-1-discovery-20261016/variants.yaml#document/3` | p2-kagurazaka-kaiseki-20261029 | AVAILABILITY | B | G037 |
| `.eval-artifacts/p2-1-discovery-20261016/variants.yaml#document/4` | p2-nakameguro-yakiniku-20261030 | AVAILABILITY | B | G038 |
| `.eval-artifacts/p2-1-discovery-20261016/variants.yaml#document/5` | p2-kichijoji-tempura-20261027 | AVAILABILITY | A | G032 |
| `.eval-artifacts/p2-live-set-20261019/variants.yaml#document/0` | p2l-kf-h001-20261103 | AVAILABILITY | B | G015 |
| `.eval-artifacts/p2-live-set-20261019/variants.yaml#document/1` | p2l-kf-h002-20261107 | AVAILABILITY | B | G016 |
| `.eval-artifacts/p2-live-set-20261019/variants.yaml#document/2` | p2l-kf-h003-20261106 | AVAILABILITY | 灰区 | G017 |
| `.eval-artifacts/p2-live-set-20261019/variants.yaml#document/3` | p2l-kf-h005-20261105 | AVAILABILITY | A | G018 |
| `.eval-artifacts/p2-live-set-20261019/variants.yaml#document/4` | p2l-kagurazaka-kaiseki-20261105 | AVAILABILITY | B | G019 |
| `.eval-artifacts/p2-live-set-20261019/variants.yaml#document/5` | p2l-kichijoji-tempura-20261103 | AVAILABILITY | A | G020 |
| `.eval-artifacts/phase2-holdout/holdout.yaml#document/0` | p2-holdout-01 | AVAILABILITY | A | G039 |
| `.eval-artifacts/phase2-holdout/holdout.yaml#document/1` | p2-holdout-02 | AVAILABILITY | B | G040 |
| `.eval-artifacts/phase2-holdout/holdout.yaml#document/2` | p2-holdout-03 | AVAILABILITY | A | G041 |
| `.eval-artifacts/phase2-holdout/holdout.yaml#document/3` | p2-holdout-04 | AVAILABILITY | A | G042 |
| `.eval-artifacts/phase2-holdout/holdout.yaml#document/4` | p2-holdout-05 | AVAILABILITY | B | G043 |
| `.eval-artifacts/phase2-holdout/holdout.yaml#document/5` | p2-holdout-06 | AVAILABILITY | B | G044 |
| `.eval-artifacts/phase2b-exit-pipeline-20261022/old-exposed-recovered.yaml#document/0` | p2-holdout-01 | AVAILABILITY | A | G039 |
| `.eval-artifacts/phase2b-exit-pipeline-20261022/old-exposed-recovered.yaml#document/1` | p2-holdout-02 | AVAILABILITY | B | G040 |
| `.eval-artifacts/phase2b-exit-pipeline-20261022/old-exposed-recovered.yaml#document/2` | p2-holdout-03 | AVAILABILITY | A | G041 |
| `.eval-artifacts/phase2b-exit-pipeline-20261022/old-exposed-recovered.yaml#document/3` | p2-holdout-04 | AVAILABILITY | A | G042 |
| `.eval-artifacts/phase2b-exit-pipeline-20261022/old-exposed-recovered.yaml#document/4` | p2-holdout-05 | AVAILABILITY | B | G043 |
| `.eval-artifacts/phase2b-exit-pipeline-20261022/old-exposed-recovered.yaml#document/5` | p2-holdout-06 | AVAILABILITY | B | G044 |
| `.eval-artifacts/phase2b-exit-pipeline-20261022/rehearsal-inputs/runner-input.yaml#document/0` | p2-holdout-01 | AVAILABILITY | A | G001 |
| `.eval-artifacts/phase2b-exit-pipeline-20261022/rehearsal-inputs/runner-input.yaml#document/1` | p2-holdout-02 | AVAILABILITY | B | G002 |
| `.eval-artifacts/phase2b-exit-pipeline-20261022/rehearsal-inputs/runner-input.yaml#document/2` | p2-holdout-03 | AVAILABILITY | A | G003 |
| `.eval-artifacts/phase2b-exit-pipeline-20261022/rehearsal-inputs/runner-input.yaml#document/3` | p2-holdout-04 | AVAILABILITY | A | G004 |
| `.eval-artifacts/phase2b-exit-pipeline-20261022/rehearsal-inputs/runner-input.yaml#document/4` | p2-holdout-05 | AVAILABILITY | B | G005 |
| `.eval-artifacts/phase2b-exit-pipeline-20261022/rehearsal-inputs/runner-input.yaml#document/5` | p2-holdout-06 | AVAILABILITY | B | G006 |
| `.eval-artifacts/phase2b-holdout/holdout.yaml#document/0` | p2b-holdout-01 | AVAILABILITY | A | G045 |
| `.eval-artifacts/phase2b-holdout/holdout.yaml#document/1` | p2b-holdout-02 | AVAILABILITY | B | G046 |
| `.eval-artifacts/phase2b-holdout/holdout.yaml#document/2` | p2b-holdout-03 | AVAILABILITY | B | G047 |
| `.eval-artifacts/phase2b-holdout/holdout.yaml#document/3` | p2b-holdout-04 | AVAILABILITY | A | G048 |
| `.eval-artifacts/phase2b-holdout/holdout.yaml#document/4` | p2b-holdout-05 | AVAILABILITY | A | G049 |
| `.eval-artifacts/phase2b-holdout/holdout.yaml#document/5` | p2b-holdout-06 | AVAILABILITY | B | G050 |
| `docs/superseded/eval/restaurant-read-pre-alignment-2026-09-15/e2e-cases.yaml#document/0` | h001 | AVAILABILITY | B | G051 |
| `docs/superseded/eval/restaurant-read-pre-alignment-2026-09-15/e2e-cases.yaml#document/1` | h002 | RECOMMENDATION | B | G052 |
| `docs/superseded/eval/restaurant-read-pre-alignment-2026-09-15/e2e-cases.yaml#document/2` | h003 | AVAILABILITY | 灰区 | G053 |
| `docs/superseded/eval/restaurant-read-pre-alignment-2026-09-15/e2e-cases.yaml#document/3` | h004 | RECOMMENDATION | 灰区 | G054 |
| `docs/superseded/eval/restaurant-read-pre-alignment-2026-09-15/e2e-cases.yaml#document/4` | h005 | AVAILABILITY | A | G055 |
| `src/eval/restaurant/agent-loop/cases/e2e-cases.gold7.yaml#document/0` | h001 | AVAILABILITY | B | G051 |
| `src/eval/restaurant/agent-loop/cases/e2e-cases.gold7.yaml#document/1` | h002 | AVAILABILITY | B | G052 |
| `src/eval/restaurant/agent-loop/cases/e2e-cases.gold7.yaml#document/2` | h003 | AVAILABILITY | 灰区 | G053 |
| `src/eval/restaurant/agent-loop/cases/e2e-cases.gold7.yaml#document/3` | h004 | RECOMMENDATION | 灰区 | G054 |
| `src/eval/restaurant/agent-loop/cases/e2e-cases.gold7.yaml#document/4` | h005 | AVAILABILITY | A | G055 |
| `src/eval/restaurant/agent-loop/cases/e2e-cases.yaml#document/0` | h001 | AVAILABILITY | B | G051 |
| `src/eval/restaurant/agent-loop/cases/e2e-cases.yaml#document/1` | h002 | AVAILABILITY | B | G052 |
| `src/eval/restaurant/agent-loop/cases/e2e-cases.yaml#document/2` | h003 | AVAILABILITY | 灰区 | G053 |
| `src/eval/restaurant/agent-loop/cases/e2e-cases.yaml#document/3` | h004 | RECOMMENDATION | 灰区 | G054 |
| `src/eval/restaurant/agent-loop/cases/e2e-cases.yaml#document/4` | h005 | AVAILABILITY | A | G055 |
| `src/eval/restaurant/semantic/fixtures.ts#SR01-complete-then-correct/SR01-T01` | SR01-T01 | UNANNOTATED — 不补造旧目标 | B | G056 |
| `src/eval/restaurant/semantic/fixtures.ts#SR01-complete-then-correct/SR01-T02` | SR01-T02 | UNANNOTATED — 不补造旧目标 | B / CONTEXT_CARRY | G057 |
| `src/eval/restaurant/semantic/fixtures.ts#SR02-incremental-completion/SR02-T01` | SR02-T01 | UNANNOTATED — 不补造旧目标 | 无时间 | G058 |
| `src/eval/restaurant/semantic/fixtures.ts#SR02-incremental-completion/SR02-T02` | SR02-T02 | UNANNOTATED — 不补造旧目标 | B | G059 |
| `src/eval/restaurant/semantic/fixtures.ts#SR03-named-target-then-complete/SR03-T01` | SR03-T01 | RECOMMENDATION | 无时间 | G060 |
| `src/eval/restaurant/semantic/fixtures.ts#SR03-named-target-then-complete/SR03-T02` | SR03-T02 | RECOMMENDATION | B | G061 |
| `src/eval/restaurant/semantic/fixtures.ts#SR04-simple-complete/SR04-T01` | SR04-T01 | UNANNOTATED — 不补造旧目标 | B | G062 |
| `src/eval/restaurant/semantic/fixtures.ts#SR05-relative-time-hard-soft-and-party-inference/SR05-T01` | SR05-T01 | UNANNOTATED — 不补造旧目标 | 灰区 | G063 |
| `src/eval/restaurant/semantic/fixtures.ts#SR06-approximate-budget-is-soft/SR06-T01` | SR06-T01 | UNANNOTATED — 不补造旧目标 | 灰区 | G064 |
| `src/eval/restaurant/semantic/fixtures.ts#SR07-relative-offset-time/SR07-T01` | SR07-T01 | UNANNOTATED — 不补造旧目标 | 灰区 | G065 |
| `src/eval/restaurant/semantic/fixtures.ts#SR08-criterion-removal/SR08-T01` | SR08-T01 | UNANNOTATED — 不补造旧目标 | 灰区 | G066 |
| `src/eval/restaurant/semantic/fixtures.ts#SR08-criterion-removal/SR08-T02` | SR08-T02 | UNANNOTATED — 不补造旧目标 | 灰区 / CONTEXT_CARRY | G067 |
| `src/eval/restaurant/semantic/fixtures.ts#SR09-relative-location-overwrite/SR09-T01` | SR09-T01 | UNANNOTATED — 不补造旧目标 | 灰区 | G068 |
| `src/eval/restaurant/semantic/fixtures.ts#SR09-relative-location-overwrite/SR09-T02` | SR09-T02 | UNANNOTATED — 不补造旧目标 | 灰区 / CONTEXT_CARRY | G069 |
| `src/eval/restaurant/semantic/fixtures.ts#SR10-hard-budget/SR10-T01` | SR10-T01 | UNANNOTATED — 不补造旧目标 | 灰区 | G070 |

## 原话与分类理由

### G001 — A

> Can you find a yakitori place near Ueno with a table for 3 on Wednesday, November 4 at 7 PM?

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G002 — B

> Looking for an Italian restaurant near Sangenjaya for 2 people on Friday, October 30 at 7:30 PM, under 8,000 yen per person.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G003 — A

> We're 6 people looking for shabu-shabu near Akasaka on Thursday, October 29, sometime between 6 and 8 PM. Any open tables?

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G004 — A

> Is there an unagi restaurant near Ningyocho that has a table for 2 on Tuesday, November 3 at 6:30 PM?

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G005 — B

> Need a Chinese restaurant near Gotanda for 4 people on Saturday, October 31 at 7 PM. Ideally under 6,000 yen per person, and no spicy Sichuan food.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G006 — B

> Looking for an izakaya near Shimokitazawa for 5 people on Friday, October 30 at 7 PM.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G007 — B

> Looking for an Italian restaurant near Jiyugaoka for 2 people on Friday, October 30 at 7:30 PM, under 8,000 yen per person.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G008 — A

> Could you find a sukiyaki restaurant near Asakusa with a table for 2 on Wednesday, November 4 at 7 PM?

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G009 — B

> We are 4 people looking for monjayaki near Tsukishima on Friday, October 30 at 6:30 PM, ideally under 4,000 yen per person.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G010 — B

> Looking for a French restaurant near Ebisu for 2 on Saturday, October 31 at 7:30 PM. Our budget is at most 15,000 yen per person.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G011 — A

> There are 6 of us. Any Thai restaurant near Ikebukuro with a table on Thursday, November 5, sometime between 6 and 8 PM?

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G012 — A

> Is there a sit-down soba restaurant near Azabu-Juban with a table for 3 on Tuesday, November 3 at 7 PM? Not a standing soba counter.

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G013 — B

> We need oden near Shimbashi for 8 people on Friday, October 30, any time between 7 and 9 PM.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G014 — B

> We are 4 people looking for monjayaki near Kachidoki on Friday, October 30 at 6:30 PM, ideally under 4,000 yen per person.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G015 — B

> Looking for an omakase spot near Shibuya for 2 people on Tuesday, November 3 at 7 PM.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G016 — B

> Recommend a first-date restaurant near Higashi-Ginza for Saturday, November 7 at 6:30 PM. Around 10,000 yen per person. No hot-pot restaurants and no Sichuan/Hunan-style cuisine where spicy food is the main focus.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G017 — 灰区

> Need a place for a team dinner nearby on Friday, November 6 after work. 10 people, around 3,000 yen per person, good for drinks, ideally with a private room.

原目标：AVAILABILITY。请求有到访时间意图，但没有 A 的订位措辞或 B 的具体钟点/数字钟点区间；交给语义模型判断。

### G018 — A

> Any spots nearby with open tables on Thursday, November 5 at 6 PM for 4 people? Local food only, no fast food.

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G019 — B

> Looking for a kaiseki restaurant near Kagurazaka for 3 people on Thursday, November 5 at 7:30 PM.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G020 — A

> Any tempura restaurants near Kichijoji with a table for 2 on Tuesday, November 3 at 6 PM?

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G021 — B

> Looking for an omakase spot near Shibuya for 2 people on Tuesday, October 20 at 7 PM.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G022 — B

> Recommend a first-date restaurant near Higashi-Ginza for Saturday, October 24 at 6:30 PM. Around 10,000 yen per person. No hot-pot restaurants and no Sichuan/Hunan-style cuisine where spicy food is the main focus.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G023 — 灰区

> Need a place for a team dinner nearby on Friday, October 23 after work. 10 people, around 3,000 yen per person, good for drinks, ideally with a private room.

原目标：AVAILABILITY。请求有到访时间意图，但没有 A 的订位措辞或 B 的具体钟点/数字钟点区间；交给语义模型判断。

### G024 — 灰区

> Good cafes nearby to meet up with a friend on the afternoon of Monday, October 19.

原目标：RECOMMENDATION。KF-H004 咖啡馆见面请求有指定日期和宽下午时段，无 A/B 锚点；灰区，现行 Gold 为 RECOMMENDATION。

### G025 — A

> Any spots nearby with open tables on Thursday, October 22 at 6 PM for 4 people? Local food only, no fast food.

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G026 — B

> Looking for a kaiseki restaurant near Kagurazaka for 3 people on Thursday, October 22 at 7:30 PM.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G027 — B

> Find a yakiniku place near Nakameguro for 4 people on Friday, October 23 at 7 PM.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G028 — A

> Any tempura restaurants near Kichijoji with a table for 2 on Tuesday, October 20 at 6 PM?

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G029 — B

> Looking for an omakase spot near Shibuya for 2 people on Monday, October 26 at 7 PM.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G030 — 灰区

> Good cafes nearby to meet up with a friend on the afternoon of Tuesday, October 27.

原目标：RECOMMENDATION。KF-H004 咖啡馆见面请求有指定日期和宽下午时段，无 A/B 锚点；灰区，现行 Gold 为 RECOMMENDATION。

### G031 — A

> Any spots nearby with open tables on Wednesday, October 28 at 6 PM for 4 people? Local food only, no fast food.

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G032 — A

> Any tempura restaurants near Kichijoji with a table for 2 on Tuesday, October 27 at 6 PM?

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G033 — B

> Looking for an omakase spot near Shibuya for 2 people tomorrow at 7 PM.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G034 — B

> Looking for an omakase spot near Shibuya for 2 people on Tuesday, October 27 at 7 PM.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G035 — B

> Recommend a first-date restaurant near Higashi-Ginza for Saturday, October 31 at 6:30 PM. Around 10,000 yen per person. No hot-pot restaurants and no Sichuan/Hunan-style cuisine where spicy food is the main focus.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G036 — A

> Any spots nearby with open tables on Thursday, October 29 at 6 PM for 4 people? Local food only, no fast food.

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G037 — B

> Looking for a kaiseki restaurant near Kagurazaka for 3 people on Thursday, October 29 at 7:30 PM.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G038 — B

> Find a yakiniku place near Nakameguro for 4 people on Friday, October 30 at 7 PM.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G039 — A

> Can you find a yakitori place near Ueno with a table for 3 on {DATE} at 7 PM?

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G040 — B

> Looking for an Italian restaurant near Jiyugaoka for 2 people on {DATE} at 7:30 PM, under 8,000 yen per person.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G041 — A

> We're 6 people looking for shabu-shabu near Akasaka on {DATE}, sometime between 6 and 8 PM. Any open tables?

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G042 — A

> Is there an unagi restaurant near Ningyocho that has a table for 2 on {DATE} at 6:30 PM?

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G043 — B

> Need a Chinese restaurant near Gotanda for 4 people on {DATE} at 7 PM. Ideally under 6,000 yen per person, and no spicy Sichuan food.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G044 — B

> Looking for an izakaya near Shimokitazawa for 5 people on {DATE} at 7 PM.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G045 — A

> Could you find a sukiyaki restaurant near Asakusa with a table for 2 on {DATE} at 7 PM?

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G046 — B

> We are 4 people looking for monjayaki near Tsukishima on {DATE} at 6:30 PM, ideally under 4,000 yen per person.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G047 — B

> Looking for a French restaurant near Ebisu for 2 on {DATE} at 7:30 PM. Our budget is at most 15,000 yen per person.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G048 — A

> There are 6 of us. Any Thai restaurant near Ikebukuro with a table on {DATE}, sometime between 6 and 8 PM?

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G049 — A

> Is there a sit-down soba restaurant near Azabu-Juban with a table for 3 on {DATE} at 7 PM? Not a standing soba counter.

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G050 — B

> We need oden near Shimbashi for 8 people on {DATE}, any time between 7 and 9 PM.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G051 — B

> Looking for an omakase spot near Shibuya for 2 people tonight at 7 PM.

原目标：AVAILABILITY。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G052 — B

> Recommend a first-date restaurant near Higashi-Ginza for this Saturday at 6:30 PM. Around 10,000 yen per person. No hot-pot restaurants and no Sichuan/Hunan-style cuisine where spicy food is the main focus.

原目标：AVAILABILITY, RECOMMENDATION。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G053 — 灰区

> Need a place for a team dinner nearby this Friday after work. 10 people, around 3,000 yen per person, good for drinks, ideally with a private room.

原目标：AVAILABILITY。请求有到访时间意图，但没有 A 的订位措辞或 B 的具体钟点/数字钟点区间；交给语义模型判断。

### G054 — 灰区

> Good cafes nearby to meet up with a friend this afternoon.

原目标：RECOMMENDATION。this afternoon 已表达今天下午；有时间但无订位措辞、无具体钟点，因此是灰区；现行 Gold 仍为 RECOMMENDATION。

### G055 — A

> Any spots nearby with open tables right now for 4 people? Local food only, no fast food.

原目标：AVAILABILITY。用户原话有订位/桌位/空位措辞，且请求有到访日期或时段。

### G056 — B

> Tomorrow between 19:00 and 19:30 in Shinjuku for two people, yakiniku under 5000 JPY per person.

原目标：UNANNOTATED。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G057 — B

> Actually make it three people in Shibuya, and remove yakiniku.

原目标：UNANNOTATED。修正 turn；会话前一轮已给出 19:00–19:30，累计请求仍属 B。本轮未表达改目标，目标应继承。

### G058 — 无时间

> I need a table in Shinjuku for two people.

原目标：UNANNOTATED。本请求尚无到访日期或时段；无时间规则优先，即使出现 table 也不能据此查位。

### G059 — B

> Tomorrow between 19:00 and 19:30.

原目标：UNANNOTATED。当前轮补充明确钟点区间；人数和餐厅请求来自同一会话上一轮，累计请求属 B。

### G060 — 无时间

> I want Sushi Dai.

原目标：RECOMMENDATION。本请求尚无到访日期或时段；无时间规则优先，即使出现 table 也不能据此查位。

### G061 — B

> Tomorrow between 19:00 and 19:30 for two people in Tsukiji.

原目标：RECOMMENDATION。当前轮明确补充钟点区间和两人，Sushi Dai 来自同一会话；属 B，旧 Gold 的 RECOMMENDATION 须列为待确认变化。

### G062 — B

> Tomorrow between 18:00 and 18:30 in Ginza for four people, Japanese food.

原目标：UNANNOTATED。正餐请求有具体钟点或数字钟点区间，人数已明确或可从封闭参与关系/会话上下文获得。

### G063 — 灰区

> This Friday evening near our office for three colleagues and me; no smoking is essential, and a quiet room would be nice.

原目标：UNANNOTATED。请求有到访时间意图，但没有 A 的订位措辞或 B 的具体钟点/数字钟点区间；交给语义模型判断。

### G064 — 灰区

> Tomorrow afternoon nearby for my parents and me. Around 3,000 yen per person would be ideal.

原目标：UNANNOTATED。请求有到访时间意图，但没有 A 的订位措辞或 B 的具体钟点/数字钟点区间；交给语义模型判断。

### G065 — 灰区

> In about 30 minutes near me for two people, Korean food.

原目标：UNANNOTATED。约 30 分钟后是相对偏移，不是用户说出的具体钟点/数字钟点区间；不以代码物化后的时刻冒充 B 锚点，拟为灰区，待复核。

### G066 — 灰区

> Tonight at dinner in Ginza for two. I need sushi, but not omakase.

原目标：UNANNOTATED。请求有到访时间意图，但没有 A 的订位措辞或 B 的具体钟点/数字钟点区间；交给语义模型判断。

### G067 — 灰区

> Drop the omakase restriction; keep sushi.

原目标：UNANNOTATED。修正 turn；继承上一轮灰区请求的时间与目标，不按孤立当前消息把已知到访时间抹掉。三次复测与前一轮组成同一 session。

### G068 — 灰区

> This Saturday night near my hotel for two people, Italian food.

原目标：UNANNOTATED。请求有到访时间意图，但没有 A 的订位措辞或 B 的具体钟点/数字钟点区间；交给语义模型判断。

### G069 — 灰区

> Actually, use the area near our office instead.

原目标：UNANNOTATED。修正 turn；继承上一轮灰区请求的时间与目标，不按孤立当前消息把已知到访时间抹掉。三次复测与前一轮组成同一 session。

### G070 — 灰区

> Tomorrow after work in Shinjuku for two. The 5,000 yen maximum is firm.

原目标：UNANNOTATED。请求有到访时间意图，但没有 A 的订位措辞或 B 的具体钟点/数字钟点区间；交给语义模型判断。

## 明确的重点与缺口

- H003 及两种团队晚餐日期变体（G017/G023/G053）都是灰区，旧 Gold 为 AVAILABILITY。
- H004 this afternoon（G054）是灰区，旧 Gold 为 RECOMMENDATION；不能因为“今天”而改成无时间。
- KF-H004 已提交的 10/19 与 10/27 版本（G024/G030）都是灰区，旧 Gold 为 RECOMMENDATION。指令提到的 Wednesday 原话未在本 main 的 Gold 中找到；指令报告的模型 AVAILABILITY 不冒充 Gold。该指令示例可另加候选，但不冒充现有用例、不计入本次数量。
- SR03-T02（G061）的旧目标为 RECOMMENDATION，新 B 分类要求 AVAILABILITY；提交为待用户确认的 Gold 变化，不修改旧 fixture。其余 13 条 SR turn 无目标标注，不能声称此前已验证目标分类。
- `.eval-artifacts/phase2-holdout`、`phase2b-holdout` 和已执行 runner-input 是已公开、已暴露材料；模板与实际填日期、fallback 地点的副本逐条保留。历史注释的 DRAFT/Clean 用词不恢复其 Clean 身份。
- 私有语义 Holdout `.eval-private/` 未读取、未枚举内容、未复制。仅引用协议已公开的 15 session / 25 turn 元数据；其逐条目标与灰区数 NOT_INSPECTED，不纳入估算。
- `.eval-artifacts/phase2c-location-semantic-20261023/semantic-inputs.json` 保存模型实际 Proposal，不是独立 Gold；E1 `gold-corrections.json` 的 entries 是原产物 SHA 绑定，Gold 源 rev1/rev2 已在上表。未把实际模型目标当标签。
