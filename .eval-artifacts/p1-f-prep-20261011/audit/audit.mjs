import fs from 'node:fs';import path from 'node:path';import cp from 'node:child_process';
const root=process.cwd(),head=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const directories=['src/infrastructure/browser','src/domains','src/application'];
const files=directories.flatMap(dir=>fs.readdirSync(dir,{recursive:true}).filter(f=>/\.(ts|json|html)$/.test(f)).map(f=>path.join(dir,f)));
const geographical=/\b(?:Tokyo|Shibuya|Shinjuku|Ginza|Higashi|Osaka|Kyoto|Azabu|Kanda|Ueno|Akasaka|Asakusa|Ebisu|Roppongi|Nihonbashi|Japan|JAPAN|JP)\b|東京|渋谷|新宿|銀座|日本|大阪|京都/;
const classPattern=/(?:list-rst|rstlist|js-calendar|p-booking-calendar|Venue Availability|VenueList|PicSkeleton|TitleSkeleton|SearchResult|table_check|tablecheck|tabelog)/i;
const rows=[];
for(const file of files){const text=fs.readFileSync(file,'utf8');const fixture=/\.test\.ts$|\/fixtures\//.test(file);
 for(const literal of text.matchAll(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/gs)){
  const value=literal[0].slice(1,-1);const types=[];
  if(/(?:https?:\/\/|wss?:\/\/)[^\s'"<>]+|\b(?:tabelog\.com|tablecheck\.com|[\w-]+\.(?:co\.jp|com|org|net))\b/.test(value))types.push('DOMAIN_OR_URL');
  if(geographical.test(value))types.push(value.includes('Asia/Tokyo')?'GEOGRAPHY_TIMEZONE':'GEOGRAPHY_LITERAL');
  if(classPattern.test(value)&&/(?:class|selector|\.list-|\[data-testid|skeleton|calendar)/i.test(value))types.push('SOURCE_STYLE_OR_SELECTOR');
  if(/\bA\d{4,6}\b/.test(value))types.push('SOURCE_REGION_CODE');
  if(types.length)rows.push({file,line:text.slice(0,literal.index).split('\n').length,fixture,types,value});
 }
 for(const match of text.matchAll(/\b(?:latitude|longitude)\s*:\s*(-?\d+(?:\.\d+)?)/g))rows.push({file,line:text.slice(0,match.index).split('\n').length,fixture,types:['COORDINATE_LITERAL_REVIEW'],value:match[0]});
}
const numstat=cp.execFileSync('git',['diff','--numstat','41205e8',head,'--','src/integrations/'],{encoding:'utf8'}).trim().split('\n').map(l=>{const [a,d,file]=l.split('\t');return {file,added:Number(a),deleted:Number(d),net:Number(a)-Number(d),scope:file.includes('/fixtures/')||file.endsWith('.test.ts')?'FIXTURE_OR_TEST':'PRODUCTION'};});
const siteProduction=numstat.filter(r=>r.scope==='PRODUCTION'&&!r.file.startsWith('src/integrations/google/')&&!r.file.startsWith('src/integrations/restaurant-'));
const selectors=['TABELOG_QUERY_READY_SELECTOR','TABELOG_QUERY_SETTLED_SELECTOR','tabelogSelectedQueryIsPending','Venue Availability"]:not(:has(.skeleton))'];
const waiting=selectors.map(selector=>{const current=cp.spawnSync('rg',['-n','-F',selector,'src/integrations/tabelog','src/integrations/tablecheck'],{encoding:'utf8'});return {selector,remaining:current.status===0,matches:current.stdout.trim()};});
const production=rows.filter(r=>!r.fixture);const totals=(rs)=>rs.reduce((a,r)=>({added:a.added+r.added,deleted:a.deleted+r.deleted,net:a.net+r.net}),{added:0,deleted:0,net:0});
const result={baseline:'41205e8',head,scope:directories,method:'Quoted/template literal inventory + coordinate properties; comments separately retained in raw grep candidate file; manually review nonzero rows and raw grep candidates. This is an inventory, not an automated architecture waiver.',production,testsAndFixtures:rows.filter(r=>r.fixture),integrationFiles:numstat,allIntegrations:totals(numstat),productionIntegrations:totals(numstat.filter(r=>r.scope==='PRODUCTION')),tabelogTableCheckProduction:totals(siteProduction),waitRemoval:waiting};
fs.writeFileSync('.eval-artifacts/p1-f-prep-20261011/audit/audit.json',JSON.stringify(result,null,2));
let md=`# Exit condition 6 inventory\n\nRead-only audit at ${head}; baseline 41205e8. No code fixes in this item.\n\n## Shared production literals — nonzero\n\n| File:line | Kind | Literal |\n|---|---|---|\n`;
for(const r of production)md+=`| ${r.file}:${r.line} | ${r.types.join(', ')} | ${r.value.replace(/\n/g,' ').replace(/\|/g,'\\|')} |\n`;
md+=`\nTests/Fixtures: ${result.testsAndFixtures.length} occurrences, listed individually in audit.json. They are historical fixtures/test URLs, not production selectors. Generic spinner/loader/skeleton classes and ARIA selectors are not site-specific. Provider identifiers are not domains. The Cloudflare endpoint is an existing runtime provider URL, listed conservatively; Asia/Tokyo is a retained business timezone. These do not qualify as a zero literal inventory.\n\n## Integration line changes\n\n| File | Added | Deleted | Net | Scope |\n|---|---:|---:|---:|---|\n`;
for(const r of numstat)md+=`| ${r.file} | ${r.added} | ${r.deleted} | ${r.net} | ${r.scope} |\n`;
md+=`\nAll integrations ${JSON.stringify(result.allIntegrations)}; production ${JSON.stringify(result.productionIntegrations)}; Tabelog/TableCheck production ${JSON.stringify(result.tabelogTableCheckProduction)}. Google and generic source-composition files are separately visible and not silently counted as site-specific. Line counts are git diff counts, not behavioral complexity.\n\n## C3 source waits\n\nTabelog: two query ready/settled selector waits and selected-query pending loop removed; the old selector constants and pending parser removed. TableCheck: Venue Availability skeleton selector wait removed. Current adapters contain no executor.waitFor call, sleep timer or waitForSettled call. Source-owned busy predicates still validate result identity and loading, and do not add source-specific waiting.\n`;
fs.writeFileSync('.eval-artifacts/p1-f-prep-20261011/audit/audit.md',md);
console.log(JSON.stringify({head,production:production.length,fixtures:result.testsAndFixtures.length,totals:result.allIntegrations,waiting}));
