import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import type {MusicTrack} from '@venus/contracts';
import {requireThat} from './security.js';
interface Asset extends MusicTrack {file:string;sha256:string;bytes:number;mime:string;expires:number;active:boolean;identity:{dev:number;ino:number;size:number;mtimeMs:number;ctimeMs:number}}
interface Registry {digest:string;tracks:Map<string,Asset>}
const hex=/^[a-f0-9]{64}$/;
const ids=/^[a-z0-9][a-z0-9_-]{0,63}$/;
export class MusicCatalog {
 private cached:Registry|null=null;
 constructor(readonly file:string,readonly allowSynthetic=false){requireThat(path.isAbsolute(file),'MUSIC_CATALOG_PATH',503);}
 private parse():Registry {
  const stat=fs.lstatSync(this.file);requireThat(stat.isFile()&&!stat.isSymbolicLink()&&stat.size>0&&stat.size<=262144,'MUSIC_CATALOG_INVALID',503);
  const raw=fs.readFileSync(this.file),digest=createHash('sha256').update(raw).digest('hex');
  if(this.cached?.digest===digest)return this.cached;
  const v=JSON.parse(raw.toString()) as {schema_version:number;tracks:Record<string,unknown>[]};
  requireThat(v.schema_version===1&&Array.isArray(v.tracks)&&v.tracks.length<=128,'MUSIC_CATALOG_INVALID',503);
  const tracks=new Map<string,Asset>();let total=0;
  for(const t of v.tracks){
   requireThat(typeof t.id==='string'&&ids.test(t.id)&&!tracks.has(t.id),'MUSIC_CATALOG_INVALID',503);
   requireThat(typeof t.sha256==='string'&&hex.test(t.sha256)&&typeof t.file==='string'&&new RegExp('^'+t.sha256+'\\.(wav|mp3|ogg)$').test(t.file),'MUSIC_CATALOG_INVALID',503);
   requireThat(typeof t.duration_ms==='number'&&Number.isSafeInteger(t.duration_ms)&&t.duration_ms>0&&t.duration_ms<=86400000,'MUSIC_CATALOG_INVALID',503);
   const title=t.title as Record<string,unknown>,rights=t.rights as Record<string,unknown>;
   requireThat(title&&['ru','en','tr'].every(l=>typeof title[l]==='string'&&(title[l] as string).trim().length>0&&(title[l] as string).length<=200),'MUSIC_CATALOG_INVALID',503);
   requireThat(rights&&['synthetic','owner-provided','licensed','public-domain'].includes(String(rights.kind))&&typeof rights.reference==='string'&&rights.reference.length>0&&rights.reference.length<=2048&&Array.isArray(rights.territories)&&rights.territories.length>0&&rights.territories.every(t=>typeof t==='string'&&t.length>0&&t.length<=80)&&Array.isArray(rights.uses)&&rights.uses.includes('room-stream')&&rights.uses.includes('with-games')&&typeof rights.valid_until==='string'&&Number.isFinite(Date.parse(rights.valid_until))&&typeof t.active==='boolean','MUSIC_RIGHTS_REQUIRED',503);
   const synthetic=rights.kind==='synthetic';requireThat(!synthetic||this.allowSynthetic,'MUSIC_SYNTHETIC_NOT_ALLOWED',503);
   const file=path.join(path.dirname(this.file),t.file),fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
   try{
    const s=fs.fstatSync(fd);total+=s.size;requireThat(s.isFile()&&s.nlink===1&&s.size>0&&s.size<=134217728&&total<=2147483648,'MUSIC_ASSET_INVALID',503);
    const hash=createHash('sha256'),chunk=Buffer.alloc(65536);let n;while((n=fs.readSync(fd,chunk,0,chunk.length,null))>0)hash.update(chunk.subarray(0,n));
    requireThat(hash.digest('hex')===t.sha256,'MUSIC_ASSET_DIGEST',503);
    const mime=t.file.endsWith('.wav')?'audio/wav':t.file.endsWith('.mp3')?'audio/mpeg':'audio/ogg';
    const head=Buffer.alloc(12);fs.readSync(fd,head,0,12,0);
    requireThat(mime==='audio/wav'?head.toString('ascii',0,4)==='RIFF'&&head.toString('ascii',8,12)==='WAVE':mime==='audio/ogg'?head.toString('ascii',0,4)==='OggS':head.toString('ascii',0,3)==='ID3'||head[0]===255&&(head[1]!&224)===224,'MUSIC_ASSET_FORMAT',503);
    tracks.set(t.id,{id:t.id,title:title as MusicTrack['title'],duration_ms:t.duration_ms,synthetic,file,sha256:t.sha256,bytes:s.size,mime,expires:Date.parse(rights.valid_until),active:t.active,identity:{dev:s.dev,ino:s.ino,size:s.size,mtimeMs:s.mtimeMs,ctimeMs:s.ctimeMs}});
   }finally{fs.closeSync(fd);}
  }
  return this.cached={digest,tracks};
 }
 snapshot(now:number){const r=this.parse();return {digest:r.digest,tracks:[...r.tracks.values()].filter(t=>t.active&&t.expires>now).map(({id,title,duration_ms,synthetic})=>({id,title,duration_ms,synthetic}))};}
 asset(id:string,now:number){const t=this.parse().tracks.get(id);requireThat(t&&t.active&&t.expires>now,'MUSIC_TRACK_UNAVAILABLE',404);return t;}
 available(now:number){try{return this.snapshot(now).tracks.length>0;}catch{return false;}}
 unchanged(asset:Asset,fd:number,now:number){const current=this.asset(asset.id,now),s=fs.fstatSync(fd);requireThat(current.sha256===asset.sha256&&current.file===asset.file&&s.dev===current.identity.dev&&s.ino===current.identity.ino&&s.size===current.identity.size&&s.mtimeMs===current.identity.mtimeMs&&s.ctimeMs===current.identity.ctimeMs,'MUSIC_TRACK_REVOKED',403);}
}
export function musicRange(header:string|undefined,size:number){
 if(header===undefined)return {start:0,end:size-1,partial:false};
 const match=/^bytes=(\d*)-(\d*)$/.exec(header);requireThat(match&&(match[1]!==''||match[2]!==''),'MUSIC_RANGE_INVALID',416);
 const start=match[1]===''?Math.max(0,size-Number(match[2])):Number(match[1]);let end=match[2]===''||match[1]===''?size-1:Number(match[2]);
 requireThat(Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start>=0&&start<size&&end>=start&&(match[1]!==''||Number(match[2])>0),'MUSIC_RANGE_INVALID',416);
 end=Math.min(end,size-1,start+1048575);return {start,end,partial:true};
}
