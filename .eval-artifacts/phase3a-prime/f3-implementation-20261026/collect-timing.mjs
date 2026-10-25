import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const files=execFileSync('git',['ls-files','-z','src'],{encoding:'utf8'}).split('\0').filter(path=>path.endsWith('.test.ts'));
const rows=[];
for(const file of files){
 const raw=readFileSync(file,'utf8');
 // Inventory source spans, not runtime test counts. Shared helpers following a
 // declaration remain in that candidate's span and are assessed explicitly.
 const starts=[{index:0,1:'<shared timing helpers>'},...raw.matchAll(/\b(?:test|it)\s*\(\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g)];
 for(const [index,node] of starts.entries()){
   const text=raw.slice(node.index,starts[index+1]?.index??raw.length);
   const patterns=[...text.matchAll(/setTimeout|setInterval|Date\.now\(\)|performance\.now\(\)|waitForTimeout|await\s+(?:delay|sleep|wait)\(/g)];
   if(patterns.length){
    const line=raw.slice(0,node.index).split('\n').length;
    rows.push({file,line,name:node[1],mechanisms:[...new Set(patterns.map(match=>match[0]))],
     injectedClock:/mock\.(?:timers|method\([^\n]*(?:Date|setTimeout))|now\s*:\s*\(\)/.test(text),
     timingLines:text.split('\n').map((value,index)=>({line:line+index,text:value.trim()})).filter(row=>/setTimeout|setInterval|Date\.now|performance\.now|timeoutMs|BudgetMs|maxElapsed|assert\.(?:ok|equal).*elapsed|await\s+(?:delay|sleep|wait)\(/.test(row.text))});
   }
 }
}
writeFileSync(process.argv[2],JSON.stringify({status:'timing inventory; needs per-mechanism disposition',scannedTestFiles:files.length,tests:rows},null,2)+'\n');
console.log(JSON.stringify({files:files.length,timingTests:rows.length,names:rows.map(({file,line,name,injectedClock})=>({file,line,name,injectedClock}))}));
