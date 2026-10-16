// Read-only inventory of retained proof, not an S0 scorer. No labels or network.
import fs from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
const [summaryPath, outputPath] = process.argv.slice(2);
if (!summaryPath || !outputPath) throw Error('Pass saved summary and a new audit file.');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const summaryBytes = await fs.readFile(summaryPath), summary = JSON.parse(summaryBytes);
const manifest = JSON.parse(await fs.readFile(summary.manifest.path));
const rows = [];
for (const row of summary.rows.filter(row => row.sourceStatus === 'RESULT_GENERATED' && row.severity.S0.status === 'NOT_EVALUATED')) {
  const file = manifest.entries.find(entry => entry.runId === row.runId).files.find(file => file.kind === 'RESULT');
  const raw = gunzipSync(await fs.readFile(resolve(dirname(summary.manifest.path), file.path)));
  if (sha(raw) !== file.originalSha256) throw Error('Original SHA mismatch');
  const result = JSON.parse(raw), trace = [...(result.diagnostics?.browserTrace ?? []), ...(result.sourceTrace?.browserTrace ?? [])];
  const requests = [...(result.diagnostics?.networkRequests ?? []), ...trace.flatMap(entry => [...(entry.detail?.networkRequests ?? []), ...(entry.kind === 'NETWORK' && Array.isArray(entry.detail) ? entry.detail : [])])];
  const dispatched = requests.filter(request => request.outcome === 'ADMITTED');
  const recordingDirectory = result.browserRecording?.path;
  let recording = { status: 'NOT_RECORDED' };
  if (recordingDirectory) {
    try {
      const path = join(recordingDirectory, 'recording.json'), bytes = await fs.readFile(path), metadata = JSON.parse(bytes);
      const names = await fs.readdir(recordingDirectory);
      const network = (metadata.entries ?? []).flatMap(entry => entry.kind === 'NETWORK' && Array.isArray(entry.detail) ? entry.detail : []);
      recording = { status: 'READ_LOCAL_ORIGINAL', path, sha256: sha(bytes), replay: metadata.replay,
        harFiles: names.filter(name => name.endsWith('.har')), networkRecords: network.length,
        bodyBearingNetworkRecords: network.filter(request => ['postData','body','requestBody'].some(key => request[key] !== undefined)).length };
    } catch (error) { if (error.code !== 'ENOENT') throw error; recording = { status: 'ORIGINAL_NOT_AVAILABLE', path: recordingDirectory }; }
  }
  rows.push({ runId: row.runId, resultSha256: file.originalSha256, scope: 'Retained request records can repeat across snapshots; counts are not distinct network calls.',
    dispatchedRecords: dispatched.length, methodPathShapes: [...new Set(dispatched.map(request => `${request.method} ${request.origin}${request.pathname}`))],
    requestFieldNames: [...new Set(dispatched.flatMap(request => Object.keys(request)))],
    calendarPostRecords: dispatched.filter(request => request.method === 'POST' && request.pathname === '/v2/hub/availability_calendar_v2').length,
    reserveDocumentRecords: dispatched.filter(request => request.resourceType === 'document' && /(?:^|\/)reserve(?:\/|$)/i.test(request.pathname ?? '')).length,
    bodyBearingRequestRecords: dispatched.filter(request => ['postData','body','requestBody'].some(key => request[key] !== undefined)).length,
    recording, evaluatorReasons: row.severity.S0.reasons });
}
await fs.writeFile(outputPath, JSON.stringify({ status: 'PROOF_INVENTORY_ONLY_NOT_A_SCORE', summarySha256: sha(summaryBytes), rows }, null, 2), { flag: 'wx' });
console.log(JSON.stringify(rows.map(row => ({ runId: row.runId, dispatchedRecords: row.dispatchedRecords,
  calendarPostRecords: row.calendarPostRecords, bodyBearingRequestRecords: row.bodyBearingRequestRecords, recording: row.recording.status,
  harFiles: row.recording.harFiles, bodyBearingRecordedRequests: row.recording.bodyBearingNetworkRecords })), null, 2));
