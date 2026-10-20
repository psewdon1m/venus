/** Additive, inactive P05 safety foundation. No API/restore adapter is installed here.
 * Callers must authenticate room ownership, serialize DB publication after durable
 * narrowing, union this state with DB exclusions, and retain these files AND keys
 * outside DB/image rollback. A supplied floor is a trusted input, not DB proof.
 * Simultaneously rolling back the host, keys, ledger and witness is undetectable.
 * There is deliberately no pruning, compaction, reset or stale-lock recovery.
 */
import * as fs from 'node:fs';
import {randomBytes} from 'node:crypto';
import {resolve,join,parse,sep} from 'node:path';
import {Keyring,canonical,hash,type Cipher} from './security.js';

const FRAME=24576, WITNESS=1024, ZERO='0'.repeat(64), DOMAIN='venus:private-topic-ledger:v1:';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DIGEST=/^[0-9a-f]{64}$/, TOPIC=/^[a-z][a-z0-9_]{0,47}$/;
export class TopicLedgerError extends Error {
  constructor(readonly code:string) {super(code);}
}
function demand(value:unknown,code='TOPIC_LEDGER_INVALID'):asserts value {if(!value) throw new TopicLedgerError(code);}
function object(value:unknown):asserts value is Record<string,unknown> {demand(value!==null&&typeof value==='object'&&!Array.isArray(value));}
function exact(value:unknown,keys:string[]):asserts value is Record<string,unknown> {
  object(value);demand(Object.keys(value).sort().join(',')===[...keys].sort().join(','));
}
function integer(value:unknown,min=0):asserts value is number {demand(Number.isSafeInteger(value)&&(value as number)>=min);}
function topics(value:unknown,vocabulary:readonly string[]):asserts value is string[] {
  demand(Array.isArray(value)&&value.length<=64&&value.every(v=>typeof v==='string'&&vocabulary.includes(v)));
  demand(canonical(value)===canonical([...new Set(value)].sort()));
}
function padded(value:unknown,length:number) {
  const data=Buffer.from(canonical(value));demand(data.length<length,'TOPIC_LEDGER_BOUND');
  const frame=Buffer.alloc(length,32);data.copy(frame);frame[length-1]=10;return frame;
}
function unpack(frame:Buffer,length:number):unknown {
  demand(frame.length===length&&frame[length-1]===10);
  const text=frame.toString('utf8');const value:unknown=JSON.parse(text);
  demand(padded(value,length).equals(frame));return value;
}
export interface TopicPins {taxonomy:string;policy:string;vocabulary:readonly string[]}
export interface TopicScope {roomId:string;ownerId:string}
export interface RequiredTopicLedger {incarnation:string;minimumSequence:number}
export interface TopicNarrowing extends TopicScope {operationId:string;expectedRevision:number;exclude:readonly string[]}
export interface TopicSafetyState extends TopicScope {
  incarnation:string;sequence:number;revision:number;taxonomy:string;policy:string;excluded:readonly string[];
}
export interface TopicNarrowingReceipt extends TopicSafetyState {
  operationSequence:number;operationRevision:number;replayed:boolean;
}
interface Header {schema:1;incarnation:string;sequence:number;previous:string;scope:string}
interface RecordRow extends Header {cipher:Cipher;mac:string}
interface Genesis {kind:'initialize';taxonomy:string;policy:string;vocabulary:readonly string[]}
interface Exclusion extends TopicScope {
  kind:'exclude';taxonomy:string;policy:string;revision:number;excluded:string[];
  operation:{id:string;expectedRevision:number;topics:string[]};
}
interface Witness {schema:1;incarnation:string;sequence:number;digest:string;mac:string}
interface Entry {header:Header;digest:string;body:Genesis|Exclusion}
interface Inspection {incarnation:string;sequence:number;digest:string;entries:Entry[];witnessSequence:number}
function scopeKey(scope:TopicScope) {return canonical({roomId:scope.roomId,ownerId:scope.ownerId});}
function validateScope(scope:TopicScope) {demand(UUID.test(scope.roomId)&&UUID.test(scope.ownerId),'TOPIC_LEDGER_SCOPE');}
function exists(path:string) {
  try {fs.lstatSync(path);return true;} catch(error) {
    if((error as NodeJS.ErrnoException).code==='ENOENT') return false;throw error;
  }
}
function checkedPins(input:TopicPins):TopicPins {
  demand(DIGEST.test(input.taxonomy)&&DIGEST.test(input.policy),'TOPIC_LEDGER_PINS');
  demand(Array.isArray(input.vocabulary)&&input.vocabulary.length>0&&input.vocabulary.length<=64);
  demand(input.vocabulary.every(t=>typeof t==='string'&&TOPIC.test(t)));
  demand(canonical(input.vocabulary)===canonical([...new Set(input.vocabulary)].sort()));
  return Object.freeze({taxonomy:input.taxonomy,policy:input.policy,vocabulary:Object.freeze([...input.vocabulary])});
}
/** Codec accepts bounded authenticated bytes only. Its use alone proves no IO durability. */
export class TopicLedgerCodec {
  readonly pins:TopicPins;
  constructor(private readonly keys:Keyring,pins:TopicPins,readonly maximumRecords=1024) {
    this.pins=checkedPins(pins);integer(maximumRecords,2);demand(maximumRecords<=4096);
  }
  private signed(value:unknown,version=this.keys.current) {return this.keys.fingerprint({domain:DOMAIN+'mac',value},version);}
  private scope(scope:TopicScope,version:string) {
    return this.keys.fingerprint({domain:DOMAIN+'scope',roomId:scope.roomId,ownerId:scope.ownerId,taxonomy:this.pins.taxonomy,policy:this.pins.policy},version);
  }
  private record(header:Header,body:Genesis|Exclusion) {
    const cipher=this.keys.encrypt(body,DOMAIN+'record:'+canonical(header));
    const unsigned={...header,cipher};return padded({...unsigned,mac:this.signed(unsigned)},FRAME);
  }
  initialize(incarnation:string) {
    demand(UUID.test(incarnation));return this.record({schema:1,incarnation,sequence:1,previous:ZERO,scope:''},
      {kind:'initialize',...this.pins});
  }
  append(state:Inspection,command:TopicNarrowing) {
    demand(state.sequence<this.maximumRecords,'TOPIC_LEDGER_FULL');
    const normalized=this.command(command);
    demand(!state.entries.some(entry=>entry.body.kind==='exclude'&&entry.body.operation.id===command.operationId),'TOPIC_LEDGER_OPERATION_EXISTS');
    const previous=this.latest(state,command);
    demand(previous.revision===command.expectedRevision,'TOPIC_LEDGER_REVISION');
    const excluded=[...new Set([...previous.excluded,...normalized.exclude])].sort();
    demand(excluded.length>previous.excluded.length,'TOPIC_LEDGER_NOT_NARROWER');
    const header:Header={schema:1,incarnation:state.incarnation,sequence:state.sequence+1,previous:state.digest,
      scope:this.scope(command,this.keys.current)};
    return this.record(header,{kind:'exclude',roomId:command.roomId,ownerId:command.ownerId,
      taxonomy:this.pins.taxonomy,policy:this.pins.policy,revision:previous.revision+1,excluded,
      operation:{id:command.operationId,expectedRevision:command.expectedRevision,topics:normalized.exclude}});
  }
  command(input:TopicNarrowing) {
    exact(input,['roomId','ownerId','operationId','expectedRevision','exclude']);validateScope(input);
    demand(UUID.test(input.operationId),'TOPIC_LEDGER_OPERATION');integer(input.expectedRevision);
    demand(Array.isArray(input.exclude));const exclude=[...input.exclude].sort();topics(exclude,this.pins.vocabulary);
    demand(exclude.length>0,'TOPIC_LEDGER_NOT_NARROWER');return {...input,exclude};
  }
  witness(state:Pick<Inspection,'incarnation'|'sequence'|'digest'>) {
    const unsigned={schema:1 as const,incarnation:state.incarnation,sequence:state.sequence,digest:state.digest};return padded({...unsigned,mac:this.signed(unsigned)},WITNESS);
  }
  inspect(chain:Buffer,witnessBytes:Buffer):Inspection {
    demand(chain.length>=FRAME&&chain.length%FRAME===0&&chain.length<=this.maximumRecords*FRAME,'TOPIC_LEDGER_SIZE');
    const raw=unpack(witnessBytes,WITNESS);exact(raw,['schema','incarnation','sequence','digest','mac']);
    const witness=raw as unknown as Witness;
    demand(witness.schema===1&&UUID.test(witness.incarnation)&&DIGEST.test(witness.digest));integer(witness.sequence,1);
    const {mac,...unsigned}=witness;demand(typeof mac==='string'&&this.keys.matchesFingerprint({domain:DOMAIN+'mac',value:unsigned},mac));
    let previous=ZERO;const entries:Entry[]=[], scopes=new Map<string,Exclusion>(), operations=new Set<string>();
    for(let offset=0;offset<chain.length;offset+=FRAME) {
      const bytes=chain.subarray(offset,offset+FRAME),value=unpack(bytes,FRAME);
      exact(value,['schema','incarnation','sequence','previous','scope','cipher','mac']);
      const row=value as unknown as RecordRow;
      const header:Header={schema:row.schema,incarnation:row.incarnation,sequence:row.sequence,previous:row.previous,scope:row.scope};
      demand(header.schema===1&&header.incarnation===witness.incarnation&&header.sequence===entries.length+1&&header.previous===previous);
      exact(row.cipher,['key_version','nonce','tag','data','format']);
      demand(row.cipher.format==='padded-json-v1'&&typeof row.cipher.key_version==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(row.cipher.key_version));
      for(const [field,length] of [[row.cipher.nonce,12],[row.cipher.tag,16],[row.cipher.data,16384]] as const) {
        demand(typeof field==='string'&&Buffer.from(field,'base64').length===length&&Buffer.from(field,'base64').toString('base64')===field);
      }
      const {mac:recordMac,...recordUnsigned}=row;
      demand(typeof recordMac==='string'&&recordMac.startsWith(row.cipher.key_version+':')&&
        this.keys.matchesFingerprint({domain:DOMAIN+'mac',value:recordUnsigned},recordMac));
      const body=this.keys.decrypt<Genesis|Exclusion>(row.cipher,DOMAIN+'record:'+canonical(header));
      if(entries.length===0) {
        exact(body,['kind','taxonomy','policy','vocabulary']);demand(body.kind==='initialize'&&header.scope==='');
        demand(canonical({taxonomy:body.taxonomy,policy:body.policy,vocabulary:(body as Genesis).vocabulary})===canonical(this.pins),'TOPIC_LEDGER_PINS');
      } else {
        exact(body,['kind','roomId','ownerId','taxonomy','policy','revision','excluded','operation']);
        demand(body.kind==='exclude');const entry=body as Exclusion;validateScope(entry);
        demand(entry.taxonomy===this.pins.taxonomy&&entry.policy===this.pins.policy,'TOPIC_LEDGER_PINS');
        demand(header.scope===this.scope(entry,row.cipher.key_version),'TOPIC_LEDGER_SCOPE');
        exact(entry.operation,['id','expectedRevision','topics']);demand(UUID.test(entry.operation.id)&&!operations.has(entry.operation.id));
        integer(entry.operation.expectedRevision);integer(entry.revision,1);topics(entry.operation.topics,this.pins.vocabulary);
        demand(entry.operation.topics.length>0);topics(entry.excluded,this.pins.vocabulary);
        const last=scopes.get(scopeKey(entry));const revision=last?.revision??0,excluded=last?.excluded??[];
        demand(entry.operation.expectedRevision===revision&&entry.revision===revision+1);
        const union=[...new Set([...excluded,...entry.operation.topics])].sort();
        demand(union.length>excluded.length&&canonical(union)===canonical(entry.excluded),'TOPIC_LEDGER_REGRESSION');
        operations.add(entry.operation.id);scopes.set(scopeKey(entry),entry);
      }
      previous=hash(bytes.toString('base64'));entries.push({header,digest:previous,body});
    }
    demand(witness.sequence<=entries.length&&entries[witness.sequence-1]!.digest===witness.digest,'TOPIC_LEDGER_WITNESS');
    return {incarnation:witness.incarnation,sequence:entries.length,digest:previous,entries,witnessSequence:witness.sequence};
  }
  latest(state:Inspection,scope:TopicScope):TopicSafetyState {
    validateScope(scope);let revision=0,excluded:readonly string[]=[];
    for(const {body} of state.entries) if(body.kind==='exclude'&&body.roomId===scope.roomId&&body.ownerId===scope.ownerId) {
      revision=body.revision;excluded=body.excluded;
    }
    return Object.freeze({roomId:scope.roomId,ownerId:scope.ownerId,incarnation:state.incarnation,sequence:state.sequence,revision,
      taxonomy:this.pins.taxonomy,policy:this.pins.policy,excluded:Object.freeze([...excluded])});
  }
  replay(state:Inspection,input:TopicNarrowing):TopicNarrowingReceipt|undefined {
    const command=this.command(input);
    for(const entry of state.entries) if(entry.body.kind==='exclude'&&entry.body.operation.id===command.operationId) {
      const body=entry.body;
      demand(body.roomId===command.roomId&&body.ownerId===command.ownerId&&body.operation.expectedRevision===command.expectedRevision&&
        canonical(body.operation.topics)===canonical(command.exclude),'TOPIC_LEDGER_REPLAY_MISMATCH');
      return Object.freeze({...this.latest(state,input),operationSequence:entry.header.sequence,operationRevision:body.revision,replayed:true});
    }
    return undefined;
  }
}

