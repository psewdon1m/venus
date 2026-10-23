import {afterEach,describe,expect,it,vi} from 'vitest';
import * as fs from 'node:fs';
import {basename} from 'node:path';
import {PrivateTopicLedger} from './private-topic-ledger.js';
import {TopicRoomLifecycle} from './topic-room-lifecycle.js';
const io=vi.hoisted(()=>({active:false,next:100,busy:false,replaced:false,lockFd:0,paths:{}as Record<number,string>,files:{}as Record<string,number>,events:[]as Array<{kind:string;path?:string;flags?:number;fd?:number}>}));
vi.mock('node:fs',async importOriginal=>{
 const real=await importOriginal<typeof import('node:fs')>();
 const missing=()=>Object.assign(Error('missing'),{code:'ENOENT'}),stat=(fd:number)=>({dev:1,ino:fd,uid:0,mode:0o100600,nlink:1,isFile:()=>true,isDirectory:()=>false});
 return {...real,
  openSync:(p:string,flags:number,...rest:unknown[])=>{if(!io.active)return Reflect.apply(real.openSync,real,[p,flags,...rest]);const lock=basename(p)==='lock'||basename(p)==='room.lock';if(lock&&io.busy)throw Object.assign(Error('busy'),{code:'EEXIST'});const fd=++io.next;io.paths[fd]=p;io.files[p]=fd;if(lock)io.lockFd=fd;io.events.push({kind:'open',path:p,flags,fd});return fd;},
  fstatSync:(fd:number)=>io.active?stat(fd):real.fstatSync(fd),
  lstatSync:(p:string)=>{if(!io.active)return real.lstatSync(p);if(!io.files[p])throw missing();return stat(io.files[p]!+(io.replaced&&io.files[p]===io.lockFd?1:0));},
  closeSync:(fd:number)=>{if(!io.active)return real.closeSync(fd);io.events.push({kind:'close',fd});},
  unlinkSync:(p:string)=>{if(!io.active)return real.unlinkSync(p);io.events.push({kind:'unlink',path:p});delete io.files[p];},
  existsSync:(p:string)=>io.active?Boolean(io.files[p]):real.existsSync(p),
  renameSync:(from:string,to:string)=>{if(!io.active)return real.renameSync(from,to);io.files[to]=io.files[from]!;delete io.files[from];io.events.push({kind:'rename',path:to});},
 };
});
afterEach(()=>{io.active=false;});
/** Actual production private lock/publication methods with controlled directory,
 * file-metadata and syscall boundaries. Not a native filesystem durability test;
 * the existing Linux tests below those modules remain required. */
function fixture(kind:'ledger'|'room'){
 Object.assign(io,{active:true,next:100,busy:false,replaced:false,lockFd:0,paths:{},files:{},events:[]});
 const object=Object.create((kind==='ledger'?PrivateTopicLedger:TopicRoomLifecycle).prototype),sync=vi.fn((fd:number)=>io.events.push({kind:'data-file-sync',fd})),directorySync=vi.fn((path:string)=>io.events.push({kind:'data-directory-sync',path})),fileGuard=vi.fn();
 Object.assign(object,{options:{controls:{sync,write:(_fd:number,bytes:Buffer)=>bytes.length},directories:()=>Object.fromEntries(['birthDirectory','personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory'].map(k=>[k,'C:/unit/'+k]))},chainDirectory:'C:/unit/chain',witnessDirectory:'C:/unit/witness',directory:(p:string)=>fs.openSync(p,fs.constants.O_RDONLY),assertFile:fileGuard,statFile:fileGuard,syncDirectory:directorySync,codec:{witness:()=>Buffer.from('unit-authenticated-witness')},encode:()=>Buffer.from('unit-authenticated-birth')});
 const locked=Reflect.get(object,'locked').bind(object);
 return {object,sync,directorySync,fileGuard,run:(fn:()=>unknown)=>kind==='ledger'?locked(fn):locked('11111111-1111-4111-8111-111111111111',fn)};
}
describe('ephemeral exclusive locks never supply data durability barriers',()=>{
 for(const kind of ['ledger','room']as const){
  it(kind+' consistent read retains exclusive/no-follow/fstat/unlink without directory fsync',()=>{const f=fixture(kind),critical=vi.fn(()=>42);expect(f.run(critical)).toBe(42);expect(critical).toHaveBeenCalledOnce();expect(f.directorySync).not.toHaveBeenCalled();expect(f.sync).not.toHaveBeenCalled();expect(f.fileGuard).toHaveBeenCalledOnce();const open=io.events.find(e=>e.fd===io.lockFd&&e.kind==='open')!;expect(open.flags!&fs.constants.O_EXCL).toBe(fs.constants.O_EXCL);if(fs.constants.O_NOFOLLOW)expect(open.flags!&fs.constants.O_NOFOLLOW).toBe(fs.constants.O_NOFOLLOW);expect(io.events.some(e=>e.kind==='unlink'&&e.path===open.path)).toBe(true);});
  it(kind+' busy/stale lock remains fail closed without deleting it',()=>{const f=fixture(kind),critical=vi.fn();io.busy=true;expect(()=>f.run(critical)).toThrow(kind==='ledger'?'TOPIC_LEDGER_BUSY':'TOPIC_ROOM_BUSY');expect(critical).not.toHaveBeenCalled();expect(io.events.some(e=>e.kind==='unlink')).toBe(false);});
  it(kind+' refuses replaced lock inode and never unlinks the replacement',()=>{const f=fixture(kind);io.replaced=true;expect(()=>f.run(()=>42)).toThrow(kind==='ledger'?'TOPIC_LEDGER_LOCK_CHANGED':'TOPIC_ROOM_LOCK_CHANGED');expect(io.events.some(e=>e.kind==='unlink')).toBe(false);expect(io.events.some(e=>e.kind==='close'&&e.fd===io.lockFd)).toBe(true);});
  it(kind+' failing operation releases only the verified owned lock',()=>{const f=fixture(kind),failure=Error('operationfailed');expect(()=>f.run(()=>{throw failure;})).toThrow(failure);expect(io.events.filter(e=>e.kind==='unlink')).toHaveLength(1);expect(f.directorySync).not.toHaveBeenCalled();});
 }
 it('ledger real publication method still syncs witness file and directory after rename',()=>{const f=fixture('ledger');Reflect.get(f.object,'publishWitness').call(f.object,'C:/unit/witness',{incarnation:'i',sequence:1,digest:'d'});expect(f.sync).toHaveBeenCalledOnce();expect(f.directorySync).toHaveBeenCalledWith('C:/unit/witness');expect(io.events.map(e=>e.kind)).toEqual(['open','data-file-sync','rename','data-directory-sync','close']);});
 it('room real publication method still syncs birth file and directory after rename',()=>{const f=fixture('room');Reflect.get(f.object,'publish').call(f.object,'C:/unit/birth','birth',{});expect(f.sync).toHaveBeenCalledOnce();expect(f.directorySync).toHaveBeenCalledWith('C:/unit/birth');expect(io.events.map(e=>e.kind)).toEqual(['open','data-file-sync','rename','data-directory-sync','close']);});
});
