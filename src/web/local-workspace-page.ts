export const LOCAL_WORKSPACE_PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Praxis — Agent Workspace</title>
    <style>
      :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #17221c; background: #f2efe7; }
      * { box-sizing: border-box; } body { margin: 0; } button, textarea, input { font: inherit; }
      button { border: 0; border-radius: 999px; padding: 10px 16px; background: #174d35; color: white; font-weight: 700; white-space: nowrap; cursor: pointer; }
      button:disabled { opacity: .5; cursor: wait; } .secondary { background: #e1ebe4; color: #174d35; }
      .eyebrow { color: #397259; font-weight: 800; letter-spacing: .09em; font-size: 11px; text-transform: uppercase; }
      .notice { padding: 13px 15px; border: 1px solid #ddc568; border-radius: 12px; background: #fff2c9; line-height: 1.45; }
      .hidden { display: none !important; } #login { max-width: 520px; margin: 10vh auto; padding: 28px; }
      #login h1 { font-size: clamp(34px, 7vw, 54px); margin: 8px 0 14px; } #login form { display: grid; gap: 12px; margin-top: 24px; }
      input, textarea { width: 100%; border: 1px solid #aeb8b0; background: white; border-radius: 11px; padding: 12px; }
      textarea { min-height: 92px; resize: vertical; }
      #workspace { min-height: 100vh; display: grid; grid-template-columns: 290px minmax(0, 1fr); }
      aside { border-right: 1px solid #d4d8d1; padding: 24px 18px; background: #e9ede6; }
      .brand { font-size: 25px; font-weight: 850; margin: 4px 0 22px; } .side-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
      #case-list { display: grid; gap: 8px; margin-top: 16px; } .case-link { text-align: left; width: 100%; border-radius: 12px; color: #25352c; background: transparent; padding: 12px; }
      .case-link.active { background: white; box-shadow: 0 1px 0 #cad1ca; } .case-link small { display: block; color: #68756d; margin-top: 5px; }
      main { padding: 28px clamp(18px, 5vw, 64px) 70px; max-width: 1120px; width: 100%; }
      header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; } h1 { margin: 5px 0; font-size: clamp(30px, 5vw, 48px); }
      .status { display: inline-block; margin-top: 8px; background: #dbeadf; color: #184c35; border-radius: 99px; padding: 5px 9px; font-size: 12px; font-weight: 800; }
      #composer { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 10px; margin: 28px 0; }
      .columns { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(260px, .65fr); gap: 18px; }
      section { min-width: 0; } .panel { background: rgba(255,255,255,.8); border: 1px solid #d8ddd6; border-radius: 15px; padding: 18px; margin-bottom: 14px; }
      .panel h2 { font-size: 16px; margin: 0 0 14px; } .message { padding: 11px 13px; border-radius: 12px; margin: 8px 0; line-height: 1.48; white-space: pre-wrap; }
      .message.USER { margin-left: 12%; background: #dce9df; } .message.ASSISTANT { margin-right: 12%; background: white; border: 1px solid #e0e4df; }
      .candidate { border-top: 1px solid #e0e4df; padding: 14px 0; } .candidate:first-of-type { border-top: 0; padding-top: 0; }
      .candidate h3 { margin: 0 0 5px; font-size: 16px; } .muted { color: #66736b; font-size: 13px; line-height: 1.45; }
      .activity { border-left: 2px solid #b7cbbd; padding: 0 0 16px 12px; } .activity strong { display: block; font-size: 14px; } .activity small { color: #78837c; }
      @media (max-width: 760px) {
        #workspace { display: block; } aside { position: sticky; top: 0; z-index: 3; border-right: 0; border-bottom: 1px solid #d4d8d1; padding: 12px 14px; }
        .brand { margin: 0; font-size: 20px; } .side-head { align-items: center; } #case-list { display: flex; overflow-x: auto; margin-top: 10px; }
        .case-link { min-width: 210px; background: rgba(255,255,255,.55); } main { padding: 22px 15px 60px; }
        header { display: block; } .columns { grid-template-columns: 1fr; } #composer { grid-template-columns: 1fr; } #composer button { width: 100%; }
      }
    </style>
  </head>
  <body>
    <section id="login">
      <div class="eyebrow">Praxis · local workspace</div><h1>Your agent workspace</h1>
      <p>Resume a restaurant case from desktop or mobile web with a server-side pilot identity.</p>
      <div id="mode-notice" class="notice"><strong>Fixture only.</strong> No real model, live availability, notification, authorization, or booking. Local access token: <code>praxis-fixture-a</code>.</div>
      <form id="login-form"><label for="access-token">Pilot access token</label><input id="access-token" autocomplete="off" required /><button>Enter workspace</button></form>
      <p id="login-error" class="notice hidden"></p>
    </section>
    <div id="workspace" class="hidden">
      <aside><div class="side-head"><div class="brand">Praxis</div><button id="new-case" class="secondary">New case</button></div><div id="case-list"></div></aside>
      <main>
        <header><div><div id="workspace-mode" class="eyebrow">Persistent restaurant agent · fixture</div><h1 id="case-title">Start a case</h1><span id="case-status" class="status hidden"></span></div><div><button id="refresh" class="secondary hidden">Refresh availability</button> <button id="logout" class="secondary">Sign out</button></div></header>
        <div id="read-boundary" class="notice">This workspace can persist and reconnect, but Fixture mode does not contact real sources.</div>
        <form id="composer"><textarea id="message" required placeholder="Tonight at 7pm near Shinjuku for two, yakiniku, around 5000 yen each."></textarea><button id="send">Start case</button></form>
        <p id="error" class="notice hidden"></p>
        <div class="columns"><section><div class="panel"><h2>Conversation</h2><div id="messages" class="muted">No case selected.</div></div><div class="panel"><h2>Restaurant artifact</h2><div id="artifact" class="muted">Candidates will appear here.</div></div></section><section><div class="panel"><h2>Activity</h2><div id="activity" class="muted">Authoritative task events will appear here.</div></div></section></div>
      </main>
    </div>
    <script>
      const $ = (selector) => document.querySelector(selector);
      const state = { cases: [], view: null, stream: null };
      const login = $('#login'), workspace = $('#workspace'), list = $('#case-list'), title = $('#case-title'), status = $('#case-status'), modeNotice = $('#mode-notice'), workspaceMode = $('#workspace-mode'), readBoundary = $('#read-boundary');
      const messages = $('#messages'), artifact = $('#artifact'), activity = $('#activity'), composer = $('#composer'), message = $('#message'), send = $('#send'), refresh = $('#refresh'), error = $('#error');
      const node = (tag, text, className) => { const item = document.createElement(tag); if (text !== undefined) item.textContent = text; if (className) item.className = className; return item; };
      const requestId = () => crypto.randomUUID();
      async function api(path, options) { const response = await fetch(path, { credentials: 'same-origin', ...options, headers: { 'content-type': 'application/json', ...(options && options.headers || {}) } }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'Request failed'); return payload; }
      function showError(value, target = error) { target.textContent = value.message || String(value); target.classList.remove('hidden'); }
      function clearError() { error.classList.add('hidden'); }
      function openStream(caseId) { if (state.stream) state.stream.close(); state.stream = new EventSource('/api/cases/' + encodeURIComponent(caseId) + '/events'); state.stream.addEventListener('case', (event) => renderView(JSON.parse(event.data))); }
      function renderList() { list.replaceChildren(); state.cases.forEach((item) => { const button = node('button', item.title, 'case-link' + (state.view && state.view.case.caseId === item.caseId ? ' active' : '')); button.append(node('small', item.status + ' · ' + item.phase)); button.onclick = () => loadCase(item.caseId); list.append(button); }); }
      function renderView(view) {
        state.view = view; title.textContent = view.case.title; status.textContent = view.case.status + (view.case.pendingUserAction ? ' · ' + view.case.pendingUserAction : ''); status.classList.remove('hidden'); send.textContent = 'Send';
        refresh.classList.toggle('hidden', view.case.phase !== 'PRESENT_RESULTS');
        const live = view.mode === 'LIVE_READ'; workspaceMode.textContent = 'Persistent restaurant agent · ' + (live ? 'live read-only' : 'fixture'); modeNotice.innerHTML = live ? '<strong>Live read-only.</strong> Server-side sources may be contacted. No authorization, booking, payment, cancellation, account login, or personal-data submission is available.' : '<strong>Fixture only.</strong> No real model, live availability, notification, authorization, or booking. Local access token: <code>praxis-fixture-a</code>.'; readBoundary.textContent = live ? 'Live results appear only after the current source evidence is grounded. A source block, challenge, or missing evidence is shown as a failure, never as an available restaurant.' : 'This workspace can persist and reconnect, but Fixture mode does not contact real sources.';
        messages.replaceChildren(); view.conversation.messages.forEach((item) => messages.append(node('div', item.content, 'message ' + item.role)));
        artifact.replaceChildren(); if (!view.restaurant.candidates.length) artifact.append(node('p', view.restaurant.missingRequiredFields.length ? 'Needed: ' + view.restaurant.missingRequiredFields.join(', ') : 'No candidates yet.', 'muted'));
        const visibleIds = view.restaurant.presentedCandidateIds || view.restaurant.candidates.map((candidate) => candidate.restaurant.id); const visibleCandidates = view.restaurant.candidates.filter((candidate) => visibleIds.includes(candidate.restaurant.id)).slice(0, 3);
        visibleCandidates.forEach((candidate) => { const card = node('div', undefined, 'candidate'); const offers = view.restaurant.availability[candidate.restaurant.id] || []; const check = view.restaurant.availabilityChecks[candidate.restaurant.id]; const evidence = view.restaurant.readEvidence.filter((item) => item.candidateId === candidate.restaurant.id && item.sourceUrl); const source = evidence.find((item) => item.kind === 'AVAILABILITY') || evidence[0]; card.append(node('h3', candidate.restaurant.outletName)); card.append(node('div', candidate.restaurant.address + (offers[0] ? ' · ' + offers[0].dateTime + ' · ' + offers[0].source : check ? ' · ' + (check.reasonCode || check.status) : ' · availability not checked'), 'muted')); card.append(node('div', view.restaurant.presentedCandidateIds ? 'Evidence-grounded result' : view.restaurant.selectedCandidateId === candidate.restaurant.id ? 'Selected by the Restaurant Agent' : 'Discovery candidate — not yet a verified availability result', 'muted')); if (source) { const link = document.createElement('a'); link.href = source.sourceUrl; link.target = '_blank'; link.rel = 'noreferrer'; link.textContent = 'Open source page'; link.className = 'muted'; card.append(link); } artifact.append(card); });
        activity.replaceChildren(); view.activities.slice().reverse().forEach((item) => { const row = node('div', undefined, 'activity'); row.append(node('strong', item.display.title)); row.append(node('div', item.display.detail || '', 'muted')); row.append(node('small', new Date(item.occurredAt).toLocaleString())); activity.append(row); });
        const found = state.cases.findIndex((item) => item.caseId === view.case.caseId); if (found >= 0) state.cases[found] = view.case; else state.cases.unshift(view.case); renderList();
      }
      async function loadCases() { const payload = await api('/api/cases'); state.cases = payload.cases; renderList(); if (state.cases[0]) await loadCase(state.cases[0].caseId); }
      async function loadCase(caseId) { try { clearError(); const payload = await api('/api/cases/' + encodeURIComponent(caseId)); renderView(payload.view); openStream(caseId); } catch (reason) { showError(reason); } }
      function resetCase() { if (state.stream) state.stream.close(); state.stream = null; state.view = null; title.textContent = 'Start a case'; status.classList.add('hidden'); send.textContent = 'Start case'; messages.textContent = 'Describe the result you want to begin.'; artifact.textContent = 'Candidates will appear here.'; activity.textContent = 'Authoritative task events will appear here.'; renderList(); message.focus(); }
      composer.addEventListener('submit', async (event) => { event.preventDefault(); send.disabled = true; try { clearError(); const path = state.view ? '/api/conversations/' + encodeURIComponent(state.view.conversation.id) + '/messages' : '/api/cases'; const body = state.view ? { message: message.value, taskVersion: state.view.case.taskVersion, requestId: requestId() } : { message: message.value, requestId: requestId() }; const payload = await api(path, { method: 'POST', body: JSON.stringify(body) }); message.value = ''; renderView(payload.view); openStream(payload.view.case.caseId); } catch (reason) { showError(reason); } finally { send.disabled = false; } });
      refresh.onclick = async () => { if (!state.view) return; refresh.disabled = true; try { clearError(); const payload = await api('/api/cases/' + encodeURIComponent(state.view.case.caseId) + '/refresh', { method: 'POST', body: JSON.stringify({ taskVersion: state.view.case.taskVersion, requestId: requestId() }) }); renderView(payload.view); openStream(payload.view.case.caseId); } catch (reason) { showError(reason); } finally { refresh.disabled = false; } };
      $('#new-case').onclick = resetCase;
      $('#login-form').addEventListener('submit', async (event) => { event.preventDefault(); try { await api('/api/session', { method: 'POST', body: JSON.stringify({ accessToken: $('#access-token').value }) }); login.classList.add('hidden'); workspace.classList.remove('hidden'); await loadCases(); } catch (reason) { showError(reason, $('#login-error')); } });
      $('#logout').onclick = async () => { await api('/api/session', { method: 'DELETE' }); location.reload(); };
      api('/api/session').then(() => { login.classList.add('hidden'); workspace.classList.remove('hidden'); return loadCases(); }).catch(() => {});
    </script>
  </body>
</html>`;
