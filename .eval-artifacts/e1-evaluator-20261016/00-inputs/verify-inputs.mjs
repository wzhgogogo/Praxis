import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
const dir = '.eval-artifacts/calibration-phase1-20261015/inputs';
const manifest = JSON.parse(fs.readFileSync(`${dir}/manifest.json`));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const expected = 'p1fA-kf-h001-a1 p1fA-kf-h002-a1 p1fA-kf-h003-a1 p1fA-kf-h004-a1 p1fA-kf-h005-a1 p1fA-kagurazaka-a1 p1fA-nakameguro-a1 p1fA-kf-h003-a2 p1fA-kf-h005-a1r p1fA-kichijoji-a2 p1fB-h001-a1 p1fB-h002-a1 p1fB-h003-a1 p1fB-h004-a1 p1fB-h005-a2 p1g-kichijoji-a2 p1g-h001-a1 p1g-h003-a2 p1g-h004-a2 p1g2-h001-a4 p20-h002-a1 p20-h001-a1'.split(' ').sort();
if (JSON.stringify(manifest.entries.map(entry => entry.runId).sort()) !== JSON.stringify(expected)) throw Error('run set mismatch');
let bytes = 0, files = 0;
for (const entry of manifest.entries) {
  if (entry.status === 'RESULT_NOT_GENERATED' && JSON.stringify(entry.files.map(file => file.kind).sort()) !== JSON.stringify(['DECISIONS','OUTER_FINISH','OUTER_INTERRUPTION','STARTED','TRACE'])) throw Error('incomplete interrupted bundle');
  for (const file of entry.files) {
    const compressed = fs.readFileSync(`${dir}/${file.path}`), raw = zlib.gunzipSync(compressed);
    if (sha(compressed) !== file.gzipSha256 || sha(raw) !== file.originalSha256 || raw.length !== file.originalBytes || compressed.length !== file.gzipBytes || !raw.equals(fs.readFileSync(file.originalPath))) throw Error(`integrity: ${file.path}`);
    bytes += compressed.length; files++;
  }
}
if (bytes !== manifest.gzipBytes || bytes > 60_000_000) throw Error('size');
console.log(JSON.stringify({result:'PASS', runs:22, results:20, interrupted:2, files, gzipBytes:bytes, manifestSha256:sha(fs.readFileSync(`${dir}/manifest.json`))}, null, 2));
