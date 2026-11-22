import assert from 'node:assert/strict';
import { startWorkspaceFixture } from '../../../src/harness/workspace-fixture-server.ts';
import { walk, responseOf } from './walkthrough-tools.mjs';

const cases = [
  ['supported', 'café with outdoor seating and serving beer', 'café with outdoor seating in Ginza'],
  ['coordinated', 'café with outdoor seating and beer', 'café with outdoor seating in Ginza'],
  ['has', 'restaurant that has beer', 'restaurant in Ginza'],
];
const inputs = [390,1440].flatMap(width => cases.map(([name,query,expected])=>({
  width, name:'f2-clean-input-'+name, start:()=>startWorkspaceFixture({beerDiscoveryQuery:query}),
  scenario:async ({main,host,receipt})=>{
    await main.create('Find me a restaurant that serves beer',0);
    await main.visible('#messages');
    assert.equal((await main.send('Ginza')).status(),200);
    await main.ready();
    const count=host.searches.length;
    const before=structuredClone(host.searches[count-1].intent);
    await main.click(main.page.locator('#request-conditions').getByRole('button',{name:'serves beer',exact:true}));
    const res=await responseOf(main.page,'POST','/messages',()=>main.click(main.page.getByRole('button',{name:'Remove serves beer',exact:true})));
    assert.equal(res.status(),200);
    await main.ready();
    assert.ok(host.searches.length>count,'another discovery request must reach source adapter');
    const after=host.searches[count].intent;
    const capsule=main.page.locator('#request-conditions').getByRole('button',{name:'serves beer',exact:true});
    assert.equal(await capsule.count(),0);
    assert.ok(!after.criteria.some(c=>c.text==='serves beer'));
    receipt.observed={caseId:(await res.json()).view.case.caseId,expected,before:before.target.query,after:after.target.query,criteria:after.criteria,visible:await main.page.locator('#request-conditions').innerText(),newSearches:host.searches.length-count};
    await main.image('post-removal');
    assert.equal(after.target.query,expected);
    return receipt.observed;
  },
})));
await walk('f2-clean-inputs',inputs);
