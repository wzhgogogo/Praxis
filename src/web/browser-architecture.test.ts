import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import type { RestaurantCaseView } from '../application/agent-workspace.js';
import type { WorkspaceView } from './browser/view-contracts.js';

// A server DTO must remain assignable to the exact data-only subset read by the browser.
const publicView = (view:RestaurantCaseView):WorkspaceView => view;
void publicView;

test('Round16 browser strict types and static imports form a DAG',async()=>{
 const root=new URL('./browser/',import.meta.url);
 const files=(await readdir(root)).filter(name=>name.endsWith('.ts'));
 const graph=new Map<string,string[]>();
 for(const name of files){
  const source=await readFile(new URL(name,root),'utf8');
  assert.doesNotMatch(source,/\bany\b|@ts-(?:ignore|nocheck|expect-error)/,name);
  const edges=[...source.matchAll(/^import\s.*?from\s+["']\.\/([^"']+)\.js["']/gm)].map(match=>match[1]+'.ts');
  if(name!=='entry.ts')assert.ok(!edges.includes('entry.ts'),name+' cannot import entry');
  graph.set(name,edges);
 }
 const visited=new Set<string>(),active=new Set<string>();
 const visit=(name:string)=>{
  assert.ok(!active.has(name),'cycle through '+name);if(visited.has(name))return;
  assert.ok(graph.has(name),'missing module '+name);active.add(name);
  for(const edge of graph.get(name)!)visit(edge);
  active.delete(name);visited.add(name);
 };
 for(const name of files)visit(name);
 const config=JSON.parse(await readFile(new URL('../../tsconfig.web.json',import.meta.url),'utf8')) as {compilerOptions:{strict:boolean}};
 assert.equal(config.compilerOptions.strict,true);
});
