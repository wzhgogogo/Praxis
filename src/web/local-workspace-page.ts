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
      aside { min-width: 0; border-right: 1px solid #d4d8d1; padding: 24px 18px; background: #e9ede6; }
      .brand { font-size: 25px; font-weight: 850; margin: 4px 0 22px; } .side-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
      #case-list { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; margin-top: 16px; } .case-link { min-width: 0; white-space: normal; overflow-wrap: anywhere; text-align: left; width: 100%; border-radius: 12px; color: #25352c; background: transparent; padding: 12px; }
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
      .candidate a { display: inline-block; margin: 8px 12px 0 0; } .candidate h3 { margin: 0 0 5px; font-size: 16px; } .muted { color: #66736b; font-size: 13px; line-height: 1.45; }
      .page-question-form { display: grid; gap: 8px; margin-top: 12px; } .page-answer { margin-top: 12px; border-left: 3px solid #b7cbbd; padding-left: 12px; } .page-answer blockquote { margin: 12px 0; white-space: pre-wrap; overflow-wrap: anywhere; }
      .booking-handoff { margin-top: 12px; padding: 12px; border: 1px solid #b7cbbd; border-radius: 12px; } .booking-handoff .departure { display: block; width: fit-content; padding: 10px 14px; border-radius: 12px; background: #174d35; color: white; text-decoration: none; } .booking-handoff blockquote { margin: 6px 0; white-space: pre-wrap; overflow-wrap: anywhere; }
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
        <header><div><div id="workspace-mode" class="eyebrow">Persistent restaurant agent · fixture</div><h1 id="case-title">Start a case</h1><span id="case-status" class="status hidden"></span></div><div><button id="refresh" class="secondary hidden">Refresh availability</button> <button id="cancel-run" class="secondary hidden">Stop current read</button> <button id="logout" class="secondary">Sign out</button></div></header>
        <div id="read-boundary" class="notice">This workspace can persist and reconnect, but Fixture mode does not contact real sources.</div>
        <form id="composer"><textarea id="message" required placeholder="Tonight at 7pm near Shinjuku for two, yakiniku, around 5000 yen each."></textarea><button id="send">Start case</button></form>
        <button id="use-location" class="secondary hidden" type="button">Use device location</button><p id="location-help" class="muted hidden">If location is unavailable, type a nearby station, address, or district in the message box.</p>
        <p id="error" class="notice hidden"></p>
        <div id="booking-feedback" class="panel hidden" aria-label="Booking feedback" aria-live="polite"></div>
        <div class="columns"><section><div class="panel"><h2>Conversation</h2><div id="messages" class="muted">No case selected.</div></div><div class="panel"><h2>Restaurant artifact</h2><div id="artifact" class="muted">Candidates will appear here.</div></div></section><section><div class="panel"><h2>Activity</h2><div id="activity" class="muted">Authoritative task events will appear here.</div></div></section></div>
      </main>
    </div>
    <script>
      const $ = (selector) => document.querySelector(selector);
      const state = { cases: [], view: null, stream: null, navigation: 0, expiryTimer: null, feedbackChecked: new Set(), feedbackClaiming: new Set(), feedbackCaseId: null };
      const login = $('#login'), workspace = $('#workspace'), list = $('#case-list'), title = $('#case-title'), status = $('#case-status'), modeNotice = $('#mode-notice'), workspaceMode = $('#workspace-mode'), readBoundary = $('#read-boundary');
      const messages = $('#messages'), artifact = $('#artifact'), activity = $('#activity'), composer = $('#composer'), message = $('#message'), send = $('#send'), refresh = $('#refresh'), cancelRun = $('#cancel-run'), useLocation = $('#use-location'), locationHelp = $('#location-help'), error = $('#error');
      const node = (tag, text, className) => { const item = document.createElement(tag); if (text !== undefined) item.textContent = text; if (className) item.className = className; return item; };
      const feedbackPanel = $('#booking-feedback');
      const requestId = () => crypto.randomUUID();
      async function api(path, options) { const response = await fetch(path, { credentials: 'same-origin', ...options, headers: { 'content-type': 'application/json', ...(options && options.headers || {}) } }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'Request failed'); return payload; }
      async function requestBookingFeedback() {
        const view = state.view; if (!view || document.visibilityState === 'hidden') return;
        const caseId = view.case.caseId;
        if (state.feedbackChecked.has(caseId) || state.feedbackClaiming.has(caseId)) return;
        state.feedbackClaiming.add(caseId);
        try {
          const payload = await api('/api/cases/' + encodeURIComponent(caseId) + '/booking-feedback/claim', {method:'POST',body:'{}'});
          state.feedbackChecked.add(caseId);
          if (!payload.prompt || state.view?.case.caseId !== caseId) return;
          const prompt = payload.prompt; state.feedbackCaseId = caseId;
          feedbackPanel.replaceChildren(node('p', prompt.question)); feedbackPanel.classList.remove('hidden');
          ['YES', 'NO', 'SKIP'].forEach(answer => {
            const button = node('button', {YES:'Yes',NO:'No',SKIP:'Skip'}[answer], 'secondary'); button.type = 'button';
            button.onclick = async () => {
              const buttons = [...feedbackPanel.querySelectorAll('button')]; buttons.forEach(item => item.disabled = true);
              try {
                await api('/api/cases/' + encodeURIComponent(caseId) + '/booking-feedback', {method:'POST',body:JSON.stringify({departureId:prompt.departure.id,answer})});
                if (state.view?.case.caseId === caseId) feedbackPanel.replaceChildren(node('p', 'Thanks — saved as your report.'));
              } catch (reason) { buttons.forEach(item => item.disabled = false); showError(reason); }
            };
            feedbackPanel.append(button);
          });
        } catch (reason) { showError(reason); } finally { state.feedbackClaiming.delete(caseId); }
      }
      async function departForBooking(event, handoff) {
        event.preventDefault(); const view = state.view; if (!view) return;
        const popup = window.open('about:blank', '_blank');
        if (!popup) { showError(new Error('Allow a new tab to continue on the source website.')); return; }
        popup.opener = null;
        try {
          const payload = await api('/api/cases/' + encodeURIComponent(view.case.caseId) + '/booking-departures', {method:'POST',body:JSON.stringify({candidateId:handoff.candidateId,offerId:handoff.offerId,taskVersion:view.case.taskVersion,requestId:requestId()})});
          state.feedbackChecked.delete(view.case.caseId); popup.location.href = payload.url;
        } catch (reason) { popup.close(); showError(reason); }
      }
      window.addEventListener('focus', requestBookingFeedback);
      window.addEventListener('pageshow', requestBookingFeedback);
      function showError(value, target = error) { target.textContent = value.message || String(value); target.classList.remove('hidden'); }
      function clearError() { error.classList.add('hidden'); }
      function openStream(caseId) { if (state.stream) state.stream.close(); state.stream = new EventSource('/api/cases/' + encodeURIComponent(caseId) + '/events'); const stream = state.stream; stream.addEventListener('case', (event) => { if (state.stream === stream && state.view && state.view.case.caseId === caseId) renderView(JSON.parse(event.data)); }); }
      function renderList() { list.replaceChildren(); state.cases.forEach((item) => { const button = node('button', item.title, 'case-link' + (state.view && state.view.case.caseId === item.caseId ? ' active' : '')); button.append(node('small', item.status + ' · ' + item.phase)); button.onclick = () => loadCase(item.caseId); list.append(button); }); }
      function renderView(view) {
        clearTimeout(state.expiryTimer);
        const now = Date.now();
        const upcomingExpiry = Object.values(view.restaurant.availabilityChecks).map(check => Date.parse(check.displayExpiresAt)).filter(time => time > now).sort((a, b) => a - b)[0];
        if (upcomingExpiry) state.expiryTimer = setTimeout(() => { if (state.view === view) renderView(view); }, Math.min(2147483647, upcomingExpiry - now + 1));
        if (state.feedbackCaseId !== view.case.caseId) feedbackPanel.classList.add('hidden');
        state.view = view; title.textContent = view.case.title; status.textContent = view.case.status + (view.case.pendingUserAction ? ' · ' + view.case.pendingUserAction : ''); status.classList.remove('hidden'); send.textContent = 'Send';
        const factOnlyResult = view.restaurant.intentDraft && view.restaurant.intentDraft.target && view.restaurant.intentDraft.target.goal === 'RECOMMENDATION'; refresh.textContent = factOnlyResult ? 'Refresh recommendation facts' : 'Refresh availability'; refresh.classList.toggle('hidden', view.case.phase !== 'PRESENT_RESULTS'); refresh.disabled = Boolean(view.restaurant.pageQuestion && !view.restaurant.pageQuestion.result);
        cancelRun.classList.toggle('hidden', view.mode !== 'LIVE_READ' || view.case.status !== 'ACTIVE');
        const needsNearbyLocation = view.restaurant.intentDraft && String(view.restaurant.intentDraft.area && view.restaurant.intentDraft.area.query || '').toLowerCase() === 'nearby' && !(view.restaurant.intentDraft.area && view.restaurant.intentDraft.area.coordinates);
        useLocation.classList.toggle('hidden', !needsNearbyLocation); locationHelp.classList.toggle('hidden', !needsNearbyLocation);
        const live = view.mode === 'LIVE_READ'; workspaceMode.textContent = 'Persistent restaurant agent · ' + (live ? 'live read-only' : 'fixture'); modeNotice.innerHTML = live ? '<strong>Live read-only.</strong> Server-side sources may be contacted. No authorization, booking, payment, cancellation, account login, or personal-data submission is available.' : '<strong>Fixture only.</strong> No real model, live availability, notification, authorization, or booking. Local access token: <code>praxis-fixture-a</code>.'; readBoundary.textContent = live ? 'Live results appear only after the current source evidence is grounded. A source block, challenge, or missing evidence is shown as a failure, never as an available restaurant.' : 'This workspace can persist and reconnect, but Fixture mode does not contact real sources.';
        messages.replaceChildren(); view.conversation.messages.forEach((item) => messages.append(node('div', item.content, 'message ' + item.role)));
        artifact.replaceChildren(); if (!view.restaurant.candidates.length) artifact.append(node('p', view.restaurant.missingRequiredFields.length ? 'Needed: ' + view.restaurant.missingRequiredFields.join(', ') : 'No candidates yet.', 'muted'));
        if (view.restaurant.searchLocation?.areaMatchBasis === 'NAMED_PLACE_RADIUS') artifact.prepend(node('p', 'Searching around ' + view.restaurant.searchLocation.label, 'muted'));
        const presentedIds = view.restaurant.presentedCandidateIds || [];
        const investigatedIds = view.restaurant.candidates.filter(candidate => view.restaurant.availabilityChecks[candidate.restaurant.id] || view.restaurant.currentFactEvidence.some(item => item.candidateId === candidate.restaurant.id && item.kind === 'RESTAURANT_FACT' && item.provider !== 'GOOGLE_PLACES')).map(candidate => candidate.restaurant.id);
        const visibleIds = [...new Set([...presentedIds, ...investigatedIds])];
        const visibleCandidates = view.restaurant.candidates.filter(candidate => !visibleIds.length || visibleIds.includes(candidate.restaurant.id)).slice(0, visibleIds.length ? 10 : 3);
        const requestedInformation = [view.restaurant.intentDraft?.target?.query || '', ...(view.restaurant.intentDraft?.criteria || []).map(item => item.text)].join(' ');
        visibleCandidates.forEach(candidate => {
          const id = candidate.restaurant.id, card = node('div', undefined, 'candidate');
          const check = view.restaurant.availabilityChecks[id];
          const expired = Boolean(check && check.displayExpiresAt && Date.parse(check.displayExpiresAt) <= now);
          const offers = expired ? [] : (view.restaurant.availability[id] || []).filter(offer => !offer.displayExpiresAt || Date.parse(offer.displayExpiresAt) > now);
          const factOnly = view.restaurant.intentDraft?.target?.goal === 'RECOMMENDATION';
          const facts = view.restaurant.currentFactEvidence.filter(item => item.candidateId === id && item.kind === 'RESTAURANT_FACT');
          const checkEvidenceIds = check?.evidenceIds || [];
          const source = view.restaurant.readEvidence.find(item => item.candidateId === id && item.sourceUrl && checkEvidenceIds.includes(item.evidenceId)) || facts.find(item => item.sourceUrl);
          const statusDetail = expired ? 'Availability expired — refresh to check again' : offers[0] ? offers[0].dateTime + ' · ' + offers[0].source : check ? (check.reasonCode || check.status) : factOnly ? 'Source facts checked for this recommendation' : 'Availability not checked';
          card.append(node('h3', candidate.restaurant.outletName), node('div', candidate.restaurant.address + (candidate.distanceObservation ? ' · ' + candidate.distanceObservation.meters + ' m from ' + (candidate.distanceObservation.centerBasis === 'NAMED_PLACE_RADIUS' ? 'requested place' : candidate.distanceObservation.centerBasis === 'TASK_LOCATION_RADIUS' ? 'your location' : 'evaluation location') : '') + ' · ' + statusDetail, 'muted'));
          card.append(node('div', presentedIds.includes(id) && (factOnly || !expired) ? 'Evidence-grounded result' : 'Investigated candidate — not a verified result for the current request', 'muted'));
          if (check && check.checkedAt) card.append(node('div', 'Availability checked: ' + new Date(check.checkedAt).toLocaleString(), 'muted'));
          (view.restaurant.bookingHandoffs || []).filter(handoff => handoff.candidateId === id && !expired && Date.parse(handoff.displayExpiresAt) > now && offers.some(offer => offer.id === handoff.offerId)).forEach(handoff => {
            const section = node('section', undefined, 'booking-handoff');
            const direct = node('a', handoff.directLabel); direct.href = handoff.url; direct.target = '_blank'; direct.rel = 'noreferrer noopener';
            const departure = node('a', handoff.continueLabel, 'departure'); departure.href = handoff.url; departure.target = '_blank'; departure.rel = 'noreferrer noopener';
            direct.onclick = event => departForBooking(event, handoff); departure.onclick = event => departForBooking(event, handoff);
            section.append(direct, departure);
            if (handoff.cancellationNotice) section.append(node('p', handoff.cancellationNotice, 'notice'));
            if (handoff.platformFee) {
              const fee = handoff.platformFee; section.append(node('p', fee.label));
              const details = node('details'); details.append(node('summary', 'Platform fee source'));
              fee.quotes.forEach(quote => details.append(node('blockquote', quote)));
              const source = node('a', 'Tabelog English help · checked ' + fee.checkedOn, 'muted'); source.href = fee.sourceUrl; source.target = '_blank'; source.rel = 'noreferrer noopener'; details.append(source); section.append(details);
            }
            if (handoff.hint) section.append(node('p', handoff.hint, 'muted booking-hint'));
            handoff.terms.forEach(term => {
              section.append(node('p', term.label));
              term.citations.forEach(citation => {
                section.append(node('blockquote', citation.text));
                const source = node('a', 'Source · read ' + new Date(citation.readAt).toLocaleString('en-GB'), 'muted');
                source.href = citation.url; source.target = '_blank'; source.rel = 'noreferrer noopener'; section.append(source);
              });
            });
            card.append(section);
          });
          (view.restaurant.conditionStates?.[id] || []).forEach(condition => {
            const label = condition.status === 'MET' ? 'met' : condition.status === 'NOT_MET' ? 'not met' : 'not checked';
            card.append(node('p', condition.text + ' — ' + label + ': ' + condition.explanation));
            condition.sources.forEach(source => { const fieldLabel = { CATEGORY: 'Source category', COURSE_TITLE: 'Course title', COURSE_DESCRIPTION: 'Course description', GOOGLE_TYPE: 'Observed type', NAME: 'Source name', CUSTOMER_REVIEW: 'Customer review', SOURCE_TEXT: 'Unclassified source text', PRICE: 'Observed price' }[source.field]; const link = node('a', fieldLabel + (source.meal && source.meal !== 'UNSPECIFIED' ? ' (' + source.meal.toLowerCase() + ')' : '') + ': ' + source.quote, 'muted'); link.href = source.sourceUrl; link.target = '_blank'; link.rel = 'noreferrer'; card.append(link); });
          });
          let hasPrice = false, hasCancellation = false;
          facts.forEach(fact => {
            const claims = fact.claims, terms = [];
            if (fact.priceFacts) {
              [fact.priceFacts.dinnerBudgetRangeYen, fact.priceFacts.lunchBudgetRangeYen].filter(Boolean).forEach(range => { hasPrice = true; terms.push(range.quote); });
              fact.priceFacts.listedCoursePricesYen.forEach(price => { hasPrice = true; terms.push(price.quote + ' — listed plan, availability not checked'); });
            }
            if (Array.isArray(claims.listedCourseDetails)) { hasPrice = true; terms.push('Listed courses — availability of each plan has not been checked:'); terms.push(...claims.listedCourseDetails); }
            if (typeof claims.coursePriceYen === 'number') { hasPrice = true; terms.push('Course: ¥' + claims.coursePriceYen.toLocaleString() + (claims.coursePriceTax ? ' (' + String(claims.coursePriceTax).toLowerCase() + ' tax)' : '')); }
            if (typeof claims.privateRoomMinimumYen === 'number') terms.push('Private-room minimum: ¥' + claims.privateRoomMinimumYen.toLocaleString());
            if (typeof claims.cancellationTerms === 'string') { hasCancellation = true; terms.push(claims.cancellationTerms); }
            if (typeof claims.noShowTerms === 'string') terms.push(claims.noShowTerms);
            terms.forEach(term => card.append(node('p', term, 'muted')));
            if (terms.length && fact.sourceUrl) { const link = node('a', 'Terms source', 'muted'); link.href = fact.sourceUrl; link.target = '_blank'; link.rel = 'noreferrer'; card.append(link); }
          });
          if (!hasPrice && /course|price|套餐|コース/i.test(requestedInformation)) card.append(node('p', 'Course prices: not verified.', 'muted'));
          if (!hasCancellation && /cancellation|キャンセル|取消/i.test(requestedInformation)) card.append(node('p', 'Cancellation terms: not verified.', 'muted'));
          if (source) { const link = node('a', 'Open source page', 'muted'); link.href = source.sourceUrl; link.target = '_blank'; link.rel = 'noreferrer'; card.append(link); }
          if (presentedIds.includes(id)) {
            const form = node('form', undefined, 'page-question-form');
            const input = node('input'); input.required = true; input.maxLength = 2000; input.placeholder = 'Ask about this restaurant'; input.setAttribute('aria-label', 'Question about ' + candidate.restaurant.outletName);
            const ask = node('button', 'Ask restaurant question'); ask.type = 'submit';
            ask.disabled = Boolean(view.restaurant.pageQuestion && !view.restaurant.pageQuestion.result);
            form.append(input, ask);
            form.onsubmit = async event => { event.preventDefault(); ask.disabled = true; try {
              clearError(); const payload = await api('/api/cases/' + encodeURIComponent(state.view.case.caseId) + '/questions', {method:'POST',body:JSON.stringify({candidateId:id,question:input.value,taskVersion:state.view.case.taskVersion,requestId:requestId()})});
              renderView(payload.view); openStream(payload.view.case.caseId);
            } catch (reason) { showError(reason); ask.disabled = false; } };
            card.append(form);
          }
          const question = view.restaurant.pageQuestion;
          if (question && question.candidateId === id) {
            const answer = node('section', undefined, 'page-answer'); answer.setAttribute('aria-label', 'Restaurant page answer');
            answer.append(node('h4', question.question));
            const result = question.result;
            answer.append(node('p', !result ? 'Reading the restaurant page…' : result.status === 'ANSWERED' ? result.answer : result.status === 'NOT_STATED' ? 'Not stated on the page' : 'The page answer could not be verified.'));
            if (result) {
              if (result.confirmationRequired) answer.append(node('p', 'Please confirm with the restaurant', 'notice'));
              (result.citations || []).forEach(citation => { const quote = node('blockquote', citation.text); const link = node('a', 'Source page'); link.href = citation.url; link.target = '_blank'; link.rel = 'noreferrer'; answer.append(quote,link,node('p','Read at: ' + citation.readAt,'muted')); });
              if (result.status !== 'ANSWERED') result.checkedPages.forEach(page => { const link = node('a','Checked page'); link.href = page.url; link.target = '_blank'; link.rel = 'noreferrer'; answer.append(link,node('p','Read at: ' + page.readAt,'muted')); });
            }
            card.append(answer);
          }
          artifact.append(card);
        });
        activity.replaceChildren(); view.activities.slice().reverse().forEach((item) => { const row = node('div', undefined, 'activity'); row.append(node('strong', item.display.title)); row.append(node('div', item.display.detail || '', 'muted')); row.append(node('small', new Date(item.occurredAt).toLocaleString())); activity.append(row); });
        const found = state.cases.findIndex((item) => item.caseId === view.case.caseId); if (found >= 0) state.cases[found] = view.case; else state.cases.unshift(view.case); renderList();
      }
      async function loadCases() { const navigation = state.navigation; const payload = await api('/api/cases'); state.cases = payload.cases; renderList(); if (navigation === state.navigation && state.cases[0]) await loadCase(state.cases[0].caseId); }
      async function loadCase(caseId) { const navigation = ++state.navigation; if (state.stream) state.stream.close(); state.stream = null; try { clearError(); const payload = await api('/api/cases/' + encodeURIComponent(caseId)); if (navigation !== state.navigation) return; renderView(payload.view); openStream(caseId); requestBookingFeedback(); } catch (reason) { if (navigation === state.navigation) showError(reason); } }
      function resetCase() { state.navigation++; clearTimeout(state.expiryTimer); if (state.stream) state.stream.close(); state.stream = null; state.view = null; feedbackPanel.classList.add('hidden'); title.textContent = 'Start a case'; status.classList.add('hidden'); send.textContent = 'Start case'; messages.textContent = 'Describe the result you want to begin.'; artifact.textContent = 'Candidates will appear here.'; activity.textContent = 'Authoritative task events will appear here.'; renderList(); message.focus(); }
      composer.addEventListener('submit', async (event) => { event.preventDefault(); send.disabled = true; try { clearError(); const path = state.view ? '/api/conversations/' + encodeURIComponent(state.view.conversation.id) + '/messages' : '/api/cases'; const body = state.view ? { message: message.value, taskVersion: state.view.case.taskVersion, requestId: requestId() } : { message: message.value, requestId: requestId() }; const payload = await api(path, { method: 'POST', body: JSON.stringify(body) }); message.value = ''; renderView(payload.view); openStream(payload.view.case.caseId); } catch (reason) { showError(reason); } finally { send.disabled = false; } });
      refresh.onclick = async () => { if (!state.view) return; refresh.disabled = true; try { clearError(); const payload = await api('/api/cases/' + encodeURIComponent(state.view.case.caseId) + '/refresh', { method: 'POST', body: JSON.stringify({ taskVersion: state.view.case.taskVersion, requestId: requestId() }) }); renderView(payload.view); openStream(payload.view.case.caseId); } catch (reason) { showError(reason); } finally { refresh.disabled = false; } };
      cancelRun.onclick = async () => { if (!state.view) return; cancelRun.disabled = true; try { clearError(); const payload = await api('/api/cases/' + encodeURIComponent(state.view.case.caseId) + '/run', { method: 'DELETE' }); renderView(payload.view); } catch (reason) { showError(reason); } finally { cancelRun.disabled = false; } };
      useLocation.onclick = () => { if (!state.view || !navigator.geolocation) { showError(new Error('Device location is unavailable. Type a nearby station, address, or district instead.')); return; } useLocation.disabled = true; navigator.geolocation.getCurrentPosition(async (position) => { try { const payload = await api('/api/cases/' + encodeURIComponent(state.view.case.caseId) + '/location', { method: 'POST', body: JSON.stringify({ taskVersion: state.view.case.taskVersion, requestId: requestId(), latitude: position.coords.latitude, longitude: position.coords.longitude, accuracyMeters: position.coords.accuracy }) }); renderView(payload.view); openStream(payload.view.case.caseId); } catch (reason) { showError(reason); } finally { useLocation.disabled = false; } }, () => { useLocation.disabled = false; locationHelp.classList.remove('hidden'); showError(new Error('Location was not shared. Type a nearby station, address, or district to continue.')); }, { enableHighAccuracy: false, maximumAge: 0, timeout: 10000 }); };
      $('#new-case').onclick = resetCase;
      $('#login-form').addEventListener('submit', async (event) => { event.preventDefault(); try { await api('/api/session', { method: 'POST', body: JSON.stringify({ accessToken: $('#access-token').value }) }); login.classList.add('hidden'); workspace.classList.remove('hidden'); await loadCases(); } catch (reason) { showError(reason, $('#login-error')); } });
      $('#logout').onclick = async () => { await api('/api/session', { method: 'DELETE' }); location.reload(); };
      api('/api/session').then(() => { login.classList.add('hidden'); workspace.classList.remove('hidden'); return loadCases(); }).catch(() => {});
    </script>
  </body>
</html>`;
