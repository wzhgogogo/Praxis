
// Inline geometry from https://lucide.dev/icons/panel-left; no runtime icon dependency.
const SIDEBAR_ICON = '<svg class="sidebar-open-icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="4"/><path d="M9 3v18"/></svg>';

export const LOCAL_WORKSPACE_PAGE = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Praxis — Your plans</title>
<style>
@font-face{font-family:'DM Sans';src:url('/assets/dm-sans.woff2') format('woff2');font-weight:100 1000;font-display:swap}
:root{--ink:#15172B;--ink-3:#5F6275;--line:#E3E5EC;--fill:#F5F6F9;--brand:#3D5AFE;--surface:#fff;--radius-card:24px;--radius-media:12px;--touch:44px;--ui-font:'DM Sans','PingFang SC','Hiragino Sans GB','Hiragino Sans','Microsoft YaHei UI','Noto Sans CJK SC',sans-serif;font-family:var(--ui-font);font-size:15px;line-height:1.5;color:#15172B;background:#fff;font-variant-numeric:tabular-nums}
*,*::before,*::after{box-sizing:border-box}body{margin:0;line-height:1.5;font-family:var(--ui-font);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}button,input,textarea,select{font:inherit;font-family:var(--ui-font);color:inherit;line-height:1.4}button,a{-webkit-tap-highlight-color:transparent}
button{cursor:pointer;border:0;background:transparent;padding:10px 12px;border-radius:999px}button:disabled{opacity:.45;cursor:default}
button:focus-visible,a:focus-visible,select:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
input[type=text]:focus-visible,input[type=search]:focus-visible,input:not([type]):focus-visible,.condition-editor input:focus-visible{outline:none}
a{color:inherit;text-decoration:none}h1,h2,h3,p{margin:0}h1,h2{font-size:24px;font-weight:600;letter-spacing:-0.025em}
h3{font-size:17px;font-weight:600;line-height:1.3}.muted{color:#5F6275;font-size:13px;line-height:1.55}[hidden]{display:none!important}
.primary{background:#3D5AFE;color:#fff;border-radius:999px;min-height:52px;padding:12px 24px;font-weight:600;line-height:1.4;text-decoration:none;width:100%}
.primary small{display:block;font-size:13px;font-weight:400;margin-top:3px}.quiet{background:#F5F6F9}
svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;vertical-align:middle}
#topbar.scrolled{box-shadow:none}
#topbar{height:72px;padding:14px 20px;display:flex;align-items:center;gap:10px;background:transparent;position:sticky;top:0;z-index:8;border:0}
.brand{font:700 24px var(--ui-font);letter-spacing:-0.03em;display:inline-flex;align-items:baseline;gap:5px;line-height:1}

.cursor{width:8px;height:1cap;background:#3D5AFE;display:inline-block;flex:none}.working .cursor{animation:blink 1s steps(2,start) infinite}.brand.orb-synced .cursor{animation:none;opacity:var(--orb-opacity,1)}
#new-case{margin-left:auto;font-size:13px;font-weight:500;background:transparent;padding:8px 14px}#menu{display:inline-flex;align-items:center;justify-content:center;position:relative;width:32px;height:32px;padding:6px;color:var(--ink-3)}#menu svg{width:20px;height:20px}
#plans{position:fixed;inset:72px auto 0 0;width:264px;background:#fff;z-index:8;padding:24px 20px;border-right:.5px solid #E3E5EC;display:flex;flex-direction:column}
#plans-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-left:12px;margin-bottom:6px}#plans-heading h2{font-size:12px;font-weight:500;color:var(--ink-3);letter-spacing:0}#collapse-plans{display:inline-flex;align-items:center;justify-content:center;position:relative;width:32px;height:32px;padding:6px;color:var(--ink-3)}#collapse-plans svg{width:20px;height:20px}#plans-brand{display:flex;align-items:center;justify-content:space-between;min-height:40px;flex:none;padding-left:12px;margin:-6px 0 28px}.case-link{display:block;width:100%;text-align:left;white-space:normal;border-radius:14px;padding:12px;line-height:1.4}
.case-link.active{background:#F5F6F9}.case-link span{display:block;font-weight:600}.case-link small{font-size:13px;color:#5F6275;margin-top:4px;display:block}
#case-list{overflow:auto;flex:1;display:flex;flex-direction:column;gap:4px}#profile{padding-top:16px;border-top:.5px solid #E3E5EC;font-size:13px}#profile summary{list-style:none;margin-left:12px;padding:10px 0;font-weight:600}#profile summary::-webkit-details-marker{display:none}#logout{font-size:13px;margin:0 0 2px 50px;padding:6px 0;text-decoration:underline}
#backdrop{position:fixed;inset:72px 0 0;background:rgba(21,23,43,.16);z-index:7}
main{max-width:660px;margin:auto;padding:28px 24px 40px}#home{min-height:62vh;display:flex;flex-direction:column;justify-content:center;gap:32px}
#home h1{text-align:center;font-size:28px;letter-spacing:-0.02em}
html{scroll-padding-bottom:var(--composer-clearance,120px)}body:has(#case-workspace:not([hidden])){height:100dvh;overflow:hidden}
#case-workspace{height:calc(100dvh - 72px - 68px);overflow-y:auto;overflow-x:hidden;padding-inline:24px;margin-inline:-24px;padding-bottom:var(--composer-clearance,120px);scroll-padding-bottom:var(--composer-clearance,120px)}
#topbar-sentinel{height:1px;margin-bottom:-1px;pointer-events:none}.workspace-head{display:flex;align-items:baseline;gap:12px;justify-content:space-between;margin-bottom:14px}
.workspace-head,.workspace-conditions,#revision-changes,#progress,#feedback,#understanding-error,#partial-source-note,#messages,#use-location,#mode-note{margin-left:0;margin-right:0}
#case-title{font-size:24px;line-height:1.3}#saved{background:transparent;font-size:13px;font-weight:500;color:#15172B;min-height:32px;line-height:1.4;padding:6px 0 6px 8px;white-space:nowrap}
#saved{display:inline-flex;align-items:center;gap:5px;margin-left:auto}#saved-count{color:#5F6275}
.workspace-conditions{display:flex;min-height:32px;align-items:center;gap:8px;margin-bottom:20px}#request-conditions{flex:1;min-width:0;font-size:13px;color:#15172B;line-height:1.4}#progress{margin:16px 0 22px}#progress:not(.has-card){margin:clamp(48px,11vh,104px) 0 28px}
.stage{display:flex;align-items:center;gap:12px;min-height:34px;font-size:13px;color:#5F6275;animation:appear .18s ease-out}
.stage .mark{height:7px;width:7px;border-radius:50%;background:#15172B;flex:none}.stage.pending .mark{background:#E3E5EC}
.stage.current .mark{height:15px;width:4px;border-radius:0;background:#3D5AFE}.stage.done{font-size:13px;font-weight:400;color:var(--ink-3)}.stage.done .mark{background:var(--ink-3)}.stage.current{font-size:15px;color:var(--ink);font-weight:600}.stage.current .mark{animation:stage-pulse 1.1s ease-in-out infinite alternate}.stage-count{font-size:13px;font-weight:500;color:var(--ink-3);margin-left:6px;font-variant-numeric:tabular-nums}#stop{margin:6px 0 0;padding:6px 0;text-decoration:underline;font-size:13px}
#progress.has-card{display:flex;align-items:center;flex-wrap:wrap;gap:4px 16px;margin:4px 0 18px}#progress.has-card .stage.current{font-size:13px}#progress.has-card .stage-count{margin-left:0}#progress.has-card #stop{margin:0;padding:6px 0}
.candidate,.panel{padding:16px;background:var(--surface);border:1px solid rgba(21,23,43,.06);border-radius:var(--radius-card);box-shadow:0 8px 24px rgba(21,23,43,.08)}
.photo{height:148px;background:#F5F6F9;border-radius:14px;position:relative;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;margin-bottom:18px}
.initial{width:44px;height:44px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(21,23,43,.06);display:inline-flex;align-items:center;justify-content:center;font-size:17px;font-weight:600;color:#15172B}.photo small{font-size:13px;color:#5F6275}
#bookmark{position:absolute;top:12px;right:12px;width:40px;height:40px;background:#fff;padding:9px;box-shadow:0 2px 8px rgba(21,23,43,.08)}
#bookmark[aria-pressed=true] svg{fill:#15172B}#restaurant-name{margin:0 0 6px}#key-facts{margin:0 0 16px;color:#5F6275;font-size:13px;display:flex;flex-wrap:wrap;gap:6px 14px}
#availability{border-top:.5px solid #E3E5EC;padding-top:14px;margin:0 0 4px;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px}#availability[data-status=unknown]{color:#5F6275}
#delivery-slots{display:flex;flex-direction:column;gap:10px;margin:10px 0 4px}#evidence{margin:0 0 14px;font-size:13px;color:#5F6275}

#recommendation{margin:0 0 16px;line-height:1.55}#recommendation:not(:empty){border-top:.5px solid #E3E5EC;padding-top:14px;margin-top:14px}#source-categories{margin:0 0 16px;display:flex;flex-direction:column;gap:6px}#card-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0 0}
#card-actions button,#card-counter{font-size:13px}#details-button{background:transparent;padding:8px 0;font-weight:500}#card-pagination{display:inline-flex;align-items:center;gap:4px}#previous,#next{width:32px;height:32px;padding:0;background:transparent;display:inline-flex;align-items:center;justify-content:center;font-weight:600}#card-counter{color:#5F6275;min-width:44px;text-align:center}#choose{margin-bottom:2px}
.view-back{padding:6px 0;margin-bottom:14px;font-size:13px;color:#5F6275;font-weight:500}#details h2,#handoff h2,#saved-panel h2,#batch-end h2{margin:0 0 18px;font-size:20px;font-weight:600}
#details-content,#handoff-terms{display:flex;flex-direction:column;gap:16px;font-size:15px;line-height:1.55}#handoff-terms:empty{display:none;margin:0}
.fact{display:flex;flex-direction:column;gap:6px}.fact a,.fact blockquote{font-size:13px;color:#5F6275}.fact blockquote{margin:0;white-space:pre-wrap}
#source-categories a,.fact a,#question-result a,#asked-result a,.asked-answer a{text-decoration:underline;text-underline-offset:3px}
.fact details,#question-result details,#asked-result details,.asked-answer details{font-size:13px;color:var(--ink-3)}.fact details[open],#question-result details[open],#asked-result details[open],.asked-answer details[open]{background:#F5F6F9;border-radius:12px;padding:8px 12px}summary{cursor:pointer;list-style:none}summary::-webkit-details-marker{display:none}.fact summary{text-decoration:underline;color:#5F6275}#refresh{font-size:13px;margin-top:16px;text-decoration:underline;padding:6px 0}
.saved-row{width:100%;display:flex;text-align:left;align-items:center;justify-content:space-between;gap:12px;padding:14px 12px;border-radius:14px;background:#F5F6F9;margin-bottom:8px}
#saved-empty{padding:24px 0;color:#5F6275;font-size:13px}#handoff-slot-label{display:inline-flex;align-items:center;gap:10px;margin:0 0 20px;font-size:13px;color:#5F6275}#handoff-slot{appearance:none;-webkit-appearance:none;font:inherit;font-size:13px;font-weight:600;line-height:1.4;color:#15172B;border:0;border-radius:999px;padding:8px 34px 8px 16px;background:#F5F6F9;max-width:100%;cursor:pointer}
#handoff-slot:disabled{opacity:1;padding-right:16px;cursor:default}
.handoff-slot-control{position:relative;display:inline-flex;min-width:0;max-width:100%}.handoff-chevron{position:absolute;right:14px;top:calc(50% - 6px);width:12px;height:12px;color:var(--ink-3);pointer-events:none}.handoff-slot-control:has(select:disabled) .handoff-chevron{display:none}
.handoff-time-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:20px}#handoff-slot-label{margin-bottom:0;min-width:0;max-width:100%}#handoff-price{font-size:13px;color:var(--ink-3)}
#handoff-provider{font-size:13px;color:#15172B;display:flex;gap:10px;margin-bottom:8px}#handoff-recommended{color:#3D5AFE;font-weight:600}
#handoff-terms{margin:16px 0 24px}#departure{display:block;text-align:center;min-height:52px}#departure-fields{display:block;font-size:13px;color:var(--ink-3);margin-top:8px;text-align:center;line-height:1.55}.hint{font-size:13px;color:#5F6275;line-height:1.55;margin-top:8px}
#direct-source{display:block;text-align:center;font-size:13px;margin:18px 0 4px;text-decoration:underline}#handoff-unavailable{line-height:1.55;font-size:13px;color:#5F6275;margin-bottom:18px}
#messages{margin-top:20px;line-height:1.55;font-size:15px;white-space:pre-wrap}
#request-conditions{display:flex;flex-wrap:wrap;gap:8px}#request-conditions>button{font-size:13px;font-weight:500;min-height:32px;line-height:1.4;padding:6px 14px;background:#F5F6F9;color:#15172B}
.condition-edit-anchor{display:inline-flex;position:relative;flex:none;z-index:4;vertical-align:top}
.condition-editor{position:absolute;top:0;display:inline-flex;align-items:center;gap:4px;height:100%;width:max-content;max-width:100%;padding:0 5px 0 12px;background:#fff;border-radius:999px;box-shadow:0 0 0 1px var(--line),0 6px 20px rgba(21,23,43,.08)}
.condition-editor:focus-within{box-shadow:0 0 0 1px var(--ink-3),0 8px 24px rgba(21,23,43,.12)}
.condition-editor input{border:0;background:transparent;font-size:13px;font-weight:500;min-width:4ch;width:8ch;height:100%;padding:0 2px}
.condition-editor button{box-shadow:none!important;padding:0!important;width:26px;height:26px;min-height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex:none}
.condition-editor button svg{width:14px;height:14px;stroke-width:2}
.condition-editor .editor-save{background:#15172B;color:#fff}.condition-editor :is(.editor-cancel,.editor-remove){background:#F5F6F9;color:#5F6275}
.condition-editor .editor-save[aria-busy=true]::after{width:12px;height:12px;left:calc(50% - 6px);top:calc(50% - 6px);border-color:#fff;border-right-color:transparent}

#reconnecting{position:sticky;top:0;z-index:7;background:#F5F6F9;padding:7px 20px;font-size:13px}
#answer-backdrop{position:fixed;inset:0;z-index:9;background:rgba(21,23,43,.12)}
#answer-sheet{position:fixed;left:20px;right:20px;bottom:0;z-index:10;max-width:612px;margin:auto;max-height:65vh;overflow:auto;background:#fff;border-radius:24px 24px 0 0;box-shadow:0 -12px 32px rgba(21,23,43,.14);border-top:.5px solid #E3E5EC;padding:0 20px 24px;overscroll-behavior:contain}
#answer-dismiss{display:block;width:100%;height:28px;padding:0;touch-action:none}#answer-dismiss::after{content:'';display:block;width:32px;height:3px;border-radius:999px;background:#5F6275;margin:auto}
#answer-place{font-size:20px;font-weight:600;margin:0 0 14px}#question-result,#asked-result{line-height:1.55;font-size:15px}#question-result details,#asked-result details{font-size:13px;margin-top:10px}#question-result summary,#asked-result summary{text-decoration:underline;color:#5F6275}#question-result blockquote,#asked-result blockquote{margin:8px 0;white-space:pre-wrap;font-size:13px}
.asked-item{background:#F5F6F9;border-radius:14px;margin-top:10px;padding:12px 14px}.asked-item>p:first-child{margin-bottom:6px;font-weight:600}.asked-answer{font-size:15px;line-height:1.55}.asked-answer details,.asked-answer blockquote{font-size:13px}.asked-answer blockquote{white-space:pre-wrap;margin:8px 0}.asked-answer summary{text-decoration:underline;color:#5F6275}
#asked-history{margin-top:22px;padding-top:18px;border-top:.5px solid #E3E5EC;line-height:1.55}#asked-history h3{margin-bottom:10px}#end-options{display:flex;align-items:center;gap:10px;margin-bottom:18px}#end-saved,#end-adjust,#empty-adjust{background:#F5F6F9;padding:8px 14px;font-size:13px;font-weight:500}#end-saved-count{color:#5F6275;margin-left:6px}
@media(min-width:960px){#answer-sheet{left:248px;right:24px}body.sidebar-collapsed #answer-sheet{left:24px}}
#feedback{margin-top:16px;margin-bottom:18px;padding:14px 16px;background:var(--fill);border:1px solid rgba(21,23,43,.06);border-radius:var(--radius-card)}#feedback p{font-weight:600;margin-bottom:10px;font-size:15px}#feedback .answers{display:flex;gap:8px;align-items:center}
#feedback button{background:#fff;font-size:13px;font-weight:600;padding:7px 14px}#feedback-dismiss{margin-left:auto;width:44px;height:44px;padding:7px;flex:none}#error{font-size:13px;line-height:1.55;margin:16px;color:#5F6275}
#composer{display:flex;gap:10px;align-items:flex-end;border-radius:28px;padding:10px 12px 10px 16px;box-shadow:0 6px 20px rgba(21,23,43,.08);background:#fff;width:100%}
#composer:focus-within{box-shadow:0 8px 24px rgba(21,23,43,.12)}
#message:focus-visible{outline:none}
#message{resize:none;border:0;background:none;min-height:40px;max-height:140px;width:100%;padding:9px 0;line-height:22px}
#home #message{height:64px}#home #composer{align-items:center}
#send{height:40px;width:40px;background:#15172B;color:#fff;flex:none;padding:9px}
#workspace-composer{position:fixed;bottom:20px;left:24px;right:24px;z-index:6;max-width:612px;margin:auto}
#use-location{font-size:13px;text-decoration:underline;margin-top:12px;margin-bottom:12px;padding:6px 0}#mode-note{font-size:13px;color:#5F6275;margin-top:12px;margin-bottom:12px;line-height:1.55}
#login{width:calc(100% - 40px);max-width:380px;margin:15vh auto;padding:24px;background:var(--surface);border:1px solid rgba(21,23,43,.06);border-radius:var(--radius-card)}#login h1{margin-bottom:24px;font-size:24px;font-weight:600}#login p{font-size:13px;color:var(--ink-3);line-height:1.55;margin-bottom:20px}
#access-token{width:100%;border:0;border-radius:999px;padding:16px 20px;box-shadow:0 6px 20px rgba(21,23,43,.08);margin:10px 0 20px}
#access-token:focus-visible{box-shadow:0 0 0 1px var(--ink-3),0 8px 24px rgba(21,23,43,.12)}
#revision-changes{font-size:13px;margin-top:0;margin-bottom:16px}#revision-changes summary{display:inline-flex;gap:16px;color:#5F6275;font-weight:600}#removed-list{list-style:none;padding:12px 14px;margin:10px 0 0;background:#F5F6F9;border-radius:14px;display:flex;flex-direction:column;gap:10px}#removed-list p{margin-top:2px}
.saved-row:disabled{opacity:1;cursor:default}.saved-row p{margin-top:4px}#empty-message{font-size:15px;line-height:1.55}.empty-actions{display:flex;align-items:stretch;gap:12px;margin-top:18px}.empty-actions:not(:has(button:not([hidden]))){display:none}.empty-actions>button{flex:1;min-height:48px;margin:0}.empty-actions #empty-adjust{min-height:48px}#understanding-error{font-size:13px;color:#5F6275;margin-top:16px;margin-bottom:16px;line-height:1.55}#partial-source-note{margin-top:16px}
#clarification-reply{width:fit-content;max-width:min(85%,36rem);margin:12px 0 8px auto;padding:8px 12px;border-radius:14px;background:#F5F6F9;color:#15172B;font-size:13px;white-space:pre-wrap;overflow-wrap:anywhere}
/* Local interaction feedback: dimensions stay fixed through pending states. */
button,.primary{touch-action:manipulation;position:relative;transition:transform 80ms ease-out,background-color 120ms ease-out}
button:not(:disabled):not([aria-busy=true]):active,.primary:not([aria-busy=true]):active{transform:translateY(1px)}
button[aria-busy=true]{cursor:progress;color:transparent;opacity:1}button[aria-busy=true] svg{visibility:hidden}
button[aria-busy=true]::after{content:'';position:absolute;width:14px;height:14px;left:calc(50% - 7px);top:calc(50% - 7px);border:2px solid #5F6275;border-right-color:transparent;border-radius:50%;animation:control-spin .8s linear infinite}
#send[aria-busy=true]::after,.primary[aria-busy=true]::after{border-color:#fff;border-right-color:transparent}
@media(hover:hover) and (pointer:fine){.primary:not(:disabled):not([aria-busy=true]):hover{background:#3450ed}.condition-editor .editor-save:not(:disabled):not([aria-busy=true]):hover{background:#2A2D44}#request-conditions>button:hover,#previous:not(:disabled):hover,#next:not(:disabled):hover,.condition-editor :is(.editor-cancel,.editor-remove):not(:disabled):hover{background:#E9ECF2}}
.primary,#send,#saved,#new-case,.condition-editor button,#card-actions button{white-space:nowrap}
#saved{min-width:0;width:auto;justify-content:center;flex:none}.case-link span,.workspace-head>h1{min-width:0;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis}
p{line-height:1.55}summary,.stage,#card-counter{line-height:1.4}#key-facts,#evidence,#source-categories{line-height:1.55}
h1,h2{text-wrap:balance;overflow-wrap:break-word;line-height:1.3}
#request-conditions>button{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#recommendation,#messages,.hint,.fact,#source-categories,#question-result,#asked-result{text-wrap:pretty;overflow-wrap:break-word}
.case-link span,.saved-row>div{min-width:0;overflow-wrap:break-word}.saved-row>div{flex:1}.fact a{overflow-wrap:anywhere}
@keyframes control-spin{to{transform:rotate(360deg)}}
@keyframes stage-pulse{to{opacity:.25}}@keyframes blink{to{opacity:0}}@keyframes appear{from{opacity:0}to{opacity:1}}
@media(min-width:960px){
body:has(#app:not([hidden])){padding-left:224px;transition:padding-left .2s ease}
#topbar{display:flex;position:fixed;top:16px;left:16px;right:24px;height:44px;padding:0;background:transparent;border:0;box-shadow:none;pointer-events:none}
#topbar>button,#topbar>a{pointer-events:auto}
#plans{display:flex!important;top:0;bottom:0;width:224px;padding:24px 16px;transition:transform .2s ease,visibility .2s ease}
#backdrop{display:none!important}#menu{display:none}
#workspace-composer{left:248px;transition:left .2s ease}
body:has(#case-workspace:not([hidden])) main{padding-top:76px}
#case-workspace{height:calc(100dvh - 116px)}
#home{min-height:calc(100dvh - 68px)}
body.sidebar-collapsed:has(#app:not([hidden])){padding-left:0}
body.sidebar-collapsed #plans{transform:translateX(-100%);visibility:hidden}
body.sidebar-collapsed #menu{display:flex}
body.sidebar-collapsed #workspace-composer{left:24px}
}
@media(pointer:coarse){#menu{position:relative}#collapse-plans::before,#menu::before{content:'';position:absolute;inset:-6px}}
@media(max-width:959px){#plans:not(.open){display:none}#topbar{height:64px;padding:12px 20px}#new-case{padding-right:0}#plans{top:0;bottom:0;padding:18px 16px 24px;z-index:12;box-shadow:8px 0 24px rgba(21,23,43,.08)}#backdrop{inset:0;z-index:11}#case-workspace{height:calc(100dvh - 64px - 54px);padding-inline:20px;margin-inline:-20px}main{max-width:none;padding:22px 20px 32px}#workspace-composer{left:20px;right:20px;bottom:18px;max-width:none}#answer-sheet{max-width:none}.workspace-head{margin-bottom:12px}.photo{height:136px}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}button:active,.primary:active{transform:none!important}}
#profile summary{display:flex;align-items:center;gap:10px}#profile-avatar{display:inline-flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;border-radius:50%;background:#F5F6F9;color:#5F6275;font-size:13px}
.condition-editor input[type=date]{width:16ch;min-width:0}.condition-editor input[type=time]{width:13ch;min-width:0}.condition-editor input[type=number]{width:5ch;min-width:0}
.slot-options{display:grid;grid-template-columns:repeat(auto-fill,72px);gap:8px}.slot-options .slot-time{width:100%;text-align:center;color:#15172B;background:#F5F6F9;border-radius:8px;padding:7px 12px;font-size:13px;font-weight:500}.slot-options .slot-time[aria-pressed=true]{background:rgba(61,90,254,.08);color:#3D5AFE}
#saved .saved-icon{width:15px;height:15px;flex:none}.slot-time,#saved-count,#card-counter{font-variant-numeric:tabular-nums}

/* Candidate-only visual refinement; other workspace views retain their styles. */
#candidate-panel{margin-bottom:96px}
#candidate-panel:has(~ #messages:not([hidden])),#candidate-panel:has(~ #error:not([hidden])){margin-bottom:16px}
#candidate-panel .candidate{padding:16px;container-type:inline-size}
#candidate-panel .photo{width:100%;height:auto;aspect-ratio:16 / 9;border-radius:12px;background:#F5F6F9;overflow:hidden;margin-bottom:12px}
#candidate-panel .photo .initial,#candidate-panel .photo>small{display:none}
#candidate-panel .photo-placeholder{width:24px;height:24px;color:#5F6275;flex:none}
.card-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit}
#candidate-panel #bookmark{width:40px;height:40px;top:12px;right:12px;padding:8px;border:1px solid rgba(21,23,43,.06);background:color-mix(in srgb,#fff 85%,transparent);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:2}
#candidate-panel #bookmark::before{content:'';position:absolute;inset:-3px}
#candidate-panel .card-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:4px}
#candidate-panel #restaurant-name{flex:1;min-width:0;font-size:20px;line-height:1.25;margin:0;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
#candidate-panel #details-button{flex:none;min-height:0;padding:4px 0;font-size:13px;line-height:1.4;color:#5F6275;font-weight:500;white-space:nowrap}
#candidate-panel #details-button::before{content:'';position:absolute;inset:-10px -8px}
#candidate-panel #key-facts{margin-bottom:12px}
#candidate-panel #availability{padding-top:12px}
#candidate-panel #availability[data-status=unknown]{font-size:13px;font-weight:500;color:#5F6275}
#candidate-panel #delivery-slots{margin-top:8px}
#candidate-panel #delivery-slots:empty,#candidate-panel #recommendation:empty,#delivery-conditions:empty{display:none}
#delivery-conditions{margin-top:8px;margin-bottom:12px;display:flex;flex-direction:column;gap:6px;font-size:13px;line-height:1.45}
.condition-row{display:flex;align-items:baseline;justify-content:flex-start;gap:12px;font-size:13px;line-height:1.45}
.condition-name{min-width:0;color:#15172B}.condition-status{flex:none;color:#5F6275;font-weight:500}
#revision-changes.only-added summary{cursor:default;pointer-events:none}
#candidate-panel .slot-time[aria-pressed=true]{background:color-mix(in srgb,#3D5AFE 16%,#fff);color:#15172B;box-shadow:none}
#candidate-panel .slot-time::before{content:'';position:absolute;left:0;right:0;top:50%;height:44px;transform:translateY(-50%)}
#candidate-panel #recommendation{box-sizing:content-box;font-size:14px;line-height:1.55;height:calc(2 * 1.55em);min-height:calc(2 * 1.55em);margin:12px 0 4px;padding:12px 0 0;color:#15172B;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
#candidate-panel #recommendation:not(:empty){margin-top:12px;padding-top:12px;border-top:.5px solid #E3E5EC}
#candidate-panel #card-actions{flex-direction:row;align-items:center;justify-content:center;gap:0;margin-top:8px}
#candidate-panel #card-pagination{align-self:center;min-height:44px}
#candidate-panel #previous,#candidate-panel #next{width:44px;height:44px;min-width:44px;min-height:44px;font-size:16px}
#candidate-panel #previous:disabled,#candidate-panel #next:disabled{opacity:.35}
@media(max-width:959px){
.workspace-head,.workspace-conditions{margin-left:0;margin-right:0}
#request-conditions{flex-wrap:nowrap;padding-block:4px;margin-block:-4px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;mask-image:linear-gradient(to right,#000 calc(100% - 24px),transparent);-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 24px),transparent)}
#request-conditions::-webkit-scrollbar{display:none}
#request-conditions>button{flex-shrink:0;max-width:none;scroll-snap-align:start}
#candidate-panel .photo{aspect-ratio:2.2 / 1;max-height:calc(100cqw / 2.2 - 16px)}
}
@media(hover:hover) and (pointer:fine){
a:hover{text-decoration:underline}.brand:hover,.primary:hover{text-decoration:none}
#collapse-plans:hover,#menu:hover{background:var(--fill)}
#saved:hover,#new-case:hover,#details-button:hover{background:transparent;text-decoration:underline}
#candidate-panel #bookmark:hover{background:#fff}
#candidate-panel #choose:hover{background:#3D5AFE;filter:brightness(.96)}
#candidate-panel #details-button:hover{color:#15172B;background:transparent;text-decoration:none}
#candidate-panel #previous:not(:disabled):hover,#candidate-panel #next:not(:disabled):hover{background:#F5F6F9}
#candidate-panel .slot-time:not([aria-pressed=true]):hover{background:#E3E5EC}
#candidate-panel .slot-time[aria-pressed=true]:hover{background:color-mix(in srgb,#3D5AFE 16%,#fff);filter:brightness(.98)}
}
/* Landing atmosphere exception; business workspace stays pure white. */
#landing-atmosphere{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;opacity:0;visibility:hidden;background:radial-gradient(ellipse at 48% 38%,rgba(61,90,254,.20),transparent 58%),radial-gradient(ellipse at 76% 58%,rgba(61,90,254,.10),transparent 52%),#fff;transform:scale(1);transition:opacity .45s ease-out,transform .45s ease-out,visibility 0s linear .45s}
#landing-atmosphere[data-active=true]{opacity:1;visibility:visible;transition-delay:0s}
#landing-atmosphere[data-mode=converged]{opacity:1;transform:scale(1)}
#landing-atmosphere[data-mode=converged][data-renderer=static]{opacity:.82;transform:scale(.92);transform-origin:var(--stage-center-x,50%) 48%;background:radial-gradient(circle at var(--stage-center-x,50%) 48%,rgba(61,90,254,.18),transparent 38%),#fff}
#landing-waves{position:fixed;inset:0;pointer-events:none;z-index:0;width:100%;height:100%;opacity:1}
#login,#app{position:relative;z-index:1}
@media(prefers-reduced-motion:reduce){#landing-atmosphere{transition:none}#landing-waves{display:none}}

/* Unified photos: one cover, complete per-image source and attribution. */
#key-facts .address-line{flex:1 0 100%;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.photo-frame{position:relative;min-width:0}.photo-frame>.photo{margin-bottom:12px}
#cover-open{position:absolute;inset:0;width:100%;height:100%;border:0;padding:0;background:transparent;border-radius:inherit;z-index:1}
#bookmark{z-index:3}.photo-credit{font-size:11px;line-height:1.35;margin:0;overflow-wrap:anywhere;color:#fff;background:rgba(21,23,43,.56);border-radius:3px;padding:3px 5px;position:absolute;bottom:22px;right:10px;z-index:2;max-width:calc(100% - 20px);pointer-events:auto}
.photo-credit a{color:inherit;text-decoration:underline;text-underline-offset:2px}.photo-credit .credit-text{white-space:nowrap}
.photo-credit.long{position:static;max-width:100%;color:#5F6275;background:transparent;border-radius:0;padding:0;margin:-5px 0 12px}.photo-credit.long .credit-text{white-space:normal}
#place-photos{margin:10px 0 20px}#detail-photo-open{display:block;width:100%;padding:0;border:0;background:#F5F6F9;border-radius:12px;overflow:hidden;aspect-ratio:16/9}
#detail-photo{display:block;width:100%;height:100%;object-fit:cover}.detail-photo-frame .photo-credit{bottom:10px}.detail-photo-frame .photo-credit.long{margin:6px 0}
.photo-controls{display:flex;gap:16px;align-items:center;justify-content:center;margin:8px 0}.photo-controls button{min-width:40px;min-height:40px;border:0;background:transparent}
#photo-viewer{width:100vw;max-width:none;height:100dvh;max-height:none;inset:0;margin:0;padding:20px;border:0;background:#F8F9FC;color:#15172B}
#photo-viewer[open]{display:flex;flex-direction:column;gap:12px}#photo-viewer::backdrop{background:rgba(21,23,43,.7)}
#photo-viewer header{display:flex;align-items:center;gap:16px;justify-content:space-between;flex:none}#photo-place{font-size:18px;margin:0}#photo-close{border:0;background:transparent;min-height:44px}
.viewer-image-frame{position:relative;min-height:0;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center}#large-photo{display:block;object-fit:contain;max-width:100%;max-height:calc(100dvh - 180px)}
#photo-source{position:static;max-width:100%;color:#5F6275;background:transparent;padding:0;margin-top:8px}#photo-source .credit-text{white-space:normal}
</style></head>
<body>
<!-- Lucide panel-left icon license (including upstream Feather notice):
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

The following Lucide icons are derived from the Feather project:

airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out

The MIT License (MIT) (for the icons listed above)

Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

-->
<div id="landing-atmosphere" aria-hidden="true" data-mode="off" data-active="false" data-renderer="static"><canvas id="landing-waves" hidden></canvas></div>
<section id="login" hidden><h1>Welcome to Praxis</h1><p>Sign in to continue your plans.</p>
<form id="login-form"><label for="access-token">Access token</label><input id="access-token" autocomplete="off" required/><button class="primary">Sign in</button></form>
<p id="login-error" role="alert" hidden></p><p>Local Fixture access: praxis-fixture-a. No real reservations.</p></section>
<div id="app" hidden>
<header id="topbar"><button id="menu" aria-label="My plans" aria-expanded="false" aria-controls="plans">${SIDEBAR_ICON}</button><a href="#" id="brand" class="brand" aria-label="Praxis home">Praxis<span class="cursor"></span></a><button id="new-case">New plan <span aria-hidden="true">+</span></button></header>
<div id="backdrop" hidden></div><aside id="plans" aria-label="My plans"><div id="plans-brand"><button id="collapse-plans" aria-label="Collapse sidebar" aria-controls="plans">${SIDEBAR_ICON}</button></div><div id="plans-heading"><h2>My plans</h2></div><nav id="case-list"></nav><details id="profile"><summary><span id="profile-avatar" aria-hidden="true">P</span><span id="profile-label">Profile</span></summary><p id="profile-name" hidden></p><button id="logout">Sign out</button></details></aside>
<main><section id="home"><h1>What do you want to plan?</h1><div id="home-composer"></div></section>
<section id="case-workspace" hidden><div id="topbar-sentinel" aria-hidden="true"></div><div id="reconnecting" role="status" hidden>Reconnecting…</div><div class="workspace-head"><h1 id="case-title"></h1></div><div class="workspace-conditions"><div id="request-conditions" aria-label="Plan conditions"></div><button id="saved" aria-label="Saved"><svg class="saved-icon" aria-hidden="true" viewBox="5 3 14 18"><path d="M6 4h12v17l-6-4-6 4z"/></svg><span>Saved</span><span id="saved-count">0</span></button></div>
<p id="understanding-error" role="status" hidden>Couldn't read that. Try rephrasing?</p>
<section id="progress" aria-label="Search progress" hidden><div id="stages"></div><button id="stop">Stop</button></section>
<details id="revision-changes" hidden><summary><span id="removed-count"></span><span id="added-count"></span></summary><ul id="removed-list"></ul></details>
<section id="feedback" hidden><p>Did you get the booking?</p><div class="answers"><button data-answer="YES">Yes</button><button data-answer="NO">Not yet</button><button id="feedback-dismiss" aria-label="Skip booking feedback" data-answer="SKIP">×</button></div></section>
<section id="candidate-panel" hidden><article class="candidate" id="candidate-card"><div class="photo-frame"><div class="photo"><button id="cover-open" aria-label="Open restaurant photos" hidden><img id="cover-image" class="card-media" alt="" decoding="async"></button><span class="initial" id="restaurant-initial"></span><span id="no-photo"><svg class="photo-placeholder" viewBox="0 0 24 24" role="img" aria-label="Image placeholder"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m4 17 5-5 4 4 3-3 4 4"/></svg></span><button id="bookmark" aria-label="Save for later" aria-pressed="false"><svg viewBox="0 0 24 24"><path d="M6 4h12v17l-6-4-6 4z"/></svg></button></div><p id="cover-photo-source" class="photo-credit" hidden></p></div><div class="card-head"><h2 id="restaurant-name"></h2><button id="details-button">About <span aria-hidden="true">›</span></button></div><div id="key-facts"></div><p id="availability"></p><div id="delivery-slots" class="muted"></div><div id="delivery-conditions"></div><p id="recommendation"></p><div id="source-categories" hidden aria-label="Source cuisine classifications"></div><button id="choose" class="primary">Let's book</button><div id="card-actions"><div id="card-pagination" role="group" aria-label="Browse restaurants"><button id="previous" aria-label="Previous restaurant">←</button><span id="card-counter" aria-live="polite" aria-atomic="true"></span><button id="next" aria-label="Next restaurant">→</button></div></div></article></section>
<section id="details" class="panel" hidden><button id="details-back" class="view-back">← Back</button><h2 id="details-name"></h2><p id="evidence" hidden></p><section id="place-photos" hidden aria-label="Restaurant photos"><div class="photo-frame detail-photo-frame"><button id="detail-photo-open" aria-label="Open restaurant photos"><img id="detail-photo" alt="" decoding="async"></button><p id="detail-photo-source" class="photo-credit"></p></div><div id="detail-photo-controls" class="photo-controls" hidden><button id="detail-photo-previous" aria-label="Previous photo">←</button><span id="detail-photo-counter"></span><button id="detail-photo-next" aria-label="Next photo">→</button></div></section><div id="details-content"></div><button id="refresh">Refresh availability</button><p id="details-refresh-status" class="muted" role="status" hidden>Refreshing…</p><section id="asked-history" hidden><h3>Q&A</h3><article id="asked-pending" class="asked-item" hidden><p id="asked-pending-question"></p><p class="muted" role="status">Checking the page…</p><button id="question-stop" class="quiet" hidden>Stop</button></article><article id="asked-latest" class="asked-item" hidden><p id="asked-question"></p><div id="asked-result"></div></article><div id="asked-earlier"></div></section></section>
<section id="saved-panel" class="panel" hidden><button id="saved-back" class="view-back">← Back</button><h2>Saved</h2><div id="saved-list"></div><p id="saved-empty">No places saved yet.</p></section>
<section id="handoff" class="panel" hidden><button id="handoff-back" class="view-back">← Back</button><p id="handoff-provider"><span id="handoff-recommended">Recommended</span><span id="handoff-provider-name"></span></p><h2 id="handoff-name"></h2><div class="handoff-time-row" id="handoff-time-row" hidden><label id="handoff-slot-label">Time <span class="handoff-slot-control"><select id="handoff-slot" aria-label="Booking time"></select><svg class="handoff-chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="m2 4 4 4 4-4"/></svg></span></label><span id="handoff-price" hidden></span></div><div id="handoff-terms"></div><p id="handoff-unavailable" hidden>No current booking handoff is available. You can check the source website or refresh availability.</p><a id="departure" class="primary" href="#" target="_blank" rel="noopener"><span id="departure-title"></span></a><p id="departure-fields" class="muted"></p><p class="hint" id="selection-hint" hidden></p><p class="hint" id="verification-hint" hidden></p><a id="direct-source" href="#" target="_blank" rel="noopener noreferrer">Go to source website ↗</a></section>
<section id="batch-end" class="panel" hidden><button id="batch-back" class="view-back">← Back</button><h2>Any of these work?</h2><div id="end-options"><button id="end-saved"><span>Saved</span><span id="end-saved-count"></span></button><button id="end-adjust">Adjust</button></div><button id="find-more" class="primary">Find more</button></section>
<section id="empty-state" class="panel" hidden><p id="empty-message"></p><div class="empty-actions"><button id="empty-adjust">Adjust</button><button id="empty-more" class="primary">Find more</button><button id="empty-retry" class="primary">Try again</button></div></section><p id="partial-source-note" class="muted" hidden>Some sources couldn't be checked.</p>
<p id="clarification-reply" hidden></p>
<div id="messages" aria-live="polite"></div>
<button id="use-location" hidden>Use my location</button><p id="mode-note" hidden></p></section>
<p id="error" role="alert" hidden></p>
<div id="workspace-composer" hidden></div>
<form id="composer" novalidate><textarea id="message" aria-label="Plan message" rows="1"></textarea><button id="send" aria-label="Send"><svg viewBox="0 0 24 24"><path d="m6 11 6-6 6 6M12 5v15"/></svg></button></form>
</main><div id="answer-backdrop" hidden></div><section id="answer-sheet" role="dialog" aria-modal="true" aria-labelledby="answer-place" tabindex="-1" hidden><button id="answer-dismiss" aria-label="Close answer"></button><h2 id="answer-place"></h2><div id="question-result"></div></section></div>
<dialog id="photo-viewer" aria-labelledby="photo-place"><header><h2 id="photo-place"></h2><button id="photo-close" aria-label="Close photos">Close</button></header><div class="viewer-image-frame"><img id="large-photo" alt="" decoding="async"><p id="photo-source" class="photo-credit"></p></div><div id="photo-controls" class="photo-controls"><button id="photo-previous" aria-label="Previous photo">←</button><span id="photo-counter"></span><button id="photo-next" aria-label="Next photo">→</button></div></dialog>
<script src="/assets/landing.js"></script><script type="module" src="/assets/workspace/entry.js"></script>
</body></html>`;
