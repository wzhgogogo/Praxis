# Probe classification correction

Status: draft / not integrated. Original82ac67fb receipt and recordings remain unchanged.

Destination OTHER is an actual guard observation at the preflight and is sufficient to trigger the user stop. q was observed EQUALS_AUTHORITATIVE_INPUT on both preflight and actual GET, and both were admitted. A later native response/request failure created a new URL without its original query observation, so fallback classification had no authority inputs and yielded OTHER. That failure-side label is not proof of different request text. A real local cross-origin receiver with a missing allow-origin response reproduces this on the old diagnostic code; the corrected Guard keeps per-Request start categories and labels transport failure FAILED instead of policy BLOCKED. Targeted red/green is preserved. Admission and the exact source contract do not change. No new website request was made to verify the correction.
