import {afterEach,expect,it} from 'vitest';
import * as fs from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
import {Keyring,hash,canonical} from './security.js';
import {PrivateTopicLedger,TopicLedgerCodec,type TopicLedgerControls} from './private-topic-ledger.js';

// Independent synthetic fixture. All filesystem probes run on the labelled disposable Linux volume.
const keys=new Keyring('first',{first:Buffer.alloc(32,23).toString('base64'),second:Buffer.alloc(32,91).toString('base64')});
const pins={taxonomy:'d'.repeat(64),policy:'e'.repeat(64),vocabulary:['alpha','beta','gamma','omega']};
const a={roomId:'10000000-0000-4000-8000-000000000001',ownerId:'20000000-0000-4000-8000-000000000002'};
const b={...a,ownerId:'20000000-0000-4000-8000-000000000003'};
const c={...a,roomId:'10000000-0000-4000-8000-000000000004'};
const op=(n:number)=>`30000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const roots:string[]=[];
function fixture(controls?:TopicLedgerControls,maximumRecords?:number){
  const root=fs.mkdtempSync('/state/reviewer-');roots.push(root);fs.chmodSync(root,0o700);
  const chainDirectory=join(root,'data'),witnessDirectory=join(root,'watermark');
  fs.mkdirSync(chainDirectory,0o700);fs.mkdirSync(witnessDirectory,0o700);
  const options={chainDirectory,witnessDirectory,keys,pins,controls,maximumRecords};
  const initialized=PrivateTopicLedger.initialize(options);
  return {root,options,...initialized,chain:join(chainDirectory,'chain'),witness:join(witnessDirectory,'witness'),lock:join(chainDirectory,'lock')};
}
afterEach(()=>{for(const root of roots.splice(0)){expect(dirname(resolve(root))).toBe('/state');fs.rmSync(root,{recursive:true,force:true});}});
const cmd=(n:number,revision:number,exclude:string[],scope=a)=>({...scope,operationId:op(n),expectedRevision:revision,exclude});
function bytes(d:ReturnType<typeof fixture>){return {chain:fs.readFileSync(d.chain),witness:fs.readFileSync(d.witness)};}
function restore(d:ReturnType<typeof fixture>,snapshot:ReturnType<typeof bytes>){fs.writeFileSync(d.chain,snapshot.chain);fs.writeFileSync(d.witness,snapshot.witness);}

it('independent ordered durability trace includes durable witness and lock removal before receipt',()=>{
  let active=false;const events:string[]=[];
  const controls:TopicLedgerControls={write:(fd,data)=>{if(active)events.push('write:'+fs.readlinkSync('/proc/self/fd/'+fd).split('/').at(-1));return fs.writeSync(fd,data);},
    sync:fd=>{if(active)events.push('sync:'+fs.readlinkSync('/proc/self/fd/'+fd).split('/').at(-1));fs.fsyncSync(fd);},
    rename:(from,to)=>{events.push('rename:witness');fs.renameSync(from,to);}};
  const d=fixture(controls);events.length=0;active=true;const receipt=d.ledger.narrow(cmd(1,0,['beta']));
  expect(receipt.excluded).toEqual(['beta']);
  expect(events.map(e=>e.replace(/witness\.new-[a-z0-9]+/,'temporary'))).toEqual([
    'sync:data','write:chain','sync:chain','sync:chain','write:temporary','sync:temporary','rename:witness','sync:watermark','sync:data']);
  expect(fs.existsSync(d.lock)).toBe(false);
});

it('three isolated scopes interleave while stale exact replay returns only its current stricter scope',()=>{
  const d=fixture();d.ledger.narrow(cmd(1,0,['alpha']));d.ledger.narrow(cmd(2,0,['gamma'],b));
  d.ledger.narrow(cmd(3,0,['omega'],c));d.ledger.narrow(cmd(4,1,['beta']));
  const before=bytes(d),replay=d.ledger.narrow(cmd(1,0,['alpha']));
  expect(replay).toMatchObject({sequence:5,revision:2,operationSequence:2,operationRevision:1,replayed:true,excluded:['alpha','beta']});
  expect(d.ledger.read(b).excluded).toEqual(['gamma']);expect(d.ledger.read(c).excluded).toEqual(['omega']);
  expect(bytes(d)).toEqual(before);
  expect(()=>d.ledger.read(b,2)).toThrow('TOPIC_LEDGER_SCOPE_REGRESSION');
});

it.each([{ownerId:b.ownerId},{roomId:c.roomId},{exclude:['beta']},{expectedRevision:1}])('global operation id replay cannot change scope/body %j',delta=>{
  const d=fixture();d.ledger.narrow(cmd(1,0,['alpha']));const before=bytes(d);
  expect(()=>d.ledger.narrow({...cmd(1,0,['alpha']),...delta})).toThrow('TOPIC_LEDGER_REPLAY_MISMATCH');
  expect(bytes(d)).toEqual(before);
});

it('full capacity still permits exact replay/read; another owner cannot bypass global bound',()=>{
  const d=fixture(undefined,2);d.ledger.narrow(cmd(1,0,['alpha']));
  expect(d.ledger.narrow(cmd(1,0,['alpha'])).replayed).toBe(true);
  expect(()=>d.ledger.narrow(cmd(2,0,['gamma'],b))).toThrow('TOPIC_LEDGER_FULL');
  expect(d.ledger.read(a).excluded).toEqual(['alpha']);expect(d.ledger.read(b).excluded).toEqual([]);
});

it('same-sequence authenticated divergent branch violates process digest floor',()=>{
  const d=fixture(),genesis=bytes(d);d.ledger.narrow(cmd(1,0,['alpha']));
  restore(d,genesis);const cold=PrivateTopicLedger.open(d.options,d.required);cold.narrow(cmd(2,0,['beta']));
  expect(()=>d.ledger.read(a)).toThrow('TOPIC_LEDGER_PROCESS_REGRESSION');
  expect(cold.read(a).excluded).toEqual(['beta']); // Entire rollback/fork plus stale external floor is explicitly outside cold-process proof.
});

it('old DB floor follows several fully authenticated unwitnessed scopes only after witness advance',()=>{
  const d=fixture(),genesis=bytes(d);d.ledger.narrow(cmd(1,0,['alpha']));d.ledger.narrow(cmd(2,0,['gamma'],b));d.ledger.narrow(cmd(3,1,['beta']));
  const full=bytes(d);fs.writeFileSync(d.witness,genesis.witness);
  const cold=PrivateTopicLedger.open(d.options,d.required);
  expect(cold.read(a).excluded).toEqual(['alpha','beta']);expect(cold.read(b).excluded).toEqual(['gamma']);
  expect(fs.readFileSync(d.witness)).toEqual(full.witness);
});

it.each([1,1024,24575])('partial appended tail of %i bytes never truncates or returns a permissive read',length=>{
  const d=fixture();d.ledger.narrow(cmd(1,0,['alpha']));fs.appendFileSync(d.chain,Buffer.alloc(length,32));const corrupt=bytes(d);
  expect(()=>PrivateTopicLedger.open(d.options,d.required)).toThrow('TOPIC_LEDGER_SIZE');expect(bytes(d)).toEqual(corrupt);
});

it.each(['noncanonical-outer','duplicate-outer-key','trailing-NUL','bad-base64','wrong-mac-domain'])('rejects independent authenticated envelope attack %s',attack=>{
  const d=fixture();d.ledger.narrow(cmd(1,0,['alpha']));const original=bytes(d),frame=original.chain.subarray(24576),row=JSON.parse(frame.toString());
  let text:string;
  if(attack==='noncanonical-outer')text=JSON.stringify(row,null,1);
  else if(attack==='duplicate-outer-key')text=canonical(row).replace('"schema":1','"schema":1,"schema":1');
  else if(attack==='trailing-NUL')text=canonical(row)+'\0';
  else {if(attack==='bad-base64')row.cipher.data=row.cipher.data.replace(/=$/,'');delete row.mac;row.mac=keys.fingerprint({domain:attack==='wrong-mac-domain'?'other':'venus:private-topic-ledger:v1:mac',value:row});text=canonical(row);}
  const replacement=Buffer.alloc(24576,32);replacement.write(text);replacement[24575]=10;
  fs.writeFileSync(d.chain,Buffer.concat([original.chain.subarray(0,24576),replacement]));
  const codec=new TopicLedgerCodec(keys,pins);fs.writeFileSync(d.witness,codec.witness({incarnation:d.required.incarnation,sequence:2,digest:hash(replacement.toString('base64'))}));
  const malformed=bytes(d);expect(()=>PrivateTopicLedger.open(d.options,d.required)).toThrow();expect(bytes(d)).toEqual(malformed);
});

it.each(['chain','witness'])('excessive %s input rejected before bounded buffer allocation',which=>{
  const d=fixture(undefined,2);fs.truncateSync(d[which],which==='chain'?3*24576:1025);
  expect(()=>PrivateTopicLedger.open(d.options,d.required)).toThrow('TOPIC_LEDGER_SIZE');
});

it('recovery refuses to acknowledge/adopt tail when re-fsync or witness publication fails',()=>{
  const d=fixture(),old=bytes(d);d.ledger.narrow(cmd(1,0,['alpha']));fs.writeFileSync(d.witness,old.witness);
  let syncCount=0;const controls={sync:(fd:number)=>{if(++syncCount===2)throw Error('independent-tail-fsync');fs.fsyncSync(fd);}};
  expect(()=>PrivateTopicLedger.open({...d.options,controls},d.required)).toThrow('independent-tail-fsync');
  expect(fs.readFileSync(d.witness)).toEqual(old.witness);
  expect(()=>PrivateTopicLedger.open({...d.options,controls:{rename:()=>{throw Error('independent-witness-rename');}}},d.required)).toThrow('independent-witness-rename');
  expect(fs.readFileSync(d.witness)).toEqual(old.witness);
  expect(PrivateTopicLedger.open(d.options,d.required).read(a).excluded).toEqual(['alpha']);
});

it('initialization failure cannot silently create an empty replacement incarnation',()=>{
  const root=fs.mkdtempSync('/state/reviewer-');roots.push(root);const chainDirectory=join(root,'data'),witnessDirectory=join(root,'watermark');fs.mkdirSync(chainDirectory,0o700);fs.mkdirSync(witnessDirectory,0o700);
  const options={chainDirectory,witnessDirectory,keys,pins,controls:{rename:()=>{throw Error('independent-init-fault');}}};
  expect(()=>PrivateTopicLedger.initialize(options)).toThrow('independent-init-fault');
  expect(fs.statSync(join(chainDirectory,'chain')).size).toBe(24576);expect(fs.existsSync(join(witnessDirectory,'witness'))).toBe(false);
  expect(()=>PrivateTopicLedger.initialize({...options,controls:undefined})).toThrow('TOPIC_LEDGER_ALREADY_EXISTS');
});

it.each(['after-chain-sync','after-witness-rename'])('independent real SIGKILL %s preserves stale lock then stricter recovery',phase=>{
  const d=fixture();for(const name of ['security','private-topic-ledger']){
    let compiled=ts.transpileModule(fs.readFileSync(new URL('./'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ES2022}}).outputText;
    compiled=compiled.replace("'./security.js'","'./security.mjs'");fs.writeFileSync(join(d.root,name+'.mjs'),compiled);
  }
  const script=`import {PrivateTopicLedger} from ${JSON.stringify('file://'+join(d.root,'private-topic-ledger.mjs'))};import {Keyring} from ${JSON.stringify('file://'+join(d.root,'security.mjs'))};
    const options=${JSON.stringify({...d.options,keys:undefined})};options.keys=new Keyring('first',{first:${JSON.stringify(Buffer.alloc(32,23).toString('base64'))}});
    options.controls={phase:p=>{if(p===${JSON.stringify(phase)})process.kill(process.pid,'SIGKILL')}};
    PrivateTopicLedger.open(options,${JSON.stringify(d.required)}).narrow(${JSON.stringify(cmd(1,0,['beta']))});process.exit(99);`;
  const result=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8',timeout:10000});
  expect(result.error).toBeUndefined();expect(result.signal,result.stderr).toBe('SIGKILL');expect(result.status).toBeNull();
  expect(()=>PrivateTopicLedger.open(d.options,d.required)).toThrow('TOPIC_LEDGER_BUSY');
  // Explicit disposable operator recovery only after confirmed child death.
  fs.unlinkSync(d.lock);expect(PrivateTopicLedger.open(d.options,d.required).read(a).excluded).toEqual(['beta']);
});

it('in-memory records and safety projections cannot be altered through returned frozen arrays',()=>{
  const d=fixture();const input=cmd(1,0,['alpha']);d.ledger.narrow(input);input.exclude.push('omega');
  const state=d.ledger.read(a);expect(Object.isFrozen(state)).toBe(true);expect(Object.isFrozen(state.excluded)).toBe(true);
  expect(()=>{(state.excluded as string[]).push('gamma');}).toThrow();expect(d.ledger.read(a).excluded).toEqual(['alpha']);
});
