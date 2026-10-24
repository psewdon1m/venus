/** Live control writes only; immutable payloads use the guarded Python chunk writer. */
import assert from 'node:assert/strict';
import {statfsSync} from 'node:fs';
export const METHOD05='METHOD05-HOST-OUTPUT-FENCES';
export function beforeHostAllocation(config,nextBytes=0,{probe=statfsSync}={}){
 if(config.global_owned_cap_bytes!==undefined)assert.equal(config.global_owned_cap_bytes,128*1024**2,'FIXED_METHOD05_CAP_REQUIRED');if(config.reserve_bytes!==undefined)assert.equal(config.reserve_bytes,10*1024**3,'FIXED_METHOD05_RESERVE_REQUIRED');
 assert(Number.isSafeInteger(nextBytes)&&nextBytes>=0&&nextBytes<=20*1024**2,'HOST_WRITE_SIZE_INVALID');
 let available;try{const s=probe(config.host_output_path,{bigint:true});assert(typeof s.bavail==='bigint'&&typeof s.bsize==='bigint'&&s.bsize>0n&&s.bsize<=65536n);available=s.bavail*s.bsize;}catch(e){throw Error('CAPACITY_FAULT:ACTUAL_HOST_SPACE_UNKNOWN:'+e.message);}
 assert(available>=BigInt(10*1024**3+128*1024**2),'CAPACITY_FAULT:ACTUAL_HOST_SPACE_LOW');
 return{available_bytes:available.toString(),prospective_bytes:nextBytes,global_owned_cap_bytes:128*1024**2,scope:'Actual host volume before write; full128MiB reserved conservatively, not a cached heartbeat substitute'};
}
