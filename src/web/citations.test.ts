import assert from 'node:assert/strict';
import test from 'node:test';
import {groupCitations,questionCitations} from './browser/citation-groups.js';
test('Round20 citations group only identical URL/readAt and retain bilingual excerpt association',()=>{
 const a={url:'https://merchant.example/terms',readAt:'2026-11-21T08:04:00Z',text:'Original Japanese',label:'Japanese page: English paraphrase'};
 const b={...a,text:'Another original excerpt'};
 const groups=groupCitations([a,b,{...a,readAt:'2026-11-21T08:05:00Z',text:'Later terms'},{...a,url:'https://merchant.example/en/terms',text:'English source'},a]);
 assert.equal(groups.length,3);assert.deepEqual(groups[0]!.excerpts,[{text:a.text,label:a.label},{text:b.text,label:b.label}]);
 assert.deepEqual(groups.map(g=>g.readAt),['2026-11-21T08:04:00Z','2026-11-21T08:05:00Z','2026-11-21T08:04:00Z']);
 assert.equal(groupCitations([{url:a.url},{url:a.url,readAt:a.readAt}]).length,2,'an unknown reading time cannot be stamped with a known one');
});

test('Round23 Q&A cleanup recognizes only smoking headers in the same URL/readAt group',()=>{
 const source={url:'https://merchant.example/a',readAt:'2026-11-21T08:04:00Z'};
 const rows=(texts:string[])=>texts.map(text=>({...source,text}));
 assert.deepEqual(questionCitations(rows(['Non-smoking/smoking','Non smoking'])),rows(['Non smoking']));
 assert.deepEqual(questionCitations(rows(['禁煙・喫煙','全席禁煙'])),rows(['全席禁煙']));
 const payment=rows(['Visa/Mastercard','Visa']);assert.deepEqual(questionCitations(payment),payment);
 const different=[...rows(['Non-smoking/smoking']),{...source,text:'Non smoking',readAt:'2026-11-21T08:05:00Z'}];assert.deepEqual(questionCitations(different),different);
 const other=[...rows(['Non-smoking/smoking']),{...source,url:'https://merchant.example/b',text:'Non smoking'}];assert.deepEqual(questionCitations(other),other);
 assert.equal(groupCitations(rows(['Non-smoking/smoking','Non smoking']))[0]!.excerpts.length,2,'shared About/Handoff grouping retains both originals');
});
