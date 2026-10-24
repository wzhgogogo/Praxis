# Recording schema revision

Status: draft / not integrated; development exposed. Timezone: Europe/Vienna.

`BROWSER_READ_RECORDING_SCHEMA_VERSION` is `browser-read-recording@4`.
Each `pages` row binds the original snapshot ordinal to `REPLAYABLE` or
`NOT_REPLAYABLE` and a reason. Only qualified documents enter `documents`
and the HAR. A nonempty subset is `PARTIALLY_REPLAYABLE`; callers must not
interpret it as a faithful whole-run replay. F2④b remains out of scope.

The public DOM limit is 1,000,000 UTF-8 bytes. Unreviewed form destinations
are removed, including unquoted attributes; methods and structure remain.
Only explicitly reviewed public GET form actions survive. Existing token,
Cookie, credential, PII, script/CSS/JSON and missing-dependency checks remain;
current source-pack challenge detection also excludes challenge documents.
Runtime and Guard network policies are unchanged.

Historical schema@3 recordings are immutable audit inputs. The offline
requalification script reads retained public DOM/network files only. A snapshot
whose original DOM was discarded remains `ORIGINAL_DOCUMENT_NOT_RETAINED`.
It does not infer new contents or relax uncaptured dependency rules. This is
an archival evaluation path, not a production compatibility branch.

The formal Runner shares one execution function with the CLI and local
transport fixture. Signal/outer-stop/deadline races settle through that
function, which flushes state, trace, decisions and recordings before the CLI
exits. Importing the Runner installs no handlers or providers.
