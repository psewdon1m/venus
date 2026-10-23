import {it,expect,vi,afterEach} from 'vitest';
import * as fs from 'node:fs';
import {join,dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import type pg from 'pg';
import {Rooms} from './rooms.js';
import {Keyring,hash,type Cipher} from './security.js';
import {TopicRoomRegistry} from './topic-room-registry.js';
import {TopicRoomLifecycle,TopicRoomLifecycleError} from './topic-room-lifecycle.js';
import {PrivateTopicPreferences,type PrivateTopicLifecycle} from './private-topic-preferences.js';
import type {TopicNarrowing,TopicSafetyState} from './private-topic-ledger.js';
const keys=new Keyring('review',{review:Buffer.alloc(32,83).toString('base64')}),pins={taxonomy:'a'.repeat(64),policy:'b'.repeat(64),vocabulary:['alpha','beta']};
const room='10000000-0000-4000-8000-000000000001',owner='20000000-0000-4000-8000-000000000001',other='20000000-0000-4000-8000-000000000002',inc='40000000-0000-4000-8000-000000000001';
const roots:string[]=[],held={roomTransactionLockHeld:true as const};
afterEach(()=>{for(const root of roots.splice(0)){expect(dirname(root)).toBe('/state');fs.rmSync(root,{recursive:true,force:true});}});
function liveBridge(){
 const root=fs.mkdtempSync('/state/bridge-');roots.push(root);const directories=Object.fromEntries(['birthDirectory','personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory'].map(n=>{const path=join(root,n);fs.mkdirSync(path,0o700);return[n,path];})) as Parameters<TopicRoomLifecycle['constructor']>[0];
 const storage=new TopicRoomLifecycle({keys,pins,directories:()=>directories as never,now:()=>100000}),birth=storage.initializeRoom(room,1000,held);storage.admitMember(room,birth,owner,randomUUID(),held);
 const query=vi.fn(async(sql:string)=>{if(sql.includes('LEFT JOIN private_topic_room_births'))return {rows:[{private_protocol:2,incarnation:birth.incarnation,minimum_sequence:'1',taxonomy_digest:pins.taxonomy,policy_digest:pins.policy}]};if(sql.startsWith('SELECT s.expires_at'))return {rows:[{expires_at:new Date(200000),offer_version:'v',offer_digest:'d',socket_generation:'1',slot:0}]};throw Error('unexpected SQL '+sql);});
 const c={query} as unknown as pg.PoolClient,registry=new TopicRoomRegistry({storage,pins,provision:()=>{throw Error('must never initialize read');},topicsChanged:async()=>{}});
 const rooms=new Rooms({keys,ledger:{contains:()=>false} as never,pool:{} as never,origin:'https://localhost',offer:()=>({version:'v',digest:'d',text:{ru:'',en:'',tr:''},synthetic:true}),now:()=>100000,privateProtocol:registry});
 const a={room:{id:room,state:'open',last_activity_at:new Date(1000),private_protocol:2},member:{id:owner},sessionHash:hash('credential')} as Awaited<ReturnType<Rooms['access']>>;
 return {storage,birth,registry,rooms,c,a,directories:directories as unknown as Record<string,string>};
}
it.each(['corrupt','missing'])('SAFETY-GUARD-01 real lifecycle %s personal chain must not disable safety access fence',async attack=>{
 const f=liveBridge();(await f.rooms.finalAccessFence(f.c,f.a,true))();const path=join(f.directories.personalChainDirectory,'chain');if(attack==='missing')fs.unlinkSync(path);else{const b=fs.readFileSync(path);b[25]^=1;fs.writeFileSync(path,b);}
 // Safety must remain reachable when optional content storage is unavailable.
 await expect(f.rooms.finalAccessFence(f.c,f.a,true)).resolves.toBeTypeOf('function');
});

function provider(){
 let now=1000,expires=100000,sequence=1,live=true;const prefs=new Map<string,{rev:string;cipher:Cipher}>(),requests=new Map<string,string>(),safety=new Map<string,TopicSafetyState>(),order:string[]=[];
 const birth={incarnation:inc,minimumSequence:1,taxonomy_digest:pins.taxonomy,policy_digest:pins.policy};
 const state=(id:string):TopicSafetyState=>({...safety.get(id)??{roomId:room,ownerId:id,incarnation:inc,sequence,revision:0,taxonomy:pins.taxonomy,policy:pins.policy,excluded:[]},sequence});
 const read=vi.fn(({ownerId}:{ownerId:string})=>state(ownerId));
 const narrow=vi.fn((n:TopicNarrowing)=>{const old=state(n.ownerId);expect(n.expectedRevision).toBe(old.revision);const next={...old,sequence:++sequence,revision:old.revision+1,excluded:[...new Set([...old.excluded,...n.exclude])].sort()};safety.set(n.ownerId,next);order.push('narrow');return {...next,operationSequence:sequence,operationRevision:next.revision,replayed:false};});
 let selected=[owner,other];
 const query=vi.fn(async(sql:string,args:unknown[]=[])=>{
  if(sql.startsWith('SELECT id FROM room_members'))return {rows:selected.map(id=>({id}))};
  if(sql.startsWith('SELECT private_protocol'))return {rows:[{private_protocol:2}]};
  if(sql.startsWith('SELECT incarnation'))return {rows:[{incarnation:inc,minimum_sequence:'1',taxonomy_digest:pins.taxonomy,policy_digest:pins.policy}]};
  if(sql.startsWith('SELECT rev,cipher'))return {rows:prefs.has(args[1] as string)?[prefs.get(args[1] as string)]:[]};
  if(sql.startsWith('SELECT request_hash'))return {rows:requests.has(args[2] as string)?[{request_hash:requests.get(args[2] as string)}]:[]};
  if(sql.startsWith('SELECT count'))return {rows:[{count:String(requests.size)}]};
  if(sql.startsWith('SELECT s.member_id')){order.push('credential-fence');return {rows:[{member_id:owner,expires_at:new Date(expires),offer_version:'v',offer_digest:'d'}]};}
  if(sql.startsWith('INSERT INTO private_topic_preferences')){order.push('db-settings');prefs.set(args[1] as string,{rev:String(args[2]),cipher:args[3] as Cipher});return {rows:[]};}
  if(sql.startsWith('INSERT INTO private_topic_requests')){requests.set(args[2] as string,args[3] as string);return {rows:[]};}
  throw Error('unexpectedSQL '+sql);
 });
 const c={query} as unknown as pg.PoolClient,a={room:{id:room,state:'open',last_activity_at:new Date(0)},member:{id:owner},sessionHash:hash('credential')} as Awaited<ReturnType<Rooms['access']>>;
 const transaction=vi.fn(async(fn:(client:pg.PoolClient)=>Promise<unknown>)=>{const oldPrefs=new Map(prefs),oldReqs=new Map(requests);try{return await fn(c);}catch(error){prefs.clear();for(const [k,v]of oldPrefs)prefs.set(k,v);requests.clear();for(const [k,v]of oldReqs)requests.set(k,v);throw error;}});
 const rooms={options:{keys,offer:()=>({version:'v',digest:'d'}),ledger:{contains:()=>false}},now:()=>now,access:async()=>a,transaction} as unknown as Rooms;
 const lifecycle:PrivateTopicLifecycle={open:()=>({read,narrow}),assertLive:()=>{if(!live)throw Error('RETIRED');},revoke:vi.fn(async()=>{order.push('revoke');})};
 const service=new PrivateTopicPreferences(rooms,lifecycle,pins),observe=()=>service.readForPlanner(c,room,[owner,other]);
 const seed=(id:string,rev:number,allow=['alpha','beta'],excluded:string[]=[])=>{prefs.set(id,{rev:String(rev),cipher:keys.encrypt({schema_version:1,room_id:room,owner_member_id:id,rev,incarnation:inc,taxonomy_digest:pins.taxonomy,policy_digest:pins.policy,allow,excluded},`private-topics:${room}:${id}:${inc}:${rev}:1`)});};
 return {service,c,a,query,read,narrow,lifecycle,observe,transaction,prefs,requests,safety,state,order,seed,clock:(t:number)=>{now=t;},expiry:(t:number)=>{expires=t;},selected:(s:string[])=>{selected=s;},sequence:(s:number)=>{sequence=s;},retire:()=>{live=false;}};
}
it('observation exact object, nested arrays and member records are deeply frozen and scope-bound',async()=>{
 const f=provider(),s=await f.observe();for(const v of [s,s.members,...s.members,...s.members.flatMap(m=>[m.allow_topic_ids,m.excluded_topic_ids])])expect(Object.isFrozen(v)).toBe(true);
 expect(()=>f.service.assertPlannerCurrent(room,structuredClone(s))).toThrow(expect.objectContaining({code:'TOPIC_OBSERVATION_REQUIRED'}));expect(()=>f.service.assertPlannerCurrent(randomUUID(),s)).toThrow(expect.objectContaining({code:'TOPIC_OBSERVATION_REQUIRED'}));
});
it.each(['wrong-client','wrong-room','unselected-member'])('exact exclusion rejects %s proof without narrowing',async attack=>{
 const f=provider(),s=await f.observe(),c=attack==='wrong-client'?{query:f.query} as unknown as pg.PoolClient:f.c,a=attack==='wrong-room'?{...f.a,room:{...f.a.room,id:randomUUID()}}:attack==='unselected-member'?{...f.a,member:{...f.a.member,id:randomUUID()}}:f.a;
 await expect(f.service.excludeForPlannerLocked(c,a,s,randomUUID(),['alpha'])).rejects.toMatchObject({code:'TOPIC_OBSERVATION_REQUIRED'});expect(f.narrow).not.toHaveBeenCalled();
});
it.each(['missing','extra','duplicate'])('exact selected member SQL rows reject %s set',attack=>{
 const f=provider();f.selected(attack==='missing'?[owner]:attack==='extra'?[owner,other,randomUUID()]:[owner,other,other]);return expect(f.observe()).rejects.toMatchObject({code:'TOPIC_SAFETY_MEMBERS_CHANGED'});
});
it.each([[],[owner],[owner,owner],Array.from({length:9},()=>randomUUID()),['bad',other]].map(ids=>({ids})))('invalid selected IDs fail before any ledger read %\u0023',async({ids})=>{
 const f=provider();await expect(f.service.readForPlanner(f.c,room,ids)).rejects.toMatchObject({code:'TOPIC_SAFETY_MEMBERS_INVALID'});expect(f.read).not.toHaveBeenCalled();
});
it.each(['count-read','last-credential-read'])('credential expiry during %s prevents irreversible exclusion',async point=>{
 const f=provider(),s=await f.observe(),original=f.query.getMockImplementation()!;f.query.mockImplementation(async(sql,args)=>{const result=await original(sql,args);if(sql.startsWith(point==='count-read'?'SELECT count':'SELECT s.member_id'))f.clock(100001);return result;});
 await expect(f.service.excludeForPlannerLocked(f.c,f.a,s,randomUUID(),['alpha'])).rejects.toMatchObject({code:'AUTH_REQUIRED'});expect(f.narrow).not.toHaveBeenCalled();expect(f.prefs.size).toBe(0);
});
it('forged selected peer with original credential cannot narrow peer scope',async()=>{
 const f=provider(),s=await f.observe(),a={...f.a,member:{...f.a.member,id:other}};await expect(f.service.excludeForPlannerLocked(f.c,a,s,randomUUID(),['alpha'])).rejects.toMatchObject({code:'AUTH_REQUIRED'});expect(f.narrow).not.toHaveBeenCalled();
});
it('locked exclusion avoids nested transaction, revokes before publishing and retires original observation',async()=>{
 const f=provider();f.seed(owner,7);const s=await f.observe(),next=await f.service.excludeForPlannerLocked(f.c,f.a,s,randomUUID(),['alpha']);expect(f.transaction).not.toHaveBeenCalled();expect(f.order.indexOf('narrow')).toBeGreaterThan(f.order.indexOf('credential-fence'));expect(f.order.indexOf('revoke')).toBeGreaterThan(f.order.indexOf('narrow'));expect(f.order.indexOf('db-settings')).toBeGreaterThan(f.order.indexOf('revoke'));expect(next.members.find(m=>m.member_id===owner)!.allow_topic_ids).toEqual(['beta']);expect(()=>f.service.assertPlannerCurrent(room,s)).toThrow(expect.objectContaining({code:'TOPIC_STATE_CHANGED'}));
});
it('maximum low-part rollback after exclusion cannot regress global/member revision or restore allow',async()=>{
 const f=provider();f.seed(owner,4096);f.seed(other,4096);const before=await f.observe();f.narrow({roomId:room,ownerId:owner,operationId:randomUUID(),expectedRevision:0,exclude:['alpha']});f.prefs.clear();const after=await f.observe();expect(after.revision).toBeGreaterThan(before.revision);expect(after.members.find(m=>m.member_id===owner)!.revision).toBeGreaterThan(before.members.find(m=>m.member_id===owner)!.revision);expect(after.members.find(m=>m.member_id===owner)!.excluded_topic_ids).toEqual(['alpha']);
});
it('all eight maximum DB low parts remain below one protected sequence stride',async()=>{
 const f=provider(),ids=Array.from({length:8},(_,i)=>i===0?owner:i===1?other:randomUUID());f.selected(ids);for(const id of ids)f.seed(id,4096);const before=await f.service.readForPlanner(f.c,room,ids);f.narrow({roomId:room,ownerId:owner,operationId:randomUUID(),expectedRevision:0,exclude:['alpha']});f.prefs.clear();const after=await f.service.readForPlanner(f.c,room,ids);expect(after.revision-before.revision).toBe(65536-8*4096);expect(after.revision).toBeGreaterThan(before.revision);
});
it.each(['db-revision-over-limit','sequence-overflow'])('planner rejects %s bounds',async attack=>{
 const f=provider();if(attack==='db-revision-over-limit')f.seed(owner,4097);else f.sequence(Number.MAX_SAFE_INTEGER);await expect(f.observe()).rejects.toMatchObject({code:attack==='db-revision-over-limit'?'TOPIC_STATE_CHANGED':'REVISION_OVERFLOW'});
});
it('revocation failure yields no published DB state but durable union remains stricter',async()=>{
 const f=provider(),s=await f.observe();vi.mocked(f.lifecycle.revoke).mockRejectedValueOnce(Error('REVOKE_FAILED'));await expect(f.service.excludeForPlannerLocked(f.c,f.a,s,randomUUID(),['alpha'])).rejects.toThrow('REVOKE_FAILED');expect(f.prefs.size).toBe(0);expect(f.requests.size).toBe(0);expect(f.state(owner).excluded).toEqual(['alpha']);expect((await f.observe()).members.find(m=>m.member_id===owner)!.allow_topic_ids).toEqual([]);
});
it('independently changed peer safety or retirement invalidates captured observation',async()=>{
 const f=provider(),s=await f.observe();f.narrow({roomId:room,ownerId:other,operationId:randomUUID(),expectedRevision:0,exclude:['beta']});expect(()=>f.service.assertPlannerCurrent(room,s)).toThrow(expect.objectContaining({code:'TOPIC_STATE_CHANGED'}));const next=await f.observe();f.retire();expect(()=>f.service.assertPlannerCurrent(room,next)).toThrow('RETIRED');
});
it('internal planner reads do not write SQL, narrow, revoke or emit public updates',async()=>{
 const f=provider();f.seed(other,8,['beta']);await f.observe();expect(f.query.mock.calls.every(([sql])=>sql.startsWith('SELECT'))).toBe(true);expect(f.narrow).not.toHaveBeenCalled();expect(f.lifecycle.revoke).not.toHaveBeenCalled();expect(f.order).toEqual([]);
});

