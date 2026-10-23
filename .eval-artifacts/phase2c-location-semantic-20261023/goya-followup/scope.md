# Bound alternative collection repair

Evidence status: exposed saved response replay and local composition; draft / not integrated.

The failure is all-or-nothing collection admission: an unrepresentable alternative discards a separately bound valid clock slot. The change stays in the existing response parser; it adds no new domain, place, merchant, path or source branch, and no new source clock convention. It does not map extended-hour values to a later date or normalize them to midnight.

All entries retain existing origin/path, merchant, date and people binding checks. A missing/invalid display time can be ignored only when its already bound link denotes a numeric hour outside the supported clock domain. A supported clock link with missing time, conflicting time, wrong identity/date/people, or newer failed response still rejects the collection. No supported slots means UNKNOWN, never empty. Existing pending-page behavior is unchanged.

The three saved traces contain safe URL fields, not raw HTTP bodies. Restore only those fields to the original URL shape; missing time is not invented. Full recorded HTML is re-read and SHA-checked. These replays prove the saved projection, not the exact discarded raw value. The Chromium control independently supplies explicit unsupported times alongside a valid slot through the actual Live assembly, installed Guard, passive response capture, Adapter and grounding. It does not prove current stock or full-task delivery.

Source production physical lines must not increase under the same06287b6f scope. All new unit/Chromium behavior tests use the existing suites. No models, Google, external websites, or Live.
