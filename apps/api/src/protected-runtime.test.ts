import {describe,it,expect} from 'vitest';
import * as fs from 'node:fs';
import os from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {ProtectedRuntime,servingBarrier} from './protected-runtime.js';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
describe.skipIf(process.platform!=='linux')('P06 protected runtime',()=>{
 it('retains a durable prefix floor across processes and denies missing/regressed authority',()=>{
  const root=fs.mkdtempSync(join(os.tmpdir(),'venus-protected-'));fs.chmodSync(root,0o700);
  try{for(const n of ['deletions.jsonl','catalog.jsonl'])fs.writeFileSync(join(root,n),'',{mode:0o600});fs.writeFileSync(join(root,'high-water.json'),JSON.stringify({format:1,deletion:{bytes:0,sha256:hash('')},catalog:{bytes:0,sha256:hash('')}}),{mode:0o600});const guard=new ProtectedRuntime(root);fs.appendFileSync(join(root,'deletions.jsonl'),'new-revocation\n');guard.checkpoint();expect(()=>new ProtectedRuntime(root)).not.toThrow();fs.writeFileSync(join(root,'deletions.jsonl'),'');expect(()=>new ProtectedRuntime(root)).toThrow();fs.unlinkSync(join(root,'high-water.json'));expect(()=>new ProtectedRuntime(root)).toThrow();}finally{fs.rmSync(root,{recursive:true,force:true});}
 });
 it('serving gate defaults closed on missing/corrupt/false and opens only explicit true',()=>{
  const root=fs.mkdtempSync(join(os.tmpdir(),'venus-serving-')),file=join(root,'gate.json'),gate=servingBarrier(file);try{expect(gate).toThrow();fs.writeFileSync(file,'{}');expect(gate).toThrow();fs.writeFileSync(file,'{"format":1,"serving":false}');expect(gate).toThrow();fs.writeFileSync(file,'{"format":1,"serving":true}');expect(gate).not.toThrow();fs.unlinkSync(file);fs.symlinkSync('/etc/passwd',file);expect(gate).toThrow();}finally{fs.rmSync(root,{recursive:true,force:true});}
 });
});
