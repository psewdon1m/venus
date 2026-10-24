import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {generateKeyPairSync} from 'node:crypto';
import {createRelease} from '../../tools/venus-operator/create-release.mjs';
import {keyIdentity} from '../../tools/venus-operator/release.mjs';
import {writeJson,json,atomic} from '../../tools/venus-operator/files.mjs';
import {UpdateEngine} from '../../tools/venus-operator/engine.mjs';
export function fixture(){const base=fs.mkdtempSync(path.join(os.tmpdir(),'venus-p06-')),root=path.join(base,'state');fs.mkdirSync(root);const pair=generateKeyPairSync('ed25519'),pem=pair.publicKey.export({type:'spki',format:'pem'}),privateKey=pair.privateKey.export({type:'pkcs8',format:'pem'});const trust={environment:'fixture',public_key_pem:pem,key_id:keyIdentity(pem).id},trustFile=path.join(base,'trust.json'),privateFile=path.join(base,'fixture-private.pem');writeJson(trustFile,trust);atomic(privateFile,privateKey);const compose=path.resolve('infra/venus/compose.standalone.yml');const releases={};for(const [name,version,char]of [['A','0.0.9001','a'],['B','0.0.9002','b']]){const output=path.join(base,name),result=createRelease({trust_file:trustFile,private_key_file:privateFile,version,main_sha:'1'.repeat(40),source_identity:'2'.repeat(64),image_reference:'ghcr.io/psewdon1m/venus@sha256:'+char.repeat(64),oci_digest:'sha256:'+char.repeat(64),config_digest:'sha256:'+char.repeat(64),compose_template:compose,output});releases[name]={...result,output,manifest:json(path.join(output,'manifest.json'))};}return {base,root,trust,trustFile,privateKey,privateFile,compose,releases,cleanup:()=>fs.rmSync(base,{recursive:true,force:true})};}
export class FakeDriver{
 constructor(ctx){this.ctx=ctx;this.version=ctx.releases.A.manifest.version;this.stopped=false;this.open=true;this.data=['backup-committed-1','backup-committed-2'];this.restores=0;this.starts=0;this.fail=null;}
 hit(name){if(this.fail===name)throw new Error(name);}
 async preflight(){this.hit('DISK_SPACE');}
 async ensureImage(){this.hit('PULL_FAILED');}
 async savePrevious(){return {image_id:'sha256:'+'a'.repeat(64),archive_sha256:'f'.repeat(64)};}
 async loadPrevious(){this.hit('OFFLINE_IMAGE_FAILED');}
 serving(value){this.open=value;}
 async stop(){this.stopped=true;}
 cleanupBackupTemps(){}
 async initialize(){}
 async start(manifest){if(manifest.version.endsWith('9002'))this.hit('MIGRATION_FAILED');this.version=manifest.version;this.stopped=false;this.starts++;}
 async healthy(expected){if(this.version.endsWith('9002'))this.hit('HEALTH_FAILED');if(expected&&expected.version!==this.version)throw new Error('WRONG_IMAGE');}
 async backup(current,id){this.hit('BACKUP_FAILED');this.saved=[...this.data];const manifest={created_at:new Date().toISOString(),write_boundary:'APP_STOPPED_AND_ALL_APP_WRITERS_QUIESCED'};this.backupRecord={file:id+'.vbackup',manifest,sha256:'f'.repeat(64)};return this.backupRecord;}
 readBackup(){this.hit('BACKUP_CORRUPT');return this.backupRecord;}
 async restore(){this.hit('RESTORE_FAILED');this.restores++;this.data=[...this.saved];}
}
export function engineFixture(ctx,controls){const driver=new FakeDriver(ctx),engine=new UpdateEngine({local_root:ctx.root,trust_file:ctx.trustFile,compose_template:ctx.compose},driver,controls);engine.import(ctx.releases.A.output);engine.import(ctx.releases.B.output);writeJson(path.join(ctx.root,'current.json'),engine.release(ctx.releases.A.release_id));return {engine,driver};}
