/** Protected per-room directory allocation. The five operator-provisioned root
 * directories already exist, are owned by this Linux UID and have mode0700.
 * This class never creates parents, repairs permissions, follows symlinks,
 * reuses partial births, removes or scans orphan rooms. Parent replacement
 * during the serving process is denied by retained dev/inode floors. */
import * as fs from 'node:fs';
import {resolve,join,parse,sep,isAbsolute} from 'node:path';
import type {RoomStorageDirectories} from './topic-room-lifecycle.js';
import {requireThat} from './security.js';
const names=['birthDirectory','personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory'] as const;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export class TopicRoomDirectories {
 private readonly roots:RoomStorageDirectories;
 private readonly identities=new Map<string,string>();
 constructor(roots:RoomStorageDirectories) {
  requireThat(process.platform==='linux','TOPIC_ROOM_PLATFORM_UNSUPPORTED',503);
  requireThat(roots&&Object.keys(roots).sort().join(',')===[...names].sort().join(',')&&Object.values(roots).every(p=>typeof p==='string'&&isAbsolute(p)),'TOPIC_ROOTS_INVALID',503);
  this.roots=Object.freeze(Object.fromEntries(names.map(name=>[name,resolve(roots[name])]))) as unknown as RoomStorageDirectories;
  const paths=Object.values(this.roots);
  requireThat(paths.every((p,i)=>paths.every((other,j)=>i===j||(p!==other&&!p.startsWith(other+sep)))),'TOPIC_ROOTS_ALIASED',503);
  this.withRoots(()=>{});
 }
 private openRoot(path:string) {
  let prefix=parse(path).root;
  for(const part of path.slice(prefix.length).split(sep).filter(Boolean)) {prefix=join(prefix,part);requireThat(!fs.lstatSync(prefix).isSymbolicLink(),'TOPIC_ROOT_SYMLINK',503);}
  const named=fs.lstatSync(path),fd=fs.openSync(path,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY|fs.constants.O_NOFOLLOW);
  try {
   const stat=fs.fstatSync(fd),identity=stat.dev+':'+stat.ino,old=this.identities.get(path);
   requireThat(stat.isDirectory()&&stat.uid===process.getuid!()&&(stat.mode&0o7777)===0o700&&stat.dev===named.dev&&stat.ino===named.ino,'TOPIC_ROOT_UNSAFE',503);
   requireThat(old===undefined||old===identity,'TOPIC_ROOT_REPLACED',503);this.identities.set(path,identity);return {fd,identity,path};
  }catch(error){fs.closeSync(fd);throw error;}
 }
 private withRoots<T>(operation:(roots:{fd:number;identity:string;path:string}[])=>T,metadataOnly=false):T {
  const opened:ReturnType<TopicRoomDirectories['openRoot']>[]=[];
  const required=metadataOnly?names.filter(name=>name!=='personalChainDirectory'&&name!=='personalWitnessDirectory'):names;
  try {
   for(const name of required)opened.push(this.openRoot(this.roots[name]));
   requireThat(new Set(opened.map(r=>r.identity)).size===required.length,'TOPIC_ROOTS_ALIASED',503);
   const result=operation(opened);
   // A late ancestor symlink can still resolve to the SAME leaf inode. Rewalk
   // the whole namespace and validate owner/mode/floors before accepting success.
   for(const root of opened){const current=this.openRoot(root.path);try{requireThat(current.identity===root.identity,'TOPIC_ROOT_REPLACED',503);}finally{fs.closeSync(current.fd);}}
   return result;
  } finally {for(const root of opened.reverse())fs.closeSync(root.fd);}
 }
 directories(roomId:string,metadataOnly=false):RoomStorageDirectories {
  requireThat(UUID.test(roomId),'INVALID_ROOM_ID',400);
  return this.withRoots(()=>Object.freeze(Object.fromEntries(names.map(name=>[name,join(this.roots[name],roomId)]))),metadataOnly) as unknown as RoomStorageDirectories;
 }
 provision(roomId:string):void {
  requireThat(UUID.test(roomId),'INVALID_ROOM_ID',400);
  this.withRoots(roots=>{
   // Validate EVERY destination before the first mkdir. Existing or partial
   // state is ambiguous and requires operator recovery, never initialization.
   for(const root of roots) {
    try {fs.lstatSync(`/proc/self/fd/${root.fd}/${roomId}`);}
    catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')continue;throw error;}
    requireThat(false,'TOPIC_ROOM_ALREADY_PROVISIONED',503);
   }
   for(const root of roots) {
    const path=`/proc/self/fd/${root.fd}/${roomId}`;
    fs.mkdirSync(path,{mode:0o700});
    const child=fs.openSync(path,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY|fs.constants.O_NOFOLLOW);
    try {const stat=fs.fstatSync(child);requireThat(stat.isDirectory()&&stat.uid===process.getuid!()&&(stat.mode&0o7777)===0o700,'TOPIC_ROOM_DIRECTORY_UNSAFE',503);fs.fsyncSync(child);}
    finally {fs.closeSync(child);}
    fs.fsyncSync(root.fd);
   }
  });
 }
}
