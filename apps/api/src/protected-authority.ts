/** Small Venus-owned positive authority outside database rollback. One API host;
 * callers serialize mutations with the media/presentation PostgreSQL advisory lock. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {requireThat} from './security.js';
const SHA=/^[a-f0-9]{64}$/,UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
interface State {format:1;version:number;previous:string;epoch:string;entries:Record<string,string>}
interface Witness {format:1;version:number;sha256:string}
export class ProtectedAuthority {
 readonly stateFile:string;readonly witnessFile:string;
 constructor(readonly root:string,readonly limit=64){
  requireThat(path.isAbsolute(root)&&Number.isSafeInteger(limit)&&limit>0&&limit<=256,'MEDIA_AUTHORITY_CONFIGURATION',503);
  const s=fs.lstatSync(root);requireThat(s.isDirectory()&&!s.isSymbolicLink()&&s.uid===process.getuid?.()&&(s.mode&0o777)===0o700,'MEDIA_AUTHORITY_UNSAFE',503);
  this.stateFile=path.join(root,'authority.json');this.witnessFile=path.join(root,'authority-witness.json');this.read();
 }
 private bounded(file:string){const s=fs.lstatSync(file);requireThat(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.uid===process.getuid?.()&&(s.mode&0o777)===0o600&&s.size>0&&s.size<=65536,'MEDIA_AUTHORITY_UNSAFE',503);const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const actual=fs.fstatSync(fd);requireThat(actual.ino===s.ino&&actual.dev===s.dev&&actual.size===s.size,'MEDIA_AUTHORITY_CHANGED',503);return fs.readFileSync(fd);}finally{fs.closeSync(fd);}}
 private atomic(file:string,bytes:Buffer){const temporary=file+'.tmp-'+randomUUID(),fd=fs.openSync(temporary,'wx',0o600);try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temporary,file);const dir=fs.openSync(this.root,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY);try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}}
 private read(){
  const raw=this.bounded(this.stateFile),state=JSON.parse(raw.toString()) as State,witness=JSON.parse(this.bounded(this.witnessFile).toString()) as Witness;
  requireThat(Object.keys(state).sort().join(',')==='entries,epoch,format,previous,version'&&state.format===1&&Number.isSafeInteger(state.version)&&state.version>=0&&SHA.test(state.previous)&&UUID.test(state.epoch)&&state.entries&&typeof state.entries==='object'&&!Array.isArray(state.entries)&&Object.keys(state.entries).length<=this.limit&&Object.entries(state.entries).every(([id,binding])=>UUID.test(id)&&typeof binding==='string'&&SHA.test(binding)),'MEDIA_AUTHORITY_CORRUPT',503);
  requireThat(Object.keys(witness).sort().join(',')==='format,sha256,version'&&witness.format===1&&Number.isSafeInteger(witness.version)&&witness.version>=0&&SHA.test(witness.sha256),'MEDIA_AUTHORITY_CORRUPT',503);
  const sha256=hash(raw),current=state.version===witness.version&&sha256===witness.sha256,rollforward=state.version===witness.version+1&&state.previous===witness.sha256;
  requireThat(current||rollforward,'MEDIA_AUTHORITY_REGRESSED',503);return {state,sha256,rollforward};
 }
 checkpoint(){const {state}=this.read();return {epoch:state.epoch,entries:{...state.entries}};}
 /** Only called under the component's database advisory mutation lock. */
 mutate(epoch:string,operation:(entries:Record<string,string>)=>void,rotate=false){
  requireThat(UUID.test(epoch),'MEDIA_EPOCH_RETIRED',503);const before=this.read();requireThat(rotate||before.state.epoch===epoch,'MEDIA_EPOCH_RETIRED',503);
  if(before.rollforward)this.atomic(this.witnessFile,Buffer.from(JSON.stringify({format:1,version:before.state.version,sha256:before.sha256})+'\n'));
  const entries:Record<string,string>={...before.state.entries};operation(entries);
  requireThat(Object.keys(entries).length<=this.limit&&Object.entries(entries).every(([id,binding])=>UUID.test(id)&&SHA.test(binding)),'MEDIA_CAPACITY',409);
  const state:State={format:1,version:before.state.version+1,previous:before.sha256,epoch:rotate?epoch:before.state.epoch,entries:Object.fromEntries(Object.entries(entries).sort(([a],[b])=>a.localeCompare(b)))};
  requireThat(Number.isSafeInteger(state.version),'MEDIA_AUTHORITY_EXHAUSTED',503);
  const raw=Buffer.from(JSON.stringify(state)+'\n');this.atomic(this.stateFile,raw);this.atomic(this.witnessFile,Buffer.from(JSON.stringify({format:1,version:state.version,sha256:hash(raw)})+'\n'));
 }
}
