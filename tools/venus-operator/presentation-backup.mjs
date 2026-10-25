/** BK2 only. BK1's existing producer/reader and128MiB limit remain separate. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {canonical,requireValue,HEX,UUID,fileHash,syncDirectory,exactKeys} from './files.mjs';
import {PRESENTATIONS_ENVIRONMENT} from './presentations-profile.mjs';
export const MAX_PRESENTATION_DUMP=256*1024*1024;
const HEADER=65536,BOUNDARY='APP_CONVERTER_AND_ALL_APP_WRITERS_QUIESCED';
export function isPresentationBackup(file){const info=fs.lstatSync(file);requireValue(info.isFile()&&!info.isSymbolicLink()&&info.nlink===1&&(info.mode&0o777)===0o600&&info.size<=MAX_PRESENTATION_DUMP+HEADER+12,'BACKUP_UNSAFE');const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);try{const prefix=Buffer.alloc(8);return fs.readSync(fd,prefix,0,8,0)===8&&prefix.toString()==='VENUSBK2';}finally{fs.closeSync(fd);}}
export async function writePresentationBackup(driver,current,jobId){
 requireValue(UUID.test(jobId)&&current.manifest.environment===PRESENTATIONS_ENVIRONMENT,'BACKUP_PROFILE_REQUIRED');
 driver.expireBackups();await driver.requireQuiesced();await driver.purgePresentationSpool();const db=await driver.container('db'),started=Date.now();
 const dir=path.join(driver.c.local_root,'backups'),dumpFile=path.join(dir,jobId+'.dump.tmp'),file=path.join(dir,jobId+'.vbackup'),tmp=file+'.tmp';
 try{
  await new Promise((resolve,reject)=>{const fd=fs.openSync(dumpFile,'wx',0o600),output=fs.createWriteStream(dumpFile,{fd,autoClose:false}),child=spawn('docker',['exec',db,'pg_dump','-U','venus','-d','venus','--format=custom','--no-owner','--no-acl'],{shell:false,stdio:['ignore','pipe','ignore']});let count=0,code=null,finished=false,settled=false;
   const end=error=>{if(settled)return;settled=true;clearTimeout(timer);if(error){child.kill('SIGKILL');output.destroy();try{fs.closeSync(fd);}catch{/* closed */}reject(error);}else{fs.fsyncSync(fd);fs.closeSync(fd);resolve();}};
   const complete=()=>{if(code!==null&&finished)end(code===0?null:new Error('BACKUP_DUMP_FAILED'));};const timer=setTimeout(()=>end(new Error('BACKUP_TIMEOUT')),180000);
   child.on('error',()=>end(new Error('BACKUP_DUMP_FAILED')));child.stdout.on('data',bytes=>{count+=bytes.length;if(count>MAX_PRESENTATION_DUMP)end(new Error('BACKUP_SIZE_LIMIT'));});output.on('error',()=>end(new Error('BACKUP_WRITE_FAILED')));output.on('finish',()=>{finished=true;complete();});child.on('close',value=>{code=value??1;complete();});child.stdout.pipe(output);
  });
  const dumpSize=fs.statSync(dumpFile).size;requireValue(dumpSize>5&&dumpSize<=MAX_PRESENTATION_DUMP,'BACKUP_SIZE_LIMIT');const check=fs.openSync(dumpFile,'r'),magic=Buffer.alloc(5);try{fs.readSync(check,magic,0,5,0);}finally{fs.closeSync(check);}requireValue(magic.toString()==='PGDMP','BACKUP_FORMAT');
  const created=Date.now(),manifest={format:'VENUS-HOST-BACKUP-2',schema:current.manifest.schema.generation,source:current.manifest.main_sha,source_identity:current.manifest.source_identity,created_at:new Date(created).toISOString(),expires_at:new Date(created+7*86400000).toISOString(),dump_sha256:fileHash(dumpFile),dump_size:dumpSize,job_id:jobId,write_boundary:BOUNDARY,keys_included:false,protected_ledgers_included:false,presentation_module_generation:1,release_environment:PRESENTATIONS_ENVIRONMENT,volatile_spool_included:false};
  const header=Buffer.from(canonical(manifest));requireValue(header.length>0&&header.length<=HEADER,'BACKUP_HEADER');const prefix=Buffer.alloc(12);prefix.write('VENUSBK2');prefix.writeUInt32BE(header.length,8);
  const out=fs.openSync(tmp,'wx',0o600),input=fs.openSync(dumpFile,'r'),buffer=Buffer.alloc(65536);try{fs.writeFileSync(out,prefix);fs.writeFileSync(out,header);let n;while((n=fs.readSync(input,buffer,0,buffer.length,null))>0)fs.writeFileSync(out,buffer.subarray(0,n));fs.fsyncSync(out);}finally{fs.closeSync(out);fs.closeSync(input);}
  requireValue(fs.statSync(tmp).size<=MAX_PRESENTATION_DUMP+HEADER+12,'BACKUP_SIZE_LIMIT');fs.renameSync(tmp,file);syncDirectory(dir);
  const result={file:path.basename(file),manifest,sha256:fileHash(file),duration_ms:Date.now()-started};readPresentationBackup(file);return result;
 }finally{fs.rmSync(dumpFile,{force:true});fs.rmSync(tmp,{force:true});}
}
export function readPresentationBackup(file){
 const info=fs.lstatSync(file);requireValue(info.isFile()&&!info.isSymbolicLink()&&info.nlink===1&&(info.mode&0o777)===0o600&&info.size<=MAX_PRESENTATION_DUMP+HEADER+12,'BACKUP_UNSAFE');
 const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);let manifest,offset;
 try{const actual=fs.fstatSync(fd);requireValue(actual.ino===info.ino&&actual.dev===info.dev&&actual.size===info.size,'BACKUP_FILE_CHANGED');const prefix=Buffer.alloc(12);requireValue(fs.readSync(fd,prefix,0,12,0)===12&&prefix.subarray(0,8).toString()==='VENUSBK2','BACKUP_TRUNCATED');const length=prefix.readUInt32BE(8);requireValue(length>0&&length<=HEADER,'BACKUP_HEADER');const header=Buffer.alloc(length);requireValue(fs.readSync(fd,header,0,length,12)===length,'BACKUP_TRUNCATED');manifest=JSON.parse(header.toString());requireValue(Buffer.from(canonical(manifest)).equals(header),'BACKUP_MANIFEST');offset=12+length;const magic=Buffer.alloc(5);requireValue(fs.readSync(fd,magic,0,5,offset)===5&&magic.toString()==='PGDMP','BACKUP_FORMAT');}finally{fs.closeSync(fd);}
 exactKeys(manifest,['format','schema','source','source_identity','created_at','expires_at','dump_sha256','dump_size','job_id','write_boundary','keys_included','protected_ledgers_included','presentation_module_generation','release_environment','volatile_spool_included']);
 const created=Date.parse(manifest.created_at),expires=Date.parse(manifest.expires_at);
 requireValue(manifest.format==='VENUS-HOST-BACKUP-2'&&manifest.schema===1&&manifest.presentation_module_generation===1&&manifest.release_environment===PRESENTATIONS_ENVIRONMENT&&manifest.volatile_spool_included===false&&manifest.keys_included===false&&manifest.protected_ledgers_included===false&&manifest.write_boundary===BOUNDARY&&HEX.test(manifest.dump_sha256)&&HEX.test(manifest.source_identity)&&/^[a-f0-9]{40}$/.test(manifest.source)&&UUID.test(manifest.job_id)&&Number.isSafeInteger(manifest.dump_size)&&manifest.dump_size>5&&manifest.dump_size<=MAX_PRESENTATION_DUMP&&Number.isFinite(created)&&created<=Date.now()&&expires>Date.now()&&expires-created===7*86400000,'BACKUP_MANIFEST');
 requireValue(info.size-offset===manifest.dump_size&&fileHash(file,offset)===manifest.dump_sha256,'BACKUP_CORRUPT');return {manifest,file,offset};
}
