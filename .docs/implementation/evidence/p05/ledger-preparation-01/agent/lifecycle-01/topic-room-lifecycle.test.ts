import {describe,it,expect,afterEach} from 'vitest';
import * as fs from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
import {Keyring} from './security.js';
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
