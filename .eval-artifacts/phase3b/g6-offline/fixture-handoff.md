# G6 P4 first deviation — B-owned product gap

- Status: draft / not integrated; **STOPPED**, not G6 acceptance.
- Date: 2026-11-01, Vienna CET.
- Product base: main `6db445ea9afdbe5debdc60efc1107f768434c555`, unchanged.
- Frozen failing A input: `b25d88fb`.
- Reproducer: `node --import tsx src/eval/restaurant/agent-loop/g6-development-preflight.ts --out <fresh-output-directory> --path P4` (no credentials/network).
- Raw original: `scripted/p4-g1-no-bound-page.json.gz`; exact decompressed and stored SHA in `scripted/manifest.json`.

## Actual chain and independent expected fact

The actual persistent application, Interpreter/Compiler, PGlite Runtime/Reducer, Agent/Validator/Router and `createLiveReadAssembly` run unchanged. Only model transport, Google responses and browser source pages are fixed local constructions; they are **not website replays**. The normal control derives discovery, HIGH same-outlet identity, request-bound availability and B1 from the real parsers/source cache; no State or qualified evidence is prefilled.

Initial user: `Find one restaurant in Shibuya for two on November 11, 2026 at 7 PM.` It reaches PRESENT_RESULTS with G6 Development Sushi, source URL `https://tabelog.com/en/tokyo/A1301/A130101/13123456/`, two guests/19:00/2026-11-11 and the source-returned form_course link. Candidate `googleWebsiteUri` remains present. The public local HTML and snapshot contain the exact independent sentence `A private room is available for groups of four or more.` (source.json merchantQuote and outlet.html, frozen SHA).

The code selects the actually displayed first candidate from State and calls the existing explicit-card `askRestaurantQuestion` entry, not an invented chat classifier. Question: `Does the first restaurant have a private room?` The real trajectory executes ANSWER_PAGE_QUESTION, ALLOWED. Expected: the literal merchant sentence, original source URL/read time and same candidate, or NOT_STATED only if not on the page. Actual: **UNVERIFIED / NO_BOUND_PAGE, checkedPages=[]**. The `restaurant_page_question` model is never invoked. This is a safe unknown but fails the requested readable-page capability.

## First deviating edge

`src/integrations/restaurant-facts/page-question-reader.ts:61–70` requests `inspectFacts({capturePagesOnly:true,...})`, then needs an emitted bound page. The Google-derived candidate goes through SourceAwareFactRead's Google side into `GoogleThenWebsiteFactRead.inspectFacts`.

`src/integrations/restaurant-facts/google-then-website-facts.ts:88–112` ignores `capturePagesOnly` while deciding whether to read the website. At line93, the only condition is `uri && needsWebsiteFactEvidence(...)`. That predicate looks at the original search's missing HARD/hours/commercial fields. This request has no such gaps; it returns at line110 after Google Details, without the line112 website reader. The source-call sequence records precisely that extra Google GET after the question, with **zero new browser navigation**. It is not a missing fixture navigation, bad identity, quotation rejection or model choice: the website reader and question model are never reached.

Product file SHA-256: `647061ee04f45a66dfcf3e43e795d84378e86c84b6583607e8f157d6f5698c2d`.

## Review handoff, no implementation here

B should decide the minimal handling of explicit page capture in this existing chain, keeping the same-outlet identity, run binding, Guard, independent question budget and cancellation. Do not solve by inventing a HARD condition, preloading a hand-authored bound page, substituting a separate G1 reader, or changing UNKNOWN to PASS. No product patch or counterfactual product mutation was made by A. The first-deviation diagnosis is supported by actual composition output plus the static branch; a repair and its causal green remain for B.

No true model replay is justified while this wiring is broken. No G6 Live Runner/independent evaluator/development Live plan is represented as complete. The checksum utility and earlier scripted controls remain reviewable; all required remaining red/green controls and paid decisions are NOT_RUN or NOT_REACHED.
