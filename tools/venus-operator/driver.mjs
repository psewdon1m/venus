import * as fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {json,read,writeJson,atomic,requireValue,directory,HEX,UUID,fileHash,canonical,syncDirectory} from './files.mjs';
import {dockerArchiveConfig} from './image-archive.mjs';
const MAX_DUMP=128*1024*1024;
export function command(program,args,{input,file_input,timeout=180000,max=MAX_DUMP}={}){
 return new Promise((resolve,reject)=>{const child=spawn(program,args,{shell:false,stdio:['pipe','pipe','pipe'],env:{PATH:process.env.PATH,DOCKER_HOST:process.env.DOCKER_HOST,HOME:process.env.HOME}});let length=0;const out=[];let done=false,diagnostic='';
  const stop=code=>{if(done)return;done=true;clearTimeout(timer);child.kill('SIGKILL');reject(new Error(code));};const timer=setTimeout(()=>stop('COMMAND_TIMEOUT'),timeout);
  child.on('error',()=>stop('COMMAND_UNAVAILABLE'));child.stdout.on('data',b=>{length+=b.length;if(length>max)stop('COMMAND_OUTPUT_LIMIT');else out.push(b);});child.stderr.on('data',b=>{if(diagnostic.length<16384)diagnostic+=b.toString().slice(0,16384-diagnostic.length);});
  child.on('close',code=>{if(done)return;done=true;clearTimeout(timer);if(code!==0){const status=/unexpected status[^\n]*\b(4\d\d|5\d\d)\b/i.exec(diagnostic)?.[1];const reason=status?'UPSTREAM_HTTP_'+status:/no space left/i.test(diagnostic)?'DISK_SPACE':/unauthorized|authentication required/i.test(diagnostic)?'REGISTRY_AUTH_REQUIRED':'COMMAND_FAILED';const error=new Error(reason);error.exit_code=code;error.operation=program==='docker'&&/^[a-z]+$/.test(args[0])?'docker_'+args[0]:'external_command';error.upstream_status=status?Number(status):null;reject(error);}else resolve(Buffer.concat(out));});child.stdin.on('error',()=>{});if(file_input){const stream=fs.createReadStream(file_input.file,{start:file_input.start});stream.on('error',()=>stop('COMMAND_INPUT_FAILED'));stream.pipe(child.stdin);child.on('close',()=>stream.destroy());}else child.stdin.end(input);
 });
}
export class DockerDriver{
 constructor(config){this.c=config;requireValue(/^venus-[a-z0-9-]{1,36}$/.test(config.project),'INVALID_PROJECT');for(const k of ['local_root','host_root','compose_template'])requireValue(typeof config[k]==='string'&&config[k].length<500&&!/[\r\n\0]/.test(config[k]),'INVALID_CONFIGURATION');directory(config.local_root);requireValue(!config.release_environment||['standalone-local-pilot-v2','standalone-local-media-v3'].includes(config.release_environment),'RELEASE_ENVIRONMENT');if(config.release_environment==='standalone-local-media-v3')requireValue(read(config.compose_template).equals(read(fileURLToPath(new URL('../../infra/venus/compose.media.standalone.yml',import.meta.url)))),'MEDIA_TEMPLATE_REQUIRED');}
 mediaEnabled(){return this.c.release_environment==='standalone-local-media-v3';}
 async requireQuiesced(){for(const service of ['app','media'])requireValue(!(await this.inspect(service))?.State?.Running,'QUIESCE_REQUIRED');}
 docker(args,options){return command('docker',args,options);}
 env(image,oci=image){return {VENUS_IMAGE:image,VENUS_OCI_DIGEST:oci,VENUS_HTTP_PORT:String(this.c.port),VENUS_STATE_ROOT:this.c.host_root,VENUS_ORIGIN:this.c.app_origin,VENUS_DEPLOYMENT_PROFILE:'local-pilot',VENUS_PRIVATE_TEXT_CHAT:'true',VENUS_PRIVATE_TOPICS:'true'};}
 async compose(args,image,oci=image){
  // No inherited arbitrary COMPOSE_*, DOCKER_CONTEXT or env interpolation.
  const envFile=path.join(this.c.local_root,'compose.env');const values=this.env(image,oci);atomic(envFile,Object.entries(values).map(([k,v])=>`${k}=${v}`).join('\n')+'\n');
  return this.docker(['compose','--project-name',this.c.project,'--env-file',envFile,'--file',this.c.compose_template,...args]);
 }
 async container(service,required=true){const output=(await this.docker(['ps','-aq','--filter',`label=com.docker.compose.project=${this.c.project}`,'--filter',`label=com.docker.compose.service=${service}`])).toString().trim().split('\n').filter(Boolean);requireValue(output.length<2&&(!required||output.length===1),'CONTAINER_IDENTITY');if(!output.length)return null;requireValue(/^[a-f0-9]{12,64}$/.test(output[0]),'CONTAINER_IDENTITY');return output[0];}
 async inspect(service){const id=await this.container(service,false);return id?JSON.parse((await this.docker(['inspect',id])).toString())[0]:null;}
 async image(reference){return JSON.parse((await this.docker(['image','inspect',reference])).toString())[0];}
 async preflight(release,{install=false}={}){
  const s=fs.statfsSync(this.c.local_root);requireValue(s.bavail*s.bsize>=Math.max(this.c.minimum_free_bytes??0,512*1024*1024),'DISK_SPACE');
  const probe=path.join(this.c.local_root,'.permission-'+randomUUID());atomic(probe,'permission');fs.unlinkSync(probe);
  requireValue(Number.isInteger(this.c.port)&&this.c.port>=1024&&this.c.port<=65535,'INVALID_PORT');const origin=new URL(this.c.app_origin);requireValue(origin.origin===this.c.app_origin&&origin.protocol==='https:'&&['localhost','127.0.0.1','[::1]'].includes(origin.hostname),'ENVIRONMENT_NOT_LOCAL_PILOT');
  const existing=await this.inspect('app');if(!install)requireValue(existing?.State?.Running,'HEALTHY_A_REQUIRED');
  const ids=(await this.docker(['ps','-q'])).toString().trim().split('\n').filter(Boolean);
  if(ids.length){const states=JSON.parse((await this.docker(['inspect',...ids])).toString());for(const row of states)for(const binds of [...Object.values(row.HostConfig.PortBindings??{}),...Object.values(row.NetworkSettings.Ports??{})])for(const b of binds??[])if(Number(b.HostPort)===this.c.port)requireValue(row.Config.Labels?.['com.docker.compose.project']===this.c.project,'PORT_IN_USE');}
  requireValue(release.schema.generation===1,'SCHEMA_UNSUPPORTED');
  if(this.mediaEnabled()){for(const port of [7881,7882])requireValue(port!==this.c.port,'MEDIA_PORT_CONFLICT');const media=fs.lstatSync(path.join(this.c.local_root,'protected','media'));requireValue(media.isDirectory()&&!media.isSymbolicLink(),'MEDIA_EXPLICIT_PROVISION_REQUIRED');}if(existing)await this.healthy();
 }
 imageMapFile(release){requireValue(/^sha256:[a-f0-9]{64}$/.test(release.image.oci_digest),'IMAGE_DIGEST_MISMATCH');return path.join(this.c.local_root,'image-identity-'+release.image.oci_digest.slice(7)+'.json');}
 imageLabels(release,labels){requireValue(labels?.['org.opencontainers.image.revision']===release.main_sha&&labels?.['org.opencontainers.image.version']===release.version,'IMAGE_SOURCE_MISMATCH');}
 imageMapMatches(release,image){try{const file=this.imageMapFile(release),stat=fs.lstatSync(file);requireValue(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&(stat.mode&0o777)===0o600&&(typeof process.getuid!=='function'||stat.uid===process.getuid()||process.getuid()===0&&stat.uid===1001),'IMAGE_MAP_UNSAFE');const m=json(file);return m.format===1&&m.image_id===image.Id&&m.reference===release.image.reference&&m.config_digest===release.image.config_digest;}catch{return false;}}
 bindImage(release,image){requireValue(image.Id===release.image.config_digest||image.Id===release.image.oci_digest,'IMAGE_DIGEST_MISMATCH');this.imageLabels(release,image.Config.Labels);if(!this.imageMapMatches(release,image))writeJson(this.imageMapFile(release),{format:1,image_id:image.Id,reference:release.image.reference,config_digest:release.image.config_digest});return image;}
 verifyArchive(release,file){const config=dockerArchiveConfig(file);requireValue(config.config_digest===release.image.config_digest,'IMAGE_CONFIG_MISMATCH');this.imageLabels(release,config.labels);return config;}
 async verifyLocalImage(release,image){
  requireValue(image.Id===release.image.config_digest||image.Id===release.image.oci_digest,'IMAGE_DIGEST_MISMATCH');this.imageLabels(release,image.Config.Labels);
  if(image.Id!==release.image.config_digest&&!this.imageMapMatches(release,image)){
   requireValue(image.RepoDigests?.includes(release.image.reference),'IMAGE_DIGEST_MISMATCH');
   const file=path.join(this.c.local_root,'.image-config-'+randomUUID()+'.tar');
   try{await this.docker(['image','save','--output',file,image.Id],{timeout:600000,max:1024*1024});fs.chmodSync(file,0o600);this.verifyArchive(release,file);}finally{fs.rmSync(file,{force:true});}
  }
  return this.bindImage(release,image);
 }
 async localImage(release){
  for(const ref of [release.image.config_digest,release.image.oci_digest]){let image;try{image=await this.image(ref);}catch{continue;}return this.verifyLocalImage(release,image);}
  throw new Error('PREVIOUS_IMAGE_MISSING');
 }
 async ensureImage(release){let image;try{image=await this.image(release.image.reference);}catch{await this.docker(['pull',release.image.reference],{timeout:600000});image=await this.image(release.image.reference);}
  requireValue(image.RepoDigests?.includes(release.image.reference),'IMAGE_DIGEST_MISMATCH');return (await this.verifyLocalImage(release,image)).Id;
 }
 async savePrevious(current){
  const release=current.manifest,image=await this.localImage(release),destination=path.join(this.c.local_root,'offline-previous.tar'),receiptFile=path.join(this.c.local_root,'offline-previous.json');
  try{const receipt=json(receiptFile);if(receipt.image_id===image.Id&&receipt.config_digest===release.image.config_digest&&receipt.reference===release.image.reference&&fileHash(destination)===receipt.archive_sha256)return receipt;}catch{ /* re-create the verified current archive before mutation */ }
  const temp=destination+'.new';fs.rmSync(temp,{force:true});await this.docker(['image','save','--output',temp,image.Id],{timeout:600000,max:1024*1024});fs.chmodSync(temp,0o600);this.verifyArchive(release,temp);
  const fd=fs.openSync(temp,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temp,destination);syncDirectory(this.c.local_root);
  const receipt={image_id:image.Id,config_digest:release.image.config_digest,reference:release.image.reference,archive_sha256:fileHash(destination)};writeJson(receiptFile,receipt);return receipt;
 }
 async loadPrevious(current,receipt){const release=current.manifest;try{await this.localImage(release);return;}catch{
  requireValue(receipt&&(receipt.image_id===release.image.config_digest||receipt.image_id===release.image.oci_digest)&&receipt.config_digest===release.image.config_digest&&receipt.reference===release.image.reference&&HEX.test(receipt.archive_sha256),'PREVIOUS_IMAGE_MISSING');
  const file=path.join(this.c.local_root,'offline-previous.tar');requireValue(fileHash(file)===receipt.archive_sha256,'PREVIOUS_ARCHIVE_CORRUPT');this.verifyArchive(release,file);
  await this.docker(['image','load','--input',file],{timeout:600000,max:1024*1024});const image=await this.image(receipt.image_id);requireValue(image.Id===receipt.image_id,'PREVIOUS_IMAGE_MISMATCH');this.bindImage(release,image);
 }}
 serving(open){writeJson(path.join(this.c.local_root,'control','serving.json'),{format:1,serving:open},0o444);}
 async stop(){const media=await this.container('media',false);if(media)await this.docker(['stop','--time','15',media]);requireValue(!(await this.inspect('media'))?.State?.Running,'MEDIA_QUIESCE_FAILED');const app=await this.container('app',false);if(app)await this.docker(['stop','--time','15',app]);requireValue(!(await this.inspect('app'))?.State?.Running,'QUIESCE_FAILED');}
 async start(release){const image=await this.localImage(release);await this.compose(['up','-d','--no-build','--pull','never',...(this.mediaEnabled()?['media','app']:['app'])],image.Id,release.image.oci_digest);}
 async initialize(release){
  const pin=/^ {4}image: (postgres:[a-z0-9.-]+@sha256:[a-f0-9]{64})$/m.exec(read(this.c.compose_template,1024*1024).toString().replace(/\r\n/g,'\n'))?.[1];requireValue(pin,'DATABASE_IMAGE_PIN_REQUIRED');
  let image;try{image=await this.image(pin);}catch{await this.docker(['pull',pin],{timeout:600000});image=await this.image(pin);}requireValue(image.RepoDigests?.some(ref=>ref.endsWith('@'+pin.split('@')[1])),'DATABASE_IMAGE_DIGEST_MISMATCH');
  const app=await this.localImage(release);await this.compose(['up','-d','--no-build','--pull','never','db'],app.Id,release.image.oci_digest);for(let i=0;i<60;i++){try{const db=await this.container('db');await this.docker(['exec',db,'pg_isready','-U','venus','-d','venus']);return;}catch{await new Promise(resolve=>setTimeout(resolve,500));}}throw new Error('DATABASE_NOT_READY');}
 async healthy(expected){
  const app=await this.container('app'),program="(async()=>{if(process.argv[2]==='true'){const fs=require('node:fs'),crypto=require('node:crypto'),key=JSON.parse(fs.readFileSync(process.env.VENUS_MEDIA_KEY_FILE,'utf8')),auth=crypto.createHmac('sha256',key.secret).update('venus-media-internal-v1').digest('base64url'),p=await fetch('http://127.0.0.1:4300/internal/v1/media/prepare',{method:'POST',headers:{'x-venus-media-internal':auth}});if(!p.ok||!(await p.json()).prepared)throw Error('MEDIA_NOT_PREPARED');}const[r,v]=await Promise.all([fetch('http://127.0.0.1:4300/health/ready'),fetch('http://127.0.0.1:4300/api/v1/version')]);if(!r.ok||!v.ok)throw Error('APP_NOT_READY');const m=JSON.parse(process.argv[1]),a=await v.json();if(m&&(a.service!=='venus'||a.version!==m.version||a.source_revision!==m.main_sha||a.image_digest!==m.image.oci_digest))throw Error('WRONG_RUNTIME');})().catch(()=>process.exit(1))";
  for(let i=0;i<60;i++){try{await this.docker(['exec',app,'node','-e',program,JSON.stringify(expected??null),String(this.mediaEnabled())],{timeout:5000,max:65536});return;}catch{await new Promise(resolve=>setTimeout(resolve,500));}}throw new Error('HEALTH_FAILED');
 }