export type TopicLedgerPhase='before-append'|'after-append'|'after-chain-sync'|'after-witness-write'|'after-witness-sync'|'after-witness-rename'|'after-witness-directory-sync';
/** Trusted fault controls are for explicit injected-syscall tests, never HTTP input. */
export interface TopicLedgerControls {
  phase?:(phase:TopicLedgerPhase)=>void;
  write?:(fd:number,bytes:Buffer)=>number;
  sync?:(fd:number)=>void;
  rename?:(source:string,target:string)=>void;
}
export interface TopicLedgerOptions {
  chainDirectory:string;witnessDirectory:string;keys:Keyring;pins:TopicPins;maximumRecords?:number;
  controls?:TopicLedgerControls;
}
/** Linux-only driver. The two pre-provisioned 0700 directories must be distinct,
 * protected and independently preserved from DB/chain rollback by the operator.
 * Kernel syscall success is the durability boundary; disk hardware behavior and
 * complete host rollback are outside this local primitive's proof. */
export class PrivateTopicLedger {
  private readonly codec:TopicLedgerCodec;
  private readonly chainDirectory:string;
  private readonly witnessDirectory:string;
  private floor:{incarnation:string;sequence:number;digest:string}|undefined;
  private required:RequiredTopicLedger;
  private constructor(private readonly options:TopicLedgerOptions,required:RequiredTopicLedger) {
    demand(process.platform==='linux','TOPIC_LEDGER_PLATFORM_UNSUPPORTED');
    this.codec=new TopicLedgerCodec(options.keys,options.pins,options.maximumRecords);
    this.chainDirectory=resolve(options.chainDirectory);this.witnessDirectory=resolve(options.witnessDirectory);
    demand(this.chainDirectory!==this.witnessDirectory&&!this.chainDirectory.startsWith(this.witnessDirectory+sep)&&
      !this.witnessDirectory.startsWith(this.chainDirectory+sep),'TOPIC_LEDGER_DIRECTORIES');
    demand(UUID.test(required.incarnation));integer(required.minimumSequence,1);this.required={...required};
  }
  static initialize(options:TopicLedgerOptions) {
    const incarnation=randomBytes(16);incarnation[6]=(incarnation[6]!&15)|64;incarnation[8]=(incarnation[8]!&63)|128;
    const hex=incarnation.toString('hex'),id=`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    const ledger=new PrivateTopicLedger(options,{incarnation:id,minimumSequence:1});
    ledger.locked((chain,witness)=>{
      demand(!exists(join(chain,'chain'))&&!exists(join(witness,'witness')),'TOPIC_LEDGER_ALREADY_EXISTS');
      const bytes=ledger.codec.initialize(id);ledger.createFile(join(chain,'chain'),bytes);
      ledger.syncDirectory(chain);const digest=hash(bytes.toString('base64'));
      ledger.publishWitness(witness,{incarnation:id,sequence:1,digest});
      ledger.floor={incarnation:id,sequence:1,digest};
    });
    return {ledger,required:Object.freeze({incarnation:id,minimumSequence:1})};
  }
  static open(options:TopicLedgerOptions,required:RequiredTopicLedger) {
    const ledger=new PrivateTopicLedger(options,required);ledger.locked((chain,witness)=>ledger.reload(chain,witness));return ledger;
  }
  read(scope:TopicScope,minimumRevision=0) {
    integer(minimumRevision);return this.locked((chain,witness)=>{
      const state=this.codec.latest(this.reload(chain,witness),scope);
      demand(state.revision>=minimumRevision,'TOPIC_LEDGER_SCOPE_REGRESSION');return state;
    });
  }
  /** Trusted internal aggregate; never expose as a room/member availability API.
   * Counts exact authenticated owner scopes under the same rollback fences as read. */
  countExcludedScopes(roomId:string,topic:string) {
    demand(typeof roomId==='string'&&UUID.test(roomId),'TOPIC_LEDGER_SCOPE');
    demand(typeof topic==='string'&&this.codec.pins.vocabulary.includes(topic),'TOPIC_LEDGER_TOPIC');
    return this.locked((chain,witness)=>{
      const state=this.reload(chain,witness),owners=new Set<string>();
      for(const {body} of state.entries) if(body.kind==='exclude'&&body.roomId===roomId&&body.excluded.includes(topic)) owners.add(body.ownerId);
      return Object.freeze({incarnation:state.incarnation,sequence:state.sequence,count:owners.size});
    });
  }
  narrow(command:TopicNarrowing):TopicNarrowingReceipt {
    this.codec.command(command);
    return this.locked((chain,witness)=>{
      const state=this.reload(chain,witness),replay=this.codec.replay(state,command);if(replay) return replay;
      const bytes=this.codec.append(state,command);this.phase('before-append');
      this.withFile(join(chain,'chain'),fs.constants.O_WRONLY|fs.constants.O_APPEND,fd=>{
        this.write(fd,bytes);this.phase('after-append');this.sync(fd);this.phase('after-chain-sync');
      });
      // Re-read authenticated bytes after the durable append, not a permissive cache.
      const next=this.reload(chain,witness);
      return Object.freeze({...this.codec.latest(next,command),operationSequence:next.sequence,
        operationRevision:command.expectedRevision+1,replayed:false});
    });
  }
  private phase(phase:TopicLedgerPhase) {this.options.controls?.phase?.(phase);}
  private sync(fd:number) {(this.options.controls?.sync??fs.fsyncSync)(fd);}
  private write(fd:number,bytes:Buffer) {demand((this.options.controls?.write??((f,b)=>fs.writeSync(f,b)))(fd,bytes)===bytes.length,'TOPIC_LEDGER_SHORT_WRITE');}
  private syncDirectory(path:string) {
    const fd=fs.openSync(path,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY);try {this.sync(fd);} finally {fs.closeSync(fd);}
  }
  private assertFile(stat:fs.Stats) {
    demand(stat.isFile()&&stat.uid===process.getuid!()&&(stat.mode&0o7777)===0o600&&stat.nlink===1,'TOPIC_LEDGER_FILE_UNSAFE');
  }
  private withFile<T>(path:string,flags:number,operation:(fd:number)=>T):T {
    const fd=fs.openSync(path,flags|fs.constants.O_NOFOLLOW);
    try {
      const stat=fs.fstatSync(fd);this.assertFile(stat);const named=fs.lstatSync(path);
      demand(named.dev===stat.dev&&named.ino===stat.ino,'TOPIC_LEDGER_FILE_CHANGED');return operation(fd);
    } finally {fs.closeSync(fd);}
  }
  private readFile(path:string,maximum:number) {
    return this.withFile(path,fs.constants.O_RDONLY,fd=>{
      const before=fs.fstatSync(fd);demand(before.size>0&&before.size<=maximum,'TOPIC_LEDGER_SIZE');
      const bytes=Buffer.alloc(before.size);let offset=0;
      while(offset<bytes.length) {const n=fs.readSync(fd,bytes,offset,bytes.length-offset,offset);demand(n>0,'TOPIC_LEDGER_SHORT_READ');offset+=n;}
      const after=fs.fstatSync(fd);this.assertFile(after);
      demand(after.size===before.size&&after.ino===before.ino&&after.dev===before.dev&&after.mtimeMs===before.mtimeMs&&
        after.ctimeMs===before.ctimeMs&&fs.readSync(fd,Buffer.alloc(1),0,1,offset)===0,'TOPIC_LEDGER_FILE_CHANGED');return bytes;
    });
  }
  private createFile(path:string,bytes:Buffer) {
    const fd=fs.openSync(path,fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_WRONLY|fs.constants.O_NOFOLLOW,0o600);
    try {this.assertFile(fs.fstatSync(fd));this.write(fd,bytes);this.sync(fd);} finally {fs.closeSync(fd);}
  }
  private publishWitness(directory:string,state:Pick<Inspection,'incarnation'|'sequence'|'digest'>) {
    const temporary=join(directory,'witness.new-'+randomBytes(12).toString('hex'));
    const fd=fs.openSync(temporary,fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_WRONLY|fs.constants.O_NOFOLLOW,0o600);
    try {
      this.assertFile(fs.fstatSync(fd));this.write(fd,this.codec.witness(state));this.phase('after-witness-write');
      this.sync(fd);this.phase('after-witness-sync');
      (this.options.controls?.rename??fs.renameSync)(temporary,join(directory,'witness'));this.phase('after-witness-rename');
      this.syncDirectory(directory);this.phase('after-witness-directory-sync');
    } finally {
      fs.closeSync(fd);if(fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }
  private reload(chain:string,witness:string) {
    const state=this.codec.inspect(this.readFile(join(chain,'chain'),this.codec.maximumRecords*FRAME),this.readFile(join(witness,'witness'),WITNESS));
    demand(state.incarnation===this.required.incarnation&&state.sequence>=this.required.minimumSequence,'TOPIC_LEDGER_REQUIRED_REGRESSION');
    if(this.floor) demand(state.incarnation===this.floor.incarnation&&state.sequence>=this.floor.sequence&&
      state.entries[this.floor.sequence-1]!.digest===this.floor.digest,'TOPIC_LEDGER_PROCESS_REGRESSION');
    this.floor={incarnation:state.incarnation,sequence:state.sequence,digest:state.digest};
    if(state.witnessSequence<state.sequence) {
      this.withFile(join(chain,'chain'),fs.constants.O_RDONLY,fd=>this.sync(fd));
      this.publishWitness(witness,this.floor);
    }
    return state;
  }
  private directory(path:string) {
    const root=parse(path).root;let prefix=root;
    for(const part of path.slice(root.length).split(sep).filter(Boolean)) {prefix=join(prefix,part);demand(!fs.lstatSync(prefix).isSymbolicLink(),'TOPIC_LEDGER_SYMLINK');}
    const named=fs.lstatSync(path),fd=fs.openSync(path,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY|fs.constants.O_NOFOLLOW);
    try {
      const stat=fs.fstatSync(fd);demand(stat.isDirectory()&&stat.uid===process.getuid!()&&(stat.mode&0o7777)===0o700&&
        named.dev===stat.dev&&named.ino===stat.ino,'TOPIC_LEDGER_DIRECTORY_UNSAFE');return fd;
    } catch(error) {fs.closeSync(fd);throw error;}
  }
  private locked<T>(operation:(chain:string,witness:string)=>T):T {
    const chainFd=this.directory(this.chainDirectory);let witnessFd:number|undefined;
    try {
      witnessFd=this.directory(this.witnessDirectory);
      demand(fs.fstatSync(chainFd).ino!==fs.fstatSync(witnessFd).ino||fs.fstatSync(chainFd).dev!==fs.fstatSync(witnessFd).dev,'TOPIC_LEDGER_DIRECTORIES');
      const chain=`/proc/self/fd/${chainFd}`,witness=`/proc/self/fd/${witnessFd}`,lock=join(chain,'lock');let lockFd:number;
      try {lockFd=fs.openSync(lock,fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_WRONLY|fs.constants.O_NOFOLLOW,0o600);}
      catch {throw new TopicLedgerError('TOPIC_LEDGER_BUSY');}
      // The exclusive lock is an ephemeral mutex, not durable authority. Every data
      // publication has its own file/directory barriers; crash-left locks still fail closed.
      try {this.assertFile(fs.fstatSync(lockFd));return operation(chain,witness);}
      finally {
        let owned:fs.Stats,named:fs.Stats;
        try {owned=fs.fstatSync(lockFd);named=fs.lstatSync(lock);} finally {fs.closeSync(lockFd);}
        demand(owned.ino===named.ino&&owned.dev===named.dev,'TOPIC_LEDGER_LOCK_CHANGED');fs.unlinkSync(lock);
      }
    } finally {if(witnessFd!==undefined) fs.closeSync(witnessFd);fs.closeSync(chainFd);}
  }
}
