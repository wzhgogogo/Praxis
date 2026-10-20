import {installObservers} from './transports.ts';
installObservers();
const {runHybridLiveRead}=await import('./runner-entry.ts');
await runHybridLiveRead();
