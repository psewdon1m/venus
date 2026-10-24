/** Synchronous fsync-backed concatenated-gzip hash chain, immutable sealed segments. */
import assert from 'node:assert/strict';
import {openSync,writeSync,fsyncSync,closeSync,readFileSync,renameSync,mkdirSync,lstatSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
const hash=b=>createHash('sha256').update(b).digest('hex'),zero='0'.repeat(64),rawCap=32*1024**2,gzipCap=4*1024**2,rowCap=2*1024**2;
export function durableSink(directory,{guard,owner,payloadLimit=15*1024**3}={}){
 assert.equal(typeof guard,'function');assert(/^[a-f0-9]{32}$/.test(owner));const root=resolve(directory);assert(!existsSync(root));guard(65536);mkdirSync(root);for(const d of ['payload','active','control'])mkdirSync(join(root,d));const chunks=[];let fd=null,active=null,rawBytes=0,gzipBytes=0,seq=0,head=zero,persistedBytes=0,closed=false,fault=null;const secondary=[];
 const errorInfo=e=>({name:typeof e?.name==='string'?e.name:'Error',code:typeof e?.code==='string'?e.code:null});
 function latch(error){if(!fault)fault=error;else if(error!==fault)secondary.push(errorInfo(error));if(fd!==null){const owned=fd;fd=null;try{closeSync(owned);}catch(e){secondary.push(errorInfo(e));}}}
 function healthy(){if(fault)throw new Error('DURABLE_SINK_POISONED',{cause:fault});}
 function operation(fn){healthy();try{return fn();}catch(e){latch(e);throw fault;}}
 const validateRoot=()=>{assert(!lstatSync(root).isSymbolicLink());for(const d of ['payload','active','control'])assert(lstatSync(join(root,d)).isDirectory()&&!lstatSync(join(root,d)).isSymbolicLink());};
 function writeAll(handle,raw){try{let offset=0;while(offset<raw.length){const n=writeSync(handle,raw,offset,raw.length-offset);assert(n>0);offset+=n;}fsyncSync(handle);}catch(e){latch(e);throw fault;}}
 function manifest(){return{schema:1,owner,kind:'DURABLE_GZIP_MEMBER_HASH_CHAIN',segments:chunks.map(c=>({...c})),last_sequence:seq,head_sha256:head,payload_bytes:persistedBytes,raw_retention:'Every appended row fsynced before durable receipt; unsealed crash prefix remains NOT_ACCEPTED'};}
 function control(name,value){const b=Buffer.from(JSON.stringify(value)+'\n');assert(b.length<=16*1024**2);guard(b.length);validateRoot();const target=join(root,'control',name),temp=target+'.next';assert(!existsSync(temp));if(existsSync(target))assert(!lstatSync(target).isSymbolicLink());const f=openSync(temp,'wx',0o600);try{writeAll(f,b);}finally{closeSync(f);}renameSync(temp,target);}
 function seal(){return operation(()=>{if(fd===null)return;guard(65536);fsyncSync(fd);closeSync(fd);fd=null;const raw=readFileSync(active);assert.equal(raw.length,gzipBytes);const name=String(chunks.length+1).padStart(9,'0')+'.gz';renameSync(active,join(root,'payload',name));chunks.push({file:name,bytes:gzipBytes,raw_bytes:rawBytes,sha256:hash(raw),last_sequence:seq,head_sha256:head});active=null;rawBytes=0;gzipBytes=0;control('manifest-current.json',manifest());});}
 function append(kind,value,tags={}){assert(!closed);return operation(()=>{
  assert(/^[a-z][a-z0-9-]{0,63}$/.test(kind));assert(tags&&typeof tags==='object'&&!Array.isArray(tags));for(const[k,v]of Object.entries(tags)){assert(['cell','group','stratum'].includes(k));assert(typeof v==='string'&&v.length<=512);}
  const body={schema:1,owner,sequence:seq+1,previous_sha256:head,kind,tags,value},digest=hash(Buffer.from(JSON.stringify(body))),line=Buffer.from(JSON.stringify({...body,row_sha256:digest})+'\n');assert(line.length<=rowCap,'DURABLE_ROW_CAP');const member=gzipSync(line,{level:6});assert(member.length<=rowCap+65536);assert(persistedBytes+member.length<=payloadLimit,'RAW_PAYLOAD15G_CAP');guard(member.length+8192);validateRoot();
  if(fd!==null&&(rawBytes+line.length>rawCap||gzipBytes+member.length>gzipCap))seal();
  if(fd===null){active=join(root,'active','current.gz.partial');assert(!existsSync(active));fd=openSync(active,'wx',0o600);}
  writeAll(fd,member);rawBytes+=line.length;gzipBytes+=member.length;persistedBytes+=member.length;seq++;head=digest;return{sequence:seq,row_sha256:digest,durable:true,compression:'gzip6 independent member',bytes:member.length};
 });}
 async function* replay(kind,selector={}){
  healthy();try{seal();const snapshot=chunks.map(c=>({...c}));let previous=zero,seen=0;
  for(const c of snapshot){guard(0);assert(/^\d{9}\.gz$/.test(c.file));const path=join(root,'payload',c.file),s=lstatSync(path);assert(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1);const raw=readFileSync(path);assert.equal(raw.length,c.bytes);assert.equal(hash(raw),c.sha256);const expanded=gunzipSync(raw,{maxOutputLength:rawCap});assert.equal(expanded.length,c.raw_bytes);assert(expanded.at(-1)===10,'TRUNCATED_RAW_LINE');
   for(const line of expanded.toString('utf8').split('\n')){if(!line)continue;healthy();guard(0);const r=JSON.parse(line),{row_sha256,...body}=r;assert.equal(r.owner,owner);assert.equal(r.schema,1);assert.equal(r.sequence,++seen);assert.equal(r.previous_sha256,previous);assert.equal(hash(Buffer.from(JSON.stringify(body))),row_sha256);previous=row_sha256;if(r.kind===kind&&Object.entries(selector).every(([k,v])=>r.tags[k]===v))yield r.value;}
   assert.equal(seen,c.last_sequence);assert.equal(previous,c.head_sha256);
  }}catch(e){latch(e);throw fault;}
 }
 async function finish(receipt){assert(!closed);return operation(()=>{append('section-receipt',receipt);seal();const m=manifest(),b=Buffer.from(JSON.stringify(m,null,2)+'\n');guard(b.length);assert(b.length<=16*1024**2);const target=join(root,'payload','FINAL_INDEX.json');assert(!existsSync(target));const f=openSync(target,'wx',0o600);try{writeAll(f,b);}finally{closeSync(f);}closed=true;return{status:'DURABLE_RAW_CLOSED_NOT_STATISTICAL_ACCEPTANCE',owner,records:seq,segments:chunks.length,index_sha256:hash(b),payload_bytes:persistedBytes};});}
 function abort(){if(fd!==null){const owned=fd;fd=null;try{if(!fault)fsyncSync(owned);}catch(e){latch(e);}finally{try{closeSync(owned);}catch(e){latch(e);}}}closed=true;return{status:'NOT_ACCEPTED_PREFIX_RETAINED',owner,sequence:seq,head_sha256:head,poisoned:Boolean(fault),first_error:fault?errorInfo(fault):null,secondary_errors:secondary.slice()};}
 return{append,replay,finish,abort,seal,manifest,root,get fault(){return fault;}};
}
