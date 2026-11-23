import type {BrowserEngine,BrowserReadNetworkPolicy,BrowserSession,BrowserEntryNavigationEvent,BrowserSettlementDiagnostics} from './browser-runtime.js';
export const remoteMethods=['navigate','prepareNavigation','prepareObservedNavigation','beginReadScope','snapshot','flushRecordedResponses','captureResponses','observeControls','click','openLink','fill','select','setChecked','press','pressEscape','scroll','dismissTransientObstruction','waitFor','waitForSettled','screenshot','screenshotLayoutOnly','close'] as const;
export type RemoteMethod=typeof remoteMethods[number];
export type Recording=NonNullable<Parameters<import('./browser-runtime.js').BrowserRuntime['openSession']>[0]['recordResponse']>;
export interface RemoteStart {endpoint:string;apiToken:string;engine:BrowserEngine;timeoutMs:number;networkPolicy?:BrowserReadNetworkPolicy;record?:boolean;}
export interface RemoteState {closed:boolean;entries:readonly BrowserEntryNavigationEvent[];settlement?:BrowserSettlementDiagnostics;}
export type Call={kind:'call';id:number;method:RemoteMethod;args:unknown[]};
export type Reply={kind:'ready';metadata:BrowserSession['metadata']}|{kind:'reply';id:number;value?:unknown;error?:{code:string;message:string;detail?:import('./browser-runtime-errors.js').BrowserTransportError};state:RemoteState}|{kind:'record';id:number;value:Parameters<Recording>[0]};
