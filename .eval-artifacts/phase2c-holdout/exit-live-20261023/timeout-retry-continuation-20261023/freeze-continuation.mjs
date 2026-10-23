import fs from 'node:fs';
import {create} from '../freeze.mjs';
import {sha} from '../../../phase2b-exit-pipeline-20261022/inputs.mjs';
const path=process.argv[2];create(path);const f=JSON.parse(fs.readFileSync(path));f.schema='phase2c-user-timeout-retry-freeze@1';f.purpose='User-authorized h01/h13 timeout retries once each, then h14–18; sequential random120–240s intervals; eval-only hard termination enforces original500s ceiling; product,Gold,Runner and evaluator unchanged';f.previousFreezeSha256=sha(fs.readFileSync('.eval-artifacts/phase2c-holdout/exit-live-20261023/sequential-continuation-20261023/live-freeze.json'));fs.writeFileSync(path,JSON.stringify(f,null,2)+'\n');console.log(JSON.stringify({sha256:sha(fs.readFileSync(path)),files:Object.keys(f.files).length}));
