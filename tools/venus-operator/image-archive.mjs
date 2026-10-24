/** Read Docker-save metadata without loading or extracting image layers. */
import fs from 'node:fs';
import {sha256,requireValue,regular} from './files.mjs';
const MAX_ARCHIVE=2*1024*1024*1024;
export function dockerArchiveConfig(file){
 const size=regular(file,MAX_ARCHIVE).size;requireValue(size>=1024,'IMAGE_ARCHIVE_SIZE');
 const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW),entries=new Map();
 try{
  for(let offset=0,count=0;offset+512<=size;count++){
   requireValue(count<16384,'IMAGE_ARCHIVE_ENTRIES');const h=Buffer.alloc(512);requireValue(fs.readSync(fd,h,0,512,offset)===512,'IMAGE_ARCHIVE_TRUNCATED');
   if(h.every(b=>b===0))break;
   const text=(a,b)=>h.subarray(a,b).toString('utf8').replace(/\0.*$/s,'').trim();
   const octal=(a,b)=>{const n=text(a,b);requireValue(/^[0-7]+$/.test(n),'IMAGE_ARCHIVE_HEADER');return parseInt(n,8);};
   const sum=[...h].reduce((n,b,i)=>n+(i>=148&&i<156?32:b),0);requireValue(sum===octal(148,156),'IMAGE_ARCHIVE_CHECKSUM');
   const bytes=octal(124,136),prefix=text(345,500),name=(prefix?prefix+'/':'')+text(0,100);
   requireValue(Number.isSafeInteger(bytes)&&offset+512+bytes<=size,'IMAGE_ARCHIVE_TRUNCATED');
   if(h[156]===0||h[156]===48){requireValue(!entries.has(name),'IMAGE_ARCHIVE_DUPLICATE');entries.set(name,{offset:offset+512,size:bytes});}
   offset+=512+Math.ceil(bytes/512)*512;
  }
  const read=(name,max)=>{const entry=entries.get(name);requireValue(entry&&entry.size>0&&entry.size<=max,'IMAGE_ARCHIVE_METADATA');const b=Buffer.alloc(entry.size);requireValue(fs.readSync(fd,b,0,b.length,entry.offset)===b.length,'IMAGE_ARCHIVE_TRUNCATED');return b;};
  const manifest=JSON.parse(read('manifest.json',65536));requireValue(Array.isArray(manifest)&&manifest.length===1,'IMAGE_ARCHIVE_MANIFEST');
  const name=manifest[0].Config;requireValue(typeof name==='string'&&/^(?:blobs\/sha256\/[a-f0-9]{64}|[a-f0-9]{64}\.json)$/.test(name),'IMAGE_ARCHIVE_CONFIG_PATH');
  const raw=read(name,2*1024*1024),digest='sha256:'+sha256(raw),config=JSON.parse(raw);
  requireValue(name.includes(digest.slice(7)),'IMAGE_ARCHIVE_CONFIG_HASH');
  return {config_digest:digest,labels:config.config?.Labels??{}};
 }finally{fs.closeSync(fd);}
}
