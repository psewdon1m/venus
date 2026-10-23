import {afterEach,describe,expect,it,vi} from 'vitest';
import {join,dirname,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {TopicRoomDirectories} from './topic-room-directories.js';
import type {RoomStorageDirectories} from './topic-room-lifecycle.js';

const intercept = vi.hoisted(() => ({fsync:undefined as undefined | ((fd:number)=>void),
  open:undefined as undefined | ((path:string)=>void), mkdir:undefined as undefined | ((path:string)=>void)}));
vi.mock('node:fs',async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {...actual,
    fsyncSync(fd:number) {intercept.fsync?.(fd);return actual.fsyncSync(fd);},
    openSync(...args:Parameters<typeof actual.openSync>) {intercept.open?.(String(args[0]));return actual.openSync(...args);},
    mkdirSync(...args:Parameters<typeof actual.mkdirSync>) {intercept.mkdir?.(String(args[0]));return actual.mkdirSync(...args);}};
});
const fs = await vi.importActual<typeof import('node:fs')>('node:fs');
const rootsNames = ['birthDirectory','personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory'] as const;
const room = '12345678-1111-4111-8111-111111111111';
const temporary:string[] = [];
function fixture() {
  const base = fs.mkdtempSync(join(tmpdir(),'venus-independent-directory-'));temporary.push(base);fs.chmodSync(base,0o700);
  const roots = Object.fromEntries(rootsNames.map(name => {const path = join(base,name);fs.mkdirSync(path,0o700);return [name,path];})) as unknown as RoomStorageDirectories;
  return {base,roots};
}
afterEach(() => {
  intercept.fsync=undefined;intercept.open=undefined;intercept.mkdir=undefined;
  for (const base of temporary.splice(0)) {expect(dirname(resolve(base))).toBe(resolve(tmpdir()));fs.rmSync(base,{recursive:true,force:true});}
});
function children(roots:RoomStorageDirectories) {return Object.values(roots).map(path => fs.readdirSync(path));}

