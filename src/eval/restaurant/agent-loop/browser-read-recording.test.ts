import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { BrowserReadRecording } from "./runners/browser-read-recording.js";

const reviewedStaticScript = [{ origin: "https://cdn.public.example", pathnamePrefix: "/assets/", resourceTypes: ["script"] as const,
  queryKeyRules: { required: [], allowedPatterns: ["^rst-v1-[A-Za-z0-9._-]+$"] } }] as const;
const reviewedDirectoryDocument = [{ origin: "https://directory.public.example", pathname: "/en/tokyo/A1303/A130301/rstLst/", resourceTypes: ["document"] as const,
  queryKeyRules: { required: [], allowed: ["sw"] } }] as const;

test("observed same-origin GET forms keep their public queryless action without an endpoint exception", async () => {
  const { tabelogPublicReadNetworkPolicy } = await import("../../../integrations/tabelog/tabelog-public-query.js");
  const root = await mkdtemp(join(tmpdir(), "real-search-form-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "real-form", reviewedReads: tabelogPublicReadNetworkPolicy.dynamicReads });
    // Contract control; the old recording already stripped action and cannot restore its bytes.
    const html = '<form method="get" action="https://tabelog.com/en/rstLst/"><input name="station_id"></form>';
    recording.recordSnapshot({ url: "https://tabelog.com/en/", title: "Real source", text: "", html });
    await recording.finish();
    const replay = await readFile(join(root, "real-form", "snapshot-0001.html"), "utf8");
    assert.match(replay, /action="https:\/\/tabelog.com\/en\/rstLst\/"/);
    const generic = new BrowserReadRecording({directory:root,runId:"generic-public-form"});
    generic.recordSnapshot({url:"https://public.example/start",title:"Public",text:"",html:'<form method="get" action="/new-public-search/"><input name="anything"></form>'});
    const genericSaved=await generic.finish();
    assert.match(await readFile(join(genericSaved.path,"snapshot-0001.html"),"utf8"),/action="https:\/\/public.example\/new-public-search\/"/);

    for (const [method, action] of [["post", "https://tabelog.com/en/rstLst/"], ["get", "https://other.example/en/rstLst/"], ["get", "https://tabelog.com/en/login/"], ["get", "https://tabelog.com/en/rstLst/?email=private"]] as const) {
      const rejected = new BrowserReadRecording({ directory: root, runId: `unreviewed-${method}-${action.length}`, reviewedReads: tabelogPublicReadNetworkPolicy.dynamicReads });
      rejected.recordSnapshot({ url: "https://tabelog.com/en/", title: "Contract control", text: "", html: `<form method="${method}" action="${action}"></form>` });
      const saved = await rejected.finish();
      assert.doesNotMatch(await readFile(join(saved.path, "snapshot-0001.html"), "utf8"), /action=/);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording writes only an in-memory sanitized public document HAR", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-1" });
    recording.record("MODEL_WIRE", { action: "CLICK", targetRef: "observation:1:target:1", reason: "private source prose", authorization: "secret-marker-do-not-log" });
    recording.recordSnapshot({ url: "https://public.example/menu?date=2026-10-08&party=2", title: "Public", text: "", html: '<h1>Public</h1><script>token="secret-marker-do-not-log"</script><meta name="csrf-token" content="meta-private"><input type="hidden" name="csrf-token" value="csrf-private"><input type="password" name="password" value="password-private"><textarea name="g-recaptcha-response">challenge-private</textarea><div data-csrf-token="data-private">Public restaurant</div><a href="/reserve?start_date=2026-10-08&amp;num_people=2&amp;start_time=19:00">19:00</a><p>a@b.example +86 138 1234 5678</p>' });
    const result = await recording.finish();
    assert.equal(result.screenshot, "NOT_CAPTURED_NO_SANITIZER");
    assert.equal(result.replay.status, "REPLAYABLE");
    if (result.replay.status !== "REPLAYABLE") throw new Error("expected replayable recording");
    const har = await readFile(result.replay.harPath, "utf8");
    const persisted = await readFile(join(root, "run-1", "recording.json"), "utf8");
    assert.equal(har.includes("secret-marker-do-not-log"), false);
    assert.equal(har.includes("<script"), false);
    assert.equal(/csrf-private|password-private|challenge-private|meta-private|data-private/.test(har), false);
    assert.match(har, /Public restaurant/);
    assert.match(har, /start_date=2026-10-08/);
    assert.equal(persisted.includes("authorization"), false);
    assert.match(har, /\[REDACTED\]/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording retains a Pack-reviewed public query document within the measured bounded size", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-reviewed-document", reviewedReads: reviewedDirectoryDocument });
    const html = `<main>${"<p>Public result</p>".repeat(16_000)}</main>`;
    assert.ok(html.length > 300_000 && html.length < 400_000);
    recording.recordSnapshot({
      url: "https://directory.public.example/en/tokyo/A1303/A130301/rstLst/?sw=omakase",
      title: "Public directory", text: "", html,
    });
    const result = await recording.finish();
    assert.equal(result.replay.status, "REPLAYABLE");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording preserves valid JSON-LD geo numbers while redacting its telephone", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "json-ld-geo" });
    recording.recordSnapshot({
      url: "https://public.example/restaurant", title: "Restaurant", text: "",
      html: '<script type="application/ld+json">{"@type":"Restaurant","name":"Public Restaurant","geo":{"@type":"GeoCoordinates","latitude":35.6697003123,"longitude":139.7671399123},"telephone":3123456789,"apiKey":12345,"metadata":{"sessionId":67890}}</script>',
    });
    const result = await recording.finish();
    assert.equal(result.replay.status, "REPLAYABLE");
    if (result.replay.status !== "REPLAYABLE") throw new Error("expected JSON-LD recording");
    const har = JSON.parse(await readFile(result.replay.harPath, "utf8")) as { log: { entries: Array<{ response: { content: { text: string } } }> } };
    const html = har.log.entries[0]!.response.content.text;
    const json = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/i)?.[1];
    assert.ok(json, "JSON-LD remains available to the production exact-radius parser");
    const structured = JSON.parse(json!);
    assert.equal(structured.geo.latitude, 35.6697003123);
    assert.equal(structured.geo.longitude, 139.7671399123);
    assert.equal(structured.telephone, "[REDACTED]");
    assert.equal(structured.apiKey, "[REDACTED]");
    assert.equal(structured.metadata.sessionId, "[REDACTED]");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording keeps reviewed GET form actions and removes unreviewed destinations", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const reviewed = new BrowserReadRecording({ directory: root, runId: "reviewed-query-form", reviewedReads: reviewedDirectoryDocument });
    reviewed.recordSnapshot({
      url: "https://directory.public.example/en/tokyo/A1303/A130301/rstLst/?sw=omakase",
      title: "Directory", text: "",
      html: '<form method="get" action="/en/tokyo/A1303/A130301/rstLst/?sw=omakase"><input name="sw"></form>',
    });
    const recorded = await reviewed.finish();
    assert.equal(recorded.replay.status, "REPLAYABLE");
    if (recorded.replay.status !== "REPLAYABLE") throw new Error("expected reviewed public form to replay");
    const reviewedHar = JSON.parse(await readFile(recorded.replay.harPath, "utf8")) as { log: { entries: Array<{ response: { content: { text: string } } }> } };
    assert.match(reviewedHar.log.entries[0]!.response.content.text, /action="https:\/\/directory\.public\.example\/en\/tokyo\/A1303\/A130301\/rstLst\/\?sw=omakase"/);

    const unreviewed = new BrowserReadRecording({ directory: root, runId: "unreviewed-query-form", reviewedReads: reviewedDirectoryDocument });
    unreviewed.recordSnapshot({
      url: "https://directory.public.example/en/tokyo/A1303/A130301/rstLst/?sw=omakase",
      title: "Directory", text: "",
      html: '<form method="get" action="/en/tokyo/A1303/A130301/rstLst/?unknown=omakase"><input name="sw"></form>',
    });
    const stripped = await unreviewed.finish();
    assert.equal(stripped.replay.status, "REPLAYABLE");
    const document = await readFile(join(stripped.path, "snapshot-0001.html"), "utf8");
    assert.match(document, /<form method="get">/);
    assert.match(document, /name="sw"/);
    assert.doesNotMatch(document, /action=|unknown=/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording refuses replay when a dynamic response was admitted without a safe captured body", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-unsafe" });
    recording.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: "<h1>Public</h1>", networkRequests: [{ outcome: "ADMITTED", origin: "https://public.example", pathname: "/v2/results", method: "GET", resourceType: "fetch", queryKeys: [] }] });
    const result = await recording.finish();
    assert.deepEqual(result.replay, { status: "NOT_REPLAYABLE", reason: "UNCAPTURED_DYNAMIC_RESPONSE" });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording refuses a snapshot-only replay when an admitted external script was not captured", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-static-missing" });
    recording.recordSnapshot({
      url: "https://public.example/menu", title: "Public", text: "", html: '<div id="calendar"></div>',
      networkRequests: [{ outcome: "ADMITTED", origin: "https://cdn.public.example/", pathname: "/assets/calendar.js", method: "GET", resourceType: "script", queryKeys: ["rst-v1-public"] }],
    });
    assert.deepEqual((await recording.finish()).replay, { status: "NOT_REPLAYABLE", reason: "UNCAPTURED_STATIC_DEPENDENCY" });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording keeps a captured safe external script in the replay HAR", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-static-captured", reviewedStaticResources: reviewedStaticScript });
    recording.recordSnapshot({
      url: "https://public.example/menu", title: "Public", text: "", html: '<script src="https://cdn.public.example/assets/calendar.js?rst-v1-202610071750-public"></script><div id="calendar"></div>',
      networkRequests: [{ outcome: "ADMITTED", origin: "https://cdn.public.example/", pathname: "/assets/calendar.js", method: "GET", resourceType: "script", queryKeys: ["rst-v1-202610071750-public"] }],
    });
    await recording.recordResponse({ url: "https://cdn.public.example/assets/calendar.js?rst-v1-202610071750-public", method: "GET", resourceType: "script", status: 200, contentType: "text/javascript", body: new TextEncoder().encode('document.cookie;document.getElementById("calendar").textContent="ready";') });
    const result = await recording.finish();
    assert.equal(result.replay.status, "REPLAYABLE");
    if (result.replay.status !== "REPLAYABLE") throw new Error("expected captured script to be replayable");
    assert.match(await readFile(result.replay.harPath, "utf8"), /calendar\.js/);
    assert.match(await readFile(result.replay.harPath, "utf8"), /rst-v1-202610071750-public/, "a reviewed public release key survives the general text scrub unchanged");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording masks a reviewed public script credential at equal length under the approved contract", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-static-secret", reviewedStaticResources: reviewedStaticScript });
    recording.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: '<div></div>',
      networkRequests: [{ outcome: "ADMITTED", origin: "https://cdn.public.example/", pathname: "/assets/calendar.js", method: "GET", resourceType: "script", queryKeys: ["rst-v1-public"] }] });
    await recording.recordResponse({ url: "https://cdn.public.example/assets/calendar.js?rst-v1-public", method: "GET", resourceType: "script", status: 200, contentType: "application/javascript", body: new TextEncoder().encode('const key = "Bearer secretvalue";') });
    const result=await recording.finish();assert.equal(result.replay.status,"REPLAYABLE");
    if(result.replay.status!=="REPLAYABLE")throw Error("Expected masked public script replay");
    const har=JSON.parse(await readFile(result.replay.harPath,"utf8"));const script=har.log.entries.find((e:any)=>e.request.url.includes("calendar.js")).response.content.text;
    assert.equal(script.length,'const key = "Bearer secretvalue";'.length);assert.ok(!script.includes("Bearer secretvalue"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording persists each runtime-masked screenshot with its snapshot", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-2" });
    recording.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: "<h1>Public</h1>" });
    await recording.captureScreenshot(new Uint8Array([137, 80, 78, 71]), "LAYOUT_ONLY_CONTENT_MASKED");
    recording.recordSnapshot({ url: "https://public.example/menu?date=2026-10-08", title: "Public", text: "", html: "<h1>Public</h1>" });
    await recording.captureScreenshot(new Uint8Array([137, 80, 78, 72]), "LAYOUT_ONLY_CONTENT_MASKED");
    const result = await recording.finish();
    assert.equal(result.screenshot, "LAYOUT_ONLY_CONTENT_MASKED");
    assert.deepEqual([...await readFile(join(root, "run-2", "screenshot-0001.png"))], [137, 80, 78, 71]);
    assert.deepEqual([...await readFile(join(root, "run-2", "screenshot-0002.png"))], [137, 80, 78, 72]);
    const metadata = JSON.parse(await readFile(join(root, "run-2", "recording.json"), "utf8"));
    assert.deepEqual(metadata.screenshots, [
      { snapshot: 1, status: "LAYOUT_ONLY_CONTENT_MASKED", file: "screenshot-0001.png" },
      { snapshot: 2, status: "LAYOUT_ONLY_CONTENT_MASKED", file: "screenshot-0002.png" },
    ]);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording adds a sanitized admitted public dynamic response to replay only in memory", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-dynamic" });
    recording.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: "<h1>Public</h1>", networkRequests: [{ outcome: "ADMITTED", origin: "https://public.example", pathname: "/v2/results", method: "GET", resourceType: "fetch", queryKeys: [] }] });
    await recording.recordResponse({ url: "https://public.example/v2/results", method: "GET", resourceType: "fetch", status: 200, contentType: "application/json", body: new TextEncoder().encode('{"available":true,"slots":[19]}') });
    const result = await recording.finish();
    assert.equal(result.replay.status, "REPLAYABLE");
    if (result.replay.status !== "REPLAYABLE") throw new Error("expected recorded response replay");
    assert.match(await readFile(result.replay.harPath, "utf8"), /\\"available\\":true/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording rejects HTTP failures and preserves safe CSS visibility in replay documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const failure = new BrowserReadRecording({ directory: root, runId: "failure" });
    await failure.recordResponse({ url: "https://public.example/v2/result", method: "GET", resourceType: "fetch", status: 503, contentType: "application/json", body: new TextEncoder().encode('{"error":"unavailable"}') });
    failure.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: '<style>#hidden-slot{display:none}</style><a id="hidden-slot" href="/reserve?start_date=2026-10-08&amp;num_people=2&amp;start_time=19:00">19:00</a>' });
    const result = await failure.finish();
    assert.equal(result.replay.status, "REPLAYABLE");
    if (result.replay.status !== "REPLAYABLE") throw new Error("503 public JSON must replay");
    assert.match(await readFile(result.replay.harPath, "utf8"), /"status": 503/);
    const visible = new BrowserReadRecording({ directory: root, runId: "visible" });
    visible.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: '<style>#hidden-slot{display:none}</style><a id="hidden-slot" href="/reserve?start_date=2026-10-08&amp;num_people=2&amp;start_time=19:00">19:00</a>' });
    const replay = await visible.finish(); assert.equal(replay.replay.status, "REPLAYABLE"); if (replay.replay.status !== "REPLAYABLE") throw new Error("expected safe CSS replay");
    assert.match(await readFile(replay.replay.harPath, "utf8"), /#hidden-slot\{display:none\}/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording preserves form methods while deleting unsafe destinations", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const safe = new BrowserReadRecording({ directory: root, runId: "forms" });
    safe.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: '<form id="public-search" class="search" data-widget="query" method="post" action="/reserve/public-query?date=2026-10-08&amp;party=2"><input name="search_text"></form>' });
    const recorded = await safe.finish();
    assert.equal(recorded.replay.status, "REPLAYABLE");
    if (recorded.replay.status !== "REPLAYABLE") throw new Error("expected safe form recording");
    const har = JSON.parse(await readFile(recorded.replay.harPath, "utf8")) as { log: { entries: Array<{ response: { content: { text: string } } }> } };
    const html = har.log.entries[0]!.response.content.text;
    assert.match(html, /id="public-search"/);
    assert.match(html, /class="search"/);
    assert.match(html, /data-widget="query"/);
    assert.match(html, /method="post"/);
    const unsafe = new BrowserReadRecording({ directory: root, runId: "unsafe-form" });
    unsafe.recordSnapshot({ url: "https://public.example/menu", title: "Public", text: "", html: '<form method=post action=/cancel?token=private><input name="search_text"></form>' });
    const stripped = await unsafe.finish();
    assert.equal(stripped.replay.status, "REPLAYABLE");
    const document = await readFile(join(stripped.path, "snapshot-0001.html"), "utf8");
    assert.match(document, /method="post"/);
    assert.doesNotMatch(document, /action=|token|private/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("browser recording preserves an admitted public document redirect for replay", async () => {
  const root = await mkdtemp(join(tmpdir(), "praxis-browser-recording-"));
  try {
    const recording = new BrowserReadRecording({ directory: root, runId: "run-redirect" });
    await recording.recordResponse({
      url: "https://public.example/directory", method: "GET", resourceType: "document", status: 302, contentType: "text/html",
      body: new TextEncoder().encode(""), redirectLocation: "https://public.example/directory/current",
    });
    await recording.recordResponse({
      url: "https://public.example/directory/current", method: "GET", resourceType: "document", status: 200, contentType: "text/html",
      body: new TextEncoder().encode("<main>Public directory</main>"),
    });
    recording.recordSnapshot({ url: "https://public.example/directory/current", title: "Directory", text: "", html: "<main>Public directory</main>" });
    const result = await recording.finish();
    assert.equal(result.replay.status, "REPLAYABLE");
    if (result.replay.status !== "REPLAYABLE") throw new Error("expected replayable redirect");
    const har = JSON.parse(await readFile(result.replay.harPath, "utf8"));
    const first = har.log.entries.find((entry: { request: { url: string } }) => entry.request.url === "https://public.example/directory");
    assert.equal(first.response.status, 302);
    assert.equal(first.response.redirectURL, "https://public.example/directory/current");
    assert.deepEqual(first.response.headers.find((header: { name: string }) => header.name === "location"), {
      name: "location", value: "https://public.example/directory/current",
    });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("recorder retains loaded Guard-admitted public stylesheets, including generic GET, byte-for-byte", async () => {
  const root = await mkdtemp(join(tmpdir(), "stylesheet-recording-"));
  const cssUrl = "https://cdn1.tablecheck.com/assets/table_check/reserve.css?release=20261009";
  const genericCssUrl = "https://static.public.example/styles/layout.css?rst-v1-202610091550-public";
  const css = '\uFEFF@font-face{font-family:public;src:url(./font.woff2)}\n@media(max-width:500px){.menu{overflow:auto}}\n' + '.menu{color:#333}\n'.repeat(1400);
  const recording = new BrowserReadRecording({ directory: root, runId: "css", reviewedStaticResources: [{ origin: "https://cdn1.tablecheck.com", pathnamePrefix: "/assets/table_check/", resourceTypes: ["stylesheet"], queryKeys: ["release"] }] });
  try {
    await recording.recordResponse({ url: cssUrl, method: "GET", resourceType: "stylesheet", status: 200, contentType: "text/css; charset=utf-8", body: Buffer.from(css) });
    await recording.recordResponse({ url: genericCssUrl, method: "GET", resourceType: "stylesheet", status: 200, contentType: "text/css", body: Buffer.from(css) });
    await recording.recordResponse({ url: "https://static.public.example/wrong-kind.css", method: "GET", resourceType: "fetch", status: 200, contentType: "text/css", body: Buffer.from(css) });
    await recording.recordResponse({ url: "https://static.public.example/unsafe.css", method: "GET", resourceType: "stylesheet", status: 200, contentType: "text/css", body: Buffer.from('a{content:"Bearer secretvalue"}') });
    await recording.recordResponse({ url: "https://stats.example/private.css?token=private", method: "GET", resourceType: "stylesheet", status: 200, contentType: "text/css", body: Buffer.from("private-marker") });
    recording.recordSnapshot({ url: "https://www.tablecheck.com/en/shops/fixture/reserve?start_date=2026-10-22&pax=2", title: "Fixture", text: "", html: `<link rel="stylesheet" href="${cssUrl}"><link rel="stylesheet" href="${genericCssUrl}"><link rel="stylesheet" href="https://cdn1.tablecheck.com/assets/table_check/not-loaded.css?release=20261009"><h1>Fixture</h1>`, networkRequests: [{ outcome: "ADMITTED", origin: "https://cdn1.tablecheck.com", pathname: "/assets/table_check/reserve.css", method: "GET", resourceType: "stylesheet", queryKeys: ["release"] }] });
    const result = await recording.finish();
    const manifest = JSON.parse(await readFile(join(result.path, "recording.json"), "utf8"));
    assert.equal(manifest.stylesheets.length, 2);
    assert.equal(manifest.stylesheets[0].url, cssUrl);
    assert.equal(await readFile(join(result.path, manifest.stylesheets[0].file), "utf8"), css);
    assert.equal(manifest.stylesheets[0].sha256, (await import("node:crypto")).createHash("sha256").update(css).digest("hex"));
    assert.equal(manifest.stylesheets[1].url, genericCssUrl);
    assert.equal(await readFile(join(result.path, manifest.stylesheets[1].file), "utf8"), css);
    assert.equal(result.replay.status, "REPLAYABLE");
    if(result.replay.status !== "REPLAYABLE")throw new Error("public stylesheet capture expected");
    const har = JSON.parse(await readFile(result.replay.harPath,"utf8"));
    assert.equal(har.log.entries.find((entry: {request:{url:string}}) => entry.request.url === cssUrl).response.content.text, css);
    assert.ok((await readFile(join(result.path, "snapshot-0001.html"), "utf8")).includes(cssUrl));
    assert.ok((await readFile(join(result.path, "snapshot-0001.html"), "utf8")).includes(genericCssUrl));
    assert.equal(JSON.stringify(manifest).includes("private-marker"), false);
  } finally { await rm(root,{recursive:true,force:true}); }
});

test('observed Tabelog keyword response retains public source names only at its exact recording endpoint', async () => {
  const root=await mkdtemp(join(tmpdir(),'tabelog-suggestion-record-'));
  try{
    const recording=new BrowserReadRecording({directory:root,runId:'public-suggestions'});
    const url='https://tabelog.com/en/suggest/keyword_suggest?keyword=Akabane';
    const text=JSON.stringify([{name:'Akabane Sta.（Tokyo）',datatype:'RailroadStation',id_in_datatype:134,exact_match:true,pal:'tokyo',LstPrf:'A1323',LstAre:'A132305',station_id:'134'}]);
    await recording.recordResponse({url,method:'GET',resourceType:'xhr',status:200,contentType:'application/json',body:Buffer.from(text)});
    recording.recordSnapshot({url:'https://tabelog.com/en/',title:'Public search',text:'Akabane',html:'<body>Akabane</body>',networkRequests:[{outcome:'ADMITTED',origin:'https://tabelog.com',pathname:'/en/suggest/keyword_suggest',method:'GET',resourceType:'xhr',queryKeys:['keyword']}]});
    const result=await recording.finish();assert.equal(result.replay.status,'REPLAYABLE');
    const har=JSON.parse(await readFile(join(result.path,'replay.har'),'utf8'));
    assert.equal(har.log.entries.find((x:any)=>x.request.url===url).response.content.text,text);
    const denied=new BrowserReadRecording({directory:root,runId:'private-suggestions'});
    await denied.recordResponse({url,method:'GET',resourceType:'xhr',status:200,contentType:'application/json',body:Buffer.from(JSON.stringify([{name:'Public',datatype:'RailroadStation',session_id:'private-value'}]))});
    denied.recordSnapshot({url:'https://tabelog.com/en/',title:'Public',text:'Public',html:'<body>Public</body>',networkRequests:[{outcome:'ADMITTED',origin:'https://tabelog.com',pathname:'/en/suggest/keyword_suggest',method:'GET',resourceType:'xhr',queryKeys:['keyword']}]});
    assert.equal((await denied.finish()).replay.status,'NOT_REPLAYABLE');
  }finally{await rm(root,{recursive:true,force:true});}
});

test('recording preserves a partial public SPA document route and masks only credential carriers',async()=>{
 const {tableCheckPublicReadNetworkPolicy:policy}=await import('../../../integrations/tablecheck/tablecheck-public-query.js');
 const root=await mkdtemp(join(tmpdir(),'public-spa-route-'));
 try{
  const recorder=new BrowserReadRecording({directory:root,runId:'partial',reviewedReads:policy.dynamicReads,reviewedStaticResources:policy.staticResources});
  // Controlled query projection/privacy mutation, not reconstructed old probe bytes.
  recorder.recordSnapshot({url:'https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc',title:'Public list',text:'Public list',html:'<body><h1>Public list</h1><input aria-label="Destination"><meta name="api-key" content="private-marker"><p>person@example.com</p><div data-access-token="private-marker">Results</div></body>'});
  const result=await recorder.finish();assert.equal(result.replay.status,'REPLAYABLE');
  const document=await readFile(join(result.path,'snapshot-0001.html'),'utf8');assert.match(document,/Public list/);assert.match(document,/Destination/);assert.match(document,/Results/);assert.doesNotMatch(document,/private-marker|person@example.com|data-access-token/);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('source public scripts up to12MB mask known credentials without changing length or syntax',async()=>{
 const {runInNewContext}=await import('node:vm');const root=await mkdtemp(join(tmpdir(),'source-script-limit-'));
 const url='https://cdn.public.example/assets/large.js',page='https://public.example/menu';
 const secrets=['Bearer fakeCredentialOnly','sk-'+ 'a'.repeat(24),'AIza'+'b'.repeat(35),'AKIA'+'C'.repeat(16)];
 const prefix=`globalThis.completed=41;const config={api_key:"opaque-fixture-credential"};const credentials=${JSON.stringify(secrets)};/*`,size=10_284_255,script=prefix+'x'.repeat(size-Buffer.byteLength(prefix)-2)+'*/';
 try{
  const recorder=new BrowserReadRecording({directory:root,runId:'large',reviewedStaticResources:reviewedStaticScript});
  recorder.recordSnapshot({url:page,title:'Public',text:'Public',html:`<script src="${url}"></script>`,networkRequests:[{outcome:'ADMITTED',origin:'https://cdn.public.example',pathname:'/assets/large.js',method:'GET',resourceType:'script',queryKeys:[]}]});
  await recorder.recordResponse({url,method:'GET',resourceType:'script',status:200,contentType:'application/javascript',body:Buffer.from(script)});
  const result=await recorder.finish();assert.equal(result.replay.status,'REPLAYABLE');if(result.replay.status!=='REPLAYABLE')throw Error('Expected public script replay');
  const har=JSON.parse(await readFile(result.replay.harPath,'utf8'));const captured=har.log.entries.find((e:any)=>e.request.url===url).response.content.text;
  assert.equal(Buffer.byteLength(captured),size);for(const secret of [...secrets,'opaque-fixture-credential'])assert.ok(!captured.includes(secret));
  const context:any={};runInNewContext(captured,context,{timeout:2000});assert.equal(context.completed,41);
  for(const [id,source,bytes,type]of [['too-large',url,12_000_001,'script'],['foreign','https://foreign.example/large.js',2_500_001,'script'],['stylesheet','https://cdn.public.example/assets/large.css',2_500_001,'stylesheet'],['fetch-js',url,2_500_001,'fetch']] as const){
   const other=new BrowserReadRecording({directory:root,runId:id,reviewedStaticResources:reviewedStaticScript});
   other.recordSnapshot({url:page,title:'Public',text:'',html:'<body>Public</body>',networkRequests:[{outcome:'ADMITTED',origin:new URL(source).origin,pathname:new URL(source).pathname,method:'GET',resourceType:type,queryKeys:[]}]});
   await other.recordResponse({url:source,method:'GET',resourceType:type,status:200,contentType:type==='stylesheet'?'text/css':'application/javascript',body:Buffer.from('x'.repeat(bytes))});
   assert.equal((await other.finish()).replay.status,'NOT_REPLAYABLE',id);
  }
 }finally{await rm(root,{recursive:true,force:true});}
});

test('Guard-admitted public document origin can record its own script without a CDN exception',async()=>{
 const root=await mkdtemp(join(tmpdir(),'own-source-script-'));const page='https://source.example/public',url='https://source.example/assets/main.js';
 try{
  const recorder=new BrowserReadRecording({directory:root,runId:'own'}),html=`<body><script src="${url}"></script></body>`;
  await recorder.recordResponse({url:page,method:'GET',resourceType:'document',status:200,contentType:'text/html',body:Buffer.from(html)});
  await recorder.recordResponse({url,method:'GET',resourceType:'script',status:200,contentType:'application/javascript',body:Buffer.from('/*'+'x'.repeat(3_000_000)+'*/')});
  recorder.recordSnapshot({url:page,title:'Public',text:'',html,networkRequests:[{outcome:'ADMITTED',origin:'https://source.example',pathname:'/assets/main.js',method:'GET',resourceType:'script',queryKeys:[]}]});
  const result=await recorder.finish();assert.equal(result.replay.status,'REPLAYABLE');if(result.replay.status!=='REPLAYABLE')throw Error('Expected admitted source script');
  const har=JSON.parse(await readFile(result.replay.harPath,'utf8'));assert.ok(har.log.entries.find((e:any)=>e.request.url===page).response.content.text.includes(url));
 }finally{await rm(root,{recursive:true,force:true});}
});


test('recording omission reasons and safe components preserve privacy without claiming full Replay',async()=>{
 const root=await mkdtemp(join(tmpdir(),'response-components-'));
 try{
  const recording=new BrowserReadRecording({directory:root,runId:'partial'});
  recording.recordSnapshot({url:'https://public.example/menu',title:'Public',text:'',html:'<h1>Public</h1>',networkRequests:[{outcome:'ADMITTED',origin:'https://public.example',pathname:'/v2/results',method:'GET',resourceType:'fetch',queryKeys:[]}]});
  await recording.recordResponse({url:'https://public.example/v2/results',method:'GET',resourceType:'fetch',status:200,contentType:'application/json',body:Buffer.from('{"email":"private-marker@example.com"}')});
  await recording.recordResponse({url:'https://public.example/v2/metadata',method:'GET',resourceType:'fetch',status:200,contentType:'application/json',body:Buffer.from('{"available":true}')});
  const result=await recording.finish();assert.equal(result.replay.status,'NOT_REPLAYABLE');
  const metadata=await readFile(join(result.path,'recording.json'),'utf8');assert.match(metadata,/JSON_SENSITIVE_KEY/);assert.doesNotMatch(metadata,/private-marker|@example/);
  const component=await readFile(join(result.path,'components.har'),'utf8');assert.match(component,/available/);assert.doesNotMatch(component,/private-marker|@example|v2\/results/);
 }finally{await rm(root,{recursive:true,force:true});}
});
