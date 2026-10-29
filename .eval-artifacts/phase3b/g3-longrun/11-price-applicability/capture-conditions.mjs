// Offline async loader. Record actual calls without changing returned values.
const suffix = '/src/domains/restaurant/condition-states.ts';
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (!url.split('?')[0].endsWith(suffix) || !process.env.PRAXIS_HARD_CAPTURE) return result;
  let source = Buffer.isBuffer(result.source) ? result.source.toString() : String(result.source);
  const exported = source.includes('export function assessRestaurantConditions(');
  const needle = exported ? 'export function assessRestaurantConditions(' : 'function assessRestaurantConditions(';
  if (!source.includes(needle)) throw Error('Condition capture could not locate the real function');
  source = source.replace(needle, 'function capturedOriginalConditions(');
  source += `\nimport { appendFileSync as appendHardCapture } from 'node:fs';
${exported ? 'export ' : ''}function assessRestaurantConditions(...args) {
  const result = capturedOriginalConditions(...args);
  appendHardCapture(process.env.PRAXIS_HARD_CAPTURE, JSON.stringify({intent:args[0],facts:args[1],conditions:result})+'\\n');
  return result;
}\n`;
  return {...result,source};
}
