import {it,expect,afterEach} from 'vitest';
import * as fs from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
import {Keyring,canonical} from './security.js';
import {TopicRoomLifecycle,type RoomStorageDirectories,type TopicRoomControls} from './topic-room-lifecycle.js';
const secret=Buffer.alloc(32,71).toString('base64'),keys=new Keyring('review',{review:secret});
const pins={taxonomy:'a'.repeat(64),policy:'b'.repeat(64),vocabulary:['personal_alpha','personal_beta']};
const room='11000000-0000-4000-8000-000000000001';
const member=(n:number)=>`22000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const op=(n:number)=>`33000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const proof={roomTransactionLockHeld:true as const},cleanup={...proof,minimumTerminalAgeMs:0},roots:string[]=[];
afterEach(()=>{for(const root of roots.splice(0)){expect(dirname(resolve(root))).toBe('/state');fs.rmSync(root,{recursive:true,force:true});}});
function fixture(controls:TopicRoomControls={}){
  const root=fs.mkdtempSync('/state/review2-');roots.push(root);
  const names=['birthDirectory','personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory'] as const;
  const directories=Object.fromEntries(names.map(n=>{const p=join(root,n);fs.mkdirSync(p,0o700);return[n,p];})) as unknown as RoomStorageDirectories;
  let now=100000;const options={keys,pins,directories:()=>directories,now:()=>now,memberLimit:4,controls};
  const manager=new TopicRoomLifecycle(options),birth=manager.initializeRoom(room,1000,proof);
  manager.admitMember(room,birth,member(1),op(1),proof);manager.admitMember(room,birth,member(2),op(2),proof);
  const wrapper=manager.open(room,birth);wrapper.narrow({roomId:room,ownerId:member(1),operationId:op(3),expectedRevision:0,exclude:['personal_alpha']});
  return {root,directories,options,manager,birth,wrapper,setClock:(v:number)=>{now=v;},intent:join(directories.birthDirectory,'retirement'),terminal:join(directories.birthDirectory,'terminal'),lock:join(directories.birthDirectory,'room.lock'),chain:join(directories.lifecycleChainDirectory,'chain'),witness:join(directories.lifecycleWitnessDirectory,'witness')};
}
type F=ReturnType<typeof fixture>;
function retire(f:F){return f.manager.retireRoom(room,f.birth,{operationId:op(40),retiredAt:80000},proof);}
function ready(controls:TopicRoomControls={}){const f=fixture(controls);retire(f);f.manager.cleanupPersonal(room,f.birth,cleanup);return f;}
function clean(f:F){return f.manager.cleanupRetiredMetadata(room,f.birth,cleanup);}
function decode(path:string,kind:string){return keys.decrypt<Record<string,unknown>>(JSON.parse(fs.readFileSync(path,'utf8')).cipher,'venus:topic-room-lifecycle:v1:'+kind);}
function encode(path:string,kind:string,value:unknown){const cipher=keys.encrypt(value,'venus:topic-room-lifecycle:v1:'+kind),unsigned={schema:1,cipher};const b=Buffer.from(canonical({...unsigned,mac:keys.fingerprint({domain:'venus:topic-room-lifecycle:v1:'+kind+':mac',value:unsigned})}));const frame=Buffer.alloc(24576,32);b.copy(frame);frame[24575]=10;fs.writeFileSync(path,frame);}
function allDenied(f:F){expect(()=>f.wrapper.read({roomId:room,ownerId:member(1)})).toThrow();expect(()=>f.wrapper.narrow({roomId:room,ownerId:member(2),operationId:op(99),expectedRevision:0,exclude:['personal_beta']})).toThrow();expect(()=>new TopicRoomLifecycle(f.options).assertMember(room,f.birth,member(2))).toThrow();expect(()=>new TopicRoomLifecycle(f.options).open(room,f.birth)).toThrow();}

