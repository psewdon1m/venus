import {createHash} from 'node:crypto';
import type pg from 'pg';
import {AccessToken,TokenVerifier,TrackSource} from 'livekit-server-sdk';
import {expect,it} from 'vitest';
import {Calls,type CallScope} from './calls.js';
import {Media,type MediaLease} from './media.js';
import type {Rooms} from './rooms.js';
import {requireThat} from './security.js';

const room='00000000-0000-4000-8000-000000000001',caller='00000000-0000-4000-8000-000000000002',peer='00000000-0000-4000-8000-000000000003';
const scopeId='00000000-0000-4000-8000-000000000004',leaseId='00000000-0000-4000-8000-000000000005',epoch='00000000-0000-4000-8000-000000000006',boot='00000000-0000-4000-8000-000000000007';
type Deadline='session'|'lease'|'scope'|'general_scope'|'offer'|'none';
const operations=['grant','gateway','frame','renew','scope','inspect'] as const;

/** Real Calls/Media methods; only the database and caller's final asynchronous
 * fence are controlled. The caller and its lease remain valid in every race. */
function fixture(deadline:Deadline){
 let now=1000,offer={version:'fixture-v1',digest:'fixture-digest'},enqueued=0;
 const pair=deadline!=='general_scope',expires=(which:Deadline)=>new Date(deadline===which?1500:10000);
 const scope:CallScope={id:scopeId,room_id:room,kind:pair?'pair_call':'general_call',state:'active',rev:'1',upstream_room:'venus-p-'+'a'.repeat(48),api_epoch:epoch,created_by:caller,target_member_id:peer,a_session:'caller-session',b_session:'peer-session',a_generation:'7',b_generation:'8',expires_at:expires(pair?'scope':'general_scope'),updated_at:new Date(now)};
 const lease:MediaLease={id:leaseId,room_id:room,member_id:caller,session_hash:'caller-session',socket_generation:'7',kind:scope.kind,scope_id:scopeId,upstream_room:scope.upstream_room,publisher:true,allow_audio:true,allow_video:false,api_epoch:epoch,sfu_epoch:boot,binding_sha256:'',expires_at:new Date(10000),revoked_at:null};
 lease.binding_sha256=createHash('sha256').update(JSON.stringify([lease.id,room,caller,lease.session_hash,'7',lease.kind,scopeId,scope.upstream_room,true,epoch,boot,true,false])).digest('hex');
 const old={...lease,id:'00000000-0000-4000-8000-000000000008',kind:'cinema' as const,upstream_room:'venus-c-'+'b'.repeat(48),expires_at:new Date(0)};
 const entries:Record<string,string>={[leaseId]:lease.binding_sha256};
 let watchdog=false;
 const advance=async()=>{await Promise.resolve();now=2000;if(deadline==='offer')offer={version:'fixture-v2',digest:'new-digest'};};
 const query=async(sql:string,values:unknown[]=[])=>{
  if(sql.includes('MIN(t.expires_at)'))return {rows:[{n:values[7]?2:1,expires_at:expires('session')}]};
  if(sql.includes('MIN(expires_at) FILTER'))return {rows:[{n:0,expires_at:expires('lease')}]};
  if(sql.startsWith('SELECT * FROM room_call_scopes')){
   if(sql.includes("kind='general_call'"))return {rows:pair?[]:[scope]};
   if(sql.includes("kind='pair_call'"))return {rows:pair?[scope]:[]};
   return {rows:[scope]};
  }
  if(sql.startsWith('SELECT id FROM room_call_scopes'))return {rows:scope.expires_at.getTime()<=now?[{id:scope.id}]:[]};
  if(sql.startsWith('SELECT id AS lease_id'))return {rows:[{lease_id:leaseId,member_id:caller}]};
  if(sql.includes('FROM venus_media_runtime'))return {rows:[{api_epoch:epoch,sfu_epoch:boot,last_authority_at:new Date(1000)}]};
  if(sql.startsWith('SELECT l.*'))return {rows:[{...lease,session_expires_at:new Date(10000),room_activity_at:new Date(1000)}]};
  if(sql.startsWith('SELECT * FROM room_media_leases')){
   if(sql.includes('WHERE (revoked_at IS NULL'))return {rows:watchdog?[old]:[]};
   if(sql.includes('id=ANY'))return {rows:[old]};
   if(sql.includes('upstream_room=ANY'))return {rows:[old]};
   return {rows:[lease]};
  }
  if(sql.startsWith('SELECT * FROM room_cinema_state'))return {rows:[]};
  if(sql.startsWith('SELECT pg_advisory')||sql.startsWith('UPDATE')||sql.startsWith('DELETE'))return {rows:[]};
  throw Error('Unexpected fixture SQL: '+sql);
 };
 const c={query} as unknown as pg.PoolClient;
 const rooms={now:()=>now,options:{origin:'https://fixture.invalid',offer:()=>offer,ledger:{contains:()=>false}},transaction:async<T>(fn:(c:pg.PoolClient)=>Promise<T>)=>fn(c),
  access:async()=>({room:{id:room,state:'open',last_activity_at:new Date(1000)},member:{id:caller,presence:'online',slot:1,socket_generation:'7'},sessionHash:'caller-session'}),
  finalAccessFence:async()=>{await advance();return()=>requireThat(now<10000,'AUTH_REQUIRED',401);},replay:async()=>({body:{scope_id:scopeId}})
 } as unknown as Rooms;
 const secret='fixture-only-media-secret-never-used-outside-this-test';
 const media=Object.assign(Object.create(Media.prototype) as Media,{rooms,epoch,keyId:'fixture-key',secret,sockets:new Map(),verifier:new TokenVerifier('fixture-key',secret),
  authority:{checkpoint:()=>({epoch,entries}),mutate:(_epoch:string,fn:(entries:Record<string,string>)=>void)=>fn(entries)},ready:async()=>true,
  client:{deleteRoom:advance,removeParticipant:async()=>{}}
 });
 const calls=new Calls(media,true);Object.assign(media,{calls});
 const run=async(operation:typeof operations[number])=>{
  const enqueue=()=>{enqueued++;};
  if(operation==='grant')return media.deliverCallGrant(room,'caller',{row:lease,created:false},enqueue);
  if(operation==='frame')return media.frame(room,'caller',leaseId,enqueue);
  if(operation==='renew')return media.renew(room,'caller',leaseId);
  if(operation==='scope')return calls.deliverScope(room,'caller',scopeId,enqueue);
  if(operation==='inspect')return calls.inspect(room,'caller',enqueue);
  const token=new AccessToken('fixture-key',secret,{identity:leaseId,ttl:600});token.addGrant({roomJoin:true,room:scope.upstream_room,canSubscribe:true,canPublish:true,canPublishData:false,canUpdateOwnMetadata:false,canPublishSources:[TrackSource.MICROPHONE]});
  return media.gateway(room,'caller',await token.toJwt(),enqueue);
 };
 return {run,enqueued:()=>enqueued,calls,scope,watchdog:()=>{watchdog=true;return media.watchdog(boot);}};
}

