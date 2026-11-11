import { WORKSPACE_CLIENT_SCRIPT } from "./workspace-client.js";

export const LOCAL_WORKSPACE_PAGE = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Praxis — Your plans</title>
<style>
@font-face{font-family:Geist;src:url('/assets/geist.woff2') format('woff2');font-weight:100 900;font-display:swap}
@font-face{font-family:'Geist Mono';src:url('/assets/geist-mono.woff2') format('woff2');font-weight:100 900;font-display:swap}
:root{font-family:Geist,Arial,sans-serif;font-size:15px;color:#15172B;background:#fff;font-variant-numeric:tabular-nums}
*{box-sizing:border-box}body{margin:0}button,input,textarea{font:inherit;color:inherit}button,a{-webkit-tap-highlight-color:transparent}
button{cursor:pointer;border:0;background:transparent;padding:10px 12px;border-radius:999px}button:disabled{opacity:.45;cursor:default}
button:focus-visible,a:focus-visible,textarea:focus-visible,input:focus-visible{outline:2px solid #3D5AFE;outline-offset:4px}
a{color:inherit;text-decoration:none}a:hover{text-decoration:underline}h1,h2,h3,p{margin:0}h1,h2{font-size:24px;font-weight:600;letter-spacing:-.6px}
h3{font-size:17px;font-weight:600}.muted{color:#5F6275;font-size:13px;line-height:1.5}[hidden]{display:none!important}
.primary{background:#3D5AFE;color:#fff;border-radius:999px;min-height:52px;padding:12px 24px;font-weight:600;width:100%}
.primary small{display:block;font-size:13px;font-weight:400;margin-top:3px}.quiet{background:#F5F6F9}
svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;vertical-align:middle}
#topbar{height:76px;padding:16px 20px;display:flex;align-items:center;gap:10px;background:white;position:relative;z-index:5}
.brand{font:600 24px 'Geist Mono',monospace;letter-spacing:-1.3px;display:inline-flex;align-items:center;gap:5px;line-height:1}
.cursor{width:8px;height:16px;background:#3D5AFE;display:inline-block}.working .cursor{animation:blink 1s steps(2,start) infinite}
#new-case{margin-left:auto;font-size:13px}#menu{padding:9px}
#plans{position:fixed;inset:76px auto 0 0;width:264px;background:#fff;z-index:8;padding:28px 20px;box-shadow:8px 0 24px rgba(21,23,43,.06);display:flex;flex-direction:column}
#plans h2{font-size:17px;letter-spacing:0;margin-bottom:24px}.case-link{display:block;width:100%;text-align:left;white-space:normal;border-radius:14px;padding:14px 12px;line-height:1.45}
.case-link.active{background:#F5F6F9}.case-link span{display:block}.case-link small{font-size:13px;color:#5F6275;margin-top:5px;display:block}
#case-list{overflow:auto;flex:1;display:flex;flex-direction:column;gap:4px}#profile{padding-top:20px;font-size:13px}#profile summary{list-style:none;padding:12px 0}#profile summary::-webkit-details-marker{display:none}#profile-name{font-size:13px}#logout{font-size:13px;padding-left:0}
#backdrop{position:fixed;inset:76px 0 0;background:rgba(21,23,43,.12);z-index:7}
main{max-width:660px;margin:auto;padding:32px 24px 40px}#home{min-height:62vh;display:flex;flex-direction:column;justify-content:center;gap:32px}
#home h1{text-align:center}html{scroll-padding-bottom:var(--composer-clearance,120px)}#case-workspace{padding-bottom:var(--composer-clearance,120px)}.workspace-head{display:flex;align-items:flex-start;gap:12px;justify-content:space-between;margin-bottom:16px}
.workspace-head,#request-conditions{margin-left:16px;margin-right:16px}
#case-title{font-size:24px;max-width:420px;line-height:1.3}#saved{background:#fff;box-shadow:0 2px 8px rgba(21,23,43,.08);font-size:13px;white-space:nowrap}
#saved{display:inline-flex;align-items:center;gap:8px}#saved-count{color:#5F6275}
#request-conditions{font-size:13px;color:#5F6275;line-height:1.7;margin-bottom:24px}#progress{margin:20px 0 28px}
.stage{display:flex;align-items:center;gap:12px;min-height:32px;font-size:13px;color:#5F6275;animation:appear .18s ease-out}
.stage .mark{height:7px;width:7px;background:#15172B;flex:none}.stage.pending .mark{background:#E3E5EC}
.stage.current .mark{height:15px;width:4px;background:#3D5AFE}.stage.current{color:#15172B}#stop{margin:8px 0 0 12px;text-decoration:underline;font-size:13px}
#progress.has-card{display:flex;align-items:center;justify-content:space-between;margin:8px 0 20px}#progress.has-card .stage.done{display:none}#progress.has-card #stop{margin:0;padding-right:0}
.candidate,.panel{padding:16px;background:#fff;border-radius:24px;box-shadow:0 8px 24px rgba(21,23,43,.08)}
.photo{height:220px;background:#F5F6F9;border-radius:8px;position:relative;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;margin-bottom:22px}
.initial{font-size:24px;font-weight:600;color:#5F6275}.photo small{font-size:13px;color:#5F6275}
#bookmark{position:absolute;top:12px;right:12px;width:42px;height:42px;background:#fff;padding:9px;box-shadow:0 2px 8px rgba(21,23,43,.08)}
#bookmark[aria-pressed=true] svg{fill:#15172B}#restaurant-name{margin:0 0 12px}#key-facts{margin:0 0 18px;color:#5F6275;font-size:13px;display:flex;flex-wrap:wrap;gap:16px}
#availability{margin:0 0 4px;font-size:15px}#evidence{margin:0 0 18px;font-size:13px;color:#5F6275}

#recommendation{margin:0 0 22px;line-height:1.55}#card-actions{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
#card-actions button,#card-counter{font-size:13px}#card-counter{color:#5F6275}#details-button{padding-left:4px}#choose{margin-bottom:2px}
.view-back{padding:8px 0;margin-bottom:18px;font-size:13px}#details h2,#handoff h2{margin:0 0 20px}
#details-content,#handoff-terms{display:flex;flex-direction:column;gap:18px;font-size:15px;line-height:1.55}
.fact{display:flex;flex-direction:column;gap:6px}.fact a,.fact blockquote{font-size:13px;color:#5F6275}.fact blockquote{margin:0;white-space:pre-wrap}
.fact details{font-size:13px}summary{cursor:pointer;list-style:none}summary::-webkit-details-marker{display:none}.fact summary{text-decoration:underline}#refresh{font-size:13px;margin-top:16px;text-decoration:underline;padding-left:0}
.saved-row{width:100%;display:flex;text-align:left;align-items:center;justify-content:space-between;gap:12px;padding:18px 4px;border-radius:12px}
#saved-empty{padding:32px 0;color:#5F6275;font-size:13px}#handoff-slot-label{display:flex;align-items:center;gap:12px;margin:0 0 24px;font-size:13px;color:#5F6275}#handoff-slot{font:inherit;color:#15172B;border:0;border-radius:14px;padding:10px 12px;background:#fff;box-shadow:0 3px 14px #15172B0b;max-width:100%}
#handoff-provider{font-size:13px;color:#15172B;display:flex;gap:12px;margin-bottom:12px}#handoff-recommended{color:#3D5AFE;font-weight:600}
#handoff-terms{margin:20px 0 28px}#departure{display:block;text-align:center}.hint{font-size:13px;color:#5F6275;line-height:1.55;margin-top:7px}
#direct-source{display:block;text-align:center;font-size:13px;margin:20px 0 4px;text-decoration:underline}#handoff-unavailable{line-height:1.6;font-size:13px;color:#5F6275}
#messages{margin-top:24px;line-height:1.6;font-size:15px;white-space:pre-wrap}
#request-conditions{display:flex;flex-wrap:wrap;gap:8px}#request-conditions button{font-size:13px;min-height:40px;padding:9px 12px;background:#fff;box-shadow:0 2px 8px rgba(21,23,43,.08)}
.condition-editor{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:4px 8px;background:#fff;border-radius:999px;box-shadow:0 2px 8px #15172b14}.condition-editor input{border:0;background:transparent;font-size:13px;min-width:0;width:120px;flex:1;padding:8px 4px}.condition-editor button{box-shadow:none!important;padding:8px!important;min-height:40px}.condition-editor .muted{white-space:nowrap}
#reconnecting{position:sticky;top:0;z-index:7;background:#F5F6F9;padding:7px 20px;font-size:13px}
#answer-backdrop{position:fixed;inset:0;z-index:9;background:transparent}
#answer-sheet{position:fixed;left:20px;right:20px;bottom:0;z-index:10;max-width:612px;margin:auto;max-height:65vh;overflow:auto;background:#fff;border-radius:24px 24px 0 0;box-shadow:0 -8px 24px rgba(21,23,43,.08);padding:0 20px 24px;overscroll-behavior:contain}
#answer-dismiss{display:block;width:100%;height:28px;padding:0;touch-action:none}#answer-dismiss::after{content:'';display:block;width:32px;height:3px;border-radius:999px;background:#5F6275;margin:auto}
#answer-place{font-size:17px;margin:0 0 14px}#question-result,#asked-result{line-height:1.6;font-size:15px}#question-result details,#asked-result details{font-size:13px;margin-top:12px}#question-result summary,#asked-result summary{text-decoration:underline}#question-result blockquote,#asked-result blockquote{margin:12px 0;white-space:pre-wrap;font-size:13px}
.asked-item{margin-top:20px}.asked-item>p{margin-bottom:8px}.asked-answer{font-size:15px;line-height:1.6}.asked-answer details,.asked-answer blockquote{font-size:13px}.asked-answer blockquote{white-space:pre-wrap;margin:12px 0}.asked-answer summary{text-decoration:underline}
#asked-history{margin-top:24px;line-height:1.6}#asked-history h3{margin-bottom:12px}#asked-question{margin-bottom:8px}#batch-end h2{margin-bottom:24px}#end-options{display:flex;align-items:center;gap:16px;margin-bottom:20px}#end-saved-count{color:#5F6275;margin-left:8px}
@media(min-width:960px){#answer-sheet{left:288px}}
#feedback{margin-top:24px;padding:20px 0}#feedback p{font-weight:600;margin-bottom:8px}#feedback .answers{display:flex;gap:8px;align-items:center}
#feedback button{background:#F5F6F9;font-size:13px}#feedback-dismiss{margin-left:auto}#error{font-size:13px;line-height:1.6;margin:18px 0;color:#5F6275}
#composer{display:flex;gap:10px;align-items:flex-end;border-radius:28px;padding:11px 12px 11px 20px;box-shadow:0 6px 20px rgba(21,23,43,.08);background:#fff;width:100%}
#message{resize:none;border:0;outline:0;background:none;min-height:38px;max-height:140px;width:100%;padding:9px 0;line-height:1.45}
#home #message{height:64px}
#message::placeholder{color:#5F6275}#send{height:42px;width:42px;background:#15172B;color:#fff;flex:none;padding:10px}
#workspace-composer{position:fixed;bottom:22px;left:24px;right:24px;z-index:6;max-width:612px;margin:auto}
#use-location{font-size:13px;text-decoration:underline;margin:12px 0}#mode-note{font-size:13px;color:#5F6275;margin:12px 0;line-height:1.45}
#login{max-width:380px;margin:15vh auto;padding:24px}#login h1{margin-bottom:24px}#login p{font-size:13px;color:#5F6275;line-height:1.6;margin-bottom:20px}
#access-token{width:100%;border:0;border-radius:999px;padding:16px 20px;box-shadow:0 6px 20px rgba(21,23,43,.08);margin:10px 0 20px}
#revision-changes{font-size:13px;margin:-10px 0 24px}#revision-changes summary{display:flex;gap:20px}#removed-list{list-style:none;padding:0;margin:16px 0 0;display:flex;flex-direction:column;gap:14px}#removed-list p{margin-top:3px}
.saved-row:disabled{opacity:1;cursor:default}.saved-row p{margin-top:5px}#empty-message{font-size:15px;line-height:1.6}.empty-actions{display:flex;align-items:center;gap:16px;margin-top:20px}#understanding-error{font-size:13px;color:#5F6275;margin:20px 0;line-height:1.6}#partial-source-note{margin-top:20px}
@keyframes blink{to{opacity:0}}@keyframes appear{from{opacity:0}to{opacity:1}}
@media(min-width:960px){body{padding-left:264px}#topbar{margin-left:-264px}#plans{display:flex!important}#backdrop{display:none!important}#menu{visibility:hidden}#workspace-composer{left:288px}}
@media(max-width:959px){#plans:not(.open){display:none}#topbar{height:68px;padding:12px 16px}#plans{top:68px}#backdrop{top:68px}main{padding:26px 20px 32px}#workspace-composer{left:20px;right:20px;bottom:18px}.workspace-head{margin-bottom:14px}.photo{height:185px}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;scroll-behavior:auto!important}}
</style></head>
<body>
<section id="login" hidden><h1>Welcome to Praxis</h1><p>Sign in to continue your plans.</p>
<form id="login-form"><label for="access-token">Access token</label><input id="access-token" autocomplete="off" required/><button class="primary">Sign in</button></form>
<p id="login-error" role="alert" hidden></p><p>Local Fixture access: praxis-fixture-a. No real reservations.</p></section>
<div id="app" hidden>
<header id="topbar"><button id="menu" aria-label="My plans" aria-expanded="false" aria-controls="plans"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button><a href="#" id="brand" class="brand" aria-label="Praxis home">Praxis<span class="cursor"></span></a><button id="new-case">New plan <span aria-hidden="true">+</span></button></header>
<div id="backdrop" hidden></div><aside id="plans" aria-label="My plans"><h2>My plans</h2><nav id="case-list"></nav><details id="profile"><summary>Profile</summary><p id="profile-name"></p><button id="logout">Sign out</button></details></aside>
<div id="reconnecting" role="status" hidden>Reconnecting…</div>
<main><section id="home"><h1>What do you want to plan?</h1><div id="home-composer"></div></section>
<section id="case-workspace" hidden><div class="workspace-head"><h1 id="case-title"></h1><button id="saved" aria-label="Saved"><span>Saved</span><span id="saved-count" hidden></span></button></div><div id="request-conditions" aria-label="Plan conditions"></div>
<p id="understanding-error" role="status" hidden>Couldn't read that. Try rephrasing?</p>
<details id="revision-changes" hidden><summary><span id="removed-count"></span><span id="added-count"></span></summary><ul id="removed-list"></ul></details>
<section id="progress" aria-label="Search progress" hidden><div id="stages"></div><button id="stop">Stop</button></section>
<section id="feedback" hidden><p>Did you get the booking?</p><div class="answers"><button data-answer="YES">Yes</button><button data-answer="NO">Not yet</button><button id="feedback-dismiss" aria-label="Skip booking feedback" data-answer="SKIP">×</button></div></section>
<section id="candidate-panel" hidden><article class="candidate" id="candidate-card"><div class="photo"><span class="initial" id="restaurant-initial"></span><small>No photo</small><button id="bookmark" aria-label="Save for later" aria-pressed="false"><svg viewBox="0 0 24 24"><path d="M6 4h12v17l-6-4-6 4z"/></svg></button></div><h2 id="restaurant-name"></h2><div id="key-facts"></div><p id="availability"></p><div id="delivery-slots" class="muted"></div><div id="delivery-conditions"></div><p id="evidence" hidden></p><p id="recommendation"></p><div id="source-categories" hidden aria-label="Source cuisine classifications"></div><div id="card-actions"><button id="details-button">Details</button><div><button id="previous" aria-label="Previous restaurant">←</button><span id="card-counter"></span><button id="next" aria-label="Next restaurant">→</button></div></div><button id="choose" class="primary">Choose this</button></article></section>
<section id="details" class="panel" hidden><button id="details-back" class="view-back">← Back</button><h2 id="details-name"></h2><div id="details-content"></div><button id="refresh">Refresh availability</button><section id="asked-history" hidden><h3>You asked</h3><p id="asked-question"></p><div id="asked-result"></div><div id="asked-earlier"></div></section></section>
<section id="saved-panel" class="panel" hidden><button id="saved-back" class="view-back">← Back</button><h2>Saved</h2><div id="saved-list"></div><p id="saved-empty">No places saved yet.</p></section>
<section id="handoff" class="panel" hidden><button id="handoff-back" class="view-back">← Back</button><p id="handoff-provider"><span id="handoff-recommended">Recommended</span><span id="handoff-provider-name"></span></p><h2 id="handoff-name"></h2><label id="handoff-slot-label" hidden>Time <select id="handoff-slot" aria-label="Booking time"></select></label><div id="handoff-terms"></div><p id="handoff-unavailable" hidden>No current booking handoff is available. You can check the source website or refresh availability.</p><a id="departure" class="primary" href="#" target="_blank" rel="noopener"><span id="departure-title"></span><small id="departure-fields"></small></a><p class="hint" id="selection-hint" hidden></p><p class="hint" id="verification-hint" hidden></p><a id="direct-source" href="#" target="_blank" rel="noopener noreferrer">Go to source website ↗</a></section>
<section id="batch-end" class="panel" hidden><button id="batch-back" class="view-back">← Back</button><h2>Any of these work?</h2><div id="end-options"><button id="end-saved"><span>Saved</span><span id="end-saved-count"></span></button><button id="end-adjust">Adjust</button></div><button id="find-more" class="primary">Find more</button></section>
<section id="empty-state" class="panel" hidden><p id="empty-message"></p><div class="empty-actions"><button id="empty-adjust">Adjust</button><button id="empty-more" class="primary">Find more</button><button id="empty-retry" class="primary">Try again</button></div></section><p id="partial-source-note" class="muted" hidden>Some sources couldn't be checked.</p>
<div id="messages" aria-live="polite"></div>
<button id="use-location" hidden>Use my location</button><p id="mode-note" hidden></p></section>
<p id="error" role="alert" hidden></p>
<div id="workspace-composer" hidden></div>
<form id="composer"><textarea id="message" aria-label="Plan message" placeholder="A quiet dinner with friends in Shibuya on Saturday" rows="1" required></textarea><button id="send" aria-label="Send"><svg viewBox="0 0 24 24"><path d="m6 11 6-6 6 6M12 5v15"/></svg></button></form>
</main><div id="answer-backdrop" hidden></div><section id="answer-sheet" role="dialog" aria-modal="true" aria-labelledby="answer-place" tabindex="-1" hidden><button id="answer-dismiss" aria-label="Close answer"></button><h2 id="answer-place"></h2><div id="question-result"></div></section></div>
<script>${WORKSPACE_CLIENT_SCRIPT}</script>
</body></html>`;
