import fs from 'node:fs';
import {create} from '../freeze.mjs';
import {sha} from '../../../phase2b-exit-pipeline-20261022/inputs.mjs';
const path=process.argv[2];create(path);const f=JSON.parse(fs.readFileSync(path));f.schema='phase2c-live-random-gap-freeze@1';f.purpose='User-approved sequential continuation only; independently drawn120–240second finish-to-start intervals, original source cooldown and product limits unchanged';f.previousFreezeSha256=sha(fs.readFileSync('.eval-artifacts/phase2c-holdout/exit-live-20261023/live-freeze.json'));fs.writeFileSync(path,JSON.stringify(f,null,2)+'\n');console.log(JSON.stringify({sha256:sha(fs.readFileSync(path)),files:Object.keys(f.files).length}));
