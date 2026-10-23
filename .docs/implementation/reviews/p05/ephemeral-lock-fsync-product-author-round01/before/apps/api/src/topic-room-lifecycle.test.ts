import {describe,it,expect,afterEach} from 'vitest';
import * as fs from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
import {Keyring,canonical} from './security.js';
import {PrivateTopicLedger} from './private-topic-ledger.js';
import {TopicRoomLifecycle,topicLifecyclePins,type RoomStorageDirectories,type TopicRoomOptions,type TopicRoomControls,type TopicRoomPhase,type TopicRoomBirth} from './topic-room-lifecycle.js';
const roomId='11111111-1111-4111-8111-111111111111',owner='22222222-2222-4222-8222-222222222222',other='33333333-3333-4333-8333-333333333333';
const request='44444444-4444-4444-8444-444444444444',third='55555555-5555-4555-8555-555555555555';
const secrets={v1:Buffer.alloc(32,41).toString('base64'),v2:Buffer.alloc(32,42).toString('base64')};
const keys=new Keyring('v1',secrets),pins={taxonomy:'a'.repeat(64),policy:'b'.repeat(64),vocabulary:['food','music']};
const proof={roomTransactionLockHeld:true as const},roots:string[]=[];
afterEach(()=>{for(const path of roots.splice(0)) {expect(dirname(resolve(path))).toBe(resolve(process.env.TOPIC_LEDGER_TEST_ROOT??tmpdir()));fs.rmSync(path,{recursive:true,force:true});}});
function fixture(controls:TopicRoomControls={},memberLimit=2) {
  const root=fs.mkdtempSync(join(process.env.TOPIC_LEDGER_TEST_ROOT??tmpdir(),'venus-topic-room-'));roots.push(root);fs.chmodSync(root,0o700);
  const names=['birthDirectory','personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory'] as const;
  const directories=Object.fromEntries(names.map(name=>{const path=join(root,name);fs.mkdirSync(path,0o700);return [name,path];})) as unknown as RoomStorageDirectories;
  let clock=10000;const options:TopicRoomOptions={directories:id=>{expect(id).toBe(roomId);return directories;},keys,pins,now:()=>clock,controls,memberLimit};
  const manager=new TopicRoomLifecycle(options);
  return {root,directories,options,manager,setClock:(value:number)=>{clock=value;},birthFile:join(directories.birthDirectory,'birth'),intentFile:join(directories.birthDirectory,'retirement'),roomLock:join(directories.birthDirectory,'room.lock')};
}
function initialized(controls:TopicRoomControls={},memberLimit=2) {
  const f=fixture(controls,memberLimit),birth=f.manager.initializeRoom(roomId,1000,proof);return {...f,birth};
}
function admitted(controls:TopicRoomControls={},memberLimit=2) {
  const f=initialized(controls,memberLimit);f.manager.admitMember(roomId,f.birth,owner,request,proof);return f;
}
function descriptor(path:string) {const value=JSON.parse(fs.readFileSync(path,'utf8'));return keys.decrypt<Record<string,unknown>>(value.cipher,'venus:topic-room-lifecycle:v1:birth');}
function childScript(f:ReturnType<typeof initialized>,action:string) {
  for(const name of ['security','private-topic-ledger','topic-room-lifecycle']) {
    const source=fs.readFileSync(new URL('./'+name+'.ts',import.meta.url),'utf8');
    const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ES2022}}).outputText
      .replace("'./security.js'","'./security.mjs'").replace("'./private-topic-ledger.js'","'./private-topic-ledger.mjs'");
    fs.writeFileSync(join(f.root,name+'.mjs'),compiled);
  }
  return `import {TopicRoomLifecycle} from ${JSON.stringify(pathToFileURL(join(f.root,'topic-room-lifecycle.mjs')).href)};
    import {Keyring} from ${JSON.stringify(pathToFileURL(join(f.root,'security.mjs')).href)};
    const roomId=${JSON.stringify(roomId)},birth=${JSON.stringify(f.birth)},proof={roomTransactionLockHeld:true};
    const options={directories:()=>(${JSON.stringify(f.directories)}),keys:new Keyring('v1',${JSON.stringify(secrets)}),pins:${JSON.stringify(pins)},now:()=>10000,memberLimit:2};
    ${action}`;
}
describe.skipIf(process.platform!=='linux')('inactive topic room lifecycle — real Linux filesystem',()=>{
  it('initializes protected immutable encrypted birth and exact per-room personal/lifecycle drivers',()=>{
    const f=initialized(),body=descriptor(f.birthFile);
    expect(body).toMatchObject({protocol:2,roomId,createdAt:1000,personalIncarnation:f.birth.incarnation,memberLimit:2});
    expect(fs.statSync(f.birthFile).size).toBe(24576);expect(fs.statSync(f.birthFile).mode&0o7777).toBe(0o600);
    expect(fs.readFileSync(f.birthFile,'utf8')).not.toMatch(/food|music|11111111|createdAt|personalIncarnation/);
    expect(()=>f.manager.initializeRoom(roomId,1000,proof)).toThrow('TOPIC_ROOM_ALREADY_INITIALIZED');
    expect(()=>new TopicRoomLifecycle(f.options).initializeRoom(roomId,1000,proof)).toThrow('TOPIC_ROOM_ALREADY_INITIALIZED');
    expect(()=>f.manager.open(roomId,{...f.birth,incarnation:other})).toThrow('TOPIC_ROOM_BIRTH_MISMATCH');
  });
  it('normal open never initializes missing birth or missing required files',()=>{
    const f=fixture(),birth:TopicRoomBirth={incarnation:owner,minimumSequence:1,taxonomy_digest:pins.taxonomy,policy_digest:pins.policy};
    expect(()=>f.manager.open(roomId,birth)).toThrow();expect(fs.existsSync(f.birthFile)).toBe(false);
    for(const path of Object.values(f.directories)) expect(fs.readdirSync(path)).toEqual([]);
  });
  it('keeps stable wrappers, empty new identity state and fresh member fences on every old wrapper operation',()=>{
    const f=admitted(),wrapped=f.manager.open(roomId,f.birth);
    expect(f.manager.open(roomId,f.birth)).toBe(wrapped);expect(wrapped.read({roomId,ownerId:owner}).excluded).toEqual([]);
    wrapped.narrow({roomId,ownerId:owner,operationId:request,expectedRevision:0,exclude:['music']});
    f.manager.admitMember(roomId,f.birth,other,request,proof);
    expect(wrapped.read({roomId,ownerId:other}).excluded).toEqual([]);
    expect(()=>wrapped.read({roomId:third,ownerId:owner})).toThrow('TOPIC_ROOM_SCOPE');
    expect(()=>wrapped.read({roomId,ownerId:third})).toThrow('TOPIC_ROOM_MEMBER_NOT_ADMITTED');
    f.manager.retireMember(roomId,f.birth,owner,request,proof); // same external request UUID is domain-separated
    expect(()=>wrapped.read({roomId,ownerId:owner})).toThrow('TOPIC_ROOM_MEMBER_RETIRED');
    expect(()=>wrapped.narrow({roomId,ownerId:owner,operationId:third,expectedRevision:1,exclude:['food']})).toThrow('TOPIC_ROOM_MEMBER_RETIRED');
    expect(()=>new TopicRoomLifecycle(f.options).assertMember(roomId,f.birth,owner)).toThrow('TOPIC_ROOM_MEMBER_RETIRED');
    expect(()=>f.manager.admitMember(roomId,f.birth,owner,third,proof)).toThrow('TOPIC_ROOM_MEMBER_RETIRED');
    expect(wrapped.read({roomId,ownerId:other}).excluded).toEqual([]);
  });
  it('durably bounds admitted identities and always reserves complete member retirement plus room terminal capacity',()=>{
    const f=admitted();expect(f.manager.admitMember(roomId,f.birth,owner,third,proof).replayed).toBe(true);
    f.manager.admitMember(roomId,f.birth,other,request,proof);
    expect(()=>f.manager.admitMember(roomId,f.birth,third,request,proof)).toThrow('TOPIC_ROOM_MEMBER_CAPACITY');
    f.manager.retireMember(roomId,f.birth,owner,request,proof);f.manager.retireMember(roomId,f.birth,other,request,proof);
    expect(f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:2000},proof).retired).toBe(true);
    const body=descriptor(f.birthFile),ledger=PrivateTopicLedger.open({chainDirectory:f.directories.lifecycleChainDirectory,witnessDirectory:f.directories.lifecycleWitnessDirectory,keys,pins:topicLifecyclePins,maximumRecords:6},
      {incarnation:body.lifecycleIncarnation as string,minimumSequence:1});
    expect(ledger.countExcludedScopes(roomId,'member_admitted')).toMatchObject({sequence:6,count:2});
  });
  it('retirement and cleanup revoke held wrappers and preserve terminal metadata over partial/repeated deletion',()=>{
    const f=admitted(),wrapped=f.manager.open(roomId,f.birth),birthBytes=fs.readFileSync(f.birthFile);
    const personalFd=fs.openSync(join(f.directories.personalChainDirectory,'chain'),'r');
    try {
      f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof);
      expect(()=>f.manager.assertLive(roomId,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
      expect(()=>wrapped.read({roomId,ownerId:owner})).toThrow('TOPIC_ROOM_RETIRED');
      expect(()=>f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:2000})).toThrow('TOPIC_ROOM_CLEANUP_TOO_EARLY');
      f.setClock(12000);expect(f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:2000}).personalRemoved).toBe(true);
      expect(fs.fstatSync(personalFd).nlink).toBe(0);expect(()=>wrapped.read({roomId,ownerId:owner})).toThrow('TOPIC_ROOM_RETIRED');
      expect(fs.existsSync(join(f.directories.personalChainDirectory,'chain'))).toBe(false);expect(fs.existsSync(join(f.directories.personalWitnessDirectory,'witness'))).toBe(false);
      expect(fs.readFileSync(f.birthFile).equals(birthBytes)).toBe(true);expect(fs.existsSync(f.intentFile)).toBe(true);
      expect(f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:2000}).personalRemoved).toBe(true);
      expect(()=>new TopicRoomLifecycle(f.options).open(roomId,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
    } finally {fs.closeSync(personalFd);}
  });
  it('never treats unauthenticated lock/clock/caller fields as trustworthy proofs',()=>{
    const f=initialized();expect(()=>f.manager.admitMember(roomId,f.birth,owner,request,{roomTransactionLockHeld:false} as unknown as typeof proof)).toThrow('TOPIC_ROOM_LOCK_REQUIRED');
    expect(()=>f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:11000},proof)).toThrow('TOPIC_ROOM_RETIREMENT_TIME');
    expect(()=>f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:999},proof)).toThrow('TOPIC_ROOM_RETIREMENT_TIME');
    f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof);
    expect(()=>f.manager.retireRoom(roomId,f.birth,{operationId:third,retiredAt:9000},proof)).toThrow('TOPIC_ROOM_RETIREMENT_CONFLICT');
    f.setClock(9999);expect(()=>f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('TOPIC_ROOM_CLOCK_REGRESSION');
  });
  it('preserves retained old keys across rotation and rejects unknown keys/pins/missing marker',()=>{
    const f=admitted();expect(new TopicRoomLifecycle({...f.options,keys:new Keyring('v2',secrets)}).open(roomId,f.birth).read({roomId,ownerId:owner}).excluded).toEqual([]);
    expect(()=>new TopicRoomLifecycle({...f.options,keys:new Keyring('v2',{v2:secrets.v2})}).open(roomId,f.birth)).toThrow();
    expect(()=>new TopicRoomLifecycle({...f.options,pins:{...pins,policy:'c'.repeat(64)}}).open(roomId,f.birth)).toThrow('TOPIC_ROOM_PINS');
  });
  it.each(['birth-mode','birth-symlink','birth-hardlink','birth-corrupt','directory-mode','directory-symlink','retirement-symlink','retirement-hardlink'])('rejects %s',kind=>{
    const f=admitted();
    if(kind.startsWith('retirement')) f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof);
    if(kind==='birth-mode') fs.chmodSync(f.birthFile,0o644);
    if(kind==='birth-symlink'||kind==='retirement-symlink') {const path=kind==='birth-symlink'?f.birthFile:f.intentFile;fs.renameSync(path,path+'.target');fs.symlinkSync(path+'.target',path);}
    if(kind==='birth-hardlink'||kind==='retirement-hardlink') fs.linkSync(kind==='birth-hardlink'?f.birthFile:f.intentFile,join(f.root,'linked'));
    if(kind==='birth-corrupt') {const bytes=fs.readFileSync(f.birthFile);bytes[100]=bytes[100]!^1;fs.writeFileSync(f.birthFile,bytes);}
    if(kind==='directory-mode') fs.chmodSync(f.directories.birthDirectory,0o750);
    if(kind==='directory-symlink') {fs.renameSync(f.directories.birthDirectory,f.directories.birthDirectory+'.target');fs.symlinkSync(f.directories.birthDirectory+'.target',f.directories.birthDirectory);}
    expect(()=>new TopicRoomLifecycle(f.options).open(roomId,f.birth)).toThrow();
  });
  it.each(['birthDirectory/birth','personalChainDirectory/chain','personalWitnessDirectory/witness','lifecycleChainDirectory/chain','lifecycleWitnessDirectory/witness'])('missing %s closes live access without reinitialization',pair=>{
    const f=admitted(),[key,name]=pair.split('/');const path=join(f.directories[key as keyof RoomStorageDirectories],name!);fs.unlinkSync(path);
    expect(()=>f.manager.assertLive(roomId,f.birth)).toThrow();expect(()=>new TopicRoomLifecycle(f.options).open(roomId,f.birth)).toThrow();expect(fs.existsSync(path)).toBe(false);
  });
  it('fails closed on unknown/stale filesystem locks and cleanup refuses unknown personal files',()=>{
    const f=admitted();fs.writeFileSync(f.roomLock,'',{mode:0o600});fs.utimesSync(f.roomLock,new Date(0),new Date(0));
    expect(()=>f.manager.assertLive(roomId,f.birth)).toThrow('TOPIC_ROOM_BUSY');fs.unlinkSync(f.roomLock);
    f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof);
    const lock=join(f.directories.personalChainDirectory,'lock');fs.writeFileSync(lock,'',{mode:0o600});
    expect(()=>f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('TOPIC_ROOM_CLEANUP_UNKNOWN_FILE');
    expect(fs.existsSync(join(f.directories.personalChainDirectory,'chain'))).toBe(true);fs.unlinkSync(lock);
  });
  it('process metadata floor rejects both-file rollback; trusted newer personal minimum never becomes lower',()=>{
    const f=admitted(),chain=join(f.directories.lifecycleChainDirectory,'chain'),witness=join(f.directories.lifecycleWitnessDirectory,'witness');
    const beforeChain=fs.readFileSync(chain),beforeWitness=fs.readFileSync(witness);
    f.manager.retireMember(roomId,f.birth,owner,request,proof);fs.writeFileSync(chain,beforeChain);fs.writeFileSync(witness,beforeWitness);
    expect(()=>f.manager.assertMember(roomId,f.birth,owner)).toThrow('TOPIC_LEDGER_PROCESS_REGRESSION');
    const g=admitted();expect(()=>g.manager.open(roomId,{...g.birth,minimumSequence:2})).toThrow('TOPIC_ROOM_PERSONAL_REGRESSION');
    expect(()=>g.manager.open(roomId,g.birth)).toThrow('TOPIC_ROOM_PERSONAL_REGRESSION');
  });
  it.each(['after-personal-initialize','after-lifecycle-initialize','after-birth-write','after-birth-sync','after-birth-rename','after-birth-directory-sync'] as TopicRoomPhase[])('injected birth fault %s never acknowledges or auto-reinitializes orphan files',phase=>{
    let armed=true;const f=fixture({phase:p=>{if(armed&&p===phase) throw new Error('injected:'+phase);}});
    expect(()=>f.manager.initializeRoom(roomId,1000,proof)).toThrow('injected:'+phase);armed=false;
    expect(()=>new TopicRoomLifecycle(f.options).initializeRoom(roomId,1000,proof)).toThrow('TOPIC_ROOM_ALREADY_INITIALIZED');
  });
  it.each(['after-retirement-write','after-retirement-sync','after-retirement-rename','after-retirement-directory-sync','after-room-retired'] as TopicRoomPhase[])('injected retirement fault %s never permits early personal cleanup',phase=>{
    let armed=false;const f=admitted({phase:p=>{if(armed&&p===phase) throw new Error('injected:'+phase);}});armed=true;
    expect(()=>f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof)).toThrow('injected:'+phase);armed=false;
    if(phase!=='after-room-retired') expect(()=>f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('TOPIC_ROOM_NOT_DURABLY_RETIRED');
    expect(fs.existsSync(join(f.directories.personalChainDirectory,'chain'))).toBe(true);
    f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof);expect(()=>f.manager.assertLive(roomId,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
  });
  it.each(['after-personal-chain-unlink','after-personal-chain-directory-sync','after-personal-witness-unlink','after-personal-witness-directory-sync'] as TopicRoomPhase[])('partial cleanup fault %s retains authoritative terminal state',phase=>{
    let armed=false;const f=admitted({phase:p=>{if(armed&&p===phase) throw new Error('injected:'+phase);}});
    f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof);armed=true;
    expect(()=>f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('injected:'+phase);armed=false;
    expect(()=>new TopicRoomLifecycle(f.options).open(roomId,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
    expect(f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0}).personalRemoved).toBe(true);
  });
  it.each(['short-write','ENOSPC','fsync','rename'])('injected metadata %s refuses success and leaves personal data untouched',fault=>{
    let armed=false;const controls:TopicRoomControls={write:(fd,bytes)=>{
      if(armed&&fault==='ENOSPC') throw new Error('injected:ENOSPC');return fs.writeSync(fd,armed&&fault==='short-write'?bytes.subarray(0,100):bytes);
    },sync:fd=>{if(armed&&fault==='fsync') throw new Error('injected:fsync');fs.fsyncSync(fd);},rename:(from,to)=>{
      if(armed&&fault==='rename') throw new Error('injected:rename');fs.renameSync(from,to);
    }};
    const f=admitted(controls);armed=true;expect(()=>f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof)).toThrow();armed=false;
    expect(fs.existsSync(join(f.directories.personalChainDirectory,'chain'))).toBe(true);
    expect(()=>f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('TOPIC_ROOM_NOT_DURABLY_RETIRED');
  });
  it.each([1,2,3,4,5,6])('injected retirement metadata fsync call %s refuses success without early unlink',target=>{
    let armed=false,calls=0;const f=admitted({sync:fd=>{if(armed&&++calls===target) throw new Error('injected:sync:'+target);fs.fsyncSync(fd);}});
    armed=true;expect(()=>f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof)).toThrow('injected:sync:'+target);armed=false;
    expect(fs.existsSync(join(f.directories.personalChainDirectory,'chain'))).toBe(true);
    if(target<6) expect(()=>f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('TOPIC_ROOM_NOT_DURABLY_RETIRED');
    if(target>=3) expect(()=>f.manager.assertLive(roomId,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
    f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof);
    expect(()=>f.manager.assertLive(roomId,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
  });
  it.each(['chain','witness'])('injected %s unlink failure retains retirement authority and is retryable',name=>{
    let armed=false;const f=admitted({unlink:path=>{if(armed&&path.endsWith('/'+name)) throw new Error('injected:unlink:'+name);fs.unlinkSync(path);}});
    f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof);armed=true;
    expect(()=>f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('injected:unlink:'+name);armed=false;
    expect(()=>new TopicRoomLifecycle(f.options).open(roomId,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
    expect(f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0}).personalRemoved).toBe(true);
  });
  it.each(['after-personal-initialize','after-lifecycle-initialize','after-birth-write','after-birth-sync','after-birth-rename','after-birth-directory-sync'] as TopicRoomPhase[])('actual SIGKILL birth phase %s leaves an unconfirmed orphan without auto-init',phase=>{
    const f=fixture(),birth:TopicRoomBirth={incarnation:owner,minimumSequence:1,taxonomy_digest:pins.taxonomy,policy_digest:pins.policy};
    const script=childScript({...f,birth},`options.controls={phase:p=>{if(p===${JSON.stringify(phase)}) process.kill(process.pid,'SIGKILL');}};
      new TopicRoomLifecycle(options).initializeRoom(roomId,1000,proof);process.exit(99);`);
    const result=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8',timeout:10000});
    expect(result.error).toBeUndefined();expect(result.signal,result.stderr).toBe('SIGKILL');expect(fs.existsSync(f.roomLock)).toBe(true);
    expect(()=>new TopicRoomLifecycle(f.options).open(roomId,birth)).toThrow('TOPIC_ROOM_BUSY');fs.unlinkSync(f.roomLock); // known terminated disposable child
    expect(()=>new TopicRoomLifecycle(f.options).initializeRoom(roomId,1000,proof)).toThrow('TOPIC_ROOM_ALREADY_INITIALIZED');
    // There is no committed PG marker in this component test. A made-up marker is never accepted.
    expect(()=>new TopicRoomLifecycle(f.options).open(roomId,birth)).toThrow();
  });
  it.each(['after-retirement-write','after-retirement-sync','after-retirement-rename','after-retirement-directory-sync','after-room-retired'] as TopicRoomPhase[])('actual SIGKILL retirement phase %s preserves stale lock and terminal ordering',phase=>{
    const f=admitted(),script=childScript(f,`options.controls={phase:p=>{if(p===${JSON.stringify(phase)}) process.kill(process.pid,'SIGKILL');}};
      new TopicRoomLifecycle(options).retireRoom(roomId,birth,{operationId:${JSON.stringify(request)},retiredAt:9000},proof);process.exit(99);`);
    const result=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8',timeout:10000});
    expect(result.error).toBeUndefined();expect(result.signal,result.stderr).toBe('SIGKILL');expect(fs.existsSync(f.roomLock)).toBe(true);
    expect(()=>new TopicRoomLifecycle(f.options).open(roomId,f.birth)).toThrow('TOPIC_ROOM_BUSY');fs.unlinkSync(f.roomLock); // known terminated disposable child only
    if(['after-retirement-rename','after-retirement-directory-sync','after-room-retired'].includes(phase)) expect(()=>new TopicRoomLifecycle(f.options).open(roomId,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
    if(phase!=='after-room-retired') expect(()=>f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('TOPIC_ROOM_NOT_DURABLY_RETIRED');
    f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof);expect(()=>f.manager.open(roomId,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
  });
  it.each(['after-personal-chain-unlink','after-personal-chain-directory-sync','after-personal-witness-unlink','after-personal-witness-directory-sync'] as TopicRoomPhase[])('actual SIGKILL cleanup phase %s never resurrects held personal state',phase=>{
    const f=admitted();f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof);
    const script=childScript(f,`options.controls={phase:p=>{if(p===${JSON.stringify(phase)}) process.kill(process.pid,'SIGKILL');}};
      new TopicRoomLifecycle(options).cleanupPersonal(roomId,birth,{...proof,minimumTerminalAgeMs:0});process.exit(99);`);
    const result=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8',timeout:10000});expect(result.signal,result.stderr).toBe('SIGKILL');
    expect(()=>f.manager.assertLive(roomId,f.birth)).toThrow('TOPIC_ROOM_BUSY');fs.unlinkSync(f.roomLock);
    expect(()=>new TopicRoomLifecycle(f.options).open(roomId,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
    expect(f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0}).personalRemoved).toBe(true);
  });
});
describe.skipIf(process.platform==='linux')('lifecycle unsupported host',()=>{
  it('explicitly refuses Windows durability claims',()=>expect(()=>new TopicRoomLifecycle({directories:()=>({} as RoomStorageDirectories),keys,pins,now:()=>0})).toThrow('TOPIC_ROOM_PLATFORM_UNSUPPORTED'));
});
function terminalPath(f:ReturnType<typeof initialized>) {return join(f.directories.birthDirectory,'terminal');}
function closedPersonalRemoved(controls:TopicRoomControls={}) {
  const f=admitted(controls);f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof);
  f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0});return f;
}
function decodeTerminal(f:ReturnType<typeof initialized>) {
  const outer=JSON.parse(fs.readFileSync(terminalPath(f),'utf8'));
  return keys.decrypt<Record<string,unknown>>(outer.cipher,'venus:topic-room-lifecycle:v1:terminal');
}
function replaceTerminal(f:ReturnType<typeof initialized>,change:(value:Record<string,unknown>)=>void) {
  const value=decodeTerminal(f);change(value);const cipher=keys.encrypt(value,'venus:topic-room-lifecycle:v1:terminal'),unsigned={schema:1,cipher};
  const bytes=Buffer.from(canonical({...unsigned,mac:keys.fingerprint({domain:'venus:topic-room-lifecycle:v1:terminal:mac',value:unsigned})}));
  const frame=Buffer.alloc(24576,32);bytes.copy(frame);frame[24575]=10;fs.writeFileSync(terminalPath(f),frame);
}
describe.skipIf(process.platform!=='linux')('inactive authenticated recovery and member-metadata cleanup',()=>{
  it('returns frozen minimal authenticated status with original intent; live classification is not readiness',()=>{
    const f=admitted();expect(f.manager.retirementStatus(roomId,f.birth)).toEqual({state:'live'});
    let armed=true;f.options.controls!.phase=phase=>{if(armed&&phase==='after-retirement-directory-sync') throw new Error('intent-only');};
    expect(()=>f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof)).toThrow('intent-only');armed=false;
    const fresh=new TopicRoomLifecycle(f.options),status=fresh.retirementStatus(roomId,f.birth);
    expect(status).toEqual({state:'retiring',retiredAt:9000,operationId:request});expect(Object.isFrozen(status)).toBe(true);
    if(status.state!=='live') fresh.retireRoom(roomId,f.birth,{operationId:status.operationId,retiredAt:status.retiredAt},proof);
    expect(fresh.retirementStatus(roomId,f.birth)).toEqual({state:'retired',retiredAt:9000,operationId:request});
  });
  it.each(['after-retirement-directory-sync','after-room-retired'] as TopicRoomPhase[])('actual crash %s -> fresh authenticated status -> exact retry -> complete cleanup',phase=>{
    const f=admitted(),script=childScript(f,`options.controls={phase:p=>{if(p===${JSON.stringify(phase)}) process.kill(process.pid,'SIGKILL');}};
      new TopicRoomLifecycle(options).retireRoom(roomId,birth,{operationId:${JSON.stringify(request)},retiredAt:9000},proof);process.exit(99);`);
    const killed=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8',timeout:10000});expect(killed.signal,killed.stderr).toBe('SIGKILL');
    expect(()=>new TopicRoomLifecycle(f.options).retirementStatus(roomId,f.birth)).toThrow('TOPIC_ROOM_BUSY');fs.unlinkSync(f.roomLock);
    const fresh=new TopicRoomLifecycle(f.options),status=fresh.retirementStatus(roomId,f.birth);expect(status.state).toBe(phase==='after-room-retired'?'retired':'retiring');
    expect(status.state).not.toBe('live');if(status.state==='live') throw new Error('expected durable intent');
    fresh.retireRoom(roomId,f.birth,{operationId:status.operationId,retiredAt:status.retiredAt},proof);
    fresh.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0});fresh.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0});
    expect(new TopicRoomLifecycle(f.options).retirementStatus(roomId,f.birth)).toEqual({state:'retired',retiredAt:9000,operationId:request});
  });
  it('deletes member-containing files only after room-only authority; old held fd grants no live permission',()=>{
    const f=admitted(),wrapped=f.manager.open(roomId,f.birth);f.manager.admitMember(roomId,f.birth,other,third,proof);
    f.manager.retireMember(roomId,f.birth,other,request,proof);f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof);
    f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0});
    const fd=fs.openSync(join(f.directories.lifecycleChainDirectory,'chain'),'r');
    try {
      expect(f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toMatchObject({memberMetadataRemoved:true,retiredAt:9000});
      expect(fs.readdirSync(f.directories.lifecycleChainDirectory)).toEqual([]);expect(fs.readdirSync(f.directories.lifecycleWitnessDirectory)).toEqual([]);expect(fs.fstatSync(fd).nlink).toBe(0);
      expect(fs.readdirSync(f.directories.birthDirectory).sort()).toEqual(['birth','retirement','terminal']);
      const terminal=decodeTerminal(f),text=JSON.stringify(terminal);
      for(const hidden of [owner,other,'member_admitted','member_retired','food','music','ownerId','topics','history']) expect(text).not.toContain(hidden);
      expect(terminal).toMatchObject({schema:1,protocol:2,roomId,personalIncarnation:f.birth.incarnation,retiredAt:9000,operationId:request,taxonomy:pins.taxonomy,policy:pins.policy});
      expect(fs.statSync(terminalPath(f)).size).toBe(24576);expect(fs.statSync(terminalPath(f)).mode&0o7777).toBe(0o600);
      expect(()=>wrapped.read({roomId,ownerId:owner})).toThrow('TOPIC_ROOM_RETIRED');expect(()=>new TopicRoomLifecycle(f.options).open(roomId,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
      expect(f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0}).memberMetadataRemoved).toBe(true);
      expect(new TopicRoomLifecycle(f.options).cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0}).personalRemoved).toBe(true);
    } finally {fs.closeSync(fd);}
  });
  it('status and exact retirement replay work after both lifecycle files are absent, including old keys',()=>{
    const f=closedPersonalRemoved();f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0});
    const fresh=new TopicRoomLifecycle({...f.options,keys:new Keyring('v2',secrets)}),status=fresh.retirementStatus(roomId,f.birth);
    expect(status).toEqual({state:'retired',retiredAt:9000,operationId:request});
    if(status.state==='live') throw new Error('expected terminal');expect(fresh.retireRoom(roomId,f.birth,{operationId:status.operationId,retiredAt:status.retiredAt},proof).retired).toBe(true);
    expect(()=>new TopicRoomLifecycle({...f.options,keys:new Keyring('v2',{v2:secrets.v2})}).retirementStatus(roomId,f.birth)).toThrow();
  });
  it('boolean/time or intent alone cannot authorize metadata unlink, and both personal files must be absent',()=>{
    const f=admitted();fs.unlinkSync(join(f.directories.personalChainDirectory,'chain'));fs.unlinkSync(join(f.directories.personalWitnessDirectory,'witness'));
    expect(()=>f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('TOPIC_ROOM_NOT_DURABLY_RETIRED');expect(fs.existsSync(terminalPath(f))).toBe(false);
    const g=admitted();g.manager.retireRoom(roomId,g.birth,{operationId:request,retiredAt:9000},proof);
    fs.unlinkSync(join(g.directories.personalChainDirectory,'chain'));
    expect(()=>g.manager.cleanupRetiredMetadata(roomId,g.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('TOPIC_ROOM_PERSONAL_FILES_REMAIN');expect(fs.existsSync(terminalPath(g))).toBe(false);
    expect(fs.existsSync(join(g.directories.lifecycleChainDirectory,'chain'))).toBe(true);
  });
  it('metadata cleanup checks authenticated terminal age and process clock before publication/unlink',()=>{
    const f=closedPersonalRemoved();
    expect(()=>f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:2000})).toThrow('TOPIC_ROOM_CLEANUP_TOO_EARLY');
    expect(fs.existsSync(terminalPath(f))).toBe(false);f.setClock(9999);
    expect(()=>f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('TOPIC_ROOM_CLOCK_REGRESSION');
    expect(fs.existsSync(join(f.directories.lifecycleChainDirectory,'chain'))).toBe(true);f.setClock(11000);
    expect(f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:2000}).memberMetadataRemoved).toBe(true);
  });
  it.each(['chain','witness'])('published terminal rejects changed remaining %s before deleting either file',name=>{
    let armed=false;const f=closedPersonalRemoved({phase:p=>{if(armed&&p==='after-terminal-directory-sync') throw new Error('published');}});armed=true;
    expect(()=>f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('published');armed=false;
    const directory=name==='chain'?f.directories.lifecycleChainDirectory:f.directories.lifecycleWitnessDirectory,path=join(directory,name),before=fs.readFileSync(path),changed=Buffer.from(before);changed[100]=changed[100]!^1;fs.writeFileSync(path,changed);
    const fresh=new TopicRoomLifecycle(f.options);expect(fresh.retirementStatus(roomId,f.birth).state).toBe('retired');
    expect(()=>fresh.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('TOPIC_ROOM_TERMINAL_FILE_MISMATCH');
    expect(fs.existsSync(join(f.directories.lifecycleChainDirectory,'chain'))).toBe(true);expect(fs.existsSync(join(f.directories.lifecycleWitnessDirectory,'witness'))).toBe(true);
    fs.writeFileSync(path,before);expect(fresh.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0}).memberMetadataRemoved).toBe(true);
  });
  it.each(['unknown','lock','symlink','hardlink','mode'])('metadata cleanup rejects %s files before terminal publication or first unlink',kind=>{
    const f=closedPersonalRemoved(),path=join(f.directories.lifecycleWitnessDirectory,'witness');
    if(kind==='unknown'||kind==='lock') fs.writeFileSync(join(f.directories.lifecycleWitnessDirectory,kind==='lock'?'lock':'foreign'),'x',{mode:0o600});
    if(kind==='symlink') {fs.renameSync(path,path+'.target');fs.symlinkSync(path+'.target',path);}
    if(kind==='hardlink') fs.linkSync(path,join(f.root,'linked'));
    if(kind==='mode') fs.chmodSync(path,0o644);
    expect(()=>f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow();
    expect(fs.existsSync(terminalPath(f))).toBe(false);expect(fs.existsSync(join(f.directories.lifecycleChainDirectory,'chain'))).toBe(true);
  });
  it.each(['missing','corrupt','short','symlink','hardlink','mode','retiredAt','pins','size','extra-member-field'])('terminal %s is never a permissive fallback',kind=>{
    const f=closedPersonalRemoved();f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0});const path=terminalPath(f);
    if(kind==='missing') fs.unlinkSync(path);
    if(kind==='corrupt') {const bytes=fs.readFileSync(path);bytes[100]=bytes[100]!^1;fs.writeFileSync(path,bytes);}
    if(kind==='short') fs.truncateSync(path,100);
    if(kind==='symlink') {fs.renameSync(path,path+'.target');fs.symlinkSync(path+'.target',path);}
    if(kind==='hardlink') fs.linkSync(path,join(f.root,'linked'));
    if(kind==='mode') fs.chmodSync(path,0o644);
    if(kind==='retiredAt') replaceTerminal(f,v=>{v.retiredAt=9001;});
    if(kind==='pins') replaceTerminal(f,v=>{v.policy='c'.repeat(64);});
    if(kind==='size') replaceTerminal(f,v=>{v.lifecycleChain={bytes:1,sha256:'a'.repeat(64)};});
    if(kind==='extra-member-field') replaceTerminal(f,v=>{v.memberId=owner;});
    expect(()=>f.manager.assertLive(roomId,f.birth)).toThrow();expect(()=>new TopicRoomLifecycle(f.options).retirementStatus(roomId,f.birth)).toThrow();
    expect(()=>f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow();
  });
  it('observed immutable terminal/intent change or disappearance denies retained manager',()=>{
    const f=closedPersonalRemoved();f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0});
    expect(f.manager.retirementStatus(roomId,f.birth).state).toBe('retired');replaceTerminal(f,()=>{}); // same semantic body, different nonce is still an immutable-file change
    expect(()=>f.manager.retirementStatus(roomId,f.birth)).toThrow('TOPIC_ROOM_TERMINAL_CHANGED');
    const g=closedPersonalRemoved();g.manager.cleanupRetiredMetadata(roomId,g.birth,{...proof,minimumTerminalAgeMs:0});fs.unlinkSync(g.intentFile);
    expect(()=>g.manager.retirementStatus(roomId,g.birth)).toThrow('TOPIC_ROOM_RETIREMENT_REGRESSION');expect(()=>new TopicRoomLifecycle(g.options).retirementStatus(roomId,g.birth)).toThrow();
    expect(()=>new TopicRoomLifecycle(g.options).retireRoom(roomId,g.birth,{operationId:third,retiredAt:10000},proof)).toThrow('TOPIC_ROOM_TERMINAL_INTENT_MISSING');
    expect(fs.existsSync(g.intentFile)).toBe(false);
  });
  it('missing intent before terminal publication cannot be replaced by a guessed new close time',()=>{
    const f=admitted();f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof);fs.unlinkSync(f.intentFile);
    expect(()=>new TopicRoomLifecycle(f.options).retireRoom(roomId,f.birth,{operationId:third,retiredAt:10000},proof)).toThrow('TOPIC_ROOM_TERMINAL_INTENT_MISSING');
    expect(fs.existsSync(f.intentFile)).toBe(false);
  });
  it('protected room-only terminal dominates restored old live metadata but refuses to delete mismatched files',()=>{
    const f=admitted(),chain=join(f.directories.lifecycleChainDirectory,'chain'),witness=join(f.directories.lifecycleWitnessDirectory,'witness');
    const liveChain=fs.readFileSync(chain),liveWitness=fs.readFileSync(witness);
    f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof);f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0});
    const finalChain=fs.readFileSync(chain),finalWitness=fs.readFileSync(witness);f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0});
    fs.writeFileSync(chain,liveChain,{mode:0o600});fs.writeFileSync(witness,liveWitness,{mode:0o600});
    const fresh=new TopicRoomLifecycle(f.options);expect(fresh.retirementStatus(roomId,f.birth).state).toBe('retired');expect(()=>fresh.open(roomId,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
    expect(()=>fresh.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('TOPIC_ROOM_TERMINAL_FILE_MISMATCH');
    fs.writeFileSync(chain,finalChain);fs.writeFileSync(witness,finalWitness);expect(fresh.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0}).memberMetadataRemoved).toBe(true);
  });
  it.each(['after-terminal-write','after-terminal-sync','after-terminal-rename','after-terminal-directory-sync','after-lifecycle-chain-unlink','after-lifecycle-chain-directory-sync','after-lifecycle-witness-unlink','after-lifecycle-witness-directory-sync'] as TopicRoomPhase[])('injected %s preserves authority and fresh-manager cleanup retry',phase=>{
    let armed=false;const f=closedPersonalRemoved({phase:p=>{if(armed&&p===phase) throw new Error('injected:'+phase);}});armed=true;
    expect(()=>f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('injected:'+phase);armed=false;
    const fresh=new TopicRoomLifecycle(f.options);expect(fresh.retirementStatus(roomId,f.birth)).toEqual({state:'retired',retiredAt:9000,operationId:request});
    expect(fresh.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0}).memberMetadataRemoved).toBe(true);expect(fs.readdirSync(f.directories.lifecycleChainDirectory)).toEqual([]);
  });
  it.each([1,2,3,4,5,6,7,8])('terminal/unlink fsync call %s fault never acknowledges and recovery remains closed',target=>{
    let armed=false,count=0;const f=closedPersonalRemoved({sync:fd=>{if(armed&&++count===target) throw new Error('injected:sync:'+target);fs.fsyncSync(fd);}});armed=true;
    expect(()=>f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow('injected:sync:'+target);armed=false;
    const fresh=new TopicRoomLifecycle(f.options);expect(fresh.retirementStatus(roomId,f.birth).state).toBe('retired');
    expect(fresh.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0}).memberMetadataRemoved).toBe(true);
  });
  it.each(['short-write','ENOSPC','rename','chain-unlink','witness-unlink'])('explicit injected terminal %s never manufactures successful cleanup',fault=>{
    let armed=false;const f=closedPersonalRemoved({write:(fd,bytes)=>{if(armed&&fault==='ENOSPC') throw new Error('injected:ENOSPC');return fs.writeSync(fd,armed&&fault==='short-write'?bytes.subarray(0,100):bytes);},
      rename:(from,to)=>{if(armed&&fault==='rename') throw new Error('injected:rename');fs.renameSync(from,to);},unlink:path=>{if(armed&&((fault==='chain-unlink'&&path.endsWith('/chain'))||(fault==='witness-unlink'&&path.endsWith('/witness')))) throw new Error('injected:unlink');fs.unlinkSync(path);}});armed=true;
    expect(()=>f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow();armed=false;
    expect(new TopicRoomLifecycle(f.options).cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0}).memberMetadataRemoved).toBe(true);
  });
  it.each(['after-terminal-write','after-terminal-sync','after-terminal-rename','after-terminal-directory-sync','after-lifecycle-chain-unlink','after-lifecycle-chain-directory-sync','after-lifecycle-witness-unlink','after-lifecycle-witness-directory-sync'] as TopicRoomPhase[])('actual SIGKILL %s -> fresh status/retry without missing-ledger parsing',phase=>{
    const f=closedPersonalRemoved(),script=childScript(f,`options.controls={phase:p=>{if(p===${JSON.stringify(phase)}) process.kill(process.pid,'SIGKILL');}};
      new TopicRoomLifecycle(options).cleanupRetiredMetadata(roomId,birth,{...proof,minimumTerminalAgeMs:0});process.exit(99);`);
    const killed=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8',timeout:10000});expect(killed.signal,killed.stderr).toBe('SIGKILL');
    expect(()=>new TopicRoomLifecycle(f.options).retirementStatus(roomId,f.birth)).toThrow('TOPIC_ROOM_BUSY');fs.unlinkSync(f.roomLock);
    const fresh=new TopicRoomLifecycle(f.options);expect(fresh.retirementStatus(roomId,f.birth)).toEqual({state:'retired',retiredAt:9000,operationId:request});
    expect(fresh.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0}).memberMetadataRemoved).toBe(true);
    expect(fs.readdirSync(f.directories.lifecycleChainDirectory)).toEqual([]);expect(fs.readdirSync(f.directories.lifecycleWitnessDirectory)).toEqual([]);
    expect(()=>fresh.open(roomId,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
  });
});
describe.skipIf(process.platform!=='linux')('metadata-only authority for authenticated safety operations',()=>{
  it.each(['missing-chain','missing-witness','corrupt-chain','corrupt-witness','unsafe-chain','missing-personal-directories','unsafe-personal-directories'])('healthy metadata authority survives %s while every private-content fence still denies',fault=>{
      const f=admitted(),wrapped=f.manager.open(roomId,f.birth),chain=join(f.directories.personalChainDirectory,'chain'),witness=join(f.directories.personalWitnessDirectory,'witness');
      if(fault==='missing-chain') fs.unlinkSync(chain);
      if(fault==='missing-witness') fs.unlinkSync(witness);
      if(fault==='corrupt-chain'||fault==='corrupt-witness') {const path=fault==='corrupt-chain'?chain:witness,bytes=fs.readFileSync(path);bytes[100]=bytes[100]!^1;fs.writeFileSync(path,bytes);}
      if(fault==='unsafe-chain') fs.chmodSync(chain,0o644);
      if(fault==='missing-personal-directories') for(const key of ['personalChainDirectory','personalWitnessDirectory'] as const) fs.renameSync(f.directories[key],f.directories[key]+'.detached');
      if(fault==='unsafe-personal-directories') for(const key of ['personalChainDirectory','personalWitnessDirectory'] as const) fs.chmodSync(f.directories[key],0o750);
      expect(f.manager.assertRoomAuthority(roomId,f.birth)).toBeUndefined();expect(f.manager.assertMemberAuthority(roomId,f.birth,owner)).toBeUndefined();
      const fresh=new TopicRoomLifecycle(f.options);expect(fresh.assertRoomAuthority(roomId,f.birth)).toBeUndefined();expect(fresh.assertMemberAuthority(roomId,f.birth,owner)).toBeUndefined();
      expect(()=>f.manager.assertLive(roomId,f.birth)).toThrow();expect(()=>f.manager.assertMember(roomId,f.birth,owner)).toThrow();expect(()=>fresh.open(roomId,f.birth)).toThrow();
      expect(()=>wrapped.read({roomId,ownerId:owner})).toThrow();expect(()=>wrapped.narrow({roomId,ownerId:owner,operationId:third,expectedRevision:0,exclude:['music']})).toThrow();
      expect(fresh.retirementStatus(roomId,f.birth)).toEqual({state:'live'});
      expect(fresh.retireMember(roomId,f.birth,owner,request,proof).denied).toBe(true);
      expect(()=>fresh.assertMemberAuthority(roomId,f.birth,owner)).toThrow('TOPIC_ROOM_MEMBER_RETIRED');expect(fresh.assertRoomAuthority(roomId,f.birth)).toBeUndefined();
      expect(fresh.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof).retired).toBe(true);
      expect(new TopicRoomLifecycle(f.options).retirementStatus(roomId,f.birth)).toEqual({state:'retired',retiredAt:9000,operationId:request});
      expect(()=>fresh.assertRoomAuthority(roomId,f.birth)).toThrow('TOPIC_ROOM_RETIRED');
      if(fault.includes('directories')) expect(()=>fresh.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0})).toThrow();
    });
  it('personal process/required-floor rollback stays closed for content but never blocks healthy metadata withdrawal',()=>{
    const f=admitted(),wrapped=f.manager.open(roomId,f.birth),chain=join(f.directories.personalChainDirectory,'chain'),witness=join(f.directories.personalWitnessDirectory,'witness');
    const oldChain=fs.readFileSync(chain),oldWitness=fs.readFileSync(witness);wrapped.narrow({roomId,ownerId:owner,operationId:request,expectedRevision:0,exclude:['music']});
    fs.writeFileSync(chain,oldChain);fs.writeFileSync(witness,oldWitness);
    expect(f.manager.assertMemberAuthority(roomId,f.birth,owner)).toBeUndefined();expect(()=>f.manager.assertLive(roomId,f.birth)).toThrow('TOPIC_LEDGER_PROCESS_REGRESSION');
    const fresh=new TopicRoomLifecycle(f.options),newerBirth={...f.birth,minimumSequence:2};
    expect(fresh.assertMemberAuthority(roomId,newerBirth,owner)).toBeUndefined();expect(()=>fresh.open(roomId,newerBirth)).toThrow('TOPIC_LEDGER_REQUIRED_REGRESSION');
    expect(fresh.retireMember(roomId,newerBirth,owner,request,proof).denied).toBe(true);
  });
  it('unavailable personal key does not become a metadata key bypass or a grant of content',()=>{
    const f=admitted(),personal=PrivateTopicLedger.open({chainDirectory:f.directories.personalChainDirectory,witnessDirectory:f.directories.personalWitnessDirectory,
      keys:new Keyring('v2',secrets),pins},{incarnation:f.birth.incarnation,minimumSequence:1});
    personal.narrow({roomId,ownerId:owner,operationId:request,expectedRevision:0,exclude:['music']});
    const fresh=new TopicRoomLifecycle({...f.options,keys:new Keyring('v1',{v1:secrets.v1})});
    expect(fresh.assertRoomAuthority(roomId,f.birth)).toBeUndefined();expect(fresh.assertMemberAuthority(roomId,f.birth,owner)).toBeUndefined();
    let denied:unknown;try {fresh.open(roomId,f.birth);} catch(error) {denied=error;}
    expect(denied).toMatchObject({code:'KEY_VERSION_UNAVAILABLE'});expect(fresh.retireMember(roomId,f.birth,owner,request,proof).denied).toBe(true);
  });
  it.each(['missing-chain','missing-witness','corrupt-chain','corrupt-witness','unsafe-chain','unsafe-lifecycle-directory','missing-birth'])('unhealthy authority %s denies both new guards and all metadata mutation/recovery',fault=>{
    const f=admitted(),chain=join(f.directories.lifecycleChainDirectory,'chain'),witness=join(f.directories.lifecycleWitnessDirectory,'witness');
    if(fault==='missing-chain') fs.unlinkSync(chain);
    if(fault==='missing-witness') fs.unlinkSync(witness);
    if(fault==='corrupt-chain'||fault==='corrupt-witness') {const path=fault==='corrupt-chain'?chain:witness,bytes=fs.readFileSync(path);bytes[100]=bytes[100]!^1;fs.writeFileSync(path,bytes);}
    if(fault==='unsafe-chain') fs.chmodSync(chain,0o644);
    if(fault==='unsafe-lifecycle-directory') fs.chmodSync(f.directories.lifecycleChainDirectory,0o750);
    if(fault==='missing-birth') fs.unlinkSync(f.birthFile);
    for(const manager of [f.manager,new TopicRoomLifecycle(f.options)]) {
      expect(()=>manager.assertRoomAuthority(roomId,f.birth)).toThrow();expect(()=>manager.assertMemberAuthority(roomId,f.birth,owner)).toThrow();
      expect(()=>manager.retirementStatus(roomId,f.birth)).toThrow();expect(()=>manager.retireMember(roomId,f.birth,owner,request,proof)).toThrow();
      expect(()=>manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof)).toThrow();
    }
  });
  it('lifecycle process-floor rewind remains authoritative even if personal state is healthy',()=>{
    const f=admitted(),chain=join(f.directories.lifecycleChainDirectory,'chain'),witness=join(f.directories.lifecycleWitnessDirectory,'witness'),oldChain=fs.readFileSync(chain),oldWitness=fs.readFileSync(witness);
    f.manager.retireMember(roomId,f.birth,owner,request,proof);fs.writeFileSync(chain,oldChain);fs.writeFileSync(witness,oldWitness);
    expect(()=>f.manager.assertRoomAuthority(roomId,f.birth)).toThrow('TOPIC_LEDGER_PROCESS_REGRESSION');expect(()=>f.manager.assertMemberAuthority(roomId,f.birth,owner)).toThrow('TOPIC_LEDGER_PROCESS_REGRESSION');
  });
  it('new authority methods preserve exact birth/member/reserved-owner/room binding',()=>{
    const f=admitted();
    for(const birth of [{...f.birth,incarnation:other},{...f.birth,policy_digest:'c'.repeat(64)},{...f.birth,taxonomy_digest:'d'.repeat(64)}]) {
      expect(()=>f.manager.assertRoomAuthority(roomId,birth)).toThrow('TOPIC_ROOM_BIRTH_MISMATCH');expect(()=>f.manager.assertMemberAuthority(roomId,birth,owner)).toThrow('TOPIC_ROOM_BIRTH_MISMATCH');
    }
    expect(()=>f.manager.assertMemberAuthority(roomId,f.birth,other)).toThrow('TOPIC_ROOM_MEMBER_NOT_ADMITTED');
    expect(()=>f.manager.assertMemberAuthority(roomId,f.birth,f.birth.incarnation)).toThrow('TOPIC_ROOM_RESERVED_OWNER');expect(()=>f.manager.assertMemberAuthority(roomId,f.birth,'bad')).toThrow('TOPIC_ROOM_SCOPE');
    expect(()=>f.manager.assertRoomAuthority('bad',f.birth)).toThrow('TOPIC_ROOM_SCOPE');
    f.manager.retireMember(roomId,f.birth,owner,request,proof);expect(f.manager.assertRoomAuthority(roomId,f.birth)).toBeUndefined();expect(()=>f.manager.assertMemberAuthority(roomId,f.birth,owner)).toThrow('TOPIC_ROOM_MEMBER_RETIRED');
  });
  it.each(['retiring','retired','terminal'])('room %s denies metadata authority even when files are otherwise healthy',kind=>{
    let armed=kind==='retiring';const f=admitted({phase:p=>{if(armed&&p==='after-retirement-directory-sync') throw new Error('intent-only');}});
    if(kind==='retiring') {expect(()=>f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof)).toThrow('intent-only');armed=false;}
    else f.manager.retireRoom(roomId,f.birth,{operationId:request,retiredAt:9000},proof);
    if(kind==='terminal') {f.manager.cleanupPersonal(roomId,f.birth,{...proof,minimumTerminalAgeMs:0});f.manager.cleanupRetiredMetadata(roomId,f.birth,{...proof,minimumTerminalAgeMs:0});}
    for(const manager of [f.manager,new TopicRoomLifecycle(f.options)]) {
      expect(()=>manager.assertRoomAuthority(roomId,f.birth)).toThrow('TOPIC_ROOM_RETIRED');expect(()=>manager.assertMemberAuthority(roomId,f.birth,owner)).toThrow('TOPIC_ROOM_RETIRED');
    }
  });
});
describe.skipIf(process.platform!=='linux')('directory resolver metadata selection forwarding',()=>{
  it.each(['missing','unsafe','symlink'])('directory resolver receives metadataOnly before validating a %s personal parent',fault=>{
    const f=fixture(),parent=join(f.root,'personal-parent');fs.mkdirSync(parent,0o700);
    for(const key of ['personalChainDirectory','personalWitnessDirectory'] as const) {
      const next=join(parent,key);fs.renameSync(f.directories[key],next);f.directories[key]=next;
    }
    const modes:boolean[]=[];
    // This deliberate parent validation models the DirectoryStore selection
    // boundary. This component test does not import that separately owned store.
    f.options.directories=(id,metadataOnly=false)=>{
      expect(id).toBe(roomId);modes.push(metadataOnly);
      if(!metadataOnly) {
        let stat:fs.Stats;try {stat=fs.lstatSync(parent);} catch {throw new Error('PERSONAL_ROOT_UNAVAILABLE');}
        if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o7777)!==0o700||stat.uid!==process.getuid!()) throw new Error('PERSONAL_ROOT_UNAVAILABLE');
      }
      return f.directories;
    };
    const birth=f.manager.initializeRoom(roomId,1000,proof);f.manager.admitMember(roomId,birth,owner,request,proof);const wrapped=f.manager.open(roomId,birth);
    if(fault==='unsafe') fs.chmodSync(parent,0o750);
    else {fs.renameSync(parent,parent+'.detached');if(fault==='symlink') fs.symlinkSync(parent+'.detached',parent);}
    const check=(mode:boolean,action:()=>unknown,denied=false)=>{
      const before=modes.length;if(denied) expect(action).toThrow('PERSONAL_ROOT_UNAVAILABLE');else expect(action).not.toThrow();
      expect(modes.slice(before)).toEqual([mode]);
    };
    check(true,()=>f.manager.assertRoomAuthority(roomId,birth));check(true,()=>f.manager.assertMemberAuthority(roomId,birth,owner));
    check(true,()=>f.manager.retirementStatus(roomId,birth));
    check(false,()=>f.manager.open(roomId,birth),true);check(false,()=>f.manager.assertLive(roomId,birth),true);check(false,()=>f.manager.assertMember(roomId,birth,owner),true);
    check(false,()=>f.manager.admitMember(roomId,birth,other,third,proof),true);check(false,()=>wrapped.read({roomId,ownerId:owner}),true);
    check(false,()=>wrapped.narrow({roomId,ownerId:owner,operationId:third,expectedRevision:0,exclude:['music']}),true);
    check(true,()=>f.manager.retireMember(roomId,birth,owner,request,proof));check(true,()=>f.manager.retireRoom(roomId,birth,{operationId:request,retiredAt:9000},proof));
    check(true,()=>f.manager.retirementStatus(roomId,birth));expect(f.manager.retirementStatus(roomId,birth).state).toBe('retired');
    check(false,()=>f.manager.cleanupPersonal(roomId,birth,{...proof,minimumTerminalAgeMs:0}),true);
  });
});