it('fresh classification authenticates exact original intent; changed retry is rejected and exact retry closes',()=>{
 let armed=false;const f=fixture({phase:p=>{if(armed&&p==='after-retirement-directory-sync')throw Error('intent-checkpoint');}});
 expect(f.manager.retirementStatus(room,f.birth)).toEqual({state:'live'});armed=true;expect(()=>retire(f)).toThrow('intent-checkpoint');armed=false;
 const fresh=new TopicRoomLifecycle(f.options),s=fresh.retirementStatus(room,f.birth);expect(s).toEqual({state:'retiring',operationId:op(40),retiredAt:80000});expect(Object.isFrozen(s)).toBe(true);
 expect(()=>fresh.retireRoom(room,f.birth,{operationId:op(40),retiredAt:80001},proof)).toThrow('TOPIC_ROOM_RETIREMENT_CONFLICT');expect(()=>fresh.retireRoom(room,f.birth,{operationId:op(41),retiredAt:80000},proof)).toThrow('TOPIC_ROOM_RETIREMENT_CONFLICT');
 expect(()=>fresh.cleanupPersonal(room,f.birth,cleanup)).toThrow('TOPIC_ROOM_NOT_DURABLY_RETIRED');if(s.state==='live')throw Error('not retiring');fresh.retireRoom(room,f.birth,{operationId:s.operationId,retiredAt:s.retiredAt},proof);
 expect(fresh.retirementStatus(room,f.birth)).toEqual({...s,state:'retired'});allDenied(f);
});

it('terminal descriptor has exact room-only fields; all member/topic service files removed; held fd grants no access',()=>{
 const f=ready(),fd=fs.openSync(f.chain,'r');try{expect(clean(f).memberMetadataRemoved).toBe(true);
 const terminal=decode(f.terminal,'terminal');expect(Object.keys(terminal).sort()).toEqual(['schema','protocol','roomId','personalIncarnation','lifecycleIncarnation','retiredAt','operationId','taxonomy','policy','lifecycleSequence','lifecycleChain','lifecycleWitness'].sort());
 for(const name of ['birth','retirement','terminal']){const decoded=decode(join(f.directories.birthDirectory,name),name),text=JSON.stringify(decoded);for(const value of [member(1),member(2),'member_admitted','member_retired'])expect(text).not.toContain(value);if(name==='birth')expect(decoded.vocabulary).toEqual(pins.vocabulary);else for(const value of pins.vocabulary)expect(text).not.toContain(value);}
 for(const directory of [f.directories.personalChainDirectory,f.directories.personalWitnessDirectory,f.directories.lifecycleChainDirectory,f.directories.lifecycleWitnessDirectory])expect(fs.readdirSync(directory)).toEqual([]);
 expect(fs.readdirSync(f.directories.birthDirectory).sort()).toEqual(['birth','retirement','terminal']);expect(fs.fstatSync(fd).nlink).toBe(0);expect(fs.readSync(fd,Buffer.alloc(1),0,1,0)).toBe(1);allDenied(f);
 const fresh=new TopicRoomLifecycle(f.options);expect(fresh.retirementStatus(room,f.birth)).toEqual({state:'retired',operationId:op(40),retiredAt:80000});expect(fresh.cleanupPersonal(room,f.birth,cleanup).personalRemoved).toBe(true);expect(fresh.cleanupRetiredMetadata(room,f.birth,cleanup).memberMetadataRemoved).toBe(true);
 }finally{fs.closeSync(fd);}
});

it.each(['live','intent-only','personal-chain-remains','personal-witness-remains'])('cleanup prerequisite %s cannot unlink lifecycle metadata',kind=>{
 let armed=false;const f=fixture({phase:p=>{if(armed&&p==='after-retirement-directory-sync')throw Error('interrupt');}});
 if(kind==='intent-only'){armed=true;expect(()=>retire(f)).toThrow();armed=false;}
 else if(kind!=='live'){retire(f);fs.unlinkSync(join(kind==='personal-chain-remains'?f.directories.personalWitnessDirectory:f.directories.personalChainDirectory,kind==='personal-chain-remains'?'witness':'chain'));}
 expect(()=>clean(f)).toThrow();expect(fs.existsSync(f.chain)).toBe(true);expect(fs.existsSync(f.witness)).toBe(true);expect(fs.existsSync(f.terminal)).toBe(false);
});

it('age and retained process clock floor govern metadata cleanup even after terminal exists',()=>{
 const f=ready();expect(()=>f.manager.cleanupRetiredMetadata(room,f.birth,{...proof,minimumTerminalAgeMs:20001})).toThrow('TOPIC_ROOM_CLEANUP_TOO_EARLY');expect(fs.existsSync(f.terminal)).toBe(false);
 f.setClock(99999);expect(()=>clean(f)).toThrow('TOPIC_ROOM_CLOCK_REGRESSION');expect(fs.existsSync(f.chain)).toBe(true);f.setClock(100001);clean(f);f.setClock(100000);expect(()=>clean(f)).toThrow('TOPIC_ROOM_CLOCK_REGRESSION');
});

