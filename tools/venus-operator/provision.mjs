/** Explicit first-install provisioning only; never invoked on startup or recover. */
import fs from 'node:fs';
import {provisionMedia} from '../media-provision.mjs';
import path from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {requireValue,atomic,writeJson,read,syncDirectory} from './files.mjs';
export function provision(root,operatorCredentialFile,{media=false}={}){
 requireValue(process.platform==='linux'&&process.getuid()===0,'PROVISION_ROOT_REQUIRED');requireValue(path.isAbsolute(root)&&root!=='/','PROVISION_ROOT');const credential=read(operatorCredentialFile,65536);requireValue(credential.length>0,'OPERATOR_CREDENTIAL_REQUIRED');
 fs.mkdirSync(root,{recursive:true,mode:0o700});for(const n of ['protected','secrets','postgres','operator-credentials'])requireValue(!fs.existsSync(path.join(root,n)),'PROVISION_ALREADY_EXISTS');
 for(const n of ['jobs','releases','backups','control','socket','protected','secrets','postgres','operator-credentials']){const p=path.join(root,n);fs.mkdirSync(p,{mode:n==='control'?0o755:n==='socket'?0o750:0o700});fs.chownSync(p,n==='protected'?1000:n==='postgres'?999:n==='operator-credentials'?1002:1001,n==='socket'||n==='operator-credentials'?1002:n==='protected'?1000:n==='postgres'?999:1001);}
 for(const n of ['topic-births','topic-personal','topic-personal-witness','topic-lifecycle','topic-lifecycle-witness']){const p=path.join(root,'protected',n);fs.mkdirSync(p,{mode:0o700});fs.chownSync(p,1000,1000);}
 if(media){const base=path.join(root,'protected','media'),result=provisionMedia(base);for(const p of [base,result.authorityDirectory,result.keyFile,path.join(result.authorityDirectory,'authority.json'),path.join(result.authorityDirectory,'authority-witness.json')])fs.chownSync(p,1000,1000);}
 const empty=createHash('sha256').update('').digest('hex');for(const n of ['deletions.jsonl','catalog.jsonl']){const p=path.join(root,'protected',n);atomic(p,'',0o600);fs.chownSync(p,1000,1000);}
 const witness=path.join(root,'protected','high-water.json');writeJson(witness,{format:1,deletion:{bytes:0,sha256:empty},catalog:{bytes:0,sha256:empty}});fs.chownSync(witness,1000,1000);
 const keyring=path.join(root,'secrets','keyring');writeJson(keyring,{current:'v1',keys:{v1:randomBytes(32).toString('base64')}},0o400);fs.chownSync(keyring,1000,1000);
 // Postgres UID999 and app GID1000 only; directory0700 protects the host path.
 const dbSecret=path.join(root,'secrets','db_password');atomic(dbSecret,randomBytes(48).toString('base64url'),0o440);fs.chownSync(dbSecret,999,1000);
 const token=path.join(root,'operator-credentials','key');atomic(token,credential,0o400);fs.chownSync(token,1002,1002);
 writeJson(path.join(root,'control','serving.json'),{format:1,serving:false},0o444);fs.chownSync(root,1001,1001);syncDirectory(root);
 return {status:'EXPLICIT_INITIAL_PROVISION_COMPLETE',root,secrets_logged:false,operator_credential:'EXACT_INPUT_FILE_UNCHANGED',restart_provisions_nothing:true};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){try{const [root,credential,profile]=process.argv.slice(2);process.stdout.write(JSON.stringify(provision(root,credential,{media:profile==='--media'}))+'\n');}catch(error){process.stderr.write(JSON.stringify({code:/^[A-Z_]+$/.test(error.message)?error.message:'PROVISION_FAILED'})+'\n');process.exitCode=1;}}
