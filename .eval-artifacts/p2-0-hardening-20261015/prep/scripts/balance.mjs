import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

// Explicitly authorized account preflight. Never persist the bearer key.
export async function captureBalance(directory, transport = fetch, apiKey = process.env.DEEPSEEK_API_KEY) {
  const result = { requestedAt: new Date().toISOString(), method: 'GET', url: 'https://api.deepseek.com/user/balance', available: false };
  try {
    if (!apiKey?.trim()) throw Object.assign(new Error('Missing provider key'), { code: 'MISSING_DEEPSEEK_KEY' });
    const response = await transport(result.url, { method: 'GET', redirect: 'error',
      headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(10000) });
    const bytes = Buffer.from(await response.arrayBuffer());
    result.status = response.status;
    result.bodyPath = resolve(directory, 'balance.body.json');
    result.sha256 = createHash('sha256').update(bytes).digest('hex');
    await writeFile(result.bodyPath, bytes, { flag: 'wx' });
    result.available = response.status === 200 && JSON.parse(bytes.toString('utf8')).is_available === true;
  } catch (error) { result.errorCode = error.code ?? error.name; }
  result.finishedAt = new Date().toISOString();
  await writeFile(resolve(directory, 'balance.metadata.json'), JSON.stringify(result, null, 2), { flag: 'wx' });
  return result;
}