it.each(['second-unknown','second-hardlink','second-symlink','second-mode'])('both metadata files validated before first deletion: %s',kind=>{
 const f=ready();if(kind==='second-unknown')fs.writeFileSync(join(f.directories.lifecycleWitnessDirectory,'extra'),'x');
 if(kind==='second-hardlink')fs.linkSync(f.witness,join(f.root,'alias'));
 if(kind==='second-symlink'){fs.renameSync(f.witness,join(f.root,'target'));fs.symlinkSync(join(f.root,'target'),f.witness);}
 if(kind==='second-mode')fs.chmodSync(f.witness,0o640);
 expect(()=>clean(f)).toThrow();expect(fs.existsSync(f.chain)).toBe(true);expect(fs.existsSync(f.terminal)).toBe(false);
});

it.each(['chain','witness'])('published terminal binds exact remaining %s bytes before first unlink',name=>{
 let armed=false;const f=ready({phase:p=>{if(armed&&p==='after-terminal-directory-sync')throw Error('published');}});armed=true;expect(()=>clean(f)).toThrow('published');armed=false;
 const file=name==='chain'?f.chain:f.witness,before=fs.readFileSync(file),bad=Buffer.from(before);bad[31]^=1;fs.writeFileSync(file,bad);
 const fresh=new TopicRoomLifecycle(f.options);expect(fresh.retirementStatus(room,f.birth).state).toBe('retired');expect(()=>fresh.cleanupRetiredMetadata(room,f.birth,cleanup)).toThrow('TOPIC_ROOM_TERMINAL_FILE_MISMATCH');expect(fs.existsSync(f.chain)).toBe(true);expect(fs.existsSync(f.witness)).toBe(true);
 fs.writeFileSync(file,before);expect(fresh.cleanupRetiredMetadata(room,f.birth,cleanup).memberMetadataRemoved).toBe(true);
});

it.each(['terminal-delete','terminal-corrupt','intent-delete','intent-corrupt','terminal-reencrypt','terminal-extra-member','terminal-other-retiredAt','terminal-other-capability'])('terminal/intent tamper %s denies old and cold managers',kind=>{
 const f=ready();clean(f);
 if(kind==='terminal-delete')fs.unlinkSync(f.terminal);
 if(kind==='intent-delete')fs.unlinkSync(f.intent);
 if(kind==='terminal-corrupt'||kind==='intent-corrupt'){const file=kind==='terminal-corrupt'?f.terminal:f.intent,b=fs.readFileSync(file);b[50]^=1;fs.writeFileSync(file,b);}
 if(kind==='terminal-reencrypt'){encode(f.terminal,'terminal',decode(f.terminal,'terminal'));expect(()=>f.manager.retirementStatus(room,f.birth)).toThrow('TOPIC_ROOM_TERMINAL_CHANGED');expect(new TopicRoomLifecycle(f.options).retirementStatus(room,f.birth).state).toBe('retired');allDenied(f);return;}
 if(kind.startsWith('terminal-')&&['terminal-extra-member','terminal-other-retiredAt','terminal-other-capability'].includes(kind)){const value=decode(f.terminal,'terminal');if(kind==='terminal-extra-member')value.members=[member(1)];if(kind==='terminal-other-retiredAt')value.retiredAt=80001;if(kind==='terminal-other-capability')(value.lifecycleChain as Record<string,unknown>).bytes=1;encode(f.terminal,'terminal',value);}
 expect(()=>f.manager.retirementStatus(room,f.birth)).toThrow();expect(()=>new TopicRoomLifecycle(f.options).retirementStatus(room,f.birth)).toThrow();expect(()=>clean(f)).toThrow();allDenied(f);
});

it('restoring old live chain cannot override independent terminal; restoring exact final files permits only cleanup',()=>{
 const f=fixture(),oldChain=fs.readFileSync(f.chain),oldWitness=fs.readFileSync(f.witness);retire(f);f.manager.cleanupPersonal(room,f.birth,cleanup);const finalChain=fs.readFileSync(f.chain),finalWitness=fs.readFileSync(f.witness);clean(f);
 fs.writeFileSync(f.chain,oldChain,{mode:0o600});fs.writeFileSync(f.witness,oldWitness,{mode:0o600});const fresh=new TopicRoomLifecycle(f.options);expect(fresh.retirementStatus(room,f.birth).state).toBe('retired');allDenied(f);expect(()=>fresh.cleanupRetiredMetadata(room,f.birth,cleanup)).toThrow('TOPIC_ROOM_TERMINAL_FILE_MISMATCH');
 fs.writeFileSync(f.chain,finalChain);fs.writeFileSync(f.witness,finalWitness);expect(fresh.cleanupRetiredMetadata(room,f.birth,cleanup).memberMetadataRemoved).toBe(true);allDenied(f);
});

