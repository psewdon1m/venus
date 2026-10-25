/** Fixed owned Linux operator drill; never loaded by the consumer API/browser. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync,spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {writePresentationBackup,readPresentationBackup} from '../../tools/venus-operator/presentation-backup.mjs';
const input=JSON.parse(Buffer.from(process.env.VENUS_PRESENTATION_BACKUP_INPUT??'', 'base64').toString());
assert.match(input.project,/^venus-p05-[a-f0-9]{12}$/);for(const k of ['db','browser','renderer'])assert.match(input[k],/^[a-f0-9]{64}$/);
assert.match(input.source,/^[a-f0-9]{40}$/);assert.match(input.identity,/^[a-f0-9]{64}$/);
const run=(args)=>{const r=spawnSync('docker',args,{encoding:'utf8',timeout:60000,maxBuffer:1024*1024});assert.equal(r.status,0,'Owned Docker action failed '+args[0]+': '+(r.stderr??'').slice(0,300));return r.stdout.trim();};
function owned(id,service){const info=JSON.parse(run(['inspect',id]))[0];assert.equal(info.Config.Labels['com.docker.compose.project'],input.project);assert.equal(info.Config.Labels['com.docker.compose.service'],service);return info;}
owned(input.db,'db');owned(input.browser,'browser');assert.equal(owned(input.renderer,'presentation-renderer').State.Running,false);
const root='/data/venus';fs.mkdirSync(path.join(root,'backups'),{recursive:true,mode:0o700});
const tableSql=`SELECT json_build_object('rooms',(SELECT count(*) FROM rooms),'documents',(SELECT count(*) FROM room_presentation_documents),'versions',(SELECT count(*) FROM room_presentation_versions),'assets',(SELECT count(*) FROM room_presentation_assets),'cipher_bytes',(SELECT coalesce(sum(octet_length(cipher)),0) FROM room_presentation_assets),'cipher_hash',(SELECT md5(coalesce(string_agg(content_version::text||':'||page_index::text||':'||sha256||':'||md5(cipher),',' ORDER BY content_version,page_index),'')) FROM room_presentation_assets),'orphans',(SELECT count(*) FROM room_presentation_assets a LEFT JOIN room_presentation_versions v USING(content_version) WHERE v.content_version IS NULL))::text;`;
const query=db=>JSON.parse(run(['exec',input.db,'psql','-X','-U','venus','-d',db,'-At','-v','ON_ERROR_STOP=1','-c',tableSql]));
const before=query('venus');assert(before.cipher_bytes>=62*1024*1024&&before.cipher_bytes<=64*1024*1024);assert(before.rooms>=4&&before.documents>=4);assert.equal(before.orphans,0);
const adapter={c:{local_root:root},expireBackups(){},async requireQuiesced(){assert.equal(owned(input.renderer,'presentation-renderer').State.Running,false);run(['exec',input.browser,'node','-e',`const fs=require('node:fs');const found=fs.readdirSync('/proc').filter(x=>/^[0-9]+$/.test(x)).some(x=>{try{const a=fs.readFileSync('/proc/'+x+'/cmdline','utf8').split(String.fromCharCode(0));return a.slice(1,3).some(v=>['tests/p05/server.mjs','tests/presentations/server.mjs'].some(name=>v===name||v.endsWith('/'+name)));}catch{return false;}});if(found)process.exit(1);`]);},async purgePresentationSpool(){run(['exec','--user','0',input.browser,'node','-e',`const fs=require('node:fs');const p='/run/venus-presentations/spool';for(const n of fs.readdirSync(p))fs.rmSync(p+'/'+n,{recursive:true,force:true});`]);},async container(role){assert.equal(role,'db');owned(input.db,'db');return input.db;}};
let targetCreated=false;
try{
 const backup=await writePresentationBackup(adapter,{manifest:{environment:'standalone-local-presentations-v4',schema:{generation:1},main_sha:input.source,source_identity:input.identity}},randomUUID());
 const verified=readPresentationBackup(path.join(root,'backups',backup.file));assert.equal(verified.manifest.dump_size,backup.manifest.dump_size);assert.equal(verified.manifest.volatile_spool_included,false);assert.equal(verified.manifest.protected_ledgers_included,false);
 const target='venus_presentations_backup_restore';run(['exec',input.db,'createdb','-U','venus',target]);targetCreated=true;
 await new Promise((resolve,reject)=>{const child=spawn('docker',['exec','-i',input.db,'pg_restore','-U','venus','-d',target,'--single-transaction','--exit-on-error','--no-owner','--no-acl'],{stdio:['pipe','ignore','pipe']});let error='';const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('Bounded BK2 restore deadline'));},60000);child.stderr.on('data',b=>{error=(error+b.toString()).slice(-4096);});child.on('error',reject);child.on('close',code=>{clearTimeout(timer);code===0?resolve():reject(Error('BK2 restore failed '+code+': '+error));});const stream=fs.createReadStream(verified.file,{start:verified.offset});stream.on('error',reject);child.stdin.on('error',reject);stream.pipe(child.stdin);});
 const after=query(target);assert.deepEqual(after,before);run(['exec',input.db,'dropdb','-U','venus',target]);targetCreated=false;
 console.log(JSON.stringify({status:'PASS',format:'VENUS-HOST-BACKUP-2',actual_bk2_producer_reader_restore:true,capacity_before:before,capacity_restored:after,dump_bytes:backup.manifest.dump_size,file_sha256:backup.sha256,backup_duration_ms:backup.duration_ms,write_boundary:backup.manifest.write_boundary,protected_authority_not_restored:true,temporary_restore_database_removed:true}));
}finally{if(targetCreated)run(['exec',input.db,'dropdb','-U','venus','venus_presentations_backup_restore']);}