 cleanupBackupTemps(jobId){requireValue(UUID.test(jobId),'JOB_ID');const dir=path.join(this.c.local_root,'backups');let removed=0;for(const suffix of ['.dump.tmp','.vbackup.tmp']){const file=path.join(dir,jobId+suffix);let stat;try{stat=fs.lstatSync(file);}catch(error){if(error.code==='ENOENT')continue;throw error;}requireValue(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&stat.uid===process.getuid()&&(stat.mode&0o777)===0o600,'BACKUP_TEMP_UNSAFE');fs.unlinkSync(file);removed++;}if(removed)syncDirectory(dir);return {removed};}
 expireBackups(now=Date.now()){const dir=path.join(this.c.local_root,'backups');let removed=0;for(const name of fs.readdirSync(dir)){if(!/^[a-f0-9-]{36}\.vbackup$/.test(name))continue;const file=path.join(dir,name),s=fs.lstatSync(file);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||(s.mode&0o777)!==0o600)continue;const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);let old=false;try{const prefix=Buffer.alloc(12);if(fs.readSync(fd,prefix,0,12,0)!==12||prefix.subarray(0,8).toString()!=='VENUSBK1')continue;const size=prefix.readUInt32BE(8);if(size<1||size>65536)continue;const header=Buffer.alloc(size);if(fs.readSync(fd,header,0,size,12)!==size)continue;const manifest=JSON.parse(header.toString());old=manifest.format==='VENUS-HOST-BACKUP-1'&&Number.isFinite(Date.parse(manifest.created_at))&&now-Date.parse(manifest.created_at)>=7*86400000-3600000;}catch{ /* corrupt files are retained for explicit repair, never called successful */ }finally{fs.closeSync(fd);}if(old){fs.unlinkSync(file);removed++;}}if(removed)syncDirectory(dir);return {removed};}
 async backup(current,jobId){
  this.expireBackups();
  await this.requireQuiesced();const db=await this.container('db');const started=Date.now();
  const dir=path.join(this.c.local_root,'backups'),dumpFile=path.join(dir,jobId+'.dump.tmp'),file=path.join(dir,jobId+'.vbackup'),tmp=file+'.tmp';
  try{
   await new Promise((resolve,reject)=>{const fd=fs.openSync(dumpFile,'wx',0o600),output=fs.createWriteStream(dumpFile,{fd,autoClose:false}),child=spawn('docker',['exec',db,'pg_dump','-U','venus','-d','venus','--format=custom','--no-owner','--no-acl'],{shell:false,stdio:['ignore','pipe','ignore']});let count=0,code=null,finished=false,settled=false;const end=error=>{if(settled)return;settled=true;clearTimeout(timer);if(error){child.kill('SIGKILL');output.destroy();try{fs.closeSync(fd);}catch{ /* already closed */ }reject(error);}else{fs.fsyncSync(fd);fs.closeSync(fd);resolve();}};const complete=()=>{if(code!==null&&finished)end(code===0?null:new Error('BACKUP_DUMP_FAILED'));};const timer=setTimeout(()=>end(new Error('BACKUP_TIMEOUT')),180000);child.on('error',()=>end(new Error('BACKUP_DUMP_FAILED')));child.stdout.on('data',b=>{count+=b.length;if(count>MAX_DUMP)end(new Error('BACKUP_SIZE_LIMIT'));});output.on('error',()=>end(new Error('BACKUP_WRITE_FAILED')));output.on('finish',()=>{finished=true;complete();});child.on('close',value=>{code=value??1;complete();});child.stdout.pipe(output);});
   const dumpSize=fs.statSync(dumpFile).size;requireValue(dumpSize>5&&dumpSize<=MAX_DUMP,'BACKUP_SIZE_LIMIT');const fdCheck=fs.openSync(dumpFile,'r'),magic=Buffer.alloc(5);try{fs.readSync(fdCheck,magic,0,5,0);}finally{fs.closeSync(fdCheck);}requireValue(magic.toString()==='PGDMP','BACKUP_FORMAT');
   const created=Date.now(),manifest={format:'VENUS-HOST-BACKUP-1',schema:current.manifest.schema.generation,source:current.manifest.main_sha,source_identity:current.manifest.source_identity,created_at:new Date(created).toISOString(),expires_at:new Date(created+7*86400000).toISOString(),dump_sha256:fileHash(dumpFile),dump_size:dumpSize,job_id:jobId,write_boundary:'APP_STOPPED_AND_ALL_APP_WRITERS_QUIESCED',keys_included:false,protected_ledgers_included:false};
   const header=Buffer.from(canonical(manifest)),prefix=Buffer.alloc(12);prefix.write('VENUSBK1');prefix.writeUInt32BE(header.length,8);const out=fs.openSync(tmp,'wx',0o600),input=fs.openSync(dumpFile,'r'),buffer=Buffer.alloc(65536);try{fs.writeFileSync(out,prefix);fs.writeFileSync(out,header);let n;while((n=fs.readSync(input,buffer,0,buffer.length,null))>0)fs.writeFileSync(out,buffer.subarray(0,n));fs.fsyncSync(out);}finally{fs.closeSync(out);fs.closeSync(input);}fs.renameSync(tmp,file);syncDirectory(dir);
   const s=fs.lstatSync(file);requireValue((s.mode&0o777)===0o600,'BACKUP_PERMISSIONS');return {file:path.basename(file),manifest,sha256:fileHash(file),duration_ms:Date.now()-started};
  }finally{fs.rmSync(dumpFile,{force:true});fs.rmSync(tmp,{force:true});}
 }
 readBackup(name){requireValue(/^[a-f0-9-]{36}\.vbackup$/.test(name),'BACKUP_NAME');const file=path.join(this.c.local_root,'backups',name),s=fs.lstatSync(file);requireValue(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&(s.mode&0o777)===0o600&&s.size<=MAX_DUMP+65548,'BACKUP_UNSAFE');const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);let manifest,offset;try{const prefix=Buffer.alloc(12);requireValue(fs.readSync(fd,prefix,0,12,0)===12&&prefix.subarray(0,8).toString()==='VENUSBK1','BACKUP_TRUNCATED');const size=prefix.readUInt32BE(8);requireValue(size>0&&size<=65536,'BACKUP_HEADER');const header=Buffer.alloc(size);requireValue(fs.readSync(fd,header,0,size,12)===size,'BACKUP_TRUNCATED');manifest=JSON.parse(header.toString());offset=12+size;const magic=Buffer.alloc(5);requireValue(fs.readSync(fd,magic,0,5,offset)===5&&magic.toString()==='PGDMP','BACKUP_FORMAT');}finally{fs.closeSync(fd);}requireValue(manifest.format==='VENUS-HOST-BACKUP-1'&&manifest.schema===1&&manifest.keys_included===false&&manifest.protected_ledgers_included===false&&manifest.write_boundary==='APP_STOPPED_AND_ALL_APP_WRITERS_QUIESCED'&&HEX.test(manifest.dump_sha256)&&Date.parse(manifest.created_at)<=Date.now()&&Date.parse(manifest.expires_at)>Date.now()&&Date.parse(manifest.expires_at)-Date.parse(manifest.created_at)===7*86400000,'BACKUP_MANIFEST');requireValue(s.size-offset===manifest.dump_size&&fileHash(file,offset)===manifest.dump_sha256,'BACKUP_CORRUPT');return {manifest,file,offset};}
 async restore(backup,current){
  await this.requireQuiesced();const {manifest,file,offset}=this.readBackup(backup.file);requireValue(manifest.source===current.manifest.main_sha&&manifest.schema===current.manifest.schema.generation&&manifest.job_id+'.vbackup'===backup.file,'BACKUP_SOURCE_MISMATCH');requireValue(fileHash(file)===backup.sha256,'BACKUP_FILE_CHANGED');
  const db=await this.container('db');await this.docker(['exec',db,'psql','-X','-U','venus','-d','postgres','-v','ON_ERROR_STOP=1','-c',"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='venus' AND pid<>pg_backend_pid();"]);
  await this.docker(['exec',db,'dropdb','--if-exists','-U','venus','venus']);await this.docker(['exec',db,'createdb','-U','venus','-O','venus','venus']);await this.docker(['exec','-i',db,'pg_restore','-U','venus','-d','venus','--single-transaction','--exit-on-error','--no-owner','--no-acl'],{file_input:{file,start:offset},max:65536});
 }
}
