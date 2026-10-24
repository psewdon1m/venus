import {describe,it,expect,afterEach,vi} from 'vitest';
import * as fs from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {TopicRoomDirectories} from './topic-room-directories.js';
import type {RoomStorageDirectories} from './topic-room-lifecycle.js';
const room='10000000-0000-4000-8000-000000000001',other='20000000-0000-4000-8000-000000000001',temporary:string[]=[];
const names=['birthDirectory','personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory'] as const;
const intercept=vi.hoisted(()=>({open:undefined as undefined|((path:string)=>void)}));
vi.mock('node:fs',async()=>{const actual=await vi.importActual<typeof import('node:fs')>('node:fs');return {...actual,openSync(...args:Parameters<typeof actual.openSync>){intercept.open?.(String(args[0]));return actual.openSync(...args);}};});
afterEach(()=>{intercept.open=undefined;for(const root of temporary.splice(0)){expect(dirname(resolve(root))).toBe(resolve(tmpdir()));fs.rmSync(root,{recursive:true,force:true});}});
function fixture(){const base=fs.mkdtempSync(join(tmpdir(),'venus-topic-dirs-'));temporary.push(base);fs.chmodSync(base,0o700);const roots=Object.fromEntries(names.map(name=>{const p=join(base,name);fs.mkdirSync(p,0o700);return [name,p];})) as unknown as RoomStorageDirectories;return {base,roots};}
describe.skipIf(process.platform!=='linux')('protected per-room directory allocation, actual Linux filesystem',()=>{
 it('creates only the five requested room directories with private modes',()=>{
  const f=fixture(),store=new TopicRoomDirectories(f.roots);store.provision(room);
  for(const path of Object.values(store.directories(room))){const stat=fs.statSync(path);expect(stat.mode&0o7777).toBe(0o700);expect(stat.uid).toBe(process.getuid!());expect(fs.readdirSync(path)).toEqual([]);}
  expect(Object.values(store.directories(room))).not.toEqual(Object.values(store.directories(other)));
 });
 it('directory lookup never creates a missing birth',()=>{
  const f=fixture(),store=new TopicRoomDirectories(f.roots);store.directories(room);for(const path of Object.values(f.roots))expect(fs.readdirSync(path)).toEqual([]);
 });
 it('rejects existing partial birth before mutating any other root',()=>{
  const f=fixture(),store=new TopicRoomDirectories(f.roots);fs.mkdirSync(join(f.roots.lifecycleWitnessDirectory,room),0o700);
  expect(()=>store.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOM_ALREADY_PROVISIONED'}));
  for(const name of names.slice(0,-1))expect(fs.readdirSync(f.roots[name])).toEqual([]);
 });
 it('cannot reinitialize a complete prior birth',()=>{
  const f=fixture(),store=new TopicRoomDirectories(f.roots);store.provision(room);expect(()=>store.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOM_ALREADY_PROVISIONED'}));
 });
 it('rejects destination symlinks before any mkdir',()=>{
  const f=fixture(),store=new TopicRoomDirectories(f.roots);fs.symlinkSync(f.base,join(f.roots.lifecycleWitnessDirectory,room),'dir');
  expect(()=>store.provision(room)).toThrow();expect(fs.readdirSync(f.roots.birthDirectory)).toEqual([]);
 });
 it('does not repair or chmod unsafe operator roots',()=>{
  const f=fixture();fs.chmodSync(f.roots.lifecycleWitnessDirectory,0o755);expect(()=>new TopicRoomDirectories(f.roots)).toThrow(expect.objectContaining({code:'TOPIC_ROOT_UNSAFE'}));expect(fs.statSync(f.roots.lifecycleWitnessDirectory).mode&0o777).toBe(0o755);
 });
 it('requires disjoint root paths',()=>{
  const f=fixture();expect(()=>new TopicRoomDirectories({...f.roots,personalChainDirectory:f.roots.birthDirectory})).toThrow(expect.objectContaining({code:'TOPIC_ROOTS_ALIASED'}));
 });
 it('rejects nested roots',()=>{
  const f=fixture(),child=join(f.roots.birthDirectory,'nested');fs.mkdirSync(child,0o700);expect(()=>new TopicRoomDirectories({...f.roots,personalChainDirectory:child})).toThrow(expect.objectContaining({code:'TOPIC_ROOTS_ALIASED'}));
 });
 it('rejects root aliases through symlinks',()=>{
  const f=fixture(),alias=join(f.base,'alias');fs.symlinkSync(f.roots.birthDirectory,alias,'dir');expect(()=>new TopicRoomDirectories({...f.roots,personalChainDirectory:alias})).toThrow(expect.objectContaining({code:'TOPIC_ROOT_SYMLINK'}));
 });
 it('retains root identity floors across delete/recreate attempts',()=>{
  const f=fixture(),store=new TopicRoomDirectories(f.roots);fs.renameSync(f.roots.birthDirectory,f.roots.birthDirectory+'.old');fs.mkdirSync(f.roots.birthDirectory,0o700);
  expect(()=>store.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOT_REPLACED'}));expect(fs.readdirSync(f.roots.personalChainDirectory)).toEqual([]);
 });
 it('never follows changed root symlinks after initialization',()=>{
  const f=fixture(),store=new TopicRoomDirectories(f.roots);fs.renameSync(f.roots.birthDirectory,f.roots.birthDirectory+'.old');fs.symlinkSync(f.roots.birthDirectory+'.old',f.roots.birthDirectory,'dir');
  expect(()=>store.directories(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOT_SYMLINK'}));
 });
 it('rejects a late ancestor symlink even if every leaf inode is unchanged',()=>{
  const f=fixture(),store=new TopicRoomDirectories(f.roots),saved=f.base+'.old';temporary.push(saved);let swapped=false;
  intercept.open=path=>{if(!swapped&&path===f.roots.lifecycleWitnessDirectory){swapped=true;fs.renameSync(f.base,saved);fs.symlinkSync(saved,f.base,'dir');}};
  expect(()=>store.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOT_SYMLINK'}));
 });
 for(const invalid of ['../escape','',room+'/child'])it(`rejects non-UUID child ${JSON.stringify(invalid)}`,()=>{
  const f=fixture(),store=new TopicRoomDirectories(f.roots);expect(()=>store.provision(invalid)).toThrow(expect.objectContaining({code:'INVALID_ROOM_ID'}));for(const path of Object.values(f.roots))expect(fs.readdirSync(path)).toEqual([]);
 });
});
it.skipIf(process.platform==='linux')('rejects unsupported platform before filesystem writes',()=>{
 expect(()=>new TopicRoomDirectories({} as RoomStorageDirectories)).toThrow(expect.objectContaining({code:'TOPIC_ROOM_PLATFORM_UNSUPPORTED'}));
});
