// Artifact-only mirror of the existing sanitized Recorder entries. No browser,
// model, Guard, Prompt or Task behavior is changed. Parent enforces user stops.
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { installReviewedPostObserver } from '../../../../src/eval/restaurant/agent-loop/post-body-audit.mjs';
const reviewedBytes = readFileSync(new URL('./reviewed-reads.json', import.meta.url));
const { PlaywrightReadNetworkGuard } = await import(pathToFileURL(resolve('src/infrastructure/browser/playwright-read-network-guard.ts')).href);
installReviewedPostObserver(PlaywrightReadNetworkGuard, reviewedBytes, entry => appendFileSync(process.env.P1F_TRACE_PATH, JSON.stringify(entry)+'\n'));
const { BrowserReadRecording } = await import(pathToFileURL(resolve('src/eval/restaurant/agent-loop/runners/browser-read-recording.ts')).href);
// Preserve the outer-only binding and body metadata in the canonical NETWORK
// mirror. No original request values enter the production Recorder/Runner.
BrowserReadRecording.prototype.recordNetwork = function(requests) {
 this.record('NETWORK', requests.map(item => ({ outcome:item.outcome, origin:item.origin, pathname:item.pathname, method:item.method, resourceType:item.resourceType, queryKeys:[...item.queryKeys],
  ...(item.outerRequestId ? {outerRequestId:item.outerRequestId} : {}), ...(item.bodyObservation ? {bodyObservation:item.bodyObservation} : {}) })));
};
const original = BrowserReadRecording.prototype.record;
BrowserReadRecording.prototype.record = function(kind, detail) {
 const result = original.call(this, kind, detail);
 const entry = this.entries.at(-1);
 appendFileSync(process.env.P1F_TRACE_PATH, JSON.stringify({at:new Date().toISOString(),...entry})+'\n');
 return result;
};
