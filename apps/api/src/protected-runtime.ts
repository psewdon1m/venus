/** P06 opt-in: protected ledgers are NEVER provisioned or restored by startup. */
import * as fs from 'node:fs';
import {dirname,join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {requireThat} from './security.js';
const digest=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
interface Floor {bytes:number;sha256:string}
interface Witness {format:1;deletion:Floor;catalog:Floor}
function bounded(file:string,max:number) {
 const s=fs.lstatSync(file);requireThat(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.size<=max,'PROTECTED_RUNTIME_UNSAFE',503);
 const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{return fs.readFileSync(fd);}finally{fs.closeSync(fd);}
}
export function servingBarrier(file:string):()=>void {
 return()=>{try {const v=JSON.parse(bounded(file,1024).toString('utf8')) as {format:number;serving:boolean};requireThat(v.format===1&&v.serving===true,'SERVICE_MAINTENANCE',503);}catch{requireThat(false,'SERVICE_MAINTENANCE',503);}};
}
export class ProtectedRuntime {
 private readonly deletion:string;private readonly catalog:string;private readonly witness:string;
 constructor(readonly root:string) {
  const s=fs.lstatSync(root);requireThat(s.isDirectory()&&!s.isSymbolicLink()&&s.uid===process.getuid?.()&&(s.mode&0o777)===0o700,'PROTECTED_RUNTIME_UNSAFE',503);
  this.deletion=join(root,'deletions.jsonl');this.catalog=join(root,'catalog.jsonl');this.witness=join(root,'high-water.json');this.checkpoint();
 }
 checkpoint=()=>{
  const value=JSON.parse(bounded(this.witness,16384).toString('utf8')) as Witness;requireThat(value.format===1,'PROTECTED_LEDGER_CORRUPT',503);
  const updated:Witness={format:1,deletion:{bytes:0,sha256:''},catalog:{bytes:0,sha256:''}};let changed=false;
  for(const [name,file] of [['deletion',this.deletion],['catalog',this.catalog]] as const) {
   const bytes=bounded(file,16*1024*1024),floor=value[name];requireThat(floor&&Number.isSafeInteger(floor.bytes)&&floor.bytes>=0&&/^[a-f0-9]{64}$/.test(floor.sha256)&&bytes.length>=floor.bytes&&digest(bytes.subarray(0,floor.bytes))===floor.sha256,'PROTECTED_LEDGER_REGRESSED',503);
   requireThat(bytes.length===0||bytes.at(-1)===10,'PROTECTED_LEDGER_TRUNCATED',503);
   updated[name]={bytes:bytes.length,sha256:digest(bytes)};changed ||=updated[name].bytes!==floor.bytes;
  }
  if(changed) {
   const tmp=this.witness+'.tmp-'+randomUUID(),fd=fs.openSync(tmp,'wx',0o600);try{fs.writeFileSync(fd,JSON.stringify(updated)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(tmp,this.witness);const dir=fs.openSync(dirname(this.witness),fs.constants.O_RDONLY|fs.constants.O_DIRECTORY);try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}
  }
 };
}
