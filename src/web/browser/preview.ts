import type { WorkspaceView } from './view-contracts.js';
import { state } from "./runtime.js";
import { actions } from "./actions.js";
export const previewParameters=new URLSearchParams(location.search);
export const previewPace=previewParameters.get('pace')==='preview';
const requestedPaceStep=Number(previewParameters.get('paceStep')),paceStep=Number.isFinite(requestedPaceStep)&&requestedPaceStep>0?requestedPaceStep:1600;
const previewSteps=[paceStep,paceStep*2,paceStep*3,paceStep*3.875];
export function cancelPreparation(){state.preparing=null;}
export const fixturePresentation=(view:WorkspaceView)=>view.mode==='FIXTURE'||document.documentElement.dataset.fixturePreview==='true';
export function clearEntryPreview(){if(!state.preview)return;clearTimeout(state.preview.timer);state.preview=null;actions.refreshCaseLinks();}
export function clearEntryTransition(){state.pendingCase=null;state.entryPace=null;clearEntryPreview();}
export function startEntryPreview(view:WorkspaceView,startedAt:number){
 if(!previewPace||!fixturePresentation(view)||view.restaurant.progress.active||view.case.phase!=='PRESENT_RESULTS'||!(view.restaurant.presentedCandidateIds||[]).length)return;
 const preview={caseId:view.case.caseId,startedAt,phase:'understanding',timer:0};state.preview=preview;
 const advance=()=>{if(state.preview!==preview)return;const elapsed=performance.now()-startedAt;
  if(elapsed>=previewSteps[3]){clearEntryPreview();return;}
  preview.phase=elapsed<previewSteps[0]?'understanding':elapsed<previewSteps[1]?'finding':elapsed<previewSteps[2]?'checking':'card';const next=previewSteps.find(at=>at>elapsed);
  preview.timer=setTimeout(()=>{advance();actions.render();},Math.max(0,Math.ceil((next??previewSteps[3])-elapsed)));
 };advance();
}
