from pathlib import Path
import hashlib,json,re
root=Path(__file__).resolve().parents[3];folder=root/'src/harness/browser';path=folder/'browser-read-fixture.test.ts'
source=path.read_text();lines=source.splitlines(keepends=True)
def part(start,end):return ''.join(lines[start-1:end])
imports=part(1,22)
helper=part(24,39)+part(193,204)+part(974,1019)
for name in ['url','identity']:helper=helper.replace(f'const {name} =',f'export const {name} =')
for name in ['replayHar','replayHarPages','exactGuideAvailabilityUrl','localFixture']:helper=helper.replace(f'function {name}(',f'export function {name}(')
helperImports='''import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";
import { CloudflareBrowserRun } from "../../infrastructure/browser/cloudflare-browser-run.js";
import type { BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";

'''
(folder/'browser-read-test-fixtures.ts').write_text(helperImports+helper)
groups={
 'browser-read-replay':[(40,192)],
 'browser-read-request-binding':[(206,647)],
 'browser-read-option-controls':[(648,973)],
 'browser-read-calendar-controls':[(1020,1297),(2446,2481)],
 'browser-read-search-controls':[(1298,1411)],
 'browser-read-tabelog':[(1412,1593),(1948,2005),(2218,2258)],
 'browser-read-page-controls':[(1594,1893),(2289,2337)],
 'browser-read-workspace':[(1894,1947),(2259,2288)],
 'browser-read-tablecheck':[(2006,2217)],
 'browser-read-stability':[(2338,2445),(2495,2516)],
 'browser-read-discovery':[(2482,2494),(2517,len(lines))],
}
rows=[]
# Keep import order stable; only omit bindings no longer used by a split file.
for name,ranges in groups.items():
 body='\n'.join(part(a,b) for a,b in ranges)
 used=[]
 for line in imports.splitlines():
  if not line.startswith('import '):continue
  names=re.findall(r'\b[A-Za-z_]\w*\b',line.split(' from ')[0].replace('import','').replace('type ',''))
  if any(re.search(r'\b'+re.escape(n)+r'\b',body) for n in names):used.append(line)
 shared=[n for n in ['url','identity','replayHar','replayHarPages','exactGuideAvailabilityUrl','localFixture'] if re.search(r'\b'+n+r'\b',body)]
 header='\n'.join(used)+'\n'
 if shared:header+='import { '+', '.join(shared)+' } from "./browser-read-test-fixtures.js";\n'
 target=folder/(name+'.test.ts');target.write_text(header+'\n'+body)
 rows.append({'file':str(target.relative_to(root)),'sourceRanges':ranges,'bodySha256':hashlib.sha256(body.encode()).hexdigest()})
assert len(re.findall(r'\btest\(',source))==sum(len(re.findall(r'\btest\(', (folder/(n+'.test.ts')).read_text())) for n in groups)
path.unlink()
(root/'.eval-artifacts/phase3a-prime/f1b/browser-split.json').write_text(json.dumps({'source':'src/harness/browser/browser-read-fixture.test.ts','files':rows,'sharedFixture':'src/harness/browser/browser-read-test-fixtures.ts','mechanism':'Unchanged test bodies, imports selected per file. P21c temporary output was fixed before the split; candidate-budget scaling is a subsequent explicit change.'},indent=2)+'\n')
p=root/'package.json';s=p.read_text().replace('--test src/harness/browser/*.test.ts','--test --test-concurrency=4 src/harness/browser/*.test.ts');p.write_text(s)
