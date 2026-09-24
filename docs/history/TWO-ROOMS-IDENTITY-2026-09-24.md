# TWO ROOMS identity comparison — first bounded experiment

- Status: local mechanism supported / exposed development diagnostic; not full Live acceptance
- Document revision: 0.2
- Scope: one shared address-comparison rule and its TableCheck identity caller; no search, cache, Browser Prompt, score threshold or inventory change

## Frozen expectation before code changes

The [H003 execution artifact](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-24T04-15-48-109Z-b953c40e-e0ec-4aa2-b87e-8ae324794859.result.json) retains the Google candidate `Two rooms cafe grill bar` at `Japan, 〒103-0027 Tokyo, Chuo City, Nihonbashi, 2-chōme−5−１ 高島屋 新館 ７階`, phone `03-6262-3177`, and the TableCheck `trnihombashi` page at `103-6107 Tokyo Chuo-ku 2-5-1 NIhonbashi Nihonbashi Takashimaya S.C. Shinkan 7F`, phone `+81362623177`. The saved comparison is name `CONFLICT`, address `CONFLICT`, phone `MATCH`, leaving identity LOW. The [restaurant's own access page](https://tworooms-nihombashi.jp/en/access/) independently confirms Nihombashi 2-5-1, Takashimaya S.C. Annex 7F and that phone. [Japan Post identifies 103-6107 as the building's seventh-floor postal code](https://www.post.japanpost.jp/cgi-zip/zipcode.php?city=1131020&id=46928&merge=0&pref=13); its [postal manual](https://www.post.japanpost.jp/service/search/zipcode/zipmanual/p04.html) describes floor-specific high-rise codes. These are the same outlet for the identity decision. This does not establish its availability.

The first contradictory field is postal code: `103-0027` versus `103-6107`. Both street numbers and explicit seventh-floor units agree. The address comparator currently returns `CONFLICT` for any unequal known postal codes, and TableCheck's resolver vetoes an exact phone match on an address conflict. Name wording differs too, but does not veto exact-phone HIGH once the false address conflict is removed. The old suite covered equal postal/floor and wrong-floor/wrong-street rejection, but no town-code versus floor-specific building-code pair; this is a coverage omission, not a new website behavior.

## Four frozen controls and acceptance budget

| Control | Independent expected identity result | Source |
|---|---|---|
| TWO ROOMS Nihombashi | HIGH by exact phone when matching street and floor have town/building-floor postal variation | Saved H003 Google and TableCheck fields; restaurant access page; Japan Post |
| bills Ginza | Preserve existing HIGH same-outlet decision | Saved H002 identity diagnostic |
| TWO ROOMS Aoyama against the Nihombashi candidate | Reject HIGH as a real sister outlet with distinct 3-11-7 Kita-Aoyama / 5F and phone 03-3498-0002 | [Aoyama restaurant contact](https://tworooms.jp/en/contact), [Aoyama TableCheck](https://www.tablecheck.com/en/tworooms) |
| Ginza Kazen | Preserve its current non-HIGH diagnostic; its equal postal codes mean this postal-variation rule cannot explain its separate address mismatch | Saved H002 identity diagnostic |

Budget: reuse the existing address-comparator and TableCheck identity tests and frozen observations, no model calls, no full H003, no new Live run. The local target is four correct identity decisions within the existing test command. Evaluation reuses TableCheck's comparison/identity diagnostic and adds a manual independent four-control verdict here; the current general Live evaluator has no gold same-outlet label for these pages, so it cannot certify this local hypothesis. The three outcomes are: **supported** if the TWO ROOMS rejection changes and the three controls retain their expected decisions; **unsupported** if the rejection persists or a control regresses; **uncovered** if the frozen source fields fail to exercise the changed rule. Even a supported result closes only this comparison mechanism, not inventory, overall unmatched rate or H003 completion.

## Red/green and independent verdict

The frozen TableCheck test failed against the old comparator at the TWO ROOMS address assertion: actual `CONFLICT`, expected `INSUFFICIENT`. The narrow rule now treats differing postcodes as unresolved only when the same postal region, street numbers and explicit floor agree, one postcode has a plausible high-rise floor suffix, and a non-generic locality token is shared. It never converts that mismatch into an address `MATCH`. The existing resolver then uses the independently matching phone; a different street or floor remains a hard conflict. No identity confidence threshold was changed.

| Control | Result after change | Verdict |
|---|---|---|
| TWO ROOMS Nihombashi | Address `INSUFFICIENT`, phone `MATCH`, resolution `HIGH` | Expected false rejection removed |
| bills Ginza | Address `MATCH`, resolution `HIGH` through name and address | Existing correct match preserved |
| TWO ROOMS Aoyama | Address `CONFLICT`, resolution below `HIGH` | Real different outlet remains rejected |
| Ginza Kazen | Resolution remains below `HIGH` | No change from this postal rule; its distinct address-parsing issue remains open |

The existing TableCheck test suite passed 39/39 after a deliberate 38/39 red run. Shared address tests passed 3/3. Typecheck, architecture check, build and default tests 519/519 passed. This is a local, source-frozen identity verdict with zero model or Live cost. The target identity mechanism is **supported**; no claim is made that current TableCheck inventory for this outlet is available, that H003 would finish, or that the broader unmatched rate is low. The general execution Evaluator was not altered in this first experiment; formal production-composition scoring and necessary variants remain a later gate if the mechanism is promoted.
