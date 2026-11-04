/** Offline component diagnosis only: no model/network/browser/state mutation. */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {locationSuggestionMatches} from '../../../../src/integrations/restaurant-search/location-suggestions.js';
import {tabelogDiscoveryPack} from '../../../../src/integrations/restaurant-search/source-packs.js';
import {namedOutletIdentityPrefix,boundNames,namedOutletCandidateResolved} from '../../../../src/domains/restaurant/named-outlet-resolution.js';
const root='.eval-artifacts/phase3b/g6-rerun-20261104/next-two';
const input=JSON.parse(await readFile(root+'/diagnostic-inputs.json','utf8'));
for(const f of input.files)if(createHash('sha256').update(await readFile(f.path)).digest('hex')!==f.sha256)throw Error('Frozen diagnosis input changed: '+f.path);
const station=input.D4.observedStationControls.map((v:any)=>({...v,nameMatches:locationSuggestionMatches(v.control,input.D4.location),packRegionEntrance:tabelogDiscoveryPack.browser!.directory!.isRegionEntrance(v.control.href),combinedSelectionFilter:locationSuggestionMatches(v.control,input.D4.location)&&tabelogDiscoveryPack.browser!.directory!.isRegionEntrance(v.control.href)}));
const artifact=JSON.parse(await readFile(input.D8.path,'utf8')),state=artifact.execution.finalSnapshot.domainState;
const prefix=namedOutletIdentityPrefix(state);const identity=prefix.map(id=>({candidateId:id,name:state.candidates.find((c:any)=>c.restaurant.id===id)?.restaurant.outletName,boundNames:boundNames(state,id),nativeHigh:state.readEvidence.filter((e:any)=>e.candidateId===id&&e.kind==='ENTITY_MATCH'&&e.provider!=='GOOGLE_PLACES'&&e.entityMatch?.confidence==='HIGH').map((e:any)=>({provider:e.provider,sourceEntityId:e.sourceEntityId,observedOutletName:e.claims?.observedOutletName})),resolved:namedOutletCandidateResolved(state,id)}));
const result={mode:input.mode,fullReplay:false,realCalls:0,D4:{station,firstFilter:'native-restaurant-search.ts matchesSuggestion -> locationSuggestionMatches AND Pack isRegionEntrance',limit:'Recorded href path /en/ fails regardless of sanitized query; no claim that bypassing this filter would produce a valid submitted station query or delivery'},D8:{target:state.intentDraft?.target,identity,limit:'No accepted native identity: the approved unique-high rule has no usable exact source name; this is not the previous one-high-plus-unknown-peer condition'}};
await writeFile(root+'/diagnostic-findings.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
