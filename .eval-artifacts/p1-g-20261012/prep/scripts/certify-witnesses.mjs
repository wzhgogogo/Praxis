import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { captureVacancy, selectionComparison } from './post-delivery.mjs';

const root = '/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing';
const batch = resolve(root, '.eval-artifacts/p1-g-20261012');
const now = Date.now();
if (now < Date.parse('2026-10-13T00:00:00Z') || now >= Date.parse('2026-10-13T03:00:00Z')) throw Error('OUTSIDE_P1G_WITNESS_CERTIFICATION_WINDOW');
const manifest = JSON.parse(await readFile(resolve(batch, 'prep/scripts/freeze.json'), 'utf8'));
for (const [path, sha] of Object.entries(manifest.files)) {
  if (createHash('sha256').update(await readFile(path)).digest('hex') !== sha) throw Error('FROZEN_SCRIPT_OR_INPUT_CHANGED');
}
const ledger = JSON.parse(await readFile(resolve(batch, 'prep/ledger.json'), 'utf8'));
if (ledger.stop || ledger.formalRuns || ledger.cases['A:p1f-novel-kichijoji-tempura-20261020'].preflightAttempts) throw Error('CERTIFICATION_ALREADY_USED_OR_BATCH_STOPPED');
const old = JSON.parse(await readFile(resolve(root, '.eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json'), 'utf8'));
const previous = old.variants.find(v => v.variantId === 'p1f-novel-kichijoji-tempura-20261020');
if (!previous) throw Error('PRIOR_WITNESS_FACTS_MISSING');
const rows = [];
await mkdir(resolve(batch, 'witness-certification-raw'), { recursive: true });
for (const rst_id of ['13282321', '13303321', '13192886']) {
  const captured = await captureVacancy({ rst_id, svd: '20261020', svps: '2', svt: '1800' }, resolve(batch, 'witness-certification-raw'), rst_id);
  const comparison = captured.item.status === 200 ? selectionComparison(captured.body, ['18:00']) : { status: 'SELECTION_UNOBSERVED' };
  rows.push({ rst_id, raw: captured.item, comparison });
}
const supported = rows.some(row => row.comparison.status === 'DISPLAYED_TIMES_PRESENT');
const certifiedAt = new Date().toISOString();
const certificate = { certifiedAt, validUntil: new Date(Date.parse(certifiedAt) + 86400000).toISOString(),
  classification: supported ? 'KNOWN_FEASIBLE_SUPPORTED' : 'NOT_SUPPORTED', rows,
  scope: 'Inventory-only recertification; prior outlet/HARD/location evidence retained without a fresh claim.',
  variants: [{ ...previous, request: '2026-10-20 18:00 x2 tempura near Kichijoji', witnesses: rows.map(row => ({
    ...(previous.witnesses.find(w => new URL(w.sourceUrl).pathname.includes(row.rst_id)) ?? {}),
    sourceUrl: previous.witnesses.find(w => new URL(w.sourceUrl).pathname.includes(row.rst_id))?.sourceUrl ?? `https://tabelog.com/en/tokyo/A1320/A132001/${row.rst_id}/`, raw: row.raw,
  })) }] };
await writeFile(resolve(batch, 'witnesses.p1g.json'), JSON.stringify(certificate, null, 2), { flag: 'wx' });
if (!supported) {
  ledger.stop = { code: 'P1G_WITNESS_NOT_SUPPORTED', at: certifiedAt, reason: 'No observed witness selection contains 18:00; stop before Kichijoji.' };
  await writeFile(resolve(batch, 'prep/ledger.json'), JSON.stringify(ledger, null, 2));
}
console.log(JSON.stringify({ classification: certificate.classification, certifiedAt, validUntil: certificate.validUntil, raw: rows.map(row => row.raw.metadataPath), modelCalls: 0, googleCalls: 0 }, null, 2));
