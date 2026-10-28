import fs from 'node:fs';
import cp from 'node:child_process';
import path from 'node:path';
import crypto from 'node:crypto';
const ts=(await import(path.resolve(process.argv[2] || (()=>{throw Error('PINNED_TYPESCRIPT_API_PATH_REQUIRED')})()))).default;
const root='.eval-artifacts/phase3b/test-suite-review';
const files=cp.execFileSync('git',['ls-files','src'],{encoding:'utf8'}).split('\n').filter(x=>x.endsWith('.test.ts'));
const cards=[];
const isTest=n=>ts.isCallExpression(n)&&/^(?:test|it|describe|suite|currentTest|probeTest)(?:\.(?:skip|todo|only))?$|^[a-zA-Z_$][\w$]*\.test$/.test(n.expression.getText());
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function pattern(n){
 if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))return esc(n.text);
 if(ts.isTemplateExpression(n))return esc(n.head.text)+n.templateSpans.map(x=>'.*?'+esc(x.literal.text)).join('');
 if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.PlusToken)return pattern(n.left)+pattern(n.right);
 return '.*';
}
for(const file of files){
 const source=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
 if(ast.parseDiagnostics.length)throw Error('UNPARSED_TEST_SOURCE:'+file);
 const imports=ast.statements.filter(ts.isImportDeclaration).map(n=>n.moduleSpecifier.text);
 const line=n=>ast.getLineAndCharacterOfPosition(n.getStart(ast)).line+1;
 function walk(n){
  if(isTest(n)){
   const first=n.arguments[0],cb=[...n.arguments].reverse().find(a=>ts.isArrowFunction(a)||ts.isFunctionExpression(a));
   if(first&&cb){
    const assertions=[],calls=new Set(),inputStatements=[];
    function parts(x){
     if(x!==cb.body&&isTest(x))return;
     if(ts.isCallExpression(x)){
      const name=x.expression.getText(ast);
      if(/^assert(?:\.|$)/.test(name))assertions.push(x.getText(ast).replace(/\s+/g,' ').slice(0,900));
      else if(!/^(?:JSON|Object|Array|String|Number|Date|Map|Set|Math|console)\./.test(name))calls.add(name);
     }
     if(ts.isVariableDeclaration(x)||ts.isIfStatement(x))inputStatements.push(x.getText(ast).replace(/\s+/g,' ').slice(0,500));
     ts.forEachChild(x,parts);
    }
    parts(cb.body);
    let parent=n.parent,parentId;
    while(parent){if(isTest(parent)){const p=parent.arguments[0];if(p){parentId=file+':'+line(parent);break;}}parent=parent.parent;}
    cards.push({id:file+':'+line(n),title:ts.isStringLiteralLike(first)?first.text:first.getText(ast),titleSource:first.getText(ast),titlePattern:'^'+pattern(first)+'$',file,line:line(n),end:ast.getLineAndCharacterOfPosition(n.end).line+1,callee:n.expression.getText(ast),parentId,container:/^(describe|suite)/.test(n.expression.getText(ast)),cohort:n.expression.getText(ast)==='probeTest'?'FROZEN_PROBE':file.startsWith('src/harness/browser/')?'CHROMIUM':'DEFAULT',assertions,calls:[...calls],inputStatements,imports,body:cb.body.getText(ast),sourceSha256:crypto.createHash('sha256').update(source).digest('hex')});
   }
  }
  ts.forEachChild(n,walk);
 }
 walk(ast);
}
fs.writeFileSync(root+'/static-cards.json',JSON.stringify(cards,null,2)+'\n');
const by={};for(const c of cards)(by[c.file]??=[]).push(c);
fs.writeFileSync(root+'/static-files.json',JSON.stringify(Object.fromEntries(Object.entries(by).map(([file,v])=>[file,{count:v.length,asserts:v.reduce((n,c)=>n+c.assertions.length,0)}])),null,2)+'\n');
console.log(JSON.stringify({files:files.length,filesWithDeclarations:Object.keys(by).length,declarations:cards.length,containers:cards.filter(c=>c.container).length,probeOnly:cards.filter(c=>c.cohort==='FROZEN_PROBE').length}));
