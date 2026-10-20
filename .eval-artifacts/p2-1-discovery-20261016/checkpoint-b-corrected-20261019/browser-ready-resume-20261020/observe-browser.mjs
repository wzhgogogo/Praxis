// Passive outer evidence for the approved cooldown rule; no request or page operation is added.
import {appendFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {LocalPlaywrightChromium} from 'file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/infrastructure/browser/local-playwright-chromium.ts';

export function busyQuote(text) {
  return String(text ?? '').match(/アクセスが集中[^。\n]{0,180}|ただいま[^。\n]{0,60}混み合[^。\n]{0,100}|Search is unavailable right now\.\s*Please try again\.|temporarily unavailable due to (?:high traffic|heavy traffic)/i)?.[0] ?? null;
}
export function sourceResponse(response) {
  try {
    const u=new URL(response.url),host=u.hostname;
    return [403,503].includes(response.status) && ['document','xhr','fetch'].includes(response.resourceType)
      && (host==='tabelog.com'||host.endsWith('.tablecheck.com')||host==='tablecheck.com'||host.endsWith('.tablecheck.net'));
  } catch { return false; }
}
export function installOuterBrowserObservation(directory) {
  const original=LocalPlaywrightChromium.prototype.openSession;
  const record=detail=>appendFileSync(resolve(directory,'outer-environment-observations.jsonl'),JSON.stringify({at:new Date().toISOString(),...detail})+'\n');
  LocalPlaywrightChromium.prototype.openSession=async function(options={}) {
    const session=await original.call(this,{...options,...(options.recordResponse?{recordResponse:response=>{
      const value=options.recordResponse?.(response);
      if(sourceResponse(response))record({kind:'SOURCE_HTTP_RETRY_SIGNAL',url:response.url,status:response.status,resourceType:response.resourceType,method:response.method});
      return value;
    }}:{})});
    const snapshot=session.snapshot.bind(session);
    session.snapshot=async(...args)=>{
      const page=await snapshot(...args),quote=busyQuote(page.text);
      if(quote)record({kind:'SOURCE_BUSY_PAGE',url:page.url,quote});
      return page;
    };
    return session;
  };
}