for(const deadline of ['session','lease'] as const)for(const operation of operations){
 it(`rejects ${operation} if only the pair peer ${deadline} expires while the final caller fence awaits`,async()=>{
  const f=fixture(deadline);await expect(f.run(operation)).rejects.toMatchObject({code:'CALL_SCOPE_RETIRED'});expect(f.enqueued()).toBe(0);
 });
}
for(const operation of operations){
 it(`allows ${operation} when both peers remain valid after the same caller await`,async()=>{
  const f=fixture('none');if(operation==='renew')await expect(f.run(operation)).resolves.toMatchObject({lease_id:leaseId});else await expect(f.run(operation)).resolves.toBeUndefined();expect(f.enqueued()).toBe(operation==='renew'?0:1);
 });
 it(`fences general-call scope expiry on ${operation} too`,async()=>{
  const f=fixture('general_scope');await expect(f.run(operation)).rejects.toMatchObject({code:'CALL_SCOPE_RETIRED'});expect(f.enqueued()).toBe(0);
 });
}
it('rejects a changed peer entry policy at final delivery',async()=>{
 const f=fixture('offer');await expect(f.run('grant')).rejects.toMatchObject({code:'CALL_SCOPE_RETIRED'});expect(f.enqueued()).toBe(0);
});
for(const deadline of ['session','lease'] as const)it(`accept replay cannot enqueue metadata after peer ${deadline} expiry`,async()=>{
 const f=fixture(deadline);f.scope.created_by=peer;f.scope.target_member_id=caller;
 await expect(f.calls.accept(room,'caller',scopeId,{expected_rev:1,idempotency_key:'00000000-0000-4000-8000-000000000009'},()=>{throw Error('Expired pair enqueued');})).rejects.toMatchObject({code:'CALL_SCOPE_RETIRED'});
});
for(const deadline of ['session','lease','scope'] as const)it(`watchdog omits expired pair ${deadline} authority after its backend cleanup awaits`,async()=>{
 const f=fixture(deadline);await expect(f.watchdog()).resolves.toMatchObject({leases:[]});
});

