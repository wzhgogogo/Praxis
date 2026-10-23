import '../exit-live-20261023/child-observers.ts';
import {installObservers} from '../../checkpoint-c-live-20261020/transports.ts';
installObservers();
const {runHybridLiveRead}=await import('./runner-entry.ts');
await runHybridLiveRead();