it.each([1,2,3,4,5,6,7,8])('independent fsync fault %i yields no successful cleanup and fresh exact retry stays denied',nth=>{
 let armed=false,n=0;const f=ready({sync:fd=>{if(armed&&++n===nth)throw Error('fsync-'+nth);fs.fsyncSync(fd);}});armed=true;expect(()=>clean(f)).toThrow('fsync-'+nth);armed=false;
 const fresh=new TopicRoomLifecycle(f.options);expect(fresh.retirementStatus(room,f.birth).state).toBe('retired');allDenied(f);expect(fresh.cleanupRetiredMetadata(room,f.birth,cleanup).memberMetadataRemoved).toBe(true);
});

it.each(['shortwrite','ENOSPC','rename','first-unlink','second-unlink'])('independent terminal %s syscall fault gives no success; retry reauthenticates',kind=>{
 let armed=false,n=0;const f=ready({write:(fd,b)=>{if(armed&&kind==='ENOSPC')throw Error('ENOSPC-review');return fs.writeSync(fd,armed&&kind==='shortwrite'?b.subarray(0,19):b);},rename:(a,b)=>{if(armed&&kind==='rename')throw Error('rename-review');fs.renameSync(a,b);},unlink:p=>{if(armed&&++n===(kind==='first-unlink'?1:kind==='second-unlink'?2:-1))throw Error('unlink-review');fs.unlinkSync(p);}});
 armed=true;expect(()=>clean(f)).toThrow();armed=false;allDenied(f);expect(new TopicRoomLifecycle(f.options).cleanupRetiredMetadata(room,f.birth,cleanup).memberMetadataRemoved).toBe(true);
});

function worker(f:F,action:string){for(const name of ['security','private-topic-ledger','topic-room-lifecycle']){const code=ts.transpileModule(fs.readFileSync(new URL('./'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ES2022}}).outputText.replace("'./security.js'","'./security.mjs'").replace("'./private-topic-ledger.js'","'./private-topic-ledger.mjs'");fs.writeFileSync(join(f.root,name+'.mjs'),code);}return `import {TopicRoomLifecycle} from ${JSON.stringify('file://'+join(f.root,'topic-room-lifecycle.mjs'))};import {Keyring} from ${JSON.stringify('file://'+join(f.root,'security.mjs'))};const room=${JSON.stringify(room)},birth=${JSON.stringify(f.birth)},proof={roomTransactionLockHeld:true};const options={keys:new Keyring('review',{review:${JSON.stringify(secret)}}),pins:${JSON.stringify(pins)},directories:()=>(${JSON.stringify(f.directories)}),now:()=>100000,memberLimit:4};${action}`;}
it.each(['after-retirement-rename','after-room-retired','after-terminal-sync','after-terminal-rename','after-terminal-directory-sync','after-lifecycle-chain-unlink','after-lifecycle-witness-unlink'])('actual SIGKILL %s requires verified operator lock recovery and exact authenticated retry',phase=>{
 const metadata=phase.startsWith('after-terminal')||phase.startsWith('after-lifecycle'),f=metadata?ready():fixture();
 const action=metadata?'manager.cleanupRetiredMetadata(room,birth,{...proof,minimumTerminalAgeMs:0})':`manager.retireRoom(room,birth,{operationId:${JSON.stringify(op(40))},retiredAt:80000},proof)`;
 const code=worker(f,`options.controls={phase:p=>{if(p===${JSON.stringify(phase)})process.kill(process.pid,'SIGKILL')}};const manager=new TopicRoomLifecycle(options);${action};process.exit(99);`),result=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',timeout:15000});
 expect(result.error).toBeUndefined();expect(result.signal,result.stderr).toBe('SIGKILL');expect(result.status).toBeNull();expect(()=>new TopicRoomLifecycle(f.options).retirementStatus(room,f.birth)).toThrow('TOPIC_ROOM_BUSY');fs.unlinkSync(f.lock); // confirmed disposable child death, operator action only
 const fresh=new TopicRoomLifecycle(f.options),s=fresh.retirementStatus(room,f.birth);expect(s).toEqual({state:phase==='after-retirement-rename'?'retiring':'retired',operationId:op(40),retiredAt:80000});if(s.state==='live')throw Error('unexpected live');fresh.retireRoom(room,f.birth,{operationId:s.operationId,retiredAt:s.retiredAt},proof);fresh.cleanupPersonal(room,f.birth,cleanup);expect(fresh.cleanupRetiredMetadata(room,f.birth,cleanup).memberMetadataRemoved).toBe(true);allDenied(f);
});