describe('independent Linux directory allocator adversarial controls',()=>{
  it('lookup is immutable and never creates or scans missing rooms',()=>{
    const f=fixture(),allocator=new TopicRoomDirectories(f.roots),value=allocator.directories(room);
    expect(Object.isFrozen(value)).toBe(true);expect(children(f.roots)).toEqual([[],[],[],[],[]]);
    expect(Object.values(value)).toEqual(Object.values(f.roots).map(root=>join(root,room)));
  });
  it('does not reuse even a single pre-existing regular file and leaves all other roots empty',()=>{
    const f=fixture(),allocator=new TopicRoomDirectories(f.roots);fs.writeFileSync(join(f.roots.lifecycleWitnessDirectory,room),'partial');
    expect(()=>allocator.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOM_ALREADY_PROVISIONED'}));
    expect(children(f.roots).slice(0,4)).toEqual([[],[],[],[]]);expect(fs.readFileSync(join(f.roots.lifecycleWitnessDirectory,room),'utf8')).toBe('partial');
  });
  it('never adopts dangling destination symlinks',()=>{
    const f=fixture(),allocator=new TopicRoomDirectories(f.roots);fs.symlinkSync('/nonexistent-review-target',join(f.roots.lifecycleWitnessDirectory,room));
    expect(()=>allocator.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOM_ALREADY_PROVISIONED'}));
    expect(children(f.roots).slice(0,4)).toEqual([[],[],[],[]]);
  });
  it('checks every ancestor for symlinks before opening roots',()=>{
    const f=fixture(),alias=f.base+'-alias';temporary.push(alias);fs.symlinkSync(f.base,alias,'dir');
    const roots=Object.fromEntries(rootsNames.map(name=>[name,join(alias,name)])) as unknown as RoomStorageDirectories;
    expect(()=>new TopicRoomDirectories(roots)).toThrow(expect.objectContaining({code:'TOPIC_ROOT_SYMLINK'}));expect(children(f.roots)).toEqual([[],[],[],[],[]]);
  });
  it('requires all roots before any mutation and never creates missing operator parents',()=>{
    const f=fixture();fs.rmdirSync(f.roots.lifecycleWitnessDirectory);
    expect(()=>new TopicRoomDirectories(f.roots)).toThrow();expect(fs.existsSync(f.roots.lifecycleWitnessDirectory)).toBe(false);
    expect(Object.values(f.roots).slice(0,4).map(path=>fs.readdirSync(path))).toEqual([[],[],[],[]]);
  });
  it('rejects roots supplied through a nested alias after normalization',()=>{
    const f=fixture();const alias=join(f.roots.birthDirectory,'..','birthDirectory');
    expect(()=>new TopicRoomDirectories({...f.roots,personalChainDirectory:alias})).toThrow(expect.objectContaining({code:'TOPIC_ROOTS_ALIASED'}));
  });
  it('denies lookup and provision after root deletion or inode replacement',()=>{
    const f=fixture(),allocator=new TopicRoomDirectories(f.roots);fs.renameSync(f.roots.lifecycleWitnessDirectory,f.roots.lifecycleWitnessDirectory+'.old');
    expect(()=>allocator.directories(room)).toThrow();fs.mkdirSync(f.roots.lifecycleWitnessDirectory,0o700);
    expect(()=>allocator.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOT_REPLACED'}));expect(children(f.roots)).toEqual([[],[],[],[],[]]);
  });
  it('rejects a wrong owner rather than repairing it',()=>{
    const f=fixture();const unsafe='/etc';expect(fs.statSync(unsafe).uid).not.toBe(process.getuid!());
    expect(()=>new TopicRoomDirectories({...f.roots,birthDirectory:unsafe})).toThrow(expect.objectContaining({code:'TOPIC_ROOT_UNSAFE'}));
  });
  it('does not weaken caller umask, and a restrictive umask yields a denied partial birth',()=>{
    const f=fixture(),allocator=new TopicRoomDirectories(f.roots),before=process.umask(0o277);
    try {expect(()=>allocator.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOM_DIRECTORY_UNSAFE'}));expect(process.umask()).toBe(0o277);}
    finally {process.umask(before);}
    expect(fs.existsSync(join(f.roots.birthDirectory,room))).toBe(true);expect(children(f.roots).slice(1)).toEqual([[],[],[],[]]);
    expect(()=>allocator.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOM_ALREADY_PROVISIONED'}));
  });
  it('exclusively creates all five children and fsyncs each child then its own actual root',()=>{
    const f=fixture(),allocator=new TopicRoomDirectories(f.roots),seen:string[]=[];
    intercept.fsync=fd=>{seen.push(fs.readlinkSync('/proc/self/fd/'+fd));};allocator.provision(room);
    expect(seen).toEqual(Object.values(f.roots).flatMap(root=>[join(root,room),root]));
    for(const root of Object.values(f.roots)){expect(fs.statSync(join(root,room)).mode&0o7777).toBe(0o700);expect(fs.statSync(join(root,room)).uid).toBe(process.getuid!());}
  });
  for(let failure=1;failure<=10;failure++)it(`fsync failure ${failure} leaves an ambiguous partial birth that cannot be reused`,()=>{
    const f=fixture(),allocator=new TopicRoomDirectories(f.roots);let count=0;
    intercept.fsync=()=>{if(++count===failure)throw Object.assign(new Error('Injected EIO'),{code:'EIO'});};
    expect(()=>allocator.provision(room)).toThrow('Injected EIO');intercept.fsync=undefined;
    const created=Math.ceil(failure/2);expect(children(f.roots)).toEqual(rootsNames.map((_,index)=>index<created?[room]:[]));
    expect(()=>allocator.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOM_ALREADY_PROVISIONED'}));
    expect(children(f.roots)).toEqual(rootsNames.map((_,index)=>index<created?[room]:[]));
  });
  it('exclusive mkdir denies a competing directory created after the preflight',()=>{
    const f=fixture(),allocator=new TopicRoomDirectories(f.roots);let inserted=false;
    intercept.mkdir=path=>{if(!inserted){inserted=true;fs.mkdirSync(path,0o700);}};
    expect(()=>allocator.provision(room)).toThrow(expect.objectContaining({code:'EEXIST'}));intercept.mkdir=undefined;
    expect(children(f.roots)).toEqual([[room],[],[],[],[]]);
    expect(()=>allocator.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOM_ALREADY_PROVISIONED'}));
  });
  it('a child swapped to a symlink before open fails O_NOFOLLOW, without writes to its target',()=>{
    const f=fixture(),allocator=new TopicRoomDirectories(f.roots),target=join(f.base,'outside');fs.mkdirSync(target,0o700);let swapped=false;
    intercept.open=path=>{if(!swapped&&path.startsWith('/proc/self/fd/')&&path.endsWith('/'+room)){
      swapped=true;fs.rmdirSync(path);fs.symlinkSync(target,path,'dir');}};
    expect(()=>allocator.provision(room)).toThrow();intercept.open=undefined;
    expect(fs.readdirSync(target)).toEqual([]);expect(children(f.roots).slice(1)).toEqual([[],[],[],[]]);
  });
  it('retains anchored writes and denies a root replaced while fsync is in progress',()=>{
    const f=fixture(),allocator=new TopicRoomDirectories(f.roots);let swapped=false;
    intercept.fsync=()=>{if(!swapped){swapped=true;fs.renameSync(f.roots.birthDirectory,f.roots.birthDirectory+'.old');fs.mkdirSync(f.roots.birthDirectory,0o700);}};
    expect(()=>allocator.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOT_REPLACED'}));intercept.fsync=undefined;
    expect(fs.readdirSync(f.roots.birthDirectory)).toEqual([]);expect(fs.readdirSync(f.roots.birthDirectory+'.old')).toEqual([room]);
    expect(()=>allocator.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOT_REPLACED'}));
  });
  it('does not accept a late ancestor symlink introduced after the final root ancestor check',()=>{
    const f=fixture(),allocator=new TopicRoomDirectories(f.roots),saved=f.base+'.old';temporary.push(saved);let swapped=false;
    intercept.open=path=>{if(!swapped&&path===f.roots.lifecycleWitnessDirectory){swapped=true;fs.renameSync(f.base,saved);fs.symlinkSync(saved,f.base,'dir');}};
    expect(()=>allocator.provision(room)).toThrow(expect.objectContaining({code:'TOPIC_ROOT_SYMLINK'}));
  });
});
