import type { CaseSummary, PageQuestion, WorkspaceView } from './view-contracts.js';
export type WorkspaceViewName = 'CANDIDATES'|'DETAILS'|'SAVED'|'HANDOFF';
export type ConditionKind = 'text'|'date'|'time'|'guests';
export type ConditionValue = string|number|{earliest:string;latest:string}|undefined;
/** Entry supplies the concrete callbacks once, before events or requests start. */
export interface WorkspaceActions {
 render():void;
 accept(view:WorkspaceView):boolean;
 api<T>(path:string,options?:RequestInit):Promise<T>;
 casePath(caseId:string):string;
 currentCase(nav:number,caseId:string|undefined):boolean;
 closeAnswer():void;
 editCondition(button:HTMLButtonElement,label:string,kind:ConditionKind,value:ConditionValue,removable?:boolean):void;
 finishPreparation():void;
 loadCase(caseId:string):Promise<void>;
 openAnswer(question:PageQuestion):void;
 openStream(caseId:string,nav:number):void;
 refreshCaseLinks():void;
 reportCaseError(error:unknown,nav:number,caseId:string|undefined):Promise<void>;
 resetCaseRequests():void;
 scheduleCaseListSync(immediate?:boolean):void;
 setView(view:WorkspaceViewName):void;
 updateCases(summary:CaseSummary):void;
}
export let actions:WorkspaceActions;
export function connectWorkspace(callbacks:WorkspaceActions){actions=callbacks;}
