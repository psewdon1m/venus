import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {ProtectedAuthority} from '../../apps/api/dist/protected-authority.js';
import {provisionMedia} from '../../tools/media-provision.mjs';
test('host authority denies stale database grants, rollback and unsafe state',{skip:process.platform!=='linux'},()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'venus-p09-owned-')),root=path.join(parent,'new');
 try{const files=provisionMedia(root),authority=new ProtectedAuthority(files.authorityDirectory),epoch=randomUUID(),lease=randomUUID();authority.mutate(epoch,entries=>{entries[lease]='a'.repeat(64);},true);const old=fs.readFileSync(authority.stateFile);authority.mutate(epoch,entries=>{delete entries[lease];});assert.equal(authority.checkpoint().entries[lease],undefined);fs.writeFileSync(authority.stateFile,old);assert.throws(()=>authority.checkpoint(),error=>error.code==='MEDIA_AUTHORITY_REGRESSED');assert.throws(()=>provisionMedia(root));}
 finally{fs.rmSync(parent,{recursive:true,force:true});}
});
