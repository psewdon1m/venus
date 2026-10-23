import {it,expect,vi,afterEach} from 'vitest';
import * as fs from 'node:fs';
import {join,dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import type pg from 'pg';
import {Rooms} from './rooms.js';
import {Keyring,hash} from './security.js';
import {TopicRoomRegistry} from './topic-room-registry.js';
import {TopicRoomLifecycle,type RoomStorageDirectories,type TopicRoomBirth} from './topic-room-lifecycle.js';
import {TopicRoomDirectories} from './topic-room-directories.js';
const keys=new Keyring('review',{review:Buffer.alloc(32,83).toString('base64')}),pins={taxonomy:'a'.repeat(64),policy:'b'.repeat(64),vocabulary:['alpha','beta']};
const room='10000000-0000-4000-8000-000000000001',owner='20000000-0000-4000-8000-000000000001',roots:string[]=[];
const intercept=vi.hoisted(()=>({open:undefined as undefined|((path:string)=>void)}));
vi.mock('node:fs',async()=>{const actual=await vi.importActual<typeof import('node:fs')>('node:fs');return {...actual,openSync(...args:Parameters<typeof actual.openSync>){intercept.open?.(String(args[0]));return actual.openSync(...args);}};});
afterEach(()=>{intercept.open=undefined;for(const root of roots.splice(0)){expect(dirname(root)).toBe('/state');fs.rmSync(root,{recursive:true,force:true});}});
async function fixture(){
 const root=fs.mkdtempSync('/state/directory-authority-');roots.push(root);
 const parents=Object.fromEntries(['birthDirectory','personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory'].map(n=>{const p=join(root,n);fs.mkdirSync(p,0o700);return[n,p];})) as unknown as RoomStorageDirectories;
 const store=new TopicRoomDirectories(parents),storage=new TopicRoomLifecycle({keys,pins,directories:store.directories.bind(store),now:()=>100000});let birth:TopicRoomBirth;
 const query=vi.fn(async(sql:string,args:unknown[]=[])=>{
  if(sql.startsWith('INSERT INTO private_topic_room_births')){birth={incarnation:args[1] as string,minimumSequence:args[2] as number,taxonomy_digest:args[3] as string,policy_digest:args[4] as string};return {rows:[]};}
  if(sql.includes('LEFT JOIN private_topic_room_births'))return {rows:[{private_protocol:2,incarnation:birth.incarnation,minimum_sequence:String(birth.minimumSequence),taxonomy_digest:pins.taxonomy,policy_digest:pins.policy}]};
  if(sql.startsWith('SELECT s.expires_at'))return {rows:[{expires_at:new Date(200000),offer_version:'v',offer_digest:'d',socket_generation:'1',slot:0}]};
  if(sql.startsWith('SELECT id FROM room_members'))return {rows:[{id:owner}]};throw Error('unexpected SQL '+sql);
 });
 const c={query} as unknown as pg.PoolClient,registry=new TopicRoomRegistry({storage,pins,provision:id=>store.provision(id),topicsChanged:async()=>{}});
 await registry.birth(c,room,owner,randomUUID(),1000);
 const rooms=new Rooms({keys,ledger:{contains:()=>false} as never,pool:{} as never,origin:'https://localhost',offer:()=>({version:'v',digest:'d',text:{ru:'',en:'',tr:''},synthetic:true}),now:()=>100000,privateProtocol:registry}),a={room:{id:room,state:'open',last_activity_at:new Date(1000),private_protocol:2},member:{id:owner},sessionHash:hash('credential')} as Awaited<ReturnType<Rooms['access']>>;
 return {root,parents,store,storage,registry,rooms,c,a,birth:birth!};
}
it('healthy provisioner callback composition births once and permits actual metadata/content fences',async()=>{
 const f=await fixture();expect((await f.rooms.finalAccessFence(f.c,f.a,true))).not.toThrow();expect(f.storage.open(room,f.birth).read({roomId:room,ownerId:owner}).excluded).toEqual([]);expect(()=>f.store.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOM_ALREADY_PROVISIONED'}));
});
it('personal room-child corruption alone remains isolated with healthy allocator parents',async()=>{
 const f=await fixture(),path=join(f.parents.personalChainDirectory,room,'chain'),b=fs.readFileSync(path);b[24]^=1;fs.writeFileSync(path,b);
 expect((await f.rooms.finalAccessFence(f.c,f.a,true))).not.toThrow();expect(()=>f.storage.open(room,f.birth)).toThrow();await expect(f.registry.retireMember(f.c,room,owner,randomUUID())).resolves.toBeUndefined();
});
it.each(['missing','mode','symlink'])('SAFETY-GUARD-02 %s personal ROOT parent must not disable metadata safety through allocator callback',async kind=>{
 const f=await fixture(),path=f.parents.personalChainDirectory;
 if(kind==='mode')fs.chmodSync(path,0o750);else{fs.renameSync(path,path+'.detached');if(kind==='symlink')fs.symlinkSync(path+'.detached',path);}
 // Metadata authority roots and credentials remain intact; optional personal
 // content parent availability must not prevent authenticated safety withdrawal.
 await expect(f.rooms.finalAccessFence(f.c,f.a,true)).resolves.toBeTypeOf('function');
});
it.each(['missing','mode','symlink'])('metadata ROOT parent %s continues to deny actual safety fence',async kind=>{
 const f=await fixture(),path=f.parents.lifecycleChainDirectory;if(kind==='mode')fs.chmodSync(path,0o750);else{fs.renameSync(path,path+'.detached');if(kind==='symlink')fs.symlinkSync(path+'.detached',path);}
 await expect(f.rooms.finalAccessFence(f.c,f.a,true)).rejects.toThrow();await expect(f.registry.recovery(f.c,room)).rejects.toThrow();
});
it.each(['missing','mode','symlink','replacement'])('paired personal ROOT %s keeps safety/recovery/withdrawal/close while content/new birth stay denied',async kind=>{
 const f=await fixture(),oldContent=f.storage.open(room,f.birth),path=f.parents.personalChainDirectory;
 if(kind==='mode')fs.chmodSync(path,0o750);else{fs.renameSync(path,path+'.detached');if(kind==='symlink')fs.symlinkSync(path+'.detached',path);if(kind==='replacement')fs.mkdirSync(path,0o700);}
 const fence=await f.rooms.finalAccessFence(f.c,f.a,true);expect(fence).not.toThrow();expect((await f.registry.recovery(f.c,room)).retiredMembers).toEqual([]);
 expect(()=>oldContent.read({roomId:room,ownerId:owner})).toThrow();expect(()=>oldContent.narrow({roomId:room,ownerId:owner,operationId:randomUUID(),expectedRevision:0,exclude:['alpha']})).toThrow();expect(()=>f.registry.assertLive(room,f.birth)).toThrow();expect(()=>f.store.provision(randomUUID())).toThrow();
 await f.registry.retireMember(f.c,room,owner,randomUUID());expect(fence).toThrow('TOPIC_ROOM_MEMBER_RETIRED');expect((await f.registry.recovery(f.c,room)).retiredMembers).toEqual([owner]);
 const roomFence=await f.registry.guard(f.c,room);expect(roomFence).not.toThrow();expect(await f.registry.retireRoom(f.c,room,randomUUID(),80000)).toEqual({retiredAt:80000});expect(roomFence).toThrow('TOPIC_ROOM_RETIRED');expect((await f.registry.recovery(f.c,room)).retirement?.retiredAt).toBe(80000);
});
it.each(['birthDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory'] as const)('authority parent replacement floor stays protected for %s',async name=>{
 const f=await fixture(),path=f.parents[name];fs.renameSync(path,path+'.detached');fs.mkdirSync(path,0o700);
 await expect(f.rooms.finalAccessFence(f.c,f.a,true)).rejects.toMatchObject({code:'TOPIC_ROOT_REPLACED'});await expect(f.registry.recovery(f.c,room)).rejects.toMatchObject({code:'TOPIC_ROOT_REPLACED'});
});
it('late ancestor symlink to same leaf inodes still rejects metadata-only namespace validation',async()=>{
 const f=await fixture(),saved=f.root+'.detached';roots.push(saved);let changed=false;
 intercept.open=path=>{if(!changed&&path===f.parents.lifecycleWitnessDirectory){changed=true;fs.renameSync(f.root,saved);fs.symlinkSync(saved,f.root);}};
 await expect(f.rooms.finalAccessFence(f.c,f.a,true)).rejects.toMatchObject({code:'TOPIC_ROOT_SYMLINK'});expect(changed).toBe(true);
});
it('metadata-only lookup creates nothing in missing room and cannot weaken full provision identity checks',async()=>{
 const f=await fixture(),newRoom=randomUUID(),paths=f.store.directories(newRoom,true);for(const p of Object.values(paths))expect(fs.existsSync(p)).toBe(false);
 const old=join(f.parents.personalChainDirectory,room),hold=f.parents.personalChainDirectory+'.detached';fs.renameSync(f.parents.personalChainDirectory,hold);fs.mkdirSync(f.parents.personalChainDirectory,0o700);
 expect(()=>f.store.directories(room,true)).not.toThrow();expect(()=>f.store.directories(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOT_REPLACED'}));expect(fs.existsSync(old)).toBe(false);expect(()=>f.store.provision(newRoom)).toThrow(expect.objectContaining({code:'TOPIC_ROOT_REPLACED'}));
});
it('constructor cold-bootstrap retains explicit all-five-parent availability precondition',async()=>{
 const f=await fixture();fs.renameSync(f.parents.personalChainDirectory,f.parents.personalChainDirectory+'.detached');expect(()=>new TopicRoomDirectories(f.parents)).toThrow();
});
it('one-argument callback dropping mode remains an unsupported composition and is observed to deny personal parent failure',async()=>{
 const f=await fixture(),broken=new TopicRoomLifecycle({keys,pins,directories:id=>f.store.directories(id),now:()=>100000});fs.chmodSync(f.parents.personalChainDirectory,0o750);
 expect(()=>broken.assertRoomAuthority(room,f.birth)).toThrow(expect.objectContaining({code:'TOPIC_ROOT_UNSAFE'}));expect(()=>f.storage.assertRoomAuthority(room,f.birth)).not.toThrow();
});

