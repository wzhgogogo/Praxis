// Artifact-only mirror of the existing sanitized Recorder entries. No browser,
// model, Guard, Prompt or Task behavior is changed. Parent enforces user stops.
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const { BrowserReadRecording } = await import(pathToFileURL(resolve('src/eval/restaurant/agent-loop/runners/browser-read-recording.ts')).href);
const original = BrowserReadRecording.prototype.record;
BrowserReadRecording.prototype.record = function(kind, detail) {
 const result = original.call(this, kind, detail);
 const entry = this.entries.at(-1);
 appendFileSync(process.env.P1F_TRACE_PATH, JSON.stringify({at:new Date().toISOString(),...entry})+'\n');
 return result;
};
