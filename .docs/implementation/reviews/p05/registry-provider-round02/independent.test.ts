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
import {PrivateTopicLedger,type TopicNarrowing,type TopicSafetyState} from './private-topic-ledger.js';
const keys=new Keyring('review',{review:Buffer.alloc(32,83).toString('base64')}),pins={taxonomy:'a'.repeat(64),policy:'b'.repeat(64),vocabulary:['alpha','beta']};
const room='10000000-0000-4000-8000-000000000001',owner='20000000-0000-4000-8000-000000000001',other='20000000-0000-4000-8000-000000000002',inc='40000000-0000-4000-8000-000000000001';
const roots:string[]=[],held={roomTransactionLockHeld:true as const};
afterEach(()=>{for(const root of roots.splice(0)){expect(dirname(root)).toBe('/state');fs.rmSync(root,{recursive:true,force:true});}});
function liveBridge(){
 const root=fs.mkdtempSync('/state/bridge-');roots.push(root);const directories=Object.fromEntries(['birthDirectory','personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory'].map(n=>{const path=join(root,n);fs.mkdirSync(path,0o700);return[n,path];})) as Parameters<TopicRoomLifecycle['constructor']>[0];
 const storage=new TopicRoomLifecycle({keys,pins,directories:()=>directories as never,now:()=>100000}),birth=storage.initializeRoom(room,1000,held);storage.admitMember(room,birth,owner,randomUUID(),held);
 const query=vi.fn(async(sql:string)=>{if(sql.includes('LEFT JOIN private_topic_room_births'))return {rows:[{private_protocol:2,incarnation:birth.incarnation,minimum_sequence:'1',taxonomy_digest:pins.taxonomy,policy_digest:pins.policy}]};if(sql.startsWith('SELECT id FROM room_members'))return {rows:[{id:owner}]};if(sql.startsWith('SELECT state,closed_at'))return {rows:[{state:'closed',closed_at:new Date(80000)}]};if(sql.startsWith('SELECT s.expires_at'))return {rows:[{expires_at:new Date(200000),offer_version:'v',offer_digest:'d',socket_generation:'1',slot:0}]};throw Error('unexpected SQL '+sql);});
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
it('registry unknown-COMMIT retry keeps original authenticated close time and operation across fresh calls',async()=>{
 const f=liveBridge(),original=randomUUID();f.storage.retireRoom(room,f.birth,{operationId:original,retiredAt:80000},held);
 expect(await f.registry.retireRoom(f.c,room,randomUUID(),99000)).toEqual({retiredAt:80000});
 expect(await f.registry.recovery(f.c,room)).toEqual({retirement:{operationId:original,retiredAt:80000},retiredMembers:[]});
 expect(f.storage.retirementStatus(room,f.birth)).toEqual({state:'retired',operationId:original,retiredAt:80000});
});
it('registry replays interrupted original intent through actual lifecycle without guessing new time',async()=>{
 const f=liveBridge(),original=randomUUID(),options=(f.storage as unknown as {options:{controls:unknown}}).options;
 options.controls={phase:(p:string)=>{if(p==='after-retirement-directory-sync')throw Error('intent-only');}};
 expect(()=>f.storage.retireRoom(room,f.birth,{operationId:original,retiredAt:80000},held)).toThrow('intent-only');options.controls={};
 expect((await f.registry.recovery(f.c,room)).retirement).toEqual({operationId:original,retiredAt:80000});expect(f.storage.retirementStatus(room,f.birth).state).toBe('retired');
});
it('registry actual member withdrawal is classified without treating arbitrary errors as withdrawal',async()=>{
 const f=liveBridge();f.storage.retireMember(room,f.birth,owner,randomUUID(),held);
 expect((await f.registry.recovery(f.c,room)).retiredMembers).toEqual([owner]);
});
it.each(['missing-admission','plain-error-with-code','corrupt-lifecycle'])('registry recovery never converts %s into successful withdrawal',async kind=>{
 const f=liveBridge();if(kind==='corrupt-lifecycle'){const path=join(f.directories.lifecycleChainDirectory,'chain'),b=fs.readFileSync(path);b[24]^=1;fs.writeFileSync(path,b);}
 else vi.spyOn(f.storage,'assertMemberAuthority').mockImplementation(()=>{if(kind==='missing-admission')throw new TopicRoomLifecycleError('TOPIC_ROOM_MEMBER_NOT_ADMITTED');throw Object.assign(Error('not authenticated'),{code:'TOPIC_ROOM_MEMBER_RETIRED'});});
 await expect(f.registry.recovery(f.c,room)).rejects.toThrow();
});
it('registry cleanup uses exact original closedAt and removes both personal then member files with real storage',async()=>{
 const f=liveBridge();f.storage.retireRoom(room,f.birth,{operationId:randomUUID(),retiredAt:80000},held);await f.registry.cleanup(f.c,room);
 for(const name of ['personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory'])expect(fs.readdirSync(f.directories[name])).toEqual([]);
 expect((await f.registry.recovery(f.c,room)).retirement?.retiredAt).toBe(80000);
});
it('registry DB missing descriptor cannot initialize a new lifecycle on read',async()=>{
 const f=liveBridge();f.c.query=vi.fn(async()=>({rows:[]})) as never;await expect(f.registry.guard(f.c,room,owner)).rejects.toMatchObject({code:'PRIVATE_PROTOCOL_UNAVAILABLE'});
 expect(fs.readdirSync(f.directories.birthDirectory)).toEqual(['birth']);
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

function breakPersonal(f:ReturnType<typeof liveBridge>,kind:string){
 const chain=join(f.directories.personalChainDirectory,'chain'),witness=join(f.directories.personalWitnessDirectory,'witness');
 if(kind==='corrupt-chain'){const b=fs.readFileSync(chain);b[26]^=1;fs.writeFileSync(chain,b);}
 if(kind==='missing-chain')fs.unlinkSync(chain);
 if(kind==='missing-witness')fs.unlinkSync(witness);
 if(kind==='unsafe-file')fs.chmodSync(witness,0o640);
 if(kind==='hardlink-file')fs.linkSync(witness,witness+'.alias');
 if(kind==='missing-directories')for(const dir of [f.directories.personalChainDirectory,f.directories.personalWitnessDirectory])fs.renameSync(dir,dir+'.detached');
 if(kind==='unsafe-directories')for(const dir of [f.directories.personalChainDirectory,f.directories.personalWitnessDirectory])fs.chmodSync(dir,0o750);
 if(kind==='symlink-directory'){const dir=f.directories.personalChainDirectory;fs.renameSync(dir,dir+'.detached');fs.symlinkSync(dir+'.detached',dir);}
 if(kind==='unknown-personal-key'){
  const rotated=new Keyring('next',{review:Buffer.alloc(32,83).toString('base64'),next:Buffer.alloc(32,84).toString('base64')});
  const writer=PrivateTopicLedger.open({keys:rotated,pins,chainDirectory:f.directories.personalChainDirectory,witnessDirectory:f.directories.personalWitnessDirectory},{incarnation:f.birth.incarnation,minimumSequence:1});
  writer.narrow({roomId:room,ownerId:owner,operationId:randomUUID(),expectedRevision:0,exclude:['alpha']});
 }
}
it.each(['corrupt-chain','missing-chain','missing-witness','unsafe-file','hardlink-file','missing-directories','unsafe-directories','symlink-directory','unknown-personal-key'])('SAFETY-GUARD-01 paired actual fence/content/withdrawal/close under %s',async kind=>{
 const f=liveBridge(),content=f.storage.open(room,f.birth);breakPersonal(f,kind);
 const guard=await f.rooms.finalAccessFence(f.c,f.a,true);expect(guard).not.toThrow();expect((await f.registry.recovery(f.c,room)).retiredMembers).toEqual([]);
 expect(()=>f.registry.assertLive(room,f.birth)).toThrow();expect(()=>content.read({roomId:room,ownerId:owner})).toThrow();expect(()=>content.narrow({roomId:room,ownerId:owner,operationId:randomUUID(),expectedRevision:0,exclude:['beta']})).toThrow();
 await f.registry.retireMember(f.c,room,owner,randomUUID());expect(()=>guard()).toThrow('TOPIC_ROOM_MEMBER_RETIRED');expect((await f.registry.recovery(f.c,room)).retiredMembers).toEqual([owner]);
 await expect(f.rooms.finalAccessFence(f.c,f.a,true)).rejects.toThrow('TOPIC_ROOM_MEMBER_RETIRED');
 const roomGuard=await f.registry.guard(f.c,room);expect(roomGuard).not.toThrow();expect(await f.registry.retireRoom(f.c,room,randomUUID(),80000)).toEqual({retiredAt:80000});expect(roomGuard).toThrow('TOPIC_ROOM_RETIRED');
 expect((await f.registry.recovery(f.c,room)).retirement?.retiredAt).toBe(80000);await expect(f.registry.retireRoom(f.c,room,randomUUID(),99000)).resolves.toEqual({retiredAt:80000});
});
it.each(['life-chain-corrupt','life-chain-missing','life-witness-missing','birth-missing','birth-corrupt','life-key-missing','bad-db-birth'])('metadata safety authority still rejects %s with valid credential seam',async kind=>{
 const f=liveBridge(),life=join(f.directories.lifecycleChainDirectory,'chain'),witness=join(f.directories.lifecycleWitnessDirectory,'witness'),birth=join(f.directories.birthDirectory,'birth');
 if(kind==='life-chain-corrupt'||kind==='birth-corrupt'){const p=kind==='birth-corrupt'?birth:life,b=fs.readFileSync(p);b[26]^=1;fs.writeFileSync(p,b);}
 if(kind==='life-chain-missing')fs.unlinkSync(life);if(kind==='life-witness-missing')fs.unlinkSync(witness);if(kind==='birth-missing')fs.unlinkSync(birth);
 if(kind==='life-key-missing'){
  const rotated=new Keyring('next',{review:Buffer.alloc(32,83).toString('base64'),next:Buffer.alloc(32,84).toString('base64')}),body=keys.decrypt<Record<string,unknown>>(JSON.parse(fs.readFileSync(birth,'utf8')).cipher,'venus:topic-room-lifecycle:v1:birth');
  const {topicLifecyclePins}=await import('./topic-room-lifecycle.js');
  const writer=PrivateTopicLedger.open({keys:rotated,pins:topicLifecyclePins,chainDirectory:f.directories.lifecycleChainDirectory,witnessDirectory:f.directories.lifecycleWitnessDirectory,maximumRecords:258},{incarnation:body.lifecycleIncarnation as string,minimumSequence:1});
  writer.narrow({roomId:room,ownerId:other,operationId:randomUUID(),expectedRevision:0,exclude:['member_admitted']});
 }
 if(kind==='bad-db-birth'){const original=f.c.query.bind(f.c);f.c.query=vi.fn(async(sql:string,...args:unknown[])=>{const r=await (original as (...args:unknown[])=>Promise<{rows:Record<string,unknown>[]} >)(sql,...args);if(sql.includes('LEFT JOIN private_topic_room_births'))return {rows:r.rows.map(row=>({...row,incarnation:randomUUID()}))};return r;}) as never;}
 await expect(f.rooms.finalAccessFence(f.c,f.a,true)).rejects.toThrow();await expect(f.registry.recovery(f.c,room)).rejects.toThrow();
});
it('metadata process floor rejects restored lifecycle before-withdrawal while retained personal content remains unusable',async()=>{
 const f=liveBridge(),paths=[join(f.directories.lifecycleChainDirectory,'chain'),join(f.directories.lifecycleWitnessDirectory,'witness')],before=paths.map(p=>fs.readFileSync(p));
 const fence=await f.rooms.finalAccessFence(f.c,f.a,true);await f.registry.retireMember(f.c,room,owner,randomUUID());expect(fence).toThrow('TOPIC_ROOM_MEMBER_RETIRED');
 paths.forEach((p,i)=>fs.writeFileSync(p,before[i]!));expect(fence).toThrow('TOPIC_LEDGER_PROCESS_REGRESSION');await expect(f.registry.recovery(f.c,room)).rejects.toThrow('TOPIC_LEDGER_PROCESS_REGRESSION');
});
it('already captured safety fence observes room retirement synchronously after its final SQL await',async()=>{
 const f=liveBridge(),fence=await f.rooms.finalAccessFence(f.c,f.a,true);await f.registry.retireRoom(f.c,room,randomUUID(),80000);expect(fence).toThrow('TOPIC_ROOM_RETIRED');await expect(f.rooms.finalAccessFence(f.c,f.a,true)).rejects.toThrow('TOPIC_ROOM_RETIRED');
});



