/** Read-only native owned-volume inventory; default does nothing. */
import assert from 'node:assert/strict';
import {lstatSync,readdirSync,readFileSync,statfsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {portableArtifactName} from './artifact-store-v2.mjs';
if(!process.argv.includes('--inspect'))console.log(JSON.stringify({status:'NOT_RUN'}));
else{
 assert.equal(process.platform,'linux');assert.equal(process.getuid(),1000);const root='/venus-output',files=[];let logical=0n,allocated=0n,objects=0;
 function walk(path,relative=''){const s=lstatSync(path,{bigint:true});assert(!s.isSymbolicLink());assert(s.isDirectory()||s.isFile());allocated+=s.blocks*512n;assert(allocated<=20n*1024n**2n);assert(++objects<=1024,'NATIVE_FILE_COUNT_CAP');if(s.isDirectory()){for(const name of readdirSync(path)){const next=relative?relative+'/'+name:name;portableArtifactName(next);walk(join(path,name),next);}}else{assert.equal(s.nlink,1n);logical+=s.size;assert(logical<=20n*1024n**2n);assert(s.size<=8n*1024n**2n);const bytes=readFileSync(path);assert.equal(BigInt(bytes.length),s.size);files.push({path:relative,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}
 walk(root);const space=statfsSync(root,{bigint:true}),free=space.bavail*space.bsize;assert(free>=10n*1024n**3n+128n*1024n**2n,'NATIVE_SPACE_RESERVE_STOP');console.log(JSON.stringify({status:'READONLY_NATIVE_INVENTORY',logical_bytes:Number(logical),allocated_bytes:Number(allocated),files,native_available_bytes:free.toString(),scope:'Owned file/directory allocation; not VHD extent growth'}));
}
