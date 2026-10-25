import fs from 'node:fs';
import type {Writable} from 'node:stream';
import type pg from 'pg';
import type {MusicCommand,MusicState} from '@venus/contracts';
import {Rooms,revision} from './rooms.js';
import {requireThat} from './security.js';
import {MusicCatalog,musicRange} from './music-catalog.js';
interface Row {rev:string;queue:string[];catalog_digest:string;track_index:number;playing:boolean;position_ms:number;anchored_at:Date}
const initial=(now:number):Row=>({rev:'0',queue:[],catalog_digest:'',track_index:0,playing:false,position_ms:0,anchored_at:new Date(now)});
export class Music {
 private streams=new Map<string,number>();
 private streamCount=0;
 constructor(readonly rooms:Rooms,readonly catalog:MusicCatalog){rooms.attachMusic(()=>catalog.available(rooms.now()));}
 private async row(c:pg.PoolClient,id:string){return (await c.query<Row>('SELECT * FROM room_music_state WHERE room_id=$1',[id])).rows[0]??initial(this.rooms.now());}
 private project(id:string,row:Row,host:boolean,context:'online'|'in_person'):MusicState {
  const now=this.rooms.now(),snapshot=this.catalog.snapshot(now);let index=row.track_index;
  const selected=()=>row.catalog_digest===snapshot.digest?snapshot.tracks.find(t=>t.id===row.queue[index])??null:null;
  let track=selected(),position=row.position_ms+(row.playing?Math.max(0,now-row.anchored_at.getTime()):0);
  while(track&&row.playing&&position>=track.duration_ms&&index<row.queue.length-1){position-=track.duration_ms;index++;track=selected();}
  position=track?Math.min(track.duration_ms,position):0;
  return {schema_version:1,room_id:id,rev:revision(row.rev),catalog_digest:snapshot.digest,server_time:new Date(now).toISOString(),status:row.playing&&!!track&&position<track.duration_ms?'playing':'paused',queue:row.queue,index,track,position_ms:position,reason:track?'ready':row.queue.length?'track_unavailable':'empty',can_control:host,default_speaker:context==='online'||host};
 }
 async dispatch(id:string,session:string|undefined,enqueue:(view:MusicState&{tracks:ReturnType<MusicCatalog['snapshot']>['tracks']})=>void){return this.rooms.transaction(async c=>{const a=await this.rooms.access(c,id,session,false,true);requireThat(a.member.slot!==null,'MEMBER_INACTIVE',403);const state=this.project(id,await this.row(c,id),a.member.role==='host',a.room.meeting_context),tracks=this.catalog.snapshot(this.rooms.now()).tracks;(await this.rooms.finalAccessFence(c,a,false,revision(a.member.socket_generation)))();enqueue({...state,tracks});});}
 async command(id:string,session:string|undefined,input:MusicCommand,requestId:string){
  requireThat(input&&typeof input==='object'&&!Array.isArray(input),'INVALID_REQUEST',400);
  const keys=Object.keys(input).sort().join(','),common='action,expected_rev,idempotency_key';
  requireThat(keys===(input.action==='queue'?'action,expected_rev,idempotency_key,tracks':input.action==='seek'?'action,expected_rev,idempotency_key,position_ms':common)&&['queue','play','pause','seek','next','previous'].includes(input.action)&&Number.isSafeInteger(input.expected_rev)&&input.expected_rev>=0&&typeof input.idempotency_key==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(input.idempotency_key),'INVALID_REQUEST',400);
  return this.rooms.transaction(async c=>{
   const a=await this.rooms.access(c,id,session),host=a.member.role==='host';requireThat(host,'HOST_REQUIRED');
   const scope='room:'+id+':music',replay=await this.rooms.replay(c,scope,input.idempotency_key,input);if(replay)return replay.body;
   const row=await this.row(c,id);requireThat(revision(row.rev)===input.expected_rev,'REVISION_CONFLICT',409);let state=this.project(id,row,host,a.room.meeting_context);
   let queue=row.queue,index=state.index,position=state.position_ms,playing=state.status==='playing',catalogDigest=row.catalog_digest;
   if(input.action==='queue'){requireThat(Array.isArray(input.tracks)&&input.tracks.length<=128&&input.tracks.every(t=>typeof t==='string'),'INVALID_REQUEST',400);for(const t of input.tracks)this.catalog.asset(t,this.rooms.now());const keep=state.track&&input.tracks.length>index&&input.tracks.slice(0,index+1).every((t,i)=>t===queue[i]);queue=[...input.tracks];catalogDigest=this.catalog.snapshot(this.rooms.now()).digest;if(!keep){index=0;position=0;playing=false;}}
   else if(input.action==='seek'){requireThat(state.track&&Number.isSafeInteger(input.position_ms)&&input.position_ms>=0&&input.position_ms<=state.track.duration_ms,'INVALID_REQUEST',400);position=input.position_ms;}
   else if(input.action==='play'){requireThat(state.track,'MUSIC_TRACK_UNAVAILABLE',409);if(position>=state.track.duration_ms)position=0;playing=true;}
   else if(input.action==='pause')playing=false;
   else {requireThat(queue.length>0,'MUSIC_QUEUE_EMPTY',409);index=Math.max(0,Math.min(queue.length-1,index+(input.action==='next'?1:-1)));this.catalog.asset(queue[index]!,this.rooms.now());position=0;}
   const anchored=new Date(this.rooms.now()),rev=revision(row.rev)+1;await c.query(`INSERT INTO room_music_state(room_id,rev,queue,catalog_digest,track_index,playing,position_ms,anchored_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(room_id) DO UPDATE SET rev=$2,queue=$3,catalog_digest=$4,track_index=$5,playing=$6,position_ms=$7,anchored_at=$8`,[id,rev,JSON.stringify(queue),catalogDigest,index,playing,position,anchored]);
   await this.rooms.changed(c,id);state=this.project(id,{rev:String(rev),queue,catalog_digest:catalogDigest,track_index:index,playing,position_ms:position,anchored_at:anchored},true,a.room.meeting_context);
   await this.rooms.remember(c,scope,input.idempotency_key,input,id,{body:{rev:state.rev},session:null,memberId:a.member.id,status:200},requestId,'music_'+input.action);(await this.rooms.finalAccessFence(c,a))();return {rev:state.rev};
  });
 }
 async pauseForCinema(c:pg.PoolClient,id:string){const row=await this.row(c,id);if(!row.playing)return;const state=this.project(id,row,true,'online');await c.query('UPDATE room_music_state SET playing=false,position_ms=$2,anchored_at=$3,track_index=$4,rev=rev+1 WHERE room_id=$1',[id,state.position_ms,new Date(this.rooms.now()),state.index]);await this.rooms.changed(c,id);}
 async stream(id:string,session:string|undefined,trackId:string,range:string|undefined,personal:boolean){
  let fd:number|undefined,streamKey='',counted=false,streamGeneration:number|undefined;
  const authorize=async(c:pg.PoolClient)=>{const a=await this.rooms.access(c,id,session,false,true);requireThat(a.member.slot!==null,'MEMBER_INACTIVE',403);if(streamGeneration!==undefined)requireThat(revision(a.member.socket_generation)===streamGeneration,'SOCKET_REPLACED',401);const row=await this.row(c,id),view=this.project(id,row,a.member.role==='host',a.room.meeting_context);requireThat(view.track?.id===trackId,'MUSIC_TRACK_UNAVAILABLE',404);requireThat(a.room.meeting_context==='online'||a.member.role==='host'||personal,'MUSIC_PERSONAL_OUTPUT_REQUIRED',403);return a;};
  await this.rooms.transaction(async c=>{const a=await authorize(c);streamKey=id+':'+a.member.id;streamGeneration=revision(a.member.socket_generation);(await this.rooms.finalAccessFence(c,a,false,streamGeneration))();});
  const asset=this.catalog.asset(trackId,this.rooms.now()),selection=musicRange(range,asset.bytes);
  requireThat(this.streamCount<64&&(this.streams.get(streamKey)??0)<2,'MUSIC_STREAM_LIMIT',429);
  fd=fs.openSync(asset.file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
  this.streamCount++;this.streams.set(streamKey,(this.streams.get(streamKey)??0)+1);counted=true;
  let aborted=false,output:Writable|undefined,started=false;
  const release=()=>{clearTimeout(timer);if(fd!==undefined){fs.closeSync(fd);fd=undefined;}if(counted){counted=false;this.streamCount--;const n=(this.streams.get(streamKey)??1)-1;if(n)this.streams.set(streamKey,n);else this.streams.delete(streamKey);}};
  const close=()=>{aborted=true;if(!output?.writableEnded)output?.destroy();release();};
  const timer=setTimeout(close,30000);timer.unref();
  const drain=async(target:Writable)=>{
   if(!target.writableNeedDrain)return;
   await new Promise<void>((resolve,reject)=>{const clean=()=>{target.off('drain',ready);target.off('close',failed);target.off('error',failed);},ready=()=>{clean();resolve();},failed=()=>{clean();reject(Error('MUSIC_STREAM_CLOSED'));};target.once('drain',ready);target.once('close',failed);target.once('error',failed);if(target.destroyed)failed();});
  };
  const deliver=async(target:Writable,begin:()=>void=()=>{},headOnly=false)=>{
   requireThat(!started,'MUSIC_STREAM_ALREADY_STARTED',503);started=true;output=target;let began=false,offset=selection.start;
   target.once('close',close);target.once('error',close);
   try{
    do{
     let writable=true;
     await this.rooms.transaction(async c=>{
      const a=await authorize(c);requireThat(!aborted&&!target.destroyed&&fd!==undefined,'MUSIC_STREAM_CLOSED',403);
      const bytes=headOnly?Buffer.alloc(0):Buffer.alloc(Math.min(65536,selection.end-offset+1));
      if(!headOnly)requireThat(fs.readSync(fd,bytes,0,bytes.length,offset)===bytes.length,'MUSIC_ASSET_CHANGED',503);
      const fence=await this.rooms.finalAccessFence(c,a,false,streamGeneration);requireThat(!aborted&&!target.destroyed&&fd!==undefined,'MUSIC_STREAM_CLOSED',403);this.catalog.unchanged(asset,fd,this.rooms.now());fence();
      if(!began){begin();began=true;}
      // No async hooks, intermediate Readable or prefetched chunk after this fence.
      if(headOnly)target.end();else{writable=target.write(bytes);offset+=bytes.length;}
     });
     // Never hold a room transaction while waiting for a slow receiver.
     if(headOnly||offset>selection.end)break;
     if(!writable)await drain(target);
     timer.refresh();
    }while(!aborted);
    if(!aborted&&!target.writableEnded)target.end();
   }catch(error){if(!began)throw error;target.destroy();}
   finally{target.off('close',close);target.off('error',close);release();}
  };
  return {deliver,close,...selection,size:asset.bytes,mime:asset.mime,etag:'"'+asset.sha256+'"'};
 }
}
