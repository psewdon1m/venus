/** Versioned resource wrapper: preserves accepted v2 path/stream checks verbatim. */
import assert from 'node:assert/strict';
import {statfsSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {ArtifactStore as CheckedTree} from './artifact-store-v2.mjs';
export const MIN_RESERVE_BYTES=10n*1024n**3n;
function nearestExisting(path){let p=resolve(path);while(!existsSync(p)){const parent=dirname(p);assert(parent!==p,'ARTIFACT_VOLUME_UNAVAILABLE');p=parent;}return p;}
export function assertFreeSpace(path,nextBytes,{reserve=MIN_RESERVE_BYTES,probe=statfsSync}={}){assert(typeof reserve==='bigint'&&reserve>=MIN_RESERVE_BYTES,'MINIMUM_FREE_RESERVE_REQUIRED');assert(Number.isSafeInteger(nextBytes)&&nextBytes>=0,'NEXT_WRITE_SIZE_INVALID');const s=probe(nearestExisting(path),{bigint:true});assert(typeof s.bavail==='bigint'&&typeof s.bsize==='bigint'&&s.bavail>=0n&&s.bsize>0n,'FILESYSTEM_SPACE_METRIC_UNAVAILABLE');const available=s.bavail*s.bsize,required=reserve+BigInt(nextBytes);assert(available>=required,'MIN_FREE_SPACE_STOP_NOT_ACCEPTED');return{available_bytes:available.toString(),required_bytes:required.toString(),reserve_bytes:reserve.toString(),next_write_bytes:nextBytes,scope:'statfs of actual output filesystem; Docker bind/host equivalence must be independently calibrated',atomic_concurrent_space_guarantee:false};}
export class ArtifactStore{
 constructor(directory,{limit=32*1024**3,reserve=MIN_RESERVE_BYTES,spaceProbe=statfsSync}={}){assert(Number.isSafeInteger(limit)&&limit>0&&limit<=32*1024**3);this.root=resolve(directory);this.reserve=reserve;this.spaceProbe=spaceProbe;this.lastSpace=assertFreeSpace(this.root,0,{reserve,probe:spaceProbe});this.tree=new CheckedTree(directory,{limit});}
 get bytes(){return this.tree.bytes;}
 get limit(){return this.tree.limit;}
 path(name){return this.tree.path(name);}
 check(){const bytes=this.tree.check();this.lastSpace=assertFreeSpace(this.root,0,{reserve:this.reserve,probe:this.spaceProbe});return bytes;}
 write(name,value){const bytes=Buffer.isBuffer(value)?value.length:Buffer.byteLength(value);this.tree.path(name);this.tree.check();this.lastSpace=assertFreeSpace(this.root,bytes,{reserve:this.reserve,probe:this.spaceProbe});const result=this.tree.write(name,value);this.lastSpace=assertFreeSpace(this.root,0,{reserve:this.reserve,probe:this.spaceProbe});return result;}
}
