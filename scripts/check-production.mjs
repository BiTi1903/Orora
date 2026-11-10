// Read-only HTTP checks; curl inherits the session proxy/CA configuration.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const run=promisify(execFile),base=new URL(process.argv[2]||'https://ororavn.com');
if(!['http:','https:'].includes(base.protocol))throw Error('Only HTTP(S) origins are supported');
const origin=base.origin,checks=[];
for(const path of ['/','/robots.txt','/sitemap.xml','/tra-cuu-don-hang','/admin','/api/addresses','/api/chat']){
 const dir=await mkdtemp(join(tmpdir(),'orora-check-'));
 try{
  const {stdout}=await run('curl',['--proto','=https,http','--proto-redir','=https,http','--location','--max-redirs','3','--max-time','20','--max-filesize','2097152','--silent','--show-error','--dump-header',join(dir,'headers'),'--output',join(dir,'body'),'--write-out','%{json}',origin+path]);
  const metrics=JSON.parse(stdout),body=await readFile(join(dir,'body'),'utf8'),raw=await readFile(join(dir,'headers'),'utf8');
  const headers=Object.fromEntries((raw.split(/\r?\n\r?\n/).filter(block=>/^HTTP\//.test(block)).at(-1)||'').split(/\r?\n/).slice(1).map(line=>{const index=line.indexOf(':');return [line.slice(0,index).toLowerCase(),line.slice(index+1).trim()];}));
  const status=Number(metrics.http_code),check={path,status,ttfbMs:Math.round(metrics.time_starttransfer*1000),totalMs:Math.round(metrics.time_total*1000),ok:status>=200&&status<300};
  if(path==='/robots.txt')check.ok&&=/Sitemap:\s*https:\/\/ororavn\.com\/sitemap.xml/.test(body)&&/Disallow:\s*\/admin/.test(body);
  if(path==='/sitemap.xml')check.ok&&=/xml/.test(headers['content-type']||'')&&/<urlset\b/.test(body)&&!/<loc>[^<]*\/(?:admin|tra-cuu-don-hang)/.test(body);
  if(['/admin','/tra-cuu-don-hang'].includes(path)){check.noindex=/noindex/.test(headers['x-robots-tag']||'');check.ok&&=check.noindex;}
  if(path==='/api/addresses')check.ok&&=Array.isArray(JSON.parse(body).items);
  if(path==='/api/chat')check.ok&&=typeof JSON.parse(body).aiConfigured==='boolean';
  checks.push(check);
 }catch(error){checks.push({path,ok:false,error:typeof error.code==='number'?`curl_exit_${error.code}`:error.name});}
 finally{await rm(dir,{recursive:true,force:true});}
}
console.log(JSON.stringify({origin,checkedAt:new Date().toISOString(),checks,passed:checks.every(check=>check.ok),scope:'Read-only HTTP; does not prove hydrated SEO, Core Web Vitals or real checkout'},null,2));
if(checks.some(check=>!check.ok))process.exitCode=1;
