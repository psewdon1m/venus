import * as fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export function fileHash(file,start=0){regular(file,2*1024*1024*1024);const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW),hash=createHash('sha256'),buffer=Buffer.alloc(65536);try{let n,offset=start;while((n=fs.readSync(fd,buffer,0,buffer.length,offset))>0){hash.update(buffer.subarray(0,n));offset+=n;}return hash.digest('hex');}finally{fs.closeSync(fd);}}
export function requireValue(value,code){if(!value)throw new Error(code);}
export function canonical(value){
  if(value===null||typeof value!=='object'){requireValue(typeof value!=='number'||Number.isSafeInteger(value),'INVALID_NUMBER');return JSON.stringify(value);}
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  requireValue(Object.getPrototypeOf(value)===Object.prototype,'INVALID_OBJECT');
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
}
export function regular(file,max=256*1024*1024){const s=fs.lstatSync(file);requireValue(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.size<=max,'UNSAFE_FILE');return s;}
export function read(file,max){regular(file,max);const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{return fs.readFileSync(fd);}finally{fs.closeSync(fd);}}
export function json(file,max=1024*1024){return JSON.parse(read(file,max).toString('utf8'));}
export function syncDirectory(dir){const fd=fs.openSync(dir,fs.constants.O_RDONLY);try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
export function directory(dir){const s=fs.lstatSync(dir);requireValue(s.isDirectory()&&!s.isSymbolicLink(),'UNSAFE_DIRECTORY');return dir;}
export function atomic(file,bytes,mode=0o600){
  directory(path.dirname(file));const tmp=file+'.tmp-'+randomUUID();const fd=fs.openSync(tmp,'wx',mode);
  try{fs.fchmodSync(fd,mode);fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  try{fs.renameSync(tmp,file);syncDirectory(path.dirname(file));}catch(e){fs.rmSync(tmp,{force:true});throw e;}
}
export function writeJson(file,value,mode=0o600){atomic(file,canonical(value)+'\n',mode);}
export function exactKeys(value,keys){requireValue(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join('|')===[...keys].sort().join('|'),'INVALID_FIELDS');}
export const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export const HEX=/^[a-f0-9]{64}$/;