it('cleans stale accepted pair status with no leases, retiring only the locked room and exact upstream scopes',async()=>{
 const day=86400000,foreign='00000000-0000-4000-8000-000000000099';let now=0,enqueued=0;
 const sample:CallScope={id:scopeId,room_id:room,kind:'pair_call',state:'pending',rev:'0',upstream_room:'venus-p-'+'a'.repeat(48),api_epoch:epoch,created_by:peer,target_member_id:caller,a_session:'peer-session',b_session:null,a_generation:'8',b_generation:null,expires_at:new Date(day+60000),updated_at:new Date(day)};
 const expired=Array.from({length:4},(_,i)=>({...sample,id:'00000000-0000-4000-8000-'+String(20+i).padStart(12,'0'),state:'active' as const,upstream_room:'venus-p-'+String(i).repeat(48),expires_at:new Date(day),updated_at:new Date(0)}));
 const foreignActive={...expired[0]!,id:'00000000-0000-4000-8000-000000000090',room_id:foreign},foreignPending={...foreignActive,id:'00000000-0000-4000-8000-000000000091',state:'pending' as const};
 const scopes:CallScope[]=[sample,...expired,foreignActive,foreignPending],deleted:string[]=[],mutatedRooms:string[]=[];
 const query=async(sql:string,values:unknown[]=[])=>{
  if(sql.startsWith('SELECT pg_advisory'))return {rows:[]};
  if(sql.includes('MIN(t.expires_at)'))return {rows:[{n:values[7]?2:1,expires_at:new Date(day*2)}]};
  if(sql.includes('MIN(expires_at) FILTER'))return {rows:[{n:0,expires_at:null}]};
  if(sql.startsWith('SELECT * FROM room_call_scopes')){
   if(sql.includes("kind='general_call'"))return {rows:[]};
   if(sql.includes("state IN ('pending','active')")&&sql.includes('expires_at>$2'))return {rows:scopes.filter(s=>s.room_id===values[0]&&s.state!=='ended'&&s.expires_at.getTime()>(values[1] as Date).getTime())};
   if(sql.includes('AND id=$2'))return {rows:scopes.filter(s=>s.room_id===values[0]&&s.id===values[1])};
   return {rows:scopes.filter(s=>s.room_id===values[0]&&s.id===values[1]&&s.state!=='ended')};
  }
  if(sql.startsWith('SELECT id FROM room_call_scopes'))return {rows:scopes.filter(s=>s.room_id===values[0]&&s.state==='active'&&s.expires_at.getTime()<=(values[1] as Date).getTime()).map(s=>({id:s.id}))};
  if(sql.startsWith('SELECT * FROM room_media_leases')||sql.startsWith('SELECT id AS lease_id'))return {rows:[]}; // No pair ever acquired a grant.
  if(sql.startsWith('UPDATE room_call_scopes')){
   if(sql.includes("SET state='active'")){Object.assign(sample,{state:'active',b_session:values[1],b_generation:values[2],rev:'1',expires_at:values[3],updated_at:values[4]});return {rows:[]};}
   if(sql.includes('id=ANY')){for(const s of scopes)if((values[0] as string[]).includes(s.id)){s.state='ended';s.updated_at=values[1] as Date;mutatedRooms.push(s.room_id);}return {rows:[]};}
   expect(sql).toContain('room_id=$1');for(const s of scopes)if(s.room_id===values[0]&&s.state==='pending'&&s.expires_at.getTime()<=(values[1] as Date).getTime()){s.state='ended';mutatedRooms.push(s.room_id);}return {rows:[]};
  }
  if(sql.startsWith('DELETE FROM room_call_scopes')){expect(sql).toContain('room_id=$1');expect(values[0]).toBe(room);return {rows:[]};}
  if(sql.startsWith('UPDATE venus_media_runtime'))return {rows:[]};
  throw Error('Unexpected expiry fixture SQL: '+sql);
 };
 const c={query} as unknown as pg.PoolClient,rooms={now:()=>now,options:{offer:()=>({version:'v1',digest:'digest'})},transaction:async<T>(fn:(c:pg.PoolClient)=>Promise<T>)=>fn(c),
  access:async()=>({room:{id:room},member:{id:caller,presence:'online',slot:1,socket_generation:'7'},sessionHash:'caller-session'}),replay:async()=>null,remember:async()=>{},finalAccessFence:async()=>()=>{}
 } as unknown as Rooms;
 const media=Object.assign(Object.create(Media.prototype) as Media,{rooms,epoch,authority:{mutate:()=>{}},client:{deleteRoom:async(name:string)=>{deleted.push(name);}},ready:async()=>true});
 const calls=new Calls(media,true);Object.assign(media,{calls});
 expect(scopes.filter(s=>s.room_id===room&&s.state==='active')).toHaveLength(4);
 now=day+1;
 await calls.inspect(room,'caller',view=>{expect(view.pairs.map(s=>s.id)).toEqual([scopeId]);enqueued++;});
 expect(enqueued).toBe(1);expect(expired.every(s=>s.state==='ended')).toBe(true);expect(deleted.sort()).toEqual(expired.map(s=>s.upstream_room).sort());
 expect(mutatedRooms).not.toContain(foreign);expect(foreignActive.state).toBe('active');expect(foreignPending.state).toBe('pending');
 await expect(calls.assertScope(c,room,expired[0]!.id,peer)).rejects.toMatchObject({code:'CALL_SCOPE_RETIRED'});
});

