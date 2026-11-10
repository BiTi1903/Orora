import {readdir,readFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const files=(await readdir('dist/assets')).filter(name=>/^index-.*\.js$/.test(name));
if(files.length!==1)throw Error('Expected one built app entry');
const source=await readFile(`dist/assets/${files[0]}`),gzip=gzipSync(source).length;
const passed=source.length<=1100000&&gzip<=330000;
console.log(JSON.stringify({entry:files[0],bytes:source.length,gzipBytes:gzip,maxBytes:1100000,maxGzipBytes:330000,passed,scope:'Entry bundle only, not network/Core Web Vitals'}));
if(!passed)process.exitCode=1;
