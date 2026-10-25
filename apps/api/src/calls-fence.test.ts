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