for(const confirmed of [true,false])it(`boot watchdog retires every unpublished/pending kind once and preserves cutoff confirmation=${confirmed}`,async()=>{
 const now=1000,entries:Record<string,string>={[leaseId]:'a'.repeat(64)},closed=new Set<string>(),writes:Array<{ids:string[];pending:boolean}>=[],backend:string[]=[];
 const kinds=['cinema','cinema','pair_call','general_call'] as const;
 const rows:MediaLease[]=kinds.map((kind,i)=>({id:'00000000-0000-4000-8000-'+String(30+i).padStart(12,'0'),room_id:room,member_id:caller,session_hash:'synthetic-session',socket_generation:'7',kind,scope_id:scopeId,upstream_room:kind==='cinema'?'venus-c-'+'a'.repeat(48):'venus-p-'+String(i).repeat(48),publisher:i!==0,api_epoch:epoch,sfu_epoch:epoch,binding_sha256:'b'.repeat(64),expires_at:new Date(10000),revoked_at:i===3?new Date(500):null,cutoff_pending:i===3}));
 const query=async(sql:string,values:unknown[]=[])=>{
  if(sql.includes('FROM venus_media_runtime'))return {rows:[{sfu_epoch:epoch}]};
  if(sql.startsWith('SELECT l.*'))return {rows:[]};
  if(sql==='SELECT * FROM room_media_leases WHERE revoked_at IS NULL OR cutoff_pending')return {rows};
  if(sql==='SELECT * FROM room_media_leases WHERE cutoff_pending')return {rows:rows.filter(r=>r.cutoff_pending)};
  if(sql.startsWith('SELECT * FROM room_media_leases')){
   if(sql.includes('WHERE (revoked_at IS NULL'))return {rows:rows.filter(r=>r.cutoff_pending)};
   if(sql.includes('id=ANY'))return {rows:rows.filter(r=>(values[0] as string[]).includes(r.id))};
   if(sql.includes('upstream_room=ANY'))return {rows:rows.filter(r=>(values[0] as string[]).includes(r.upstream_room))};
  }
  if(sql.startsWith('UPDATE room_media_leases')){
   expect(sql).toBe('UPDATE room_media_leases SET revoked_at=COALESCE(revoked_at,$2),cutoff_pending=$3 WHERE id=ANY($1::uuid[])');
   expect(backend.length).toBeGreaterThan(0);const ids=values[0] as string[],pending=values[2] as boolean;writes.push({ids:[...ids],pending});
   for(const r of rows)if(ids.includes(r.id)){r.revoked_at??=values[1] as Date;r.cutoff_pending=pending;}return {rows:[]};
  }
  if(sql.startsWith('SELECT pg_advisory')||sql.startsWith('UPDATE')||sql.startsWith('DELETE'))return {rows:[]};
  throw Error('Unexpected boot watchdog SQL: '+sql);
 };
 const c={query} as unknown as pg.PoolClient,rooms={now:()=>now,options:{offer:()=>({version:'v1',digest:'digest'}),ledger:{contains:()=>false}},transaction:async<T>(fn:(c:pg.PoolClient)=>Promise<T>)=>fn(c)} as unknown as Rooms;
 const cutoff=async(name:string)=>{expect(Object.keys(entries)).toEqual([]);expect(closed.size).toBe(4);expect(writes).toHaveLength(0);backend.push(name);if(!confirmed)throw Error('Synthetic admin unavailable');};
 const media=Object.assign(Object.create(Media.prototype) as Media,{rooms,epoch,sockets:new Map(rows.map(r=>[r.id,new Set([{close:()=>{closed.add(r.id);}}])])),authority:{checkpoint:()=>({epoch,entries}),mutate:(_epoch:string,fn:(value:Record<string,string>)=>void)=>fn(entries)},client:{deleteRoom:cutoff,removeParticipant:cutoff},control:async()=>({running:true,cutoff_confirmed:false})});
 Object.assign(media,{calls:new Calls(media,true)});
 await expect(media.watchdog(boot)).resolves.toMatchObject({leases:[]});
 expect(writes).toHaveLength(1);expect(writes[0]!.ids.sort()).toEqual(rows.map(r=>r.id).sort());expect(writes[0]!.pending).toBe(!confirmed);
 expect(rows.every(r=>r.revoked_at&&r.cutoff_pending===!confirmed)).toBe(true);expect(rows[3]!.revoked_at?.getTime()).toBe(500);
 if(!confirmed){backend.length=0;writes.length=0;await expect(media.admitVenue(c,room)).rejects.toMatchObject({code:'MEDIA_CUTOFF_UNCONFIRMED'});expect(writes).toHaveLength(0);}
});
