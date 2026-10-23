import {describe,it,expect,afterEach} from 'vitest';
import * as fs from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawn,spawnSync} from 'node:child_process';
import ts from 'typescript';
import {Keyring,hash,canonical} from './security.js';
import {TopicLedgerCodec,PrivateTopicLedger,type TopicNarrowing,type TopicLedgerOptions,type TopicLedgerControls,type TopicLedgerPhase} from './private-topic-ledger.js';

const secrets={v1:Buffer.alloc(32,71).toString('base64'),v2:Buffer.alloc(32,72).toString('base64')};
const keys=new Keyring('v1',secrets),pins={taxonomy:'a'.repeat(64),policy:'b'.repeat(64),vocabulary:['food','friendship','music']};
const scope={roomId:'11111111-1111-4111-8111-111111111111',ownerId:'22222222-2222-4222-8222-222222222222'};
const incarnation='33333333-3333-4333-8333-333333333333',operationId='44444444-4444-4444-8444-444444444444';
const otherOperation='55555555-5555-4555-8555-555555555555',otherOwner='66666666-6666-4666-8666-666666666666';
const command:TopicNarrowing={...scope,operationId,expectedRevision:0,exclude:['music']};
const frameLength=24576,domain='venus:private-topic-ledger:v1:';
function codecFixture() {
  const codec=new TopicLedgerCodec(keys,pins),genesis=codec.initialize(incarnation);
  const witness=codec.witness({incarnation,sequence:1,digest:hash(genesis.toString('base64'))});
  const state=codec.inspect(genesis,witness),second=codec.append(state,command),chain=Buffer.concat([genesis,second]);
  const nextWitness=codec.witness({incarnation,sequence:2,digest:hash(second.toString('base64'))});
  return {codec,genesis,witness,second,chain,nextWitness};
}
function pack(value:unknown,length=frameLength) {
  const bytes=Buffer.from(canonical(value));expect(bytes.length).toBeLessThan(length);
  const frame=Buffer.alloc(length,32);bytes.copy(frame);frame[length-1]=10;return frame;
}
function authenticatedMutation(bytes:Buffer,change:(body:Record<string,unknown>,row:Record<string,unknown>)=>void) {
  const row=JSON.parse(bytes.toString('utf8')),header={schema:row.schema,incarnation:row.incarnation,sequence:row.sequence,previous:row.previous,scope:row.scope};
  const body=keys.decrypt<Record<string,unknown>>(row.cipher,domain+'record:'+canonical(header));change(body,row);
  const updated={schema:row.schema,incarnation:row.incarnation,sequence:row.sequence,previous:row.previous,scope:row.scope};
  row.cipher=keys.encrypt(body,domain+'record:'+canonical(updated));delete row.mac;
  return pack({...row,mac:keys.fingerprint({domain:domain+'mac',value:row})});
}
describe('topic safety ledger authenticated codec (no durability claim)',()=>{
  it('uses equal encrypted frame sizes and no plaintext room, owner or topics',()=>{
    const f=codecFixture();expect(f.genesis.length).toBe(f.second.length);expect(f.witness.length).toBe(1024);
    for(const value of [scope.roomId,scope.ownerId,'music','friendship','food']) expect(f.chain.toString('utf8')).not.toContain(value);
    const decoded=f.codec.latest(f.codec.inspect(f.chain,f.nextWitness),scope);
    expect(decoded.excluded).toEqual(['music']);expect(decoded.revision).toBe(1);expect(Object.isFrozen(decoded.excluded)).toBe(true);
    expect(new Set(Array.from({length:20},()=>f.codec.initialize(incarnation).toString('base64'))).size).toBe(20);
  });
  it('keeps room/member isolation and exact revision checks; no implicit cross-scope grants',()=>{
    const f=codecFixture(),state=f.codec.inspect(f.chain,f.nextWitness);
    expect(f.codec.latest(state,{...scope,ownerId:otherOwner}).excluded).toEqual([]);
    expect(f.codec.latest(state,{...scope,roomId:otherOwner}).excluded).toEqual([]);
    expect(()=>f.codec.append(state,{...command,operationId:otherOperation})).toThrow('TOPIC_LEDGER_REVISION');
    expect(()=>f.codec.append(state,{...command,operationId:otherOperation,expectedRevision:1})).toThrow('TOPIC_LEDGER_NOT_NARROWER');
  });
  it('exact replay returns current stricter union; changed body or scope reuse denies',()=>{
    const f=codecFixture(),state=f.codec.inspect(f.chain,f.nextWitness);
    const third=f.codec.append(state,{...command,operationId:otherOperation,expectedRevision:1,exclude:['food']});
    const latest=f.codec.inspect(Buffer.concat([f.chain,third]),f.nextWitness),receipt=f.codec.replay(latest,command)!;
    expect(receipt).toMatchObject({operationSequence:2,operationRevision:1,sequence:3,revision:2,replayed:true,excluded:['food','music']});
    for(const changed of [{exclude:['food']},{ownerId:otherOwner},{expectedRevision:1}]) {
      expect(()=>f.codec.replay(latest,{...command,...changed})).toThrow('TOPIC_LEDGER_REPLAY_MISMATCH');
    }
  });
  it('retains old encryption/MAC keys through rotation; missing/wrong key and pin changes deny',()=>{
    const f=codecFixture();expect(new TopicLedgerCodec(new Keyring('v2',secrets),pins).inspect(f.chain,f.nextWitness).sequence).toBe(2);
    const rotated=new TopicLedgerCodec(new Keyring('v2',secrets),pins);
    const third=rotated.append(rotated.inspect(f.chain,f.nextWitness),{...command,operationId:otherOperation,expectedRevision:1,exclude:['food']});
    const witness=rotated.witness({incarnation,sequence:3,digest:hash(third.toString('base64'))});
    expect(rotated.latest(rotated.inspect(Buffer.concat([f.chain,third]),witness),scope).excluded).toEqual(['food','music']);
    for(const ring of [new Keyring('v2',{v2:secrets.v2}),new Keyring('v1',{v1:secrets.v2})]) {
      expect(()=>new TopicLedgerCodec(ring,pins).inspect(f.chain,f.nextWitness)).toThrow();
    }
    for(const changed of [{taxonomy:'c'.repeat(64)},{policy:'d'.repeat(64)},{vocabulary:['food','music']}]) {
      expect(()=>new TopicLedgerCodec(keys,{...pins,...changed}).inspect(f.chain,f.nextWitness)).toThrow();
    }
  });
  it.each(['empty','short','trailing','tamper','reorder','duplicate','wrong-witness','witness-ahead','witness-short'])('rejects %s without dropping tail',kind=>{
    const f=codecFixture();let chain=f.chain,witness=f.nextWitness;
    if(kind==='empty') chain=Buffer.alloc(0);
    if(kind==='short') chain=chain.subarray(0,-1);
    if(kind==='trailing') chain=Buffer.concat([chain,Buffer.from('x')]);
    if(kind==='tamper') {chain=Buffer.from(chain);chain[frameLength+100]=chain[frameLength+100]!^1;}
    if(kind==='reorder') chain=Buffer.concat([f.second,f.genesis]);
    if(kind==='duplicate') chain=Buffer.concat([f.genesis,f.second,f.second]);
    if(kind==='wrong-witness') witness=f.codec.witness({incarnation,sequence:2,digest:'f'.repeat(64)});
    if(kind==='witness-ahead') witness=f.codec.witness({incarnation,sequence:3,digest:hash(f.second.toString('base64'))});
    if(kind==='witness-short') witness=witness.subarray(0,-1);
    expect(()=>f.codec.inspect(chain,witness)).toThrow();
  });
  it.each(['room','owner','scope','pins','shrink','revision','unknown-topic','duplicate-operation','AAD'])('rejects authenticated malformed %s records',kind=>{
    const f=codecFixture();let mutated=authenticatedMutation(f.second,(body,row)=>{
      if(kind==='room') body.roomId=otherOwner;
      if(kind==='owner') body.ownerId=otherOwner;
      if(kind==='scope') row.scope='v1:changed';
      if(kind==='pins') body.policy='c'.repeat(64);
      if(kind==='shrink') body.excluded=[];
      if(kind==='revision') body.revision=9;
      if(kind==='unknown-topic') body.excluded=['unknown'];
      if(kind==='duplicate-operation') body.operation={id:operationId,expectedRevision:1,topics:['food']};
    });
    if(kind==='AAD') {const row=JSON.parse(mutated.toString('utf8'));row.cipher=keys.encrypt({kind:'exclude'},'wrong-aad');delete row.mac;mutated=pack({...row,mac:keys.fingerprint({domain:domain+'mac',value:row})});}
    const witness=f.codec.witness({incarnation,sequence:2,digest:hash(mutated.toString('base64'))});
    expect(()=>f.codec.inspect(Buffer.concat([f.genesis,mutated]),witness)).toThrow();
  });
  it('rejects bad vocabulary, bounds, unknown fields and non-narrowing/duplicate topics',()=>{
    for(const vocabulary of [[],['music','food'],['music','music'],['Unknown'],Array.from({length:65},(_,i)=>'t'+i)]) {
      expect(()=>new TopicLedgerCodec(keys,{...pins,vocabulary})).toThrow();
    }
    const f=codecFixture(),state=f.codec.inspect(f.chain,f.nextWitness);
    for(const exclude of [[],['unknown'],['music','music']]) expect(()=>f.codec.command({...command,exclude})).toThrow();
    expect(()=>f.codec.command({...command,extra:true} as TopicNarrowing)).toThrow();
    expect(()=>new TopicLedgerCodec(keys,pins,2).append(state,{...command,operationId:otherOperation,expectedRevision:1,exclude:['food']})).toThrow('TOPIC_LEDGER_FULL');
  });
  it('rejects a cryptographically valid duplicate operation in a later otherwise monotonic record',()=>{
    const f=codecFixture(),state=f.codec.inspect(f.chain,f.nextWitness);
    const third=f.codec.append(state,{...command,operationId:otherOperation,expectedRevision:1,exclude:['food']});
    const changed=authenticatedMutation(third,body=>{(body.operation as {id:string}).id=operationId;});
    const witness=f.codec.witness({incarnation,sequence:3,digest:hash(changed.toString('base64'))});
    expect(()=>f.codec.inspect(Buffer.concat([f.chain,changed]),witness)).toThrow();
  });
});

