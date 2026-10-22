// One-time migration of already reviewed semantic identities to exact artifact
// indices. No labels and no runtime text-pair or synonym lookup.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const dir='.eval-artifacts/checkpoint-c-live-20261020/criterion-presentation-20261021';
const sha=b=>createHash('sha256').update(b).digest('hex');
const reviewPath='src/eval/restaurant/agent-loop/cases/criterion-equivalences.yaml';
const reviewSha256=sha(await fs.readFile(reviewPath));
if(reviewSha256!=='9880c47f54540947ea73d06dd8e530241cbce46f377f9a6f325bd6e7c8271440')throw Error('REVIEW_INPUT_CHANGED');
const historical={
 'p1fA-kf-h002-a1':[[0,0,'first-date-b'],[2,3,'sichuan-hunan'],[3,2,'hot-pot']],
 'p1fA-kf-h004-a1':[[1,2,'meet-friend']],
 'p1fA-kagurazaka-a1':[[0,0,'kaiseki']],
 'p1fA-kf-h003-a2':[[0,3,'team-dinner']],
 'p1fA-kichijoji-a2':[[0,0,'tempura']],
 'p1fB-h002-a1':[[0,0,'first-date-a'],[2,3,'sichuan-hunan'],[3,2,'hot-pot']],
 'p1fB-h003-a1':[[0,3,'team-dinner']],
 'p1g-kichijoji-a2':[[0,0,'tempura']],
 'p1g-h003-a2':[[0,3,'team-dinner']],
 'p1g-h004-a2':[[1,1,'meet-friend']],
 'p20-h002-a1':[[0,0,'first-date-a'],[2,3,'sichuan-hunan'],[3,2,'hot-pot']],
};
const entries=[];
function add(runId,artifactSha256,r,indices,review){
 const gold=r.materializedCase.semantic.criteria,actual=r.finalSnapshot.domainState.intentDraft.criteria;
 entries.push({runId,artifactSha256,pairs:indices.map(([goldIndex,actualIndex,entry])=>({goldIndex,actualIndex,semanticId:`semantic:criterion:${goldIndex}`,goldTextSha256:sha(gold[goldIndex].value??gold[goldIndex].text),actualTextSha256:sha(actual[actualIndex].text),refs:[`${reviewPath}#sha256=${reviewSha256}:entry=${entry}`,...review]}))});
}
const manifestPath='.eval-artifacts/calibration-phase1-20261015/inputs/manifest.json',manifest=JSON.parse(await fs.readFile(manifestPath));
for(const row of manifest.entries){if(!historical[row.runId])continue;const f=row.files.find(f=>f.kind==='RESULT');const b=gunzipSync(await fs.readFile(`.eval-artifacts/calibration-phase1-20261015/inputs/${f.path}`));if(sha(b)!==f.originalSha256)throw Error('ARTIFACT_CHANGED');add(row.runId,sha(b),JSON.parse(b),historical[row.runId],[`${manifestPath}:run=${row.runId}`]);}
const quick='.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021';
for(const [id,indices]of [['c-02',[[0,1,'first-date-a'],[2,3,'sichuan-hunan']]],['c-05',[[0,0,'kaiseki']]]]){
 const root=`${quick}/quick-live-results/${id}-attempt-1/runner`,p=(await fs.readdir(root)).find(p=>p.endsWith('.result.json')),bytes=await fs.readFile(`${root}/${p}`);add(id,sha(bytes),JSON.parse(bytes),indices,[`${quick}/independent-review.md@66269d74`]);
}
await fs.writeFile('src/eval/restaurant/agent-loop/cases/criterion-correspondences.json',JSON.stringify({schema:'artifact-criterion-correspondence@1',status:'frozen regression; exposed reviewed development inputs',rule:'Exact artifact SHA and reviewed index pairs only. This registry cannot establish source truth or be applied to another run.',entries},null,2),{flag:'wx'});
console.log(JSON.stringify({entries:entries.length,pairs:entries.reduce((n,r)=>n+r.pairs.length,0)}));
