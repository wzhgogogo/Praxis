export interface Slot { dateTime: string; partySize: number }
export interface Offer extends Slot { id: string }
export interface RevisionScope { userId:string; caseId:string; revision:number }
export interface SelectionScope extends RevisionScope { candidateId:string }
export type SelectionIntent = ({kind:'SELECTED'} & Slot) | {kind:'RECONFIRM'};
export function selectionKey(scope:SelectionScope):string {
 return 'praxis:slot:'+JSON.stringify([scope.userId,scope.caseId,scope.revision,scope.candidateId]);
}
export function reconfirmationKey(scope:RevisionScope):string {
 return 'praxis:slot-reconfirm:'+JSON.stringify([scope.userId,scope.caseId,scope.revision]);
}
export function readSelection(storage:Pick<Storage,'getItem'>,scope:SelectionScope):SelectionIntent|undefined {
 if(storage.getItem(reconfirmationKey(scope)))return {kind:'RECONFIRM'};
 const raw=storage.getItem(selectionKey(scope));if(!raw)return undefined;
 const value:unknown=JSON.parse(raw);
 if(!value||typeof value!=='object'||!('kind' in value)||value.kind!=='SELECTED'
  ||!('dateTime' in value)||typeof value.dateTime!=='string'||!('partySize' in value)
  ||typeof value.partySize!=='number'||!Number.isInteger(value.partySize))return undefined;
 return {kind:'SELECTED',dateTime:value.dateTime,partySize:value.partySize};
}
export function projectSelection(intent:SelectionIntent|undefined,offers:readonly Offer[]) {
 if(intent?.kind==='RECONFIRM')return {offerId:undefined,reselect:offers.length>0};
 const offer=intent?offers.find(item=>item.dateTime===intent.dateTime&&item.partySize===intent.partySize):offers[0];
 return {offerId:offer?.id,reselect:!!intent&&offers.length>0&&!offer};
}
