import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const dir='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/evaluation-20261023';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64*1024*1024});
const baseline=git('rev-parse','025940c5').trim(),current=git('rev-parse','HEAD').trim(),sha=b=>createHash('sha256').update(b).digest('hex');
const paths=commit=>git('ls-tree','-r','--name-only',commit,'src','web-skills').trim().split('\n').filter(Boolean);
const oldPaths=paths(baseline),newPaths=paths(current),all=[...new Set([...oldPaths,...newPaths])].sort();
const runtime=p=>p.endsWith('.ts')&&!p.endsWith('.test.ts')&&!p.startsWith('src/eval/')&&!p.startsWith('src/harness/');
const provider=p=>/^src\/integrations\/(tabelog|tablecheck)\//.test(p)&&runtime(p);
const mixed=p=>runtime(p)&&/^src\/integrations\//.test(p)&&!provider(p)&&/tabelog|tablecheck/i.test((oldPaths.includes(p)?git('show',`${baseline}:${p}`):'')+' '+(newPaths.includes(p)?git('show',`${current}:${p}`):''));
const extra=['src/integrations/restaurant-search/source-packs.ts','src/integrations/restaurant-search/native-restaurant-search.ts'];
const selected=all.filter(p=>provider(p)||mixed(p)||extra.includes(p));
function lines(text){
 const rows=text.replace(/\n$/,'').split('\n');if(!text)return{physical:0,nonblank:0};
 return{physical:rows.length,nonblank:rows.filter(s=>s.trim()).length};
}
const rows=selected.map(p=>{const before=oldPaths.includes(p)?git('show',`${baseline}:${p}`):'',after=newPaths.includes(p)?git('show',`${current}:${p}`):'';return{path:p,scope:provider(p)?p.split('/')[2]:'mixed-provider-containing-production-file',before:lines(before),after:lines(after),beforeSha256:sha(before),afterSha256:sha(after)};});
function total(items,field){return Object.fromEntries(['physical','nonblank'].map(k=>[k,items.reduce((n,r)=>n+r[field][k],0)]));}
const scopes=[['provider-directories',rows.filter(r=>r.scope!=='mixed-provider-containing-production-file')],['provider-and-mixed-files',rows]].map(([scope,items])=>{const before=total(items,'before'),after=total(items,'after');return{scope,files:items.length,before,after,delta:Object.fromEntries(Object.keys(before).map(k=>[k,after[k]-before[k]]))};});
const shared=all.filter(p=>runtime(p)&&/^src\/(core|application|domains|infrastructure)\//.test(p));
const patterns=/tabelog|tablecheck|google\.com|maps\.google|asakusa|kachidoki|tsukishima|ebisu|hiroo|ikebukuro|otsuka|azabu|shinbashi|shimbashi|hamamatsucho|kuramae|sukiyaki|monjayaki|soba|oden|French|Thai|matsumoto|kagurazaka|kichijoji|sangenjaya|gotanda|ningyocho|shimokitazawa|akasaka|ueno|shibuya|ginza|shinjuku|omakase|kaiseki|yakitori|shabu|cantonese|sichuan|dim.sum|tempura|Italian|Chinese|神楽坂|吉祥寺|五反田|三軒茶屋|天ぷら|緯度|経度|\b(?:lat|lng|latitude|longitude)\s*:\s*(?:35\.|139\.)/i;
const candidates=[];
for(const p of shared){
 const diff=git('diff','--unified=0',baseline,current,'--',p);let line=0;
 for(const s of diff.split('\n')){const m=s.match(/^@@ .*\+(\d+)/);if(m){line=Number(m[1]);continue;}if(s.startsWith('+++'))continue;if(s.startsWith('+')){if(patterns.test(s.slice(1)))candidates.push({path:p,line,text:s.slice(1)});line++;}else if(s.startsWith(' '))line++;}
}
const genericSkills=all.filter(p=>p.startsWith('web-skills/')&&!/^web-skills\/(tabelog|tablecheck)\//.test(p));
for(const p of genericSkills)for(const s of git('diff','--unified=0',baseline,current,'--',p).split('\n'))if(s.startsWith('+')&&!s.startsWith('+++')&&patterns.test(s.slice(1)))candidates.push({path:p,text:s.slice(1)});
assert.equal(candidates.length,0,'Do not silently certify shared-layer generality; inspect every candidate');
const report={schema:'phase2-generality-audit@1',status:scopes.every(s=>Object.values(s.delta).every(v=>v<=0))?'SATISFIED':'NOT_SATISFIED',
 baseline:{commit:baseline,authority:'Phase 2 Playbook §1 starts after signed E1; 025940c5 approved Phase 2 before P2-1 implementation. The immediately prior E1 signoff d6031c48 has the same relevant production files.',priorSignoff:'d6031c48'},currentCommit:current,
 countingRule:'Production TypeScript only, no tests, fixtures, eval, harness or generated dependencies. Primary narrow scope is complete Tabelog/TableCheck directories. Expanded scope adds whole integration files containing either provider plus native restaurant search/source packs; mixed whole files are conservative, not credited as exclusively site-specific. Physical total includes blank/comment lines; nonblank is also shown. These are reproducible source-file lines, not parser-dependent statements. Both scopes must not increase to certify the requirement.',
 scopes,files:rows,sharedLayer:{status:'SATISFIED_WITH_REVIEWABLE_SCOPE',scope:'all non-test production core/application/domain/infrastructure TypeScript and generic web-skills',checkedFiles:shared.length+genericSkills.length,candidateAddedConstants:candidates,method:'Review additions against site/place/cuisine/evaluation-coordinate patterns; unchanged provider enum contracts and integration source packs are separate. This bounded static audit is not a proof about arbitrary dynamically constructed constants.'}};
for(const r of rows)if(oldPaths.includes(r.path))assert.equal(git('show',`d6031c48:${r.path}`),git('show',`${baseline}:${r.path}`));
await fs.writeFile(`${dir}/generality-audit.json`,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({baseline,scopes,sharedCandidates:candidates.length,status:report.status}));
