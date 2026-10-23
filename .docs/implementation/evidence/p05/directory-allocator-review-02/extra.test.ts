import {afterEach,expect,it,vi} from 'vitest';
import {join,dirname,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {TopicRoomDirectories} from './topic-room-directories.js';
import type {RoomStorageDirectories} from './topic-room-lifecycle.js';
const fault=vi.hoisted(()=>({beforeFsync:undefined as undefined|(()=>void)}));
vi.mock('node:fs',async()=>{const actual=await vi.importActual<typeof import('node:fs')>('node:fs');return {...actual,fsyncSync(fd:number){fault.beforeFsync?.();actual.fsyncSync(fd);}};});
const fs=await vi.importActual<typeof import('node:fs')>('node:fs');
const names=['birthDirectory','personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory'] as const;
const room='12345678-1111-4111-8111-111111111111',temporary:string[]=[];
function fixture(){const base=fs.mkdtempSync(join(tmpdir(),'venus-directory-final-check-'));temporary.push(base);fs.chmodSync(base,0o700);const roots=Object.fromEntries(names.map(name=>{const path=join(base,name);fs.mkdirSync(path,0o700);return [name,path];})) as unknown as RoomStorageDirectories;return {base,roots};}
afterEach(()=>{fault.beforeFsync=undefined;for(const path of temporary.splice(0)){expect(dirname(resolve(path))).toBe(resolve(tmpdir()));fs.rmSync(path,{recursive:true,force:true});}});
it('final publication rejects a root chmod to public mode during anchored fsync',()=>{
 const f=fixture(),allocator=new TopicRoomDirectories(f.roots);let changed=false;
 fault.beforeFsync=()=>{if(!changed){changed=true;fs.chmodSync(f.roots.birthDirectory,0o755);}};
 expect(()=>allocator.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOT_UNSAFE'}));fault.beforeFsync=undefined;
 expect(fs.statSync(f.roots.birthDirectory).mode&0o7777).toBe(0o755);
 for(const root of Object.values(f.roots))expect(fs.readdirSync(root)).toEqual([room]);
});
it('final publication rejects an ancestor symlink introduced during child fsync with original roots unchanged',()=>{
 const f=fixture(),allocator=new TopicRoomDirectories(f.roots),saved=f.base+'.old';temporary.push(saved);let changed=false;
 fault.beforeFsync=()=>{if(!changed){changed=true;fs.renameSync(f.base,saved);fs.symlinkSync(saved,f.base,'dir');}};
 expect(()=>allocator.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOT_SYMLINK'}));fault.beforeFsync=undefined;
 expect(fs.lstatSync(f.base).isSymbolicLink()).toBe(true);
 for(const root of Object.values(f.roots))expect(fs.readdirSync(root)).toEqual([room]);
 expect(()=>allocator.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOT_SYMLINK'}));
});
