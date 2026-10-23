import {it,expect,afterEach} from 'vitest';
import * as fs from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
import {Keyring} from './security.js';
import {PrivateTopicLedger} from './private-topic-ledger.js';
import {TopicRoomLifecycle,type RoomStorageDirectories,type TopicRoomControls} from './topic-room-lifecycle.js';
const secret=Buffer.alloc(32,57).toString('base64'),keys=new Keyring('r',{r:secret});
const pins={taxonomy:'c'.repeat(64),policy:'d'.repeat(64),vocabulary:['alpha','beta','gamma']};
const room='10000000-0000-4000-8000-000000000001',otherRoom='10000000-0000-4000-8000-000000000002';
const id=(n:number)=>`20000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const op=(n:number)=>`30000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const proof={roomTransactionLockHeld:true as const},roots:string[]=[];
afterEach(()=>{for(const root of roots.splice(0)){expect(dirname(resolve(root))).toBe('/state');fs.rmSync(root,{recursive:true,force:true});}});
function fixture(controls:TopicRoomControls={},memberLimit=3){
  const root=fs.mkdtempSync('/state/reviewer-life-');roots.push(root);
  const names=['birthDirectory','personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory'] as const;
  const directories=Object.fromEntries(names.map(name=>{const path=join(root,name);fs.mkdirSync(path,0o700);return[name,path];})) as unknown as RoomStorageDirectories;
  let clock=50000;const options={keys,pins,directories:()=>directories,now:()=>clock,memberLimit,controls};
  const manager=new TopicRoomLifecycle(options),birth=manager.initializeRoom(room,1000,proof);
  return{root,directories,options,manager,birth,clock:(value:number)=>{clock=value;},birthFile:join(directories.birthDirectory,'birth'),intentFile:join(directories.birthDirectory,'retirement'),lock:join(directories.birthDirectory,'room.lock')};
}
function admitted(controls:TopicRoomControls={},limit=3){const f=fixture(controls,limit);f.manager.admitMember(room,f.birth,id(1),op(1),proof);return f;}
function retire(f:ReturnType<typeof fixture>){return f.manager.retireRoom(room,f.birth,{operationId:op(20),retiredAt:40000},proof);}
function personal(f:ReturnType<typeof fixture>){return join(f.directories.personalChainDirectory,'chain');}
function decodeBirth(f:ReturnType<typeof fixture>){return keys.decrypt<Record<string,unknown>>(JSON.parse(fs.readFileSync(f.birthFile,'utf8')).cipher,'venus:topic-room-lifecycle:v1:birth');}
function snapshots(f:ReturnType<typeof fixture>){return ['chain','witness'].map((name,i)=>fs.readFileSync(join(i?f.directories.lifecycleWitnessDirectory:f.directories.lifecycleChainDirectory,name)));}

