/** Data-only subset of the public application workspace DTO. No server implementation imports.
 * Structural assignability is checked against RestaurantCaseView in slot-selection.test.ts. */
export interface WorkspaceUser { id:string; displayName:string }
export interface CaseSummary { caseId:string; conversationId:string; title:string; status:string; phase:string; taskVersion:number; stopped?:boolean; updatedAt:string }
export interface Offer { id:string; dateTime:string; partySize:number; displayExpiresAt?:string; price?:{amount:number;basis:'PER_PERSON'|'TOTAL'} }
export interface Candidate { restaurant:{id:string;outletName:string;address:string;sourceIds:Record<string,string>};matchReasons?:string[];distanceObservation?:{meters:number} }
export interface SourceQuote {field:string;quote:string;sourceUrl?:string}
export interface Evidence { evidenceId:string;candidateId?:string;kind:string;provider:string;sourceUrl?:string;observedAt:string;claims:Record<string,string|number|boolean|string[]>;sourceFieldQuotes?:SourceQuote[] }
export interface Condition {text:string;status:'MET'|'NOT_MET'|'NOT_CHECKED';strength:string;explanation?:string;evidenceIds:string[];sources:SourceQuote[]}
export interface Citation {text:string;url:string;readAt:string}
export interface Answer {status:'ANSWERED'|'NOT_STATED'|'UNVERIFIED';answer?:string|null;confirmationRequired?:boolean;citations?:Citation[];checkedPages:{url:string;readAt:string}[]}
export interface PageQuestion {requestId:string;question:string;candidateId:string;result?:Answer}
export interface Handoff {candidateId:string;offerId:string;provider:string;url:string;continueLabel:string;selectionHint?:string;verificationHint?:string;displayExpiresAt:string;terms:{label:string;citations:Citation[]}[];cancellationNotice?:string;cancellationConfirmation?:string;platformFee?:{label:string}}
export interface FeedbackPrompt {departure:{id:string}}
export interface IntentDraft {area?:{query:string;coordinates?:{latitude:number;longitude:number}};date?:string;timeWindow?:{earliest:string;latest:string};partySize?:number;partySizeSource?:string;budgetPerPerson?:{max:number};criteria:{text:string}[];target?:{goal:string}}
export interface WorkspaceView {
 mode:'FIXTURE'|'LIVE_READ';case:CaseSummary;conversation:{id:string;messages:{role:string;content:string}[]};
 restaurant:{
 requirementRevision:number;searchRevision:number;intentDraft?:IntentDraft;searchLocation?:{label:string}|undefined;
 progress:{active:boolean;stopped:boolean;discoveredCount?:number;checkedCount?:number};
 readStatus:{kind:'PENDING'|'RESULTS'|'NO_QUALIFIED_RESULTS'|'ALL_SOURCES_FAILED'|'MODEL_FAILURE'|'OTHER_FAILURE';partialSourceFailure:boolean;canContinue:boolean;canRetry:boolean};
 readyCandidateIds:string[];presentedCandidateIds?:string[];candidates:Candidate[];
 availability:Record<string,Offer[]>;availabilityChecks:Record<string,{status:string;displayExpiresAt?:string;evidenceIds:string[]}>;
 readEvidence:Evidence[];currentFactEvidence:Evidence[];conditionStates?:Record<string,Condition[]>;
 savedCandidates:{candidateId:string;outletName:string;current:boolean;reasonCode?:string}[];
 revisionDiff?:{removed:{candidateId:string;outletName:string;reasonCode:string}[];added:{candidateId:string;outletName:string}[]};
 shortlistCandidateIds?:string[];questionHistory:PageQuestion[];pageQuestion?:PageQuestion;bookingHandoffs?:Handoff[];bookingFeedbackAvailable?:boolean;
 sourceReadContext?:{runId:string;startedAt:string};clarificationQuestion?:string;missingRequiredFields:string[];
 }
}
export interface Photo { id:string;contentUrl:string;provider?:string;sourcePageUrl:string;sourceLabel:string;attribution?:string;authors?:{displayName:string;uri?:string}[] }
export interface PhotoResult {candidateId?:string;photos:Photo[];expiresAt:string;status?:string}
