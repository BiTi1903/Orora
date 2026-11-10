import {readFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const manifest=JSON.parse(await readFile('dist/.vite/manifest.json','utf8'));
const entries=Object.entries(manifest).filter(([,value])=>value.isEntry);
if(entries.length!==1)throw Error('Expected one built app entry');
const visited=new Set(),files=new Set();
const visit=key=>{if(visited.has(key))return;visited.add(key);const item=manifest[key];if(!item)throw Error('Missing manifest dependency');if(item.file.endsWith('.js'))files.add(item.file);for(const dependency of item.imports||[])visit(dependency);};
visit(entries[0][0]);
let bytes=0,gzipBytes=0;
for(const file of files){const source=await readFile(`dist/${file}`);bytes+=source.length;gzipBytes+=gzipSync(source).length;}
const passed=bytes<=1100000&&gzipBytes<=330000;
console.log(JSON.stringify({entry:entries[0][1].file,staticJsFiles:[...files],bytes,gzipBytes,maxBytes:1100000,maxGzipBytes:330000,passed,scope:'Entry and static JS imports, excludes deferred chunks; not Core Web Vitals'}));
if(!passed)process.exitCode=1;
