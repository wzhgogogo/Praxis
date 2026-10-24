// Minimal synthetic public pages, collected 2026-10-24; no historical run.
import { BrowserReadRecording } from "../runners/browser-read-recording.js";
export async function diagnosticRecording(directory: string) {
  const recorder = new BrowserReadRecording({ directory, runId: "mixed" });
  recorder.recordSnapshot({ url: "https://public.example/good", title: "Public", text: "", html: "<h1>Public</h1>" });
  recorder.recordSnapshot({ url: "https://public.example/script", title: "Missing script", text: "", html: '<main data-token="fixture-session">Region menu</main><form method="post" action="/reserve"><input name="csrf-token" value="fixture-private"><button>Search</button></form>', networkRequests: [{ outcome: "ADMITTED", origin: "https://public.example", pathname: "/public.js", method: "GET", resourceType: "script", queryKeys: [] }] });
  recorder.recordSnapshot({ url: "https://public.example/options", title: "OPTIONS", text: "", html: '<h1>Regions</h1><p>fixture@example.org</p>', networkRequests: [{ outcome: "ADMITTED", origin: "https://public.example", pathname: "/slots", method: "OPTIONS", resourceType: "fetch", queryKeys: [] }] });
  recorder.recordSnapshot({ url: "https://www.tablecheck.com/en/challenge", title: "Just a moment", text: "Verify you are human", html: "<h1>Verify you are human</h1>" });
  recorder.recordSnapshot({ url: "https://public.example/secret?token=synthetic-private", title: "Secret", text: "", html: "<h1>Private</h1>" });
  recorder.recordSnapshot({ url: "https://public.example/large", title: "Large", text: "", html: "x".repeat(1_000_001) });
  return recorder.finish();
}
