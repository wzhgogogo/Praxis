import '../child-observers.ts';
const {installObservers}=await import('../../../checkpoint-c-live-20261020/transports.ts');
installObservers();
const {runHybridLiveRead}=await import('../../../checkpoint-c-live-20261020/runner-entry-h13-600s-20261023.ts');
await runHybridLiveRead();
