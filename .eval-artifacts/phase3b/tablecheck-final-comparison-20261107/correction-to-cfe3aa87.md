# Correction to retained transport report

Status: superseding explanation only; original cfe3aa87 report/recording unchanged.

The earlier report said the reserved preflight response came from Guard. The precise layer is Playwright1.62.1 Chromium interception: coreBundle.js36015–36032 detects an intercepted browser OPTIONS preflight and locally calls Fetch.fulfillRequest with204. Guard separately admits or rejects the request via CDP, and otherwise continues it. Both the October20 lockfile and current lockfile pin1.62.1 with the same integrity. A fast204 is therefore not proof of an upstream OPTIONS response, nor a new Guard implementation regression.

The previous local receiver results remain valid: the receiver observed no OPTIONS in the guarded modes and browser CORS passed. This correction changes the attribution of local preflight handling, not those observations. Do not add headers, bypass interception, forward an unreviewed request, or claim the server saw a preflight.

November6 D8 also contains21 distinct successful search-v4 GET terminals (catalog5/search16), with Node response-available callbacks. Therefore the recent native probe failures do not establish continuous interface failure since October. This does not establish current source compatibility or successful named text lookup.
