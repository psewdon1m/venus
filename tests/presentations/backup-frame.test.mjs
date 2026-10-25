// Frame/compatibility tests only; actual PostgreSQL/ACL/restore proof is separate.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {fixture} from '../p06/helpers.mjs';
import {createRelease} from '../../tools/venus-operator/create-release.mjs';
import {verifyRelease} from '../../tools/venus-operator/release.mjs';
import {DockerDriver} from '../../tools/venus-operator/driver.mjs';
import {canonical,atomic} from '../../tools/venus-operator/files.mjs';
import {readPresentationBackup,MAX_PRESENTATION_DUMP} from '../../tools/venus-operator/presentation-backup.mjs';
import {PRESENTATIONS_ENVIRONMENT,PRESENTATIONS_RELEASE} from '../../tools/venus-operator/presentations-profile.mjs';

const linux={skip:process.platform!=='linux'};
const template=fileURLToPath(new URL('../../infra/venus/compose.presentations.standalone.yml',import.meta.url));
function context(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'venus-bk2-'));fs.mkdirSync(path.join(root,'backups'));const driver=new DockerDriver({project:'venus-bk2-unit',local_root:root,host_root:root,compose_template:template,release_environment:PRESENTATIONS_ENVIRONMENT,presentations_enabled:false});return {root,driver,cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};}
function frame(root,{kind=2,size=64,changes={}}={}){
 const job_id=randomUUID(),created=Date.now(),payload=Buffer.from('PGDMP-frame-only'),zero=Buffer.alloc(65536),hash=createHash('sha256');hash.update(payload);let remaining=size-payload.length;while(remaining>0){const n=Math.min(remaining,zero.length);hash.update(zero.subarray(0,n));remaining-=n;}
 const manifest={format:'VENUS-HOST-BACKUP-'+kind,schema:1,source:'1'.repeat(40),source_identity:'2'.repeat(64),created_at:new Date(created).toISOString(),expires_at:new Date(created+7*86400000).toISOString(),dump_sha256:hash.digest('hex'),dump_size:size,job_id,write_boundary:kind===2?'APP_CONVERTER_AND_ALL_APP_WRITERS_QUIESCED':'APP_STOPPED_AND_ALL_APP_WRITERS_QUIESCED',keys_included:false,protected_ledgers_included:false,...(kind===2?{presentation_module_generation:1,release_environment:PRESENTATIONS_ENVIRONMENT,volatile_spool_included:false}:{}),...changes};
 const header=Buffer.from(canonical(manifest)),prefix=Buffer.alloc(12);prefix.write('VENUSBK'+kind);prefix.writeUInt32BE(header.length,8);const file=path.join(root,'backups',job_id+'.vbackup'),fd=fs.openSync(file,'wx',0o600);try{fs.writeSync(fd,prefix);fs.writeSync(fd,header);fs.writeSync(fd,payload);fs.ftruncateSync(fd,12+header.length+size);}finally{fs.closeSync(fd);}return {file,name:job_id+'.vbackup',manifest};
}

test('BK2 profile binds converter and fixed environment without implicit v3 activation',linux,()=>{const c=context();try{assert.equal(c.driver.env('sha256:'+'3'.repeat(64)).VENUS_PRESENTATIONS_ENABLED,'false');assert.equal(c.driver.mediaEnabled(),true);assert.equal(PRESENTATIONS_RELEASE.max_dump_bytes,MAX_PRESENTATION_DUMP);assert.deepEqual(PRESENTATIONS_RELEASE.quiesced_services,['app','media','presentation-renderer']);assert.throws(()=>new DockerDriver({project:'venus-wrong',local_root:c.root,host_root:c.root,compose_template:template,release_environment:'standalone-local-media-v3',presentations_enabled:true}),/EXPLICIT_PROFILE/);}finally{c.cleanup();}});
test('BK2 framing verifies hash, exact declaration and permissions; ordinary BK1 stays readable',linux,()=>{const c=context();try{const good=frame(c.root);assert.equal(c.driver.readBackup(good.name).manifest.format,'VENUS-HOST-BACKUP-2');const legacy=frame(c.root,{kind:1});assert.equal(c.driver.readBackup(legacy.name).manifest.format,'VENUS-HOST-BACKUP-1');const b=fs.readFileSync(good.file);b[b.length-1]^=1;atomic(good.file,b);assert.throws(()=>readPresentationBackup(good.file),/CORRUPT/);const unsafe=frame(c.root);fs.chmodSync(unsafe.file,0o644);assert.throws(()=>readPresentationBackup(unsafe.file),/UNSAFE/);const bad=frame(c.root,{changes:{volatile_spool_included:true}});assert.throws(()=>readPresentationBackup(bad.file),/MANIFEST/);const linked=path.join(c.root,'backups',randomUUID()+'.vbackup');fs.symlinkSync(legacy.file,linked);assert.throws(()=>readPresentationBackup(linked),/UNSAFE/);}finally{c.cleanup();}});
test('BK2 supports129MiB frame while BK1 rejects it, and BK2 still has finite256MiB cap',linux,()=>{const c=context();try{const large=frame(c.root,{size:129*1024*1024});assert.equal(readPresentationBackup(large.file).manifest.dump_size,129*1024*1024);const legacy=frame(c.root,{kind:1,size:129*1024*1024});assert.throws(()=>c.driver.readBackup(legacy.name),/UNSAFE/);fs.truncateSync(large.file,MAX_PRESENTATION_DUMP+65549);assert.throws(()=>readPresentationBackup(large.file),/UNSAFE/);}finally{c.cleanup();}});
test('BK2 restore rejects legacy generation before any database command',linux,async()=>{const c=context();try{const legacy=frame(c.root,{kind:1});c.driver.requireQuiesced=async()=>{};let commands=0;c.driver.docker=async()=>{commands++;throw Error('UNEXPECTED_DATABASE_COMMAND');};await assert.rejects(c.driver.restore({file:legacy.name},{manifest:{schema:{generation:1}}}),/PROFILE_MISMATCH/);assert.equal(commands,0);}finally{c.cleanup();}});

test('signed fixture profile4 binds its exact converter and BK2 descriptor; old environment rejects it',linux,()=>{
 const c=fixture();try{const compose=path.resolve('infra/venus/compose.presentations.standalone.yml'),output=path.join(c.base,'presentations-v4'),digest='d'.repeat(64);createRelease({trust_file:c.trustFile,private_key_file:c.privateFile,version:'0.0.9004',main_sha:'1'.repeat(40),source_identity:'2'.repeat(64),image_reference:'ghcr.io/psewdon1m/venus@sha256:'+digest,oci_digest:'sha256:'+digest,config_digest:'sha256:'+digest,compose_template:compose,environment:PRESENTATIONS_ENVIRONMENT,output});
  const accepted=verifyRelease(output,c.trust,{environment:PRESENTATIONS_ENVIRONMENT,schema:1,compose_template:compose});assert.deepEqual(accepted.manifest.presentations,PRESENTATIONS_RELEASE);assert.equal(accepted.manifest.environment,PRESENTATIONS_ENVIRONMENT);
  assert.throws(()=>verifyRelease(output,c.trust,{environment:'standalone-local-media-v3',schema:1,compose_template:compose}),/ENV_SCHEMA/);
 }finally{c.cleanup();}
});