const directories:string[]=[];
afterEach(()=>{
  for(const path of directories.splice(0)) {
    expect(dirname(resolve(path))).toBe(resolve(process.env.TOPIC_LEDGER_TEST_ROOT??tmpdir()));
    fs.rmSync(path,{recursive:true,force:true});
  }
});
function disk(controls?:TopicLedgerControls,maximumRecords?:number) {
  const base=process.env.TOPIC_LEDGER_TEST_ROOT??tmpdir(),root=fs.mkdtempSync(join(base,'venus-topic-ledger-'));
  directories.push(root);fs.chmodSync(root,0o700);
  const chainDirectory=join(root,'chain-dir'),witnessDirectory=join(root,'witness-dir');
  fs.mkdirSync(chainDirectory,0o700);fs.mkdirSync(witnessDirectory,0o700);
  const options:TopicLedgerOptions={chainDirectory,witnessDirectory,keys,pins,...(controls?{controls}:{}),...(maximumRecords?{maximumRecords}:{})};
  return {root,options,chain:join(chainDirectory,'chain'),witness:join(witnessDirectory,'witness'),lock:join(chainDirectory,'lock')};
}
function childScript(d:ReturnType<typeof disk>,required:unknown,action:string) {
  // Compile these exact mounted bytes, not the checkout or an accepted build.
  for(const name of ['security','private-topic-ledger']) {
    const source=fs.readFileSync(new URL('./'+name+'.ts',import.meta.url),'utf8');
    const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ES2022}}).outputText;
    fs.writeFileSync(join(d.root,name+'.mjs'),name==='private-topic-ledger'?compiled.replace("'./security.js'","'./security.mjs'"):compiled);
  }
  return `import {PrivateTopicLedger} from ${JSON.stringify(pathToFileURL(join(d.root,'private-topic-ledger.mjs')).href)};
    import {Keyring} from ${JSON.stringify(pathToFileURL(join(d.root,'security.mjs')).href)};
    import * as fs from 'node:fs';
    const options=${JSON.stringify({...d.options,keys:undefined})};options.keys=new Keyring('v1',${JSON.stringify(secrets)});
    const required=${JSON.stringify(required)},command=${JSON.stringify(command)};
    ${action}`;
}
describe.skipIf(process.platform!=='linux')('topic safety ledger real Linux filesystem (not API/DB activation)',()=>{
  it('internal aggregate counts exact unique authenticated scopes without exposing owner/topic lists',()=>{
    const d=disk(),{ledger,required}=PrivateTopicLedger.initialize(d.options);
    expect(ledger.countExcludedScopes(scope.roomId,'music')).toMatchObject({count:0,sequence:1});
    ledger.narrow(command);ledger.narrow({...command,operationId:otherOperation,expectedRevision:1,exclude:['food']});
    const third='77777777-7777-4777-8777-777777777777';
    ledger.narrow({...command,ownerId:otherOwner,operationId:third});
    const aggregate=ledger.countExcludedScopes(scope.roomId,'music');
    expect(aggregate).toEqual({incarnation:required.incarnation,sequence:4,count:2});expect(Object.isFrozen(aggregate)).toBe(true);
    expect(ledger.countExcludedScopes(otherOwner,'music').count).toBe(0);expect(ledger.countExcludedScopes(scope.roomId,'friendship').count).toBe(0);
    for(const [room,topic] of [['bad','music'],[scope.roomId,'unknown'],[scope.roomId,''],[scope.roomId,' music']]) {
      expect(()=>ledger.countExcludedScopes(room!,topic!)).toThrow();
    }
  });
  it('internal aggregate preserves required/witness/process floors and does not bypass corrupt or missing files',()=>{
    const d=disk(),{ledger,required}=PrivateTopicLedger.initialize(d.options),oldChain=fs.readFileSync(d.chain),oldWitness=fs.readFileSync(d.witness);
    ledger.narrow(command);expect(ledger.countExcludedScopes(scope.roomId,'music').count).toBe(1);
    fs.writeFileSync(d.chain,oldChain);expect(()=>ledger.countExcludedScopes(scope.roomId,'music')).toThrow('TOPIC_LEDGER_WITNESS');
    fs.writeFileSync(d.witness,oldWitness);expect(()=>ledger.countExcludedScopes(scope.roomId,'music')).toThrow('TOPIC_LEDGER_PROCESS_REGRESSION');
    expect(()=>PrivateTopicLedger.open(d.options,{...required,minimumSequence:2})).toThrow('TOPIC_LEDGER_REQUIRED_REGRESSION');
    fs.unlinkSync(d.witness);expect(()=>ledger.countExcludedScopes(scope.roomId,'music')).toThrow();
  });
  it('explicitly initializes, fsyncs append/witness, reopens and retains stricter union across old DB marker',()=>{
    const d=disk(),{ledger,required}=PrivateTopicLedger.initialize(d.options);
    expect(ledger.read(scope)).toMatchObject({revision:0,excluded:[]});
    const first=ledger.narrow(command);expect(first).toMatchObject({revision:1,sequence:2,excluded:['music'],replayed:false});
    const reopened=PrivateTopicLedger.open(d.options,required);
    expect(reopened.read(scope).excluded).toEqual(['music']);
    expect(reopened.narrow(command)).toMatchObject({replayed:true,operationSequence:2});
    reopened.narrow({...command,operationId:otherOperation,expectedRevision:1,exclude:['food']});
    expect(PrivateTopicLedger.open(d.options,required).read(scope).excluded).toEqual(['food','music']);
    expect(ledger.narrow(command)).toMatchObject({replayed:true,revision:2,excluded:['food','music']});
    for(const path of [d.chain,d.witness]) {expect(fs.statSync(path).mode&0o7777).toBe(0o600);expect(fs.statSync(path).nlink).toBe(1);}
    expect(fs.readFileSync(d.chain,'utf8')).not.toMatch(/music|food|friendship|22222222/);
    expect(()=>PrivateTopicLedger.initialize(d.options)).toThrow('TOPIC_LEDGER_ALREADY_EXISTS');
  });
  it.each(['chain','witness'] as const)('missing required %s never becomes empty',which=>{
    const d=disk(),{required}=PrivateTopicLedger.initialize(d.options);fs.unlinkSync(d[which]);
    expect(()=>PrivateTopicLedger.open(d.options,required)).toThrow();expect(fs.existsSync(d[which])).toBe(false);
  });
  it('does not initialize through normal open or accept a foreign incarnation/minimum sequence',()=>{
    const d=disk();expect(()=>PrivateTopicLedger.open(d.options,{incarnation,minimumSequence:1})).toThrow();
    expect(fs.existsSync(d.chain)).toBe(false);expect(fs.existsSync(d.witness)).toBe(false);
    const {required}=PrivateTopicLedger.initialize(d.options);
    expect(()=>PrivateTopicLedger.open(d.options,{...required,incarnation})).toThrow('TOPIC_LEDGER_REQUIRED_REGRESSION');
    expect(()=>PrivateTopicLedger.open(d.options,{...required,minimumSequence:2})).toThrow('TOPIC_LEDGER_REQUIRED_REGRESSION');
  });
  it.each(['chain','witness'] as const)('explicit initialization refuses a preexisting dangling %s symlink without creating state',which=>{
    const d=disk();fs.symlinkSync(join(d.root,'missing-target'),d[which]);
    expect(()=>PrivateTopicLedger.initialize(d.options)).toThrow('TOPIC_LEDGER_ALREADY_EXISTS');
    expect(fs.lstatSync(d[which]).isSymbolicLink()).toBe(true);
    expect(fs.existsSync(d[which==='chain'?'witness':'chain'])).toBe(false);
  });
  it('detects chain rollback with independent newer witness and process rollback with both old files',()=>{
    const d=disk(),{ledger,required}=PrivateTopicLedger.initialize(d.options),oldChain=fs.readFileSync(d.chain),oldWitness=fs.readFileSync(d.witness);
    ledger.narrow(command);const newerChain=fs.readFileSync(d.chain);
    fs.writeFileSync(d.chain,oldChain);expect(()=>PrivateTopicLedger.open(d.options,required)).toThrow('TOPIC_LEDGER_WITNESS');
    fs.writeFileSync(d.chain,newerChain);expect(ledger.read(scope).revision).toBe(1);
    fs.writeFileSync(d.chain,oldChain);fs.writeFileSync(d.witness,oldWitness);
    expect(()=>ledger.read(scope)).toThrow('TOPIC_LEDGER_PROCESS_REGRESSION');
    // A cold new process with all witnesses AND trusted DB minimum rolled back cannot detect this.
    expect(PrivateTopicLedger.open(d.options,required).read(scope).revision).toBe(0);
  });
  it('recovers only complete authenticated stricter tail and durably advances witness',()=>{
    const d=disk(),{ledger,required}=PrivateTopicLedger.initialize(d.options),oldWitness=fs.readFileSync(d.witness);
    ledger.narrow(command);fs.writeFileSync(d.witness,oldWitness);
    expect(PrivateTopicLedger.open(d.options,required).read(scope).excluded).toEqual(['music']);
    expect(fs.readFileSync(d.witness).equals(oldWitness)).toBe(false);
    fs.appendFileSync(d.chain,Buffer.from('partial'));const bytes=fs.readFileSync(d.chain);
    expect(()=>PrivateTopicLedger.open(d.options,required)).toThrow('TOPIC_LEDGER_SIZE');expect(fs.readFileSync(d.chain).equals(bytes)).toBe(true);
  });
  it.each(['chain-mode','witness-mode','directory-mode','chain-hardlink','witness-hardlink','chain-symlink','witness-symlink','directory-symlink'])('rejects unsafe %s',kind=>{
    const d=disk(),{required}=PrivateTopicLedger.initialize(d.options);
    if(kind==='chain-mode') fs.chmodSync(d.chain,0o640);
    if(kind==='witness-mode') fs.chmodSync(d.witness,0o644);
    if(kind==='directory-mode') fs.chmodSync(d.options.chainDirectory,0o750);
    if(kind==='chain-hardlink') fs.linkSync(d.chain,join(d.root,'linked-chain'));
    if(kind==='witness-hardlink') fs.linkSync(d.witness,join(d.root,'linked-witness'));
    if(kind==='chain-symlink'||kind==='witness-symlink') {const path=kind==='chain-symlink'?d.chain:d.witness;fs.renameSync(path,path+'.target');fs.symlinkSync(path+'.target',path);}
    if(kind==='directory-symlink') {fs.renameSync(d.options.chainDirectory,d.options.chainDirectory+'-target');fs.symlinkSync(d.options.chainDirectory+'-target',d.options.chainDirectory);}
    expect(()=>PrivateTopicLedger.open(d.options,required)).toThrow();
  });
  it('exclusive locks fail closed for another live writer, stale-looking lock and concurrent reentry',()=>{
    const controls:TopicLedgerControls={},d=disk(controls),{ledger,required}=PrivateTopicLedger.initialize(d.options);
    fs.writeFileSync(d.lock,'',{mode:0o600});fs.utimesSync(d.lock,new Date(0),new Date(0));
    expect(()=>ledger.read(scope)).toThrow('TOPIC_LEDGER_BUSY');expect(()=>PrivateTopicLedger.open(d.options,required)).toThrow('TOPIC_LEDGER_BUSY');
    fs.unlinkSync(d.lock);let observed=false;
    controls.phase=phase=>{if(phase==='before-append') {expect(()=>PrivateTopicLedger.open(d.options,required)).toThrow('TOPIC_LEDGER_BUSY');observed=true;}};
    ledger.narrow(command);expect(observed).toBe(true);expect(fs.existsSync(d.lock)).toBe(false);
  });
  it('bounds the ledger without pruning exclusions or consuming duplicate operations',()=>{
    const d=disk(undefined,2),{ledger}=PrivateTopicLedger.initialize(d.options);ledger.narrow(command);const bytes=fs.readFileSync(d.chain);
    expect(ledger.narrow(command).replayed).toBe(true);
    expect(()=>ledger.narrow({...command,operationId:otherOperation,expectedRevision:1,exclude:['food']})).toThrow('TOPIC_LEDGER_FULL');
    expect(fs.readFileSync(d.chain).equals(bytes)).toBe(true);expect(ledger.read(scope,1).excluded).toEqual(['music']);
    expect(()=>ledger.read(scope,2)).toThrow('TOPIC_LEDGER_SCOPE_REGRESSION');
  });
  it.each(['before-append','after-append','after-chain-sync','after-witness-write','after-witness-sync','after-witness-rename','after-witness-directory-sync'] as TopicLedgerPhase[])('injected crash-control at %s never acknowledges; reopen keeps any valid stricter append',phase=>{
    let armed=false;const controls:TopicLedgerControls={phase:p=>{if(armed&&p===phase) throw new Error('injected:'+phase);}};
    const d=disk(controls),{ledger,required}=PrivateTopicLedger.initialize(d.options);armed=true;
    expect(()=>ledger.narrow(command)).toThrow('injected:'+phase);armed=false;
    const reopened=PrivateTopicLedger.open(d.options,required);
    expect(reopened.read(scope).excluded).toEqual(phase==='before-append'?[]:['music']);
    expect(fs.existsSync(d.lock)).toBe(false);
  });
  it.each(['short-write','ENOSPC','fsync','rename'])('injected %s denies success and never silently repairs a corrupt tail',fault=>{
    let armed=false;const controls:TopicLedgerControls={
      write:(fd,bytes)=>{if(armed&&fault==='ENOSPC') throw new Error('injected:ENOSPC');if(armed&&fault==='short-write') return fs.writeSync(fd,bytes.subarray(0,100));return fs.writeSync(fd,bytes);},
      sync:fd=>{if(armed&&fault==='fsync') throw new Error('injected:fsync');fs.fsyncSync(fd);},
      rename:(from,to)=>{if(armed&&fault==='rename') throw new Error('injected:rename');fs.renameSync(from,to);}
    };
    const d=disk(controls),{ledger,required}=PrivateTopicLedger.initialize(d.options);armed=true;
    expect(()=>ledger.narrow(command)).toThrow();armed=false;
    if(fault==='short-write') {const corrupt=fs.readFileSync(d.chain);expect(()=>PrivateTopicLedger.open(d.options,required)).toThrow('TOPIC_LEDGER_SIZE');expect(fs.readFileSync(d.chain).equals(corrupt)).toBe(true);}
    else expect(PrivateTopicLedger.open(d.options,required).read(scope).excluded).toEqual(fault==='rename'?['music']:[]);
  });
  it.each([1,2,3,4,5,6])('injected fsync failure at durable call %s refuses acknowledgement and revalidates on reopen',target=>{
    let armed=false,calls=0;const controls:TopicLedgerControls={sync:fd=>{
      if(armed&&++calls===target) throw new Error('injected:sync:'+target);fs.fsyncSync(fd);
    }};
    const d=disk(controls),{ledger,required}=PrivateTopicLedger.initialize(d.options);armed=true;
    expect(()=>ledger.narrow(command)).toThrow('injected:sync:'+target);armed=false;
    expect(calls).toBeGreaterThanOrEqual(target);
    expect(PrivateTopicLedger.open(d.options,required).read(scope).excluded).toEqual(target===1?[]:['music']);
  });
  it.each(['before-append','after-append','after-chain-sync','after-witness-write','after-witness-sync','after-witness-rename','after-witness-directory-sync'] as TopicLedgerPhase[])('real child SIGKILL at %s retains stale lock and never silently relaxes after explicit test-operator recovery',phase=>{
    const d=disk(),{required}=PrivateTopicLedger.initialize(d.options);
    const script=childScript(d,required,`options.controls={phase:p=>{if(p===${JSON.stringify(phase)}) process.kill(process.pid,'SIGKILL');}};
      PrivateTopicLedger.open(options,required).narrow(command);process.exit(99);`);
    const result=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8',timeout:10000});
    expect(result.error).toBeUndefined();expect(result.signal,result.stderr).toBe('SIGKILL');expect(result.status).toBeNull();
    expect(fs.existsSync(d.lock)).toBe(true);expect(()=>PrivateTopicLedger.open(d.options,required)).toThrow('TOPIC_LEDGER_BUSY');
    // Only this disposable test operator, knowing child termination, removes its lock.
    fs.unlinkSync(d.lock);
    expect(PrivateTopicLedger.open(d.options,required).read(scope).excluded).toEqual(phase==='before-append'?[]:['music']);
  });
  it('real second process cannot enter while first process holds the exclusive writer lock',async()=>{
    const d=disk(),{required}=PrivateTopicLedger.initialize(d.options),ready=join(d.root,'ready');
    const script=childScript(d,required,`options.controls={phase:p=>{if(p==='before-append') {
      fs.writeFileSync(${JSON.stringify(ready)},'ready');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,30000);
    }}};PrivateTopicLedger.open(options,required).narrow(command);`);
    const child=spawn(process.execPath,['--input-type=module','-e',script],{stdio:['ignore','pipe','pipe']});
    const exited=new Promise<{code:number|null;signal:NodeJS.Signals|null}>(res=>child.once('exit',(code,signal)=>res({code,signal})));
    let stderr='';child.stderr.on('data',chunk=>{stderr+=String(chunk);});
    try {
      for(let i=0;i<200&&!fs.existsSync(ready)&&child.exitCode===null&&child.signalCode===null;i++) await new Promise(res=>setTimeout(res,10));
      expect(fs.existsSync(ready),stderr).toBe(true);
      const denied=spawnSync(process.execPath,['--input-type=module','-e',childScript(d,required,
        `try {PrivateTopicLedger.open(options,required);process.exit(99);} catch(error) {if(error.code!=='TOPIC_LEDGER_BUSY') throw error;}`)],{encoding:'utf8',timeout:10000});
      expect(denied.status,denied.stderr).toBe(0);expect(fs.existsSync(d.lock)).toBe(true);
    } finally {child.kill('SIGKILL');await exited;}
    expect(()=>PrivateTopicLedger.open(d.options,required)).toThrow('TOPIC_LEDGER_BUSY');fs.unlinkSync(d.lock);
    expect(PrivateTopicLedger.open(d.options,required).read(scope).excluded).toEqual([]);
  });
});
describe.skipIf(process.platform==='linux')('unsupported host is explicit',()=>{
  it('does not claim Windows file durability',()=>{
    expect(()=>PrivateTopicLedger.open({chainDirectory:'unused',witnessDirectory:'unused2',keys,pins},{incarnation,minimumSequence:1})).toThrow('TOPIC_LEDGER_PLATFORM_UNSUPPORTED');
  });
});
