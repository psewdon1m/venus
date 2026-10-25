/** Explicit new-directory provisioning only. Never API startup/restore initialization. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
export function provisionPresentations(root){
 if(!path.isAbsolute(root)||fs.existsSync(root))throw Error('PRESENTATIONS_NEW_DIRECTORY_REQUIRED');
 fs.mkdirSync(root,{mode:0o700});const authority=path.join(root,'authority');fs.mkdirSync(authority,{mode:0o700});
 const state=Buffer.from(JSON.stringify({format:1,version:0,previous:'0'.repeat(64),epoch:randomUUID(),entries:{}})+'\n');
 for(const [name,bytes]of [['authority.json',state],['authority-witness.json',Buffer.from(JSON.stringify({format:1,version:0,sha256:createHash('sha256').update(state).digest('hex')})+'\n')]]){
  const fd=fs.openSync(path.join(authority,name),'wx',0o600);try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 }
 if(process.platform!=='win32')for(const directory of [authority,root,path.dirname(root)]){const fd=fs.openSync(directory,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY);try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
 return {authorityDirectory:authority,entries_preserved_on_restart:true};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const result=provisionPresentations(path.resolve(process.argv[2]??''));process.stdout.write(JSON.stringify({status:'EXPLICIT_PRESENTATIONS_PROVISIONED',...result})+'\n');}
