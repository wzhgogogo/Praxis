import {PlaywrightReadNetworkGuard} from '../../../../src/infrastructure/browser/playwright-read-network-guard.ts';
const install=PlaywrightReadNetworkGuard.prototype.install;
PlaywrightReadNetworkGuard.prototype.install=async function(context,...args){
 const guard=this;
 context.on('requestfailed',request=>{
  const url=new URL(request.url());
  console.error('E1_REQUEST_FAILED',JSON.stringify({method:request.method(),resourceType:request.resourceType(),origin:url.origin,pathname:url.pathname,failure:request.failure(),diagnostics:guard.snapshotDiagnostics(),requests:guard.snapshotRequests()}));
 });
 return install.call(this,context,...args);
};
