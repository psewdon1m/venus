import fs from 'node:fs';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {requireThat} from './security.js';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
interface Identity {guardian_epoch:string;job_id:string;api_epoch:string;nonce:string}
interface Health {schema_version:1;guardian_epoch:string;state:'idle'|'busy'|'closed';job_id:string|null;api_epoch:string|null;nonce:string|null}
export interface RenderPage {index:number;file:string;bytes:number;sha256:string;width:number;height:number}
interface RenderResult extends Identity {schema_version:1;status:'ready'|'failed'|'cancelled';error:string|null;pages:RenderPage[];total_bytes:number}
const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
export class PresentationSpool {
 constructor(readonly root:string){requireThat(path.isAbsolute(root),'PRESENTATION_SPOOL_UNSAFE',503);const s=fs.lstatSync(root);requireThat(s.isDirectory()&&!s.isSymbolicLink()&&s.uid===process.getuid?.()&&(s.mode&0o7777)===0o1777,'PRESENTATION_SPOOL_UNSAFE',503);}
 private read(name:string,max:number){const file=path.join(this.root,name),s=fs.lstatSync(file);requireThat(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.uid===0&&(s.mode&0o777)===0o444&&s.size<=max,'PRESENTATION_WORKER_UNAVAILABLE',503);const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const a=fs.fstatSync(fd);requireThat(a.ino===s.ino&&a.dev===s.dev&&a.size===s.size,'PRESENTATION_WORKER_UNAVAILABLE',503);const bytes=fs.readFileSync(fd);requireThat(bytes.length===s.size,'PRESENTATION_WORKER_UNAVAILABLE',503);return {bytes,mtime:s.mtimeMs};}finally{fs.closeSync(fd);}}
 health():Health {const raw=this.read('health.json',4096);requireThat(Date.now()-raw.mtime<5000&&raw.mtime<=Date.now()+1000,'PRESENTATION_WORKER_UNAVAILABLE',503);const h=JSON.parse(raw.bytes.toString()) as Health;requireThat(h.schema_version===1&&UUID.test(h.guardian_epoch)&&['idle','busy','closed'].includes(h.state)&&(h.state!=='busy'||[h.job_id,h.api_epoch,h.nonce].every(x=>typeof x==='string'&&UUID.test(x))),'PRESENTATION_WORKER_UNAVAILABLE',503);return h;}
 available(){try{return this.health().state==='idle';}catch{return false;}}
 private write(name:string,bytes:Buffer){const file=path.join(this.root,name),tmp=path.join(this.root,'.api-'+randomUUID());requireThat(!fs.existsSync(file),'PRESENTATION_WORKER_BUSY',409);const fd=fs.openSync(tmp,'wx',0o600);try{fs.writeFileSync(fd,bytes);fs.fchmodSync(fd,0o444);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(tmp,file);}
 private json(name:string,value:unknown){this.write(name,Buffer.from(JSON.stringify(value)+'\n'));}
 private same(a:Identity,b:Identity){return a.guardian_epoch===b.guardian_epoch&&a.job_id===b.job_id&&a.nonce===b.nonce&&a.api_epoch===b.api_epoch;}
 private result(id:Identity){if(!fs.existsSync(path.join(this.root,'result.json')))return null;const r=JSON.parse(this.read('result.json',65536).bytes.toString()) as RenderResult;requireThat(r.schema_version===1&&this.same(r,id),'PRESENTATION_WORKER_UNAVAILABLE',503);return r;}
 private signal(name:'cancel.json'|'ack.json',id:Identity){if(!fs.existsSync(path.join(this.root,name)))this.json(name,{schema_version:1,...id});}
 async quiesce(){const deadline=Date.now()+125000;for(;;){const h=this.health();requireThat(h.state!=='closed','PRESENTATION_WORKER_UNAVAILABLE',503);if(h.state==='idle')return;const id=h as Identity;if(this.result(id))this.signal('ack.json',id);else this.signal('cancel.json',id);requireThat(Date.now()<deadline,'PRESENTATION_WORKER_UNAVAILABLE',503);await sleep(100);}}
 async render(input:{id:string;nonce:string;epoch:string;source:Buffer;source_sha256:string;output_budget_bytes:number},cancelled:()=>boolean){
  const h=this.health();requireThat(h.state==='idle','PRESENTATION_WORKER_BUSY',409);
  const id:Identity={guardian_epoch:h.guardian_epoch,job_id:input.id,nonce:input.nonce,api_epoch:input.epoch};
  this.write('source.pdf',input.source);this.json('request.json',{schema_version:1,...id,source_bytes:input.source.length,source_sha256:input.source_sha256,output_budget_bytes:input.output_budget_bytes});
  const deadline=Date.now()+125000;let result:RenderResult|null=null;
  try {for(;;){const current=this.health();requireThat(current.guardian_epoch===id.guardian_epoch&&current.state!=='closed','PRESENTATION_WORKER_UNAVAILABLE',503);if(cancelled()||Date.now()>deadline)this.signal('cancel.json',id);result=this.result(id);if(result)break;requireThat(Date.now()<deadline+5000,'PRESENTATION_WORKER_UNAVAILABLE',503);await sleep(100);}
   requireThat(result.status==='ready'&&!cancelled(),'PRESENTATION_RENDER_FAILED',422);
   requireThat(Array.isArray(result.pages)&&result.pages.length>=1&&result.pages.length<=100&&Number.isSafeInteger(result.total_bytes)&&result.total_bytes<=input.output_budget_bytes,'PRESENTATION_RENDER_LIMIT',422);
   let total=0;const pages=result.pages.map((page,index)=>{requireThat(page.index===index&&page.file===`page-${index}.png`&&Number.isSafeInteger(page.bytes)&&page.bytes>0&&page.bytes<=4*1024*1024&&/^[a-f0-9]{64}$/.test(page.sha256)&&Number.isSafeInteger(page.width)&&Number.isSafeInteger(page.height)&&page.width>0&&page.height>0&&page.width<=8192&&page.height<=8192&&page.width*page.height<=8000000,'PRESENTATION_RENDER_LIMIT',422);const bytes=this.read(page.file,4*1024*1024).bytes;requireThat(bytes.length===page.bytes&&sha(bytes)===page.sha256&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes.length>=24&&bytes.readUInt32BE(16)===page.width&&bytes.readUInt32BE(20)===page.height,'PRESENTATION_RENDER_INVALID',422);total+=bytes.length;requireThat(total<=input.output_budget_bytes,'PRESENTATION_RENDER_LIMIT',422);return {metadata:page,bytes};});requireThat(total===result.total_bytes,'PRESENTATION_RENDER_INVALID',422);const current=this.health();requireThat(current.state==='busy'&&this.same(current as Identity,id),'PRESENTATION_WORKER_UNAVAILABLE',503);return pages;
  }finally {if(result)this.signal('ack.json',id);else this.signal('cancel.json',id);await this.quiesce();}
 }
}
