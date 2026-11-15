import {readdir,readFile,writeFile}from'node:fs/promises';import{resolve,join,dirname,relative}from'node:path';import{fileURLToPath}from'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const secretValues=[...new Set(Object.entries(process.env).filter(([key,value])=>/(?:API_KEY|SECRET|PASSWORD|ACCESS_TOKEN|AUTH_TOKEN)$/i.test(key)&&value&&value.length>=8).map(([,value])=>value))];
const hits=[];let count=0,totalBytes=0;
async function scan(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=join(dir,entry.name);if(entry.isDirectory())await scan(file);else if(entry.isFile()){const data=await readFile(file);count++;totalBytes+=data.length;if(secretValues.some(secret=>data.includes(Buffer.from(secret))))hits.push(relative(root,file));}}}
await scan(root);
const result={filesScanned:count,bytesScanned:totalBytes,configuredCredentialValuesChecked:secretValues.length,credentialHits:hits};
await writeFile(join(root,'privacy-final.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));if(hits.length)process.exitCode=1;
