/** Explicit owned-fixture setup, never used by production API startup. */
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
export function fixtureAuthority(root){if(fs.existsSync(root))return root;fs.mkdirSync(root,{mode:0o700});const state=Buffer.from(JSON.stringify({format:1,version:0,previous:'0'.repeat(64),epoch:randomUUID(),entries:{}})+'\n');for(const [name,data] of [['authority.json',state],['authority-witness.json',Buffer.from(JSON.stringify({format:1,version:0,sha256:createHash('sha256').update(state).digest('hex')})+'\n')]]){const fd=fs.openSync(path.join(root,name),'wx',0o600);try{fs.writeFileSync(fd,data);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}const fd=fs.openSync(root,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY);try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}return root;}
