
### HO-001

> Looking for an omakase spot near Shibuya for 2 people tonight at 7 PM.

### HO-002

> Recommend a first-date restaurant near Higashi-Ginza for this Saturday at 6:30 PM. Around 10,000 yen per person. No spicy food, no hot pot.

### HO-003

> Need a place for a team dinner nearby this Friday after work. 10 people, around 3,000 yen per person, good for drinks, ideally with a private room.

### HO-004

> Good cafes nearby to meet up with a friend this afternoon.

### HO-005

> Any spots nearby with open tables right now for 4 people? Local food only, no fast food.

### HO-006

> Dinner with friends this Saturday night, 4 people. We're near Tokyo Skytree in Sumida, and they live in Minato. Any good restaurant halfway between us? Any cuisine is fine.

### HO-007

> Where's a good place for a family dinner? My parents are visiting my wife and me.

### HO-008

> I'm treating a senior colleague to dinner near our office. He's quite traditional—what kind of food would be a good choice?

### HO-009

> Any good restaurants around the office lately?

### HO-010

> Any new Western restaurants recently opened in Ginza?

### HO-011

**Turn 1**

> I feel like having ramen after work. Anything good nearby?

**Turn 2**

> A friend is joining me and will be here in about 30 minutes. We just want to have burgers. Any Mori burgers near and available?

### HO-012

**Turn 1**

> I'm having dinner with friends tomorrow night near Azabudai. Any good options?

**Turn 2**

> I don't want sushi.

**Turn 3**

> There are three of us, all women.

**Turn 4**

> The places you recommended are a bit too expensive.

### HO-013

**Turn 1**

> I need to take my department head out for dinner.

**Turn 2**

> It'll be my department head and a few senior colleagues.

**Turn 3**

> Three senior colleagues.

**Turn 4**

> Actually, plans changed. There'll be four senior colleagues.

### HO-014

**Turn 1**

> Are there any restaurants nearby that are open right now?

**Turn 2**

> We have a young child with us.

**Turn 3**

> Nothing spicy. The child is two years old.

### HO-015

**Turn 1**

> My friend wants to go to a new cake shop in Shibuya, but I think it's a bit too far. Is there anything closer?

**Turn 2**

> I'd rather just find a nearby cafe where we can sit for a while.

### HO-016

**Turn 1**

> I'm starving but don't want anything too heavy. Anything good around here?

**Turn 2**

> Maybe noodles or something warm.

### HO-017

**Turn 1**

> I want to take my parents out for dinner tonight, but they can't walk very far.

**Turn 2**

> We're staying near Tokyo Station.

**Turn 3**

> My dad doesn't eat raw food.

### HO-018

**Turn 1**

> Can you find somewhere near Roppongi for dinner tonight?

**Turn 2**

> Actually, Shinjuku might be easier for everyone.

### HO-019

**Turn 1**

> Looking for somewhere to have brunch this weekend.

**Turn 2**

> Ideally somewhere we can sit for a while since we'll probably be chatting.

**Turn 3**

> It doesn't need to be trendy. Somewhere that's not too crowded would be better.

### HO-020

**Turn 1**

> Any good yakiniku places nearby?

**Turn 2**

> That one looks good, but do they have anything available around 8?

### HO-021

**Turn 1**

> I want to try somewhere in Tokyo that's a bit unique—something I normally wouldn't find back in Beijing.

**Turn 2**

> It doesn't need to be particularly expensive.

### HO-022

> We have about an hour before our train from Tokyo Station. Where should we eat?

### HO-023

> Looking for somewhere for dinner and drinks, but I don't want an izakaya. Ideally somewhere a bit quieter.

### HO-024

**Turn 1**

> It's my girlfriend's birthday next week. Where should I take her for dinner?

**Turn 2**

> She likes French food, but we did French for her birthday last year.

**Turn 3**

> I'd like to try something different this time.

### HO-025

**Turn 1**

> I went to a really good yakitori place before, but I can't remember the name.

**Turn 2**

> I think it was in Ebisu.

**Turn 3**

> It was very small, mostly counter seating.

### HO-026

**Turn 1**

> Anything decent still open near me?

**Turn 2**

> I don't want to travel more than 15 minutes.

### HO-027

**Turn 1**

> A client is visiting our office tomorrow around noon. Where should I take them for lunch?

**Turn 2**

> We only have about an hour.

**Turn 3**

> Our office is in Marunouchi.

### HO-028

**Turn 1**

> Where can we go for dessert after dinner in Ginza?

**Turn 2**

> Not another full restaurant, just somewhere we can sit and have something sweet.

### HO-029

**Turn 1**

> My friend wants wagyu, but I think it's going to be too expensive.

**Turn 2**

> Is there somewhere cheaper that gives us a similar experience?

### HO-030

**Turn 1**

> Need dinner for six tonight somewhere around Shibuya.

**Turn 2**

> One person is vegetarian.

**Turn 3**

> Actually, there'll be seven of us.

**Turn 4**

> And we probably won't get there until after 9.



**本轮标注规则：
nearby / near me / close by → 视为明确的当前位置相对位置约束，Parser 不追问 location，下游通过 location tool resolve。
close to the office / near my hotel / near home → 视为明确的相对地点约束，下游优先从 context / profile / tool resolve 对应地点。
criteria 的定义就是“影响后续决策的用户要求”，SOFT：用户明确表达，但允许权衡的偏好、程度或近似条件。；明确不可违反或者明确指明 → HARD
partySize may be inferred when the number of diners is strongly implied by the conversation. Avoid inference when participant count is genuinely ambiguous.h007优化了一下变成了推理出4个人
now / right now 必须基于 referenceTime + timezone 解析为绝对 date + exact time；不得保留 "now" 字符串。Provider slot rounding / tolerance 属于下游执行策略。
afternoon 与当前底层 exact-time contract 的兼容问题先记着，后面真实落 eval 时如果触发 schema 问题，再集中处理 daypart。
模糊时间表达 → deterministic approximate time window → 用于 recommendation / availability search；真正 booking 前必须由用户确认具体 slot。
用户当前其实在问 “什么菜系/类型合适”，还没有真正进入“帮我找一家餐厅”的阶段。因此现实产品里，完全可以先回答「怀石、寿司、传统日料等可能更稳妥」，不需要马上追问日期、时间、人数。

但当前 contract 只有 ASK / SEARCH，没有类似 ADVISE / EXPLORE 的状态。所以按现有结构只能先标 ASK。

另外我不会把 traditional 推成 Japanese food。它只是描述这个 senior colleague 的偏好，应该保留成较软的语义条件。