it.each([1,2,4])('admission count=%i retains all member-withdrawal and room-terminal reserve after exhaustion',limit=>{
  const f=fixture({},limit);for(let n=1;n<=limit;n++)f.manager.admitMember(room,f.birth,id(n),op(n),proof);
  expect(()=>f.manager.admitMember(room,f.birth,id(99),op(99),proof)).toThrow('TOPIC_ROOM_MEMBER_CAPACITY');
  for(let n=1;n<=limit;n++)f.manager.retireMember(room,f.birth,id(n),op(n),proof);
  expect(()=>f.manager.admitMember(room,f.birth,id(100),op(100),proof)).toThrow('TOPIC_ROOM_MEMBER_CAPACITY');
  expect(retire(f).retired).toBe(true);expect(()=>f.manager.open(room,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
});

it('reserved incarnation identity never consumes admission; same external UUID is domain-isolated across real identities',()=>{
  const f=fixture(),before=snapshots(f);
  expect(()=>f.manager.admitMember(room,f.birth,f.birth.incarnation,op(1),proof)).toThrow('TOPIC_ROOM_RESERVED_OWNER');
  expect(snapshots(f)).toEqual(before);
  f.manager.admitMember(room,f.birth,id(1),op(1),proof);f.manager.admitMember(room,f.birth,id(2),op(1),proof);
  f.manager.retireMember(room,f.birth,id(1),op(1),proof);
  expect(()=>f.manager.assertMember(room,f.birth,id(1))).toThrow('TOPIC_ROOM_MEMBER_RETIRED');
  f.manager.assertMember(room,f.birth,id(2));
});

it('count aggregate returns immutable minimal shape and detects scope/filter/floor errors',()=>{
  const root=fs.mkdtempSync('/state/reviewer-life-');roots.push(root);const a=join(root,'a'),b=join(root,'b');fs.mkdirSync(a,0o700);fs.mkdirSync(b,0o700);
  const options={chainDirectory:a,witnessDirectory:b,keys,pins}, {ledger,required}=PrivateTopicLedger.initialize(options);
  const oldChain=fs.readFileSync(join(a,'chain')),oldWitness=fs.readFileSync(join(b,'witness'));
  ledger.narrow({roomId:room,ownerId:id(1),operationId:op(1),expectedRevision:0,exclude:['alpha']});
  ledger.narrow({roomId:room,ownerId:id(2),operationId:op(2),expectedRevision:0,exclude:['beta']});
  ledger.narrow({roomId:otherRoom,ownerId:id(3),operationId:op(3),expectedRevision:0,exclude:['alpha']});
  const count=ledger.countExcludedScopes(room,'alpha');expect(Object.keys(count).sort()).toEqual(['count','incarnation','sequence']);expect(Object.isFrozen(count)).toBe(true);expect(count.count).toBe(1);
  expect(()=>ledger.countExcludedScopes(room,'unknown')).toThrow();expect(()=>ledger.countExcludedScopes('bad','alpha')).toThrow();
  fs.writeFileSync(join(a,'chain'),oldChain);fs.writeFileSync(join(b,'witness'),oldWitness);
  expect(()=>ledger.countExcludedScopes(room,'alpha')).toThrow('TOPIC_LEDGER_PROCESS_REGRESSION');
  expect(()=>PrivateTopicLedger.open(options,{...required,minimumSequence:4})).toThrow('TOPIC_LEDGER_REQUIRED_REGRESSION');
});

it('retired member denies retained wrappers after cold reopen while unrelated admitted member remains live',()=>{
  const f=admitted(),wrapper=f.manager.open(room,f.birth);wrapper.narrow({roomId:room,ownerId:id(1),operationId:op(1),expectedRevision:0,exclude:['alpha']});
  f.manager.admitMember(room,f.birth,id(2),op(2),proof);f.manager.retireMember(room,f.birth,id(1),op(1),proof);
  expect(()=>wrapper.read({roomId:room,ownerId:id(1)})).toThrow('TOPIC_ROOM_MEMBER_RETIRED');
  expect(()=>new TopicRoomLifecycle(f.options).open(room,f.birth).narrow({roomId:room,ownerId:id(1),operationId:op(2),expectedRevision:1,exclude:['beta']})).toThrow('TOPIC_ROOM_MEMBER_RETIRED');
  expect(wrapper.read({roomId:room,ownerId:id(2)}).excluded).toEqual([]);
});

it('published incomplete retirement intent denies live delivery but cannot authorize cleanup',()=>{
  let armed=false;const f=admitted({phase:p=>{if(armed&&p==='after-retirement-directory-sync')throw Error('intent-only');}}),wrapper=f.manager.open(room,f.birth);
  armed=true;expect(()=>retire(f)).toThrow('intent-only');armed=false;
  expect(()=>wrapper.read({roomId:room,ownerId:id(1)})).toThrow('TOPIC_ROOM_RETIRED');
  expect(()=>new TopicRoomLifecycle(f.options).assertLive(room,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
  expect(()=>f.manager.cleanupPersonal(room,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('TOPIC_ROOM_NOT_DURABLY_RETIRED');
  expect(()=>f.manager.retireRoom(room,f.birth,{operationId:op(20),retiredAt:40001},proof)).toThrow('TOPIC_ROOM_RETIREMENT_CONFLICT');
  expect(fs.existsSync(personal(f))).toBe(true);retire(f);
  expect(f.manager.cleanupPersonal(room,f.birth,{...proof,minimumTerminalAgeMs:0}).personalRemoved).toBe(true);
});

it('observed retirement intent removal and newer lifecycle rollback never reopen cached manager',()=>{
  const f=admitted(),before=snapshots(f);retire(f);fs.unlinkSync(f.intentFile);
  expect(()=>f.manager.assertLive(room,f.birth)).toThrow();
  fs.writeFileSync(join(f.directories.lifecycleChainDirectory,'chain'),before[0]!);fs.writeFileSync(join(f.directories.lifecycleWitnessDirectory,'witness'),before[1]!);
  expect(()=>f.manager.assertMember(room,f.birth,id(1))).toThrow('TOPIC_LEDGER_PROCESS_REGRESSION');
});

it.each(['birth-hardlink','intent-hardlink','second-personal-hardlink','second-personal-symlink','unknown-second-file'])('unsafe cleanup %s never unlinks first personal file',attack=>{
  const f=admitted();retire(f);
  const witness=join(f.directories.personalWitnessDirectory,'witness');
  if(attack==='birth-hardlink')fs.linkSync(f.birthFile,join(f.root,'linked'));
  if(attack==='intent-hardlink')fs.linkSync(f.intentFile,join(f.root,'linked'));
  if(attack==='second-personal-hardlink')fs.linkSync(witness,join(f.root,'linked'));
  if(attack==='second-personal-symlink'){fs.renameSync(witness,join(f.root,'target'));fs.symlinkSync(join(f.root,'target'),witness);}
  if(attack==='unknown-second-file')fs.writeFileSync(join(f.directories.personalWitnessDirectory,'unrecognized'),'x');
  expect(()=>f.manager.cleanupPersonal(room,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow();expect(fs.existsSync(personal(f))).toBe(true);
});

it('held actual fd loses links after unlink but both cached and cold wrappers obey retained terminal metadata',()=>{
  const f=admitted(),wrapper=f.manager.open(room,f.birth),fd=fs.openSync(personal(f),'r');
  try{retire(f);const result=f.manager.cleanupPersonal(room,f.birth,{...proof,minimumTerminalAgeMs:0});expect(result.personalRemoved).toBe(true);expect(fs.fstatSync(fd).nlink).toBe(0);
    expect(fs.readSync(fd,Buffer.alloc(1),0,1,0)).toBe(1); // Unix open fd still contains bytes; it is not a delivery grant.
    expect(()=>wrapper.read({roomId:room,ownerId:id(1)})).toThrow('TOPIC_ROOM_RETIRED');expect(()=>new TopicRoomLifecycle(f.options).open(room,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
    expect(fs.existsSync(f.birthFile)).toBe(true);expect(fs.existsSync(f.intentFile)).toBe(true);
  }finally{fs.closeSync(fd);}
});

it.each([1,2,3,4,5,6])('independent retirement sync failure %i gives no receipt and never clears terminal safety',target=>{
  let armed=false,calls=0;const f=admitted({sync:fd=>{if(armed&&++calls===target)throw Error('review-sync-'+target);fs.fsyncSync(fd);}});
  armed=true;expect(()=>retire(f)).toThrow('review-sync-'+target);armed=false;
  expect(fs.existsSync(personal(f))).toBe(true);
  if(target>=3)expect(()=>f.manager.assertLive(room,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
  retire(f);expect(()=>f.manager.open(room,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
});

it.each([2,3,4])('cleanup directory-sync failure %i retains terminal authority and is retryable',target=>{
  let armed=false,calls=0;const f=admitted({sync:fd=>{if(armed&&++calls===target)throw Error('cleanup-sync-'+target);fs.fsyncSync(fd);}});retire(f);armed=true;
  expect(()=>f.manager.cleanupPersonal(room,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('cleanup-sync-'+target);armed=false;
  expect(()=>new TopicRoomLifecycle(f.options).open(room,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
  expect(f.manager.cleanupPersonal(room,f.birth,{...proof,minimumTerminalAgeMs:0}).personalRemoved).toBe(true);
});

it.each(['short-write','rename','ENOSPC'])('independent metadata %s fault does not publish a terminal receipt or authorize cleanup',fault=>{
  let armed=false;const f=admitted({write:(fd,bytes)=>{if(armed&&fault==='ENOSPC')throw Error('review-ENOSPC');return fs.writeSync(fd,armed&&fault==='short-write'?bytes.subarray(0,17):bytes);},rename:(from,to)=>{if(armed&&fault==='rename')throw Error('review-rename');fs.renameSync(from,to);}});
  armed=true;expect(()=>retire(f)).toThrow();armed=false;
  expect(()=>f.manager.cleanupPersonal(room,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('TOPIC_ROOM_NOT_DURABLY_RETIRED');expect(fs.existsSync(personal(f))).toBe(true);
  retire(f);expect(f.manager.cleanupPersonal(room,f.birth,{...proof,minimumTerminalAgeMs:0}).personalRemoved).toBe(true);
});

it.each(['chain','witness'])('independent %s unlink failure keeps full terminal metadata and allows repeat cleanup',name=>{
  let armed=false;const f=admitted({unlink:path=>{if(armed&&path.endsWith('/'+name))throw Error('review-unlink');fs.unlinkSync(path);}});retire(f);armed=true;
  expect(()=>f.manager.cleanupPersonal(room,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('review-unlink');armed=false;
  expect(()=>new TopicRoomLifecycle(f.options).open(room,f.birth)).toThrow('TOPIC_ROOM_RETIRED');expect(f.manager.cleanupPersonal(room,f.birth,{...proof,minimumTerminalAgeMs:0}).personalRemoved).toBe(true);
});

it('wrong room, altered pins, reserved owner and missing personal floor never enter wrapper',()=>{
  const f=admitted();expect(()=>f.manager.open(otherRoom,f.birth)).toThrow('TOPIC_ROOM_BIRTH_MISMATCH');
  expect(()=>new TopicRoomLifecycle({...f.options,pins:{...pins,taxonomy:'f'.repeat(64)}}).open(room,f.birth)).toThrow('TOPIC_ROOM_PINS');
  expect(()=>f.manager.open(room,{...f.birth,minimumSequence:2})).toThrow('TOPIC_ROOM_PERSONAL_REGRESSION');
  expect(()=>f.manager.open(room,f.birth)).toThrow('TOPIC_ROOM_PERSONAL_REGRESSION');
});

it('actual paths are protected, directory aliases and stale room lock are rejected without guessing age',()=>{
  const f=admitted();const lock=f.lock;fs.writeFileSync(lock,'',{mode:0o600});fs.utimesSync(lock,new Date(0),new Date(0));expect(()=>f.manager.assertLive(room,f.birth)).toThrow('TOPIC_ROOM_BUSY');fs.unlinkSync(lock);
  const altered={...f.directories,personalWitnessDirectory:f.directories.personalChainDirectory};expect(()=>new TopicRoomLifecycle({...f.options,directories:()=>altered}).assertLive(room,f.birth)).toThrow('TOPIC_ROOM_DIRECTORIES');
  fs.chmodSync(f.directories.personalWitnessDirectory,0o750);expect(()=>f.manager.assertLive(room,f.birth)).toThrow('TOPIC_ROOM_DIRECTORY_UNSAFE');
});

function worker(f:ReturnType<typeof fixture>,action:string){
  for(const name of ['security','private-topic-ledger','topic-room-lifecycle']){
    const code=ts.transpileModule(fs.readFileSync(new URL('./'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ES2022}}).outputText.replace("'./security.js'","'./security.mjs'").replace("'./private-topic-ledger.js'","'./private-topic-ledger.mjs'");fs.writeFileSync(join(f.root,name+'.mjs'),code);
  }
  return `import {TopicRoomLifecycle} from ${JSON.stringify('file://'+join(f.root,'topic-room-lifecycle.mjs'))};import {Keyring} from ${JSON.stringify('file://'+join(f.root,'security.mjs'))};const room=${JSON.stringify(room)},birth=${JSON.stringify(f.birth)},proof={roomTransactionLockHeld:true};const options={keys:new Keyring('r',{r:${JSON.stringify(secret)}}),pins:${JSON.stringify(pins)},directories:()=>(${JSON.stringify(f.directories)}),now:()=>50000,memberLimit:3};${action}`;
}
it.each(['after-retirement-rename','after-room-retired','after-personal-chain-unlink'])('independent actual SIGKILL at %s preserves lock denial and recoverable retirement',phase=>{
  const f=admitted();if(phase==='after-personal-chain-unlink')retire(f);
  const action=phase==='after-personal-chain-unlink'?`manager.cleanupPersonal(room,birth,{...proof,minimumTerminalAgeMs:0})`:`manager.retireRoom(room,birth,{operationId:${JSON.stringify(op(20))},retiredAt:40000},proof)`;
  const code=worker(f,`options.controls={phase:p=>{if(p===${JSON.stringify(phase)})process.kill(process.pid,'SIGKILL')}};const manager=new TopicRoomLifecycle(options);${action};process.exit(99);`);
  const result=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',timeout:10000});expect(result.error).toBeUndefined();expect(result.signal,result.stderr).toBe('SIGKILL');expect(result.status).toBeNull();
  expect(()=>new TopicRoomLifecycle(f.options).open(room,f.birth)).toThrow('TOPIC_ROOM_BUSY');fs.unlinkSync(f.lock); // only after confirmed disposable worker death
  expect(()=>new TopicRoomLifecycle(f.options).open(room,f.birth)).toThrow('TOPIC_ROOM_RETIRED');retire(f);expect(f.manager.cleanupPersonal(room,f.birth,{...proof,minimumTerminalAgeMs:0}).personalRemoved).toBe(true);
});

it('born descriptor and personal/lifecycle ciphertext hide ownership/topic/clock field values at fixed frame sizes',()=>{
  const f=admitted();retire(f);for(const file of [f.birthFile,f.intentFile,personal(f),join(f.directories.lifecycleChainDirectory,'chain')]){
    const bytes=fs.readFileSync(file);expect(bytes.length%24576).toBe(0);for(const marker of [room,id(1),'alpha','beta','retiredAt','member_admitted'])expect(bytes.toString()).not.toContain(marker);
  }expect(decodeBirth(f).roomId).toBe(room);
});
