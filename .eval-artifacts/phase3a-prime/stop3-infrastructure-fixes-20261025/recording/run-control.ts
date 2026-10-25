import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {runRecordingKeyScenario} from '../../../../src/harness/browser/fixtures/recording-key-scenario.js';
const root=resolve(process.argv[2]);await mkdir(root,{recursive:true});
console.log(JSON.stringify(await runRecordingKeyScenario(root)));
