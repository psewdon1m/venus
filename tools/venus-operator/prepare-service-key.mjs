/** Explicit operator preparation. Private material is generated OUTSIDE Git. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {generateKeyPairSync,randomUUID,createPrivateKey,createPublicKey} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {keyIdentity} from './release.mjs';
import {requireValue,atomic,canonical} from './files.mjs';
const directory=path.resolve(process.argv[2]??path.join(os.homedir(),'.codex','secrets','venus-release-'+randomUUID()));
const resume=process.argv.includes('--resume'),relative=path.relative(process.cwd(),directory);requireValue(relative.startsWith('..')||path.isAbsolute(relative),'PRIVATE_KEY_MUST_BE_OUTSIDE_PROJECT');requireValue(resume?fs.existsSync(directory)&&!fs.existsSync(path.join(directory,'PUBLIC-KEY-IDENTITY.json')):!fs.existsSync(directory),'KEY_DIRECTORY_ALREADY_EXISTS');fs.mkdirSync(directory,{recursive:true,mode:0o700});
if(process.platform==='win32'){const who=execFileSync('whoami',['/user','/fo','csv','/nh'],{encoding:'utf8'}),sid=/S-1-5-21-[0-9-]+/.exec(who)?.[0];requireValue(sid,'OWNER_SID_REQUIRED');execFileSync('icacls',[directory,'/inheritance:r','/grant:r','*'+sid+':(OI)(CI)F'],{stdio:'pipe'});}else fs.chmodSync(directory,0o700);
// Windows does not implement POSIX directory fsync. This preparation helper
// flushes files and pins an owner-only NTFS ACL; Linux runtime atomic() stays
// strict and is not weakened to hide that platform distinction.
function preparedFile(file,bytes,mode=0o600){if(process.platform!=='win32')return atomic(file,bytes,mode);const tmp=file+'.prepare-'+randomUUID(),fd=fs.openSync(tmp,'wx',mode);try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(tmp,file);}
const privateFile=path.join(directory,'venus-service-signing.pem');let privateKey;
if(resume){const s=fs.lstatSync(privateFile);requireValue(s.isFile()&&!s.isSymbolicLink(),'PRIVATE_KEY_FILE_UNSAFE');privateKey=createPrivateKey(fs.readFileSync(privateFile));requireValue(privateKey.asymmetricKeyType==='ed25519','PRIVATE_KEY_ALGORITHM');}else{privateKey=generateKeyPairSync('ed25519').privateKey;preparedFile(privateFile,privateKey.export({type:'pkcs8',format:'pem'}));}
const publicPem=createPublicKey(privateKey).export({type:'spki',format:'pem'}),id=keyIdentity(publicPem).id;
const descriptor={format:'VENUS-RELEASE-TRUST-1',environment:'service',key_id:id,public_key_pem:publicPem,owner_approved:false,status:'REAL_LOCAL_KEY_PREPARED_OWNER_APPROVAL_AND_GITHUB_ENVIRONMENT_PENDING',private_key_in_repository:false};
preparedFile(path.resolve('infra/venus/release-trust.json'),canonical(descriptor)+'\n',0o644);
preparedFile(path.join(directory,'PUBLIC-KEY-IDENTITY.json'),canonical({key_id:id,public_key_pem:publicPem,private_key_file:privateFile,owner_approval:'PENDING',uploaded_to_GitHub:false,production_signing_readiness:false})+'\n');
process.stdout.write(JSON.stringify({status:'PREPARED_NOT_ACTIVATED',key_id:id,private_directory:directory,trust_anchor:'infra/venus/release-trust.json',private_material_logged:false,owner_approval_required:true})+'\n');
