/** Bounded idempotent downloads from exact qualified Venus GitHub tag only. */
import fs from 'node:fs';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {atomic,json,requireValue} from './files.mjs';
import {verifyRelease} from './release.mjs';
const files=[['manifest.json',65536],['manifest.sig.json',16384],['bundle.tar.gz',16*1024*1024]];
export async function fetchRelease(tag,directory,trust,template){
 requireValue(/^venus-v(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$/.test(tag),'RELEASE_TAG');requireValue(!fs.existsSync(directory),'DOWNLOAD_DESTINATION_EXISTS');const staging=directory+'.partial';requireValue(!fs.existsSync(staging),'DOWNLOAD_INTERRUPTED_REQUIRES_EXPLICIT_CLEANUP');fs.mkdirSync(staging,{recursive:true,mode:0o700});const outcomes=[];
 for(const [file,max]of files){let complete=false;for(let attempt=0;attempt<4;attempt++){
  const url='https://github.com/psewdon1m/venus/releases/download/'+tag+'/'+file;let response;try{response=await fetch(url,{signal:AbortSignal.timeout(15000),redirect:'follow'});}catch{outcomes.push({file,attempt,code:'NETWORK_UNAVAILABLE'});if(attempt===3)throw new Error('DOWNLOAD_FAILED');await delay(250*2**attempt);continue;}
  if(!response.ok){outcomes.push({file,attempt,status:response.status});if(![429,502,503,504].includes(response.status)||attempt===3)throw new Error('DOWNLOAD_HTTP_'+response.status);const retry=Number(response.headers.get('retry-after'));await response.body?.cancel();await delay(Math.min(Number.isFinite(retry)&&retry>0?retry*1000:250*2**attempt,3000));continue;}
  const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;requireValue(size<=max,'DOWNLOAD_SIZE');chunks.push(chunk);}atomic(path.join(staging,file),Buffer.concat(chunks),0o644);outcomes.push({file,attempt,status:response.status,bytes:size});complete=true;break;
 }requireValue(complete,'DOWNLOAD_FAILED');}
 const verified=verifyRelease(staging,trust,{environment:'standalone-local-pilot-v2',schema:1,compose_template:template});requireValue(verified.manifest.tag===tag,'DOWNLOAD_TAG_MISMATCH');fs.renameSync(staging,directory);return {release_id:verified.release_id,outcomes};
}
if(process.argv[1]?.endsWith('fetch-release.mjs')){const [tag,directory,trust,template]=process.argv.slice(2);void fetchRelease(tag,directory,json(trust),template).then(value=>process.stdout.write(JSON.stringify(value)+'\n')).catch(error=>{process.stderr.write(JSON.stringify({code:/^[A-Z0-9_]+$/.test(error.message)?error.message:'DOWNLOAD_FAILED'})+'\n');process.exitCode=1;});}
