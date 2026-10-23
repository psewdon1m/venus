/** Default-inactive room-local protocol2 storage. This is not a PG/admission,
 * deployment/compatibility-floor, orphan scanner or backup/restore integration.
 * Trusted callers must hold the SAME room transaction/advisory ordering before
 * birth/admit/withdraw/retire/cleanup and final delivery. Boolean proofs below
 * document that precondition; they do not authenticate a DB lock or caller.
 * No automatic terminal-metadata prune, legacy conversion, stale-lock guessing
 * or reinitialization.
 */
import * as fs from 'node:fs';
import {randomBytes,createHash} from 'node:crypto';
import {resolve,join,parse,sep} from 'node:path';
import {Keyring,canonical,hash,type Cipher} from './security.js';
import {PrivateTopicLedger,type TopicLedgerControls,type TopicLedgerOptions,type TopicPins,type RequiredTopicLedger,type TopicScope} from './private-topic-ledger.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DIGEST=/^[0-9a-f]{64}$/,FRAME=24576,DOMAIN='venus:topic-room-lifecycle:v1:';
export const topicLifecyclePins:TopicPins=Object.freeze({taxonomy:hash(DOMAIN+'taxonomy:member_admitted,member_retired,room_retired'),
  policy:hash(DOMAIN+'policy:durable-admission-and-retirement'),vocabulary:Object.freeze(['member_admitted','member_retired','room_retired'])});
export class TopicRoomLifecycleError extends Error {constructor(readonly code:string) {super(code);}}
function demand(value:unknown,code='TOPIC_ROOM_INVALID'):asserts value {if(!value) throw new TopicRoomLifecycleError(code);}
function exact(value:unknown,fields:string[]):asserts value is Record<string,unknown> {
  demand(value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===[...fields].sort().join(','));
}
function int(value:unknown,minimum=0):asserts value is number {demand(Number.isSafeInteger(value)&&(value as number)>=minimum);}
function uuid(value:unknown):asserts value is string {demand(typeof value==='string'&&UUID.test(value),'TOPIC_ROOM_SCOPE');}
function present(path:string) {try {fs.lstatSync(path);return true;} catch(error) {if((error as NodeJS.ErrnoException).code==='ENOENT') return false;throw error;}}
export interface TopicRoomBirth extends RequiredTopicLedger {taxonomy_digest:string;policy_digest:string}
export interface RoomStorageDirectories {
  birthDirectory:string;personalChainDirectory:string;personalWitnessDirectory:string;lifecycleChainDirectory:string;lifecycleWitnessDirectory:string;
}
export type TopicRoomPhase='after-personal-initialize'|'after-lifecycle-initialize'|'after-birth-write'|'after-birth-sync'|'after-birth-rename'|'after-birth-directory-sync'|
  'after-retirement-write'|'after-retirement-sync'|'after-retirement-rename'|'after-retirement-directory-sync'|'after-room-retired'|
  'after-personal-chain-unlink'|'after-personal-chain-directory-sync'|'after-personal-witness-unlink'|'after-personal-witness-directory-sync'|
  'after-terminal-write'|'after-terminal-sync'|'after-terminal-rename'|'after-terminal-directory-sync'|
  'after-lifecycle-chain-unlink'|'after-lifecycle-chain-directory-sync'|'after-lifecycle-witness-unlink'|'after-lifecycle-witness-directory-sync';
export interface TopicRoomControls {
  phase?:(phase:TopicRoomPhase)=>void;write?:(fd:number,bytes:Buffer)=>number;sync?:(fd:number)=>void;
  rename?:(source:string,target:string)=>void;unlink?:(path:string)=>void;
}
export interface TopicRoomOptions {
  directories:(roomId:string,metadataOnly?:boolean)=>RoomStorageDirectories;keys:Keyring;pins:TopicPins;now:()=>number;
  memberLimit?:number;maximumPersonalRecords?:number;maximumCachedRooms?:number;
  controls?:TopicRoomControls;personalControls?:TopicLedgerControls;lifecycleControls?:TopicLedgerControls;
}
export interface TrustedRoomLock {roomTransactionLockHeld:true}
interface BirthDescriptor {
  schema:1;protocol:2;roomId:string;createdAt:number;personalIncarnation:string;lifecycleIncarnation:string;
  taxonomy:string;policy:string;vocabulary:readonly string[];memberLimit:number;maximumPersonalRecords:number;
}
interface RetirementIntent {
  schema:1;roomId:string;personalIncarnation:string;lifecycleIncarnation:string;retiredAt:number;operationId:string;
}
interface FileCapability {bytes:number;sha256:string}
interface TerminalDescriptor extends RetirementIntent {
  protocol:2;taxonomy:string;policy:string;lifecycleSequence:number;lifecycleChain:FileCapability;lifecycleWitness:FileCapability;
}
export type TopicRetirementStatus=Readonly<{state:'live'}|{state:'retiring'|'retired';retiredAt:number;operationId:string}>;
interface RoomUnit {directories:RoomStorageDirectories;anchors:Record<keyof RoomStorageDirectories,string>}
interface RoomContext {
  descriptor:BirthDescriptor;descriptorHash:string;directories:RoomStorageDirectories;lifecycle?:PrivateTopicLedger;
  personal?:PrivateTopicLedger;minimumSequence:number;sawIntent:boolean;intentHash?:string;sawTerminal:boolean;terminalHash?:string;
  wrapped:Pick<PrivateTopicLedger,'read'|'narrow'>;
}
function freezePins(pins:TopicPins):TopicPins {
  demand(DIGEST.test(pins.taxonomy)&&DIGEST.test(pins.policy)&&Array.isArray(pins.vocabulary)&&pins.vocabulary.length>0&&pins.vocabulary.length<=64);
  demand(pins.vocabulary.every(v=>typeof v==='string'&&/^[a-z][a-z0-9_]{0,47}$/.test(v))&&new Set(pins.vocabulary).size===pins.vocabulary.length);
  return Object.freeze({...pins,vocabulary:Object.freeze([...pins.vocabulary].sort())});
}
/** Retain this manager for the serving process: its cached instances preserve
 * ledger high-water floors. Recreating it is not a process rollback defence. */
export class TopicRoomLifecycle {
  private readonly pins:TopicPins;
  private readonly memberLimit:number;
  private readonly maximumPersonalRecords:number;
  private readonly maximumCachedRooms:number;
  private readonly rooms=new Map<string,RoomContext>();
  private clockFloor=0;
  constructor(private readonly options:TopicRoomOptions) {
    demand(process.platform==='linux','TOPIC_ROOM_PLATFORM_UNSUPPORTED');this.pins=freezePins(options.pins);
    this.memberLimit=options.memberLimit??128;int(this.memberLimit,1);demand(this.memberLimit<=2047);
    this.maximumPersonalRecords=options.maximumPersonalRecords??1024;int(this.maximumPersonalRecords,2);demand(this.maximumPersonalRecords<=4096);
    this.maximumCachedRooms=options.maximumCachedRooms??1024;int(this.maximumCachedRooms,1);demand(this.maximumCachedRooms<=4096);
  }
  private now() {const now=this.options.now();int(now);demand(now>=this.clockFloor,'TOPIC_ROOM_CLOCK_REGRESSION');this.clockFloor=now;return now;}
  private proof(proof:TrustedRoomLock) {exact(proof,['roomTransactionLockHeld']);demand(proof.roomTransactionLockHeld===true,'TOPIC_ROOM_LOCK_REQUIRED');}
  private birth(context:RoomContext):TopicRoomBirth {return Object.freeze({incarnation:context.descriptor.personalIncarnation,
    minimumSequence:context.minimumSequence,taxonomy_digest:this.pins.taxonomy,policy_digest:this.pins.policy});}
  initializeRoom(roomId:string,createdAt:number,proof:TrustedRoomLock):TopicRoomBirth {
    this.proof(proof);uuid(roomId);int(createdAt);demand(createdAt<=this.now(),'TOPIC_ROOM_FUTURE_BIRTH');
    return this.locked(roomId,unit=>{
      demand(!this.rooms.has(roomId),'TOPIC_ROOM_ALREADY_INITIALIZED');
      for(const [key,directory] of Object.entries(unit.anchors)) demand(fs.readdirSync(directory).every(name=>key==='birthDirectory'&&name==='room.lock'),'TOPIC_ROOM_ALREADY_INITIALIZED');
      demand(this.rooms.size<this.maximumCachedRooms,'TOPIC_ROOM_CACHE_FULL');
      const personal=PrivateTopicLedger.initialize(this.ledgerOptions(unit.directories,false));this.phase('after-personal-initialize');
      const lifecycle=PrivateTopicLedger.initialize(this.ledgerOptions(unit.directories,true));this.phase('after-lifecycle-initialize');
      const descriptor:BirthDescriptor={schema:1,protocol:2,roomId,createdAt,personalIncarnation:personal.required.incarnation,
        lifecycleIncarnation:lifecycle.required.incarnation,taxonomy:this.pins.taxonomy,policy:this.pins.policy,vocabulary:this.pins.vocabulary,
        memberLimit:this.memberLimit,maximumPersonalRecords:this.maximumPersonalRecords};
      this.publish(unit.anchors.birthDirectory,'birth',descriptor);
      const context=this.context(unit,roomId);context.personal=personal.ledger;context.lifecycle=lifecycle.ledger;return this.birth(context);
    });
  }
  /** Stable wrapper; every read/narrow rechecks room AND member retirement. */
  open(roomId:string,birth:TopicRoomBirth):Pick<PrivateTopicLedger,'read'|'narrow'> {
    return this.locked(roomId,unit=>{
      const context=this.context(unit,roomId,birth);this.live(unit,context);return context.wrapped;
    });
  }
  assertLive(roomId:string,birth:TopicRoomBirth) {this.locked(roomId,unit=>this.live(unit,this.context(unit,roomId,birth)));}
  assertMember(roomId:string,birth:TopicRoomBirth,ownerId:string) {
    this.locked(roomId,unit=>this.member(unit,this.context(unit,roomId,birth),ownerId));
  }
  /** Metadata-only safety fence. No personal files/directories are opened and
   * no private content/grant/readiness permission follows from success. */
  assertRoomAuthority(roomId:string,birth:TopicRoomBirth) {
    this.locked(roomId,unit=>{
      const context=this.context(unit,roomId,birth),state=this.retirement(unit,context);
      demand(!state.retired&&!state.intent,'TOPIC_ROOM_RETIRED');
    },true);
  }
  /** Authenticated lifecycle admission/withdrawal check for safety operations;
   * the caller still authenticates the session/room/offer under DB ordering. */
  assertMemberAuthority(roomId:string,birth:TopicRoomBirth,ownerId:string) {
    this.locked(roomId,unit=>{
      const context=this.context(unit,roomId,birth),state=this.retirement(unit,context);
      demand(!state.retired&&!state.intent,'TOPIC_ROOM_RETIRED');this.memberId(context,ownerId);
      const member=this.lifecycle(context).read({roomId,ownerId});
      demand(member.excluded.includes('member_admitted'),'TOPIC_ROOM_MEMBER_NOT_ADMITTED');
      demand(!member.excluded.includes('member_retired'),'TOPIC_ROOM_MEMBER_RETIRED');
    },true);
  }
  /** Authenticated lifecycle classification, NOT room readiness or admission.
   * Original persisted values let a fresh process recover an interrupted close. */
  retirementStatus(roomId:string,birth:TopicRoomBirth):TopicRetirementStatus {
    return this.locked(roomId,unit=>{
      const context=this.context(unit,roomId,birth),state=this.retirement(unit,context);
      if(state.intent) return Object.freeze({state:state.retired?'retired' as const:'retiring' as const,
        retiredAt:state.intent.retiredAt,operationId:state.intent.operationId});
      demand(!state.retired,'TOPIC_ROOM_TERMINAL_INTENT_MISSING');return Object.freeze({state:'live' as const});
    },true);
  }
  admitMember(roomId:string,birth:TopicRoomBirth,ownerId:string,operationId:string,proof:TrustedRoomLock) {
    this.proof(proof);uuid(ownerId);uuid(operationId);
    return this.locked(roomId,unit=>{
      const context=this.context(unit,roomId,birth);this.live(unit,context);this.memberId(context,ownerId);
      const state=this.lifecycle(context).read({roomId,ownerId});
      demand(!state.excluded.includes('member_retired'),'TOPIC_ROOM_MEMBER_RETIRED');
      if(state.excluded.includes('member_admitted')) return Object.freeze({admitted:true as const,sequence:state.sequence,replayed:true});
      const count=this.lifecycle(context).countExcludedScopes(roomId,'member_admitted');
      demand(count.count<context.descriptor.memberLimit,'TOPIC_ROOM_MEMBER_CAPACITY');
      const receipt=this.lifecycle(context).narrow({roomId,ownerId,operationId:this.operation(roomId,ownerId,'admit',operationId),expectedRevision:state.revision,exclude:['member_admitted']});
      return Object.freeze({admitted:true as const,sequence:receipt.sequence,replayed:false});
    });
  }
  retireMember(roomId:string,birth:TopicRoomBirth,ownerId:string,operationId:string,proof:TrustedRoomLock) {
    this.proof(proof);uuid(ownerId);uuid(operationId);
    return this.locked(roomId,unit=>{
      const context=this.context(unit,roomId,birth);this.memberId(context,ownerId);
      const terminal=this.retirement(unit,context);
      if(terminal.retired) return Object.freeze({denied:true as const,roomTerminal:true,sequence:terminal.sequence});
      const state=this.lifecycle(context).read({roomId,ownerId});
      demand(state.excluded.includes('member_admitted'),'TOPIC_ROOM_MEMBER_NOT_ADMITTED');
      if(state.excluded.includes('member_retired')) return Object.freeze({denied:true as const,roomTerminal:false,sequence:state.sequence});
      const receipt=this.lifecycle(context).narrow({roomId,ownerId,operationId:this.operation(roomId,ownerId,'retire-member',operationId),expectedRevision:state.revision,exclude:['member_retired']});
      return Object.freeze({denied:true as const,roomTerminal:false,sequence:receipt.sequence});
    },true);
  }
  retireRoom(roomId:string,birth:TopicRoomBirth,input:{operationId:string;retiredAt:number},proof:TrustedRoomLock) {
    this.proof(proof);exact(input,['operationId','retiredAt']);uuid(input.operationId);int(input.retiredAt);
    return this.locked(roomId,unit=>{
      const context=this.context(unit,roomId,birth),now=this.now();
      demand(input.retiredAt>=context.descriptor.createdAt&&input.retiredAt<=now,'TOPIC_ROOM_RETIREMENT_TIME');
      const intent:RetirementIntent={schema:1,roomId,personalIncarnation:context.descriptor.personalIncarnation,
        lifecycleIncarnation:context.descriptor.lifecycleIncarnation,retiredAt:input.retiredAt,operationId:input.operationId};
      const old=this.intent(unit,context);
      if(old) demand(canonical(old)===canonical(intent),'TOPIC_ROOM_RETIREMENT_CONFLICT');
      else {
        // Missing previously required intent is corruption, not a chance to
        // invent a new closedAt from the caller's current clock after restore.
        demand(!present(join(unit.anchors.birthDirectory,'terminal')),'TOPIC_ROOM_TERMINAL_INTENT_MISSING');
        const existing=this.lifecycle(context).read({roomId,ownerId:context.descriptor.personalIncarnation});
        demand(!existing.excluded.includes('room_retired'),'TOPIC_ROOM_TERMINAL_INTENT_MISSING');
        try {this.publish(unit.anchors.birthDirectory,'retirement',intent);} finally {if(present(join(unit.anchors.birthDirectory,'retirement'))) context.sawIntent=true;}
      }
      // Even a prior failed publication must reach durable file+directory before terminal receipt.
      this.file(unit.anchors.birthDirectory,'retirement',fd=>this.sync(fd));this.syncDirectory(unit.anchors.birthDirectory);
      const terminal=this.terminal(unit,context,old??intent);
      if(terminal) {this.file(unit.anchors.birthDirectory,'terminal',fd=>this.sync(fd));this.syncDirectory(unit.anchors.birthDirectory);}
      else {
        const scope={roomId,ownerId:context.descriptor.personalIncarnation},state=this.lifecycle(context).read(scope);
        if(!state.excluded.includes('room_retired')) this.lifecycle(context).narrow({...scope,operationId:this.operation(roomId,scope.ownerId,'retire-room',input.operationId),expectedRevision:state.revision,exclude:['room_retired']});
      }
      this.phase('after-room-retired');return Object.freeze({retired:true as const,retiredAt:intent.retiredAt});
    },true);
  }
  /** Only personal chain/witness are unlinked. Birth/retirement/lifecycle terminal
   * metadata remain authoritative. No recursive delete or terminal metadata prune. */
  cleanupPersonal(roomId:string,birth:TopicRoomBirth,input:TrustedRoomLock&{minimumTerminalAgeMs:number}) {
    exact(input,['roomTransactionLockHeld','minimumTerminalAgeMs']);this.proof({roomTransactionLockHeld:input.roomTransactionLockHeld});int(input.minimumTerminalAgeMs);
    return this.locked(roomId,unit=>{
      const context=this.context(unit,roomId,birth),terminal=this.retirement(unit,context),now=this.now();
      demand(terminal.retired&&terminal.intent,'TOPIC_ROOM_NOT_DURABLY_RETIRED');
      demand(now>=terminal.intent.retiredAt&&now-terminal.intent.retiredAt>=input.minimumTerminalAgeMs,'TOPIC_ROOM_CLEANUP_TOO_EARLY');
      const pairs=[['personalChainDirectory','chain'],['personalWitnessDirectory','witness']] as const;
      // Validate BOTH directories and every remaining file before the first unlink.
      for(const [key,name] of pairs) {
        const directory=unit.anchors[key];demand(fs.readdirSync(directory).every(value=>value===name),'TOPIC_ROOM_CLEANUP_UNKNOWN_FILE');
        if(present(join(directory,name))) this.file(directory,name,()=>{});
      }
      for(const [key,name] of pairs) {
        const directory=unit.anchors[key],path=join(directory,name);
        if(present(path)) {(this.options.controls?.unlink??fs.unlinkSync)(path);this.phase(name==='chain'?'after-personal-chain-unlink':'after-personal-witness-unlink');}
        this.syncDirectory(directory);this.phase(name==='chain'?'after-personal-chain-directory-sync':'after-personal-witness-directory-sync');
      }
      return Object.freeze({personalRemoved:true as const,retiredAt:terminal.intent.retiredAt,overdue:now-terminal.intent.retiredAt>24*3600000});
    });
  }
  /** Erases the service's member-containing lifecycle files only after publishing
   * authenticated room-only terminal authority. Retained fds/backups/keys are not
   * erased. Retention scheduling and later room-only metadata prune belong to P06. */
  cleanupRetiredMetadata(roomId:string,birth:TopicRoomBirth,input:TrustedRoomLock&{minimumTerminalAgeMs:number}) {
    exact(input,['roomTransactionLockHeld','minimumTerminalAgeMs']);this.proof({roomTransactionLockHeld:input.roomTransactionLockHeld});int(input.minimumTerminalAgeMs);
    return this.locked(roomId,unit=>{
      const context=this.context(unit,roomId,birth),state=this.retirement(unit,context),now=this.now();
      demand(state.retired&&state.intent,'TOPIC_ROOM_NOT_DURABLY_RETIRED');
      demand(now>=state.intent.retiredAt&&now-state.intent.retiredAt>=input.minimumTerminalAgeMs,'TOPIC_ROOM_CLEANUP_TOO_EARLY');
      for(const key of ['personalChainDirectory','personalWitnessDirectory'] as const) demand(fs.readdirSync(unit.anchors[key]).length===0,'TOPIC_ROOM_PERSONAL_FILES_REMAIN');
      let terminal=state.terminal;
      if(!terminal) {
        const chain=this.capability(unit.anchors.lifecycleChainDirectory,'chain',(2*this.memberLimit+2)*FRAME);
        const witness=this.capability(unit.anchors.lifecycleWitnessDirectory,'witness',1024);
        terminal={...state.intent,protocol:2,taxonomy:this.pins.taxonomy,policy:this.pins.policy,lifecycleSequence:state.sequence,
          lifecycleChain:chain,lifecycleWitness:witness};
        this.checkLifecycleFiles(unit,terminal,false);
        try {this.publish(unit.anchors.birthDirectory,'terminal',terminal);} finally {if(present(join(unit.anchors.birthDirectory,'terminal'))) context.sawTerminal=true;}
        terminal=this.terminal(unit,context,state.intent);demand(terminal,'TOPIC_ROOM_TERMINAL_REQUIRED');
      }
      // A previous failed publication may have renamed without directory sync.
      // Refresh durability before any destructive retry, then verify BOTH files.
      this.file(unit.anchors.birthDirectory,'terminal',fd=>this.sync(fd));this.syncDirectory(unit.anchors.birthDirectory);
      this.checkLifecycleFiles(unit,terminal,true);
      for(const [key,name] of [['lifecycleChainDirectory','chain'],['lifecycleWitnessDirectory','witness']] as const) {
        const directory=unit.anchors[key],path=join(directory,name);
        if(present(path)) {(this.options.controls?.unlink??fs.unlinkSync)(path);this.phase(name==='chain'?'after-lifecycle-chain-unlink':'after-lifecycle-witness-unlink');}
        this.syncDirectory(directory);this.phase(name==='chain'?'after-lifecycle-chain-directory-sync':'after-lifecycle-witness-directory-sync');
      }
      return Object.freeze({memberMetadataRemoved:true as const,retiredAt:state.intent.retiredAt,overdue:now-state.intent.retiredAt>24*3600000});
    });
  }
  private context(unit:RoomUnit,roomId:string,birth?:TopicRoomBirth) {
    const bytes=this.read(unit.anchors.birthDirectory,'birth'),decoded=this.decode<BirthDescriptor>(bytes,'birth');
    this.validateBirth(decoded,roomId);const digest=hash(bytes.toString('base64'));let context=this.rooms.get(roomId);
    if(context) demand(context.descriptorHash===digest&&canonical(context.directories)===canonical(unit.directories),'TOPIC_ROOM_BIRTH_CHANGED');
    else {
      demand(this.rooms.size<this.maximumCachedRooms,'TOPIC_ROOM_CACHE_FULL');
      context={descriptor:Object.freeze({...decoded,vocabulary:Object.freeze([...decoded.vocabulary])}),descriptorHash:digest,directories:unit.directories,
        minimumSequence:1,sawIntent:false,sawTerminal:false,wrapped:undefined as unknown as RoomContext['wrapped']};
      const fixed=context;
      context.wrapped=Object.freeze({read:(scope:TopicScope,minimumRevision=0)=>this.locked(roomId,current=>{
        const latest=this.context(current,roomId);demand(latest===fixed,'TOPIC_ROOM_INSTANCE_CHANGED');this.checkScope(roomId,scope);
        this.member(current,latest,scope.ownerId);return this.personal(latest).read(scope,minimumRevision);
      }),narrow:(command:Parameters<PrivateTopicLedger['narrow']>[0])=>this.locked(roomId,current=>{
        const latest=this.context(current,roomId);demand(latest===fixed,'TOPIC_ROOM_INSTANCE_CHANGED');this.checkScope(roomId,command);
        this.member(current,latest,command.ownerId);return this.personal(latest).narrow(command);
      })});
      this.rooms.set(roomId,context);
    }
    if(birth) {
      exact(birth,['incarnation','minimumSequence','taxonomy_digest','policy_digest']);int(birth.minimumSequence,1);
      demand(birth.incarnation===decoded.personalIncarnation&&birth.taxonomy_digest===decoded.taxonomy&&birth.policy_digest===decoded.policy,'TOPIC_ROOM_BIRTH_MISMATCH');
      context.minimumSequence=Math.max(context.minimumSequence,birth.minimumSequence);
    }
    return context;
  }
  private checkScope(roomId:string,scope:TopicScope) {demand(scope.roomId===roomId,'TOPIC_ROOM_SCOPE');uuid(scope.ownerId);}
  private operation(roomId:string,ownerId:string,kind:string,requestId:string) {
    const hex=hash(canonical({domain:DOMAIN+'operation',roomId,ownerId,kind,requestId}));
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
  }
  private memberId(context:RoomContext,ownerId:string) {uuid(ownerId);demand(ownerId!==context.descriptor.personalIncarnation,'TOPIC_ROOM_RESERVED_OWNER');}
  private personal(context:RoomContext) {
    context.personal??=PrivateTopicLedger.open(this.ledgerOptions(context.directories,false),{incarnation:context.descriptor.personalIncarnation,minimumSequence:context.minimumSequence});
    return context.personal;
  }
  private lifecycle(context:RoomContext) {
    context.lifecycle??=PrivateTopicLedger.open(this.ledgerOptions(context.directories,true),{incarnation:context.descriptor.lifecycleIncarnation,minimumSequence:1});
    return context.lifecycle;
  }
  private live(unit:RoomUnit,context:RoomContext) {
    const terminal=this.retirement(unit,context);demand(!terminal.retired&&!terminal.intent,'TOPIC_ROOM_RETIRED');
    const state=this.personal(context).read({roomId:context.descriptor.roomId,ownerId:context.descriptor.personalIncarnation});
    demand(state.sequence>=context.minimumSequence,'TOPIC_ROOM_PERSONAL_REGRESSION');
  }
  private member(unit:RoomUnit,context:RoomContext,ownerId:string) {
    this.live(unit,context);this.memberId(context,ownerId);
    const state=this.lifecycle(context).read({roomId:context.descriptor.roomId,ownerId});
    demand(state.excluded.includes('member_admitted'),'TOPIC_ROOM_MEMBER_NOT_ADMITTED');demand(!state.excluded.includes('member_retired'),'TOPIC_ROOM_MEMBER_RETIRED');
  }
  private intent(unit:RoomUnit,context:RoomContext):RetirementIntent|undefined {
    if(!present(join(unit.anchors.birthDirectory,'retirement'))) {demand(!context.sawIntent,'TOPIC_ROOM_RETIREMENT_REGRESSION');return undefined;}
    const bytes=this.read(unit.anchors.birthDirectory,'retirement'),digest=hash(bytes.toString('base64'));
    demand(context.intentHash===undefined||context.intentHash===digest,'TOPIC_ROOM_RETIREMENT_CHANGED');
    const value=this.decode<RetirementIntent>(bytes,'retirement');
    exact(value,['schema','roomId','personalIncarnation','lifecycleIncarnation','retiredAt','operationId']);
    demand(value.schema===1&&value.roomId===context.descriptor.roomId&&value.personalIncarnation===context.descriptor.personalIncarnation&&
      value.lifecycleIncarnation===context.descriptor.lifecycleIncarnation,'TOPIC_ROOM_RETIREMENT_MISMATCH');
    uuid(value.operationId);int(value.retiredAt);demand(value.retiredAt>=context.descriptor.createdAt,'TOPIC_ROOM_RETIREMENT_TIME');
    context.sawIntent=true;context.intentHash=digest;return value;
  }
  private retirement(unit:RoomUnit,context:RoomContext) {
    const intent=this.intent(unit,context),terminal=this.terminal(unit,context,intent);
    if(terminal) return {retired:true,sequence:terminal.lifecycleSequence,intent,terminal};
    const state=this.lifecycle(context).read({roomId:context.descriptor.roomId,ownerId:context.descriptor.personalIncarnation});
    return {retired:state.excluded.includes('room_retired'),sequence:state.sequence,intent,terminal:undefined};
  }
  private terminal(unit:RoomUnit,context:RoomContext,intent:RetirementIntent|undefined):TerminalDescriptor|undefined {
    if(!present(join(unit.anchors.birthDirectory,'terminal'))) {demand(!context.sawTerminal,'TOPIC_ROOM_TERMINAL_REGRESSION');return undefined;}
    const bytes=this.read(unit.anchors.birthDirectory,'terminal'),digest=hash(bytes.toString('base64'));
    demand(context.terminalHash===undefined||context.terminalHash===digest,'TOPIC_ROOM_TERMINAL_CHANGED');
    const value=this.decode<TerminalDescriptor>(bytes,'terminal');
    exact(value,['schema','protocol','roomId','personalIncarnation','lifecycleIncarnation','retiredAt','operationId','taxonomy','policy','lifecycleSequence','lifecycleChain','lifecycleWitness']);
    demand(intent&&value.schema===1&&value.protocol===2&&value.roomId===context.descriptor.roomId&&value.personalIncarnation===context.descriptor.personalIncarnation&&
      value.lifecycleIncarnation===context.descriptor.lifecycleIncarnation&&value.taxonomy===this.pins.taxonomy&&value.policy===this.pins.policy&&
      value.retiredAt===intent.retiredAt&&value.operationId===intent.operationId,'TOPIC_ROOM_TERMINAL_MISMATCH');
    int(value.lifecycleSequence,2);demand(value.lifecycleSequence<=2*this.memberLimit+2);
    for(const [capability,maximum] of [[value.lifecycleChain,(2*this.memberLimit+2)*FRAME],[value.lifecycleWitness,1024]] as const) {
      exact(capability,['bytes','sha256']);int(capability.bytes,1);demand(capability.bytes<=maximum&&typeof capability.sha256==='string'&&DIGEST.test(capability.sha256));
    }
    demand(value.lifecycleChain.bytes===value.lifecycleSequence*FRAME&&value.lifecycleWitness.bytes===1024,'TOPIC_ROOM_TERMINAL_CAPABILITY');
    context.sawTerminal=true;context.terminalHash=digest;return value;
  }
  private capability(directory:string,name:string,maximum:number):FileCapability {
    const bytes=this.readBounded(directory,name,maximum);return Object.freeze({bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
  }
  private checkLifecycleFiles(unit:RoomUnit,terminal:TerminalDescriptor,allowAbsent:boolean) {
    for(const [key,name,capability] of [['lifecycleChainDirectory','chain',terminal.lifecycleChain],['lifecycleWitnessDirectory','witness',terminal.lifecycleWitness]] as const) {
      const directory=unit.anchors[key];demand(fs.readdirSync(directory).every(value=>value===name),'TOPIC_ROOM_CLEANUP_UNKNOWN_FILE');
      if(present(join(directory,name))) {
        const actual=this.capability(directory,name,capability.bytes);
        demand(actual.bytes===capability.bytes&&actual.sha256===capability.sha256,'TOPIC_ROOM_TERMINAL_FILE_MISMATCH');
      } else demand(allowAbsent,'TOPIC_ROOM_REQUIRED_METADATA_MISSING');
    }
  }
  private validateBirth(value:BirthDescriptor,roomId:string) {
    exact(value,['schema','protocol','roomId','createdAt','personalIncarnation','lifecycleIncarnation','taxonomy','policy','vocabulary','memberLimit','maximumPersonalRecords']);
    demand(value.schema===1&&value.protocol===2&&value.roomId===roomId,'TOPIC_ROOM_BIRTH_MISMATCH');uuid(value.personalIncarnation);uuid(value.lifecycleIncarnation);
    int(value.createdAt);demand(value.personalIncarnation!==value.lifecycleIncarnation);
    demand(value.taxonomy===this.pins.taxonomy&&value.policy===this.pins.policy&&canonical(value.vocabulary)===canonical(this.pins.vocabulary),'TOPIC_ROOM_PINS');
    demand(value.memberLimit===this.memberLimit&&value.maximumPersonalRecords===this.maximumPersonalRecords,'TOPIC_ROOM_CONFIGURATION');
  }
  private ledgerOptions(d:RoomStorageDirectories,lifecycle:boolean):TopicLedgerOptions {
    const controls=lifecycle?this.options.lifecycleControls:this.options.personalControls;
    return {chainDirectory:lifecycle?d.lifecycleChainDirectory:d.personalChainDirectory,witnessDirectory:lifecycle?d.lifecycleWitnessDirectory:d.personalWitnessDirectory,
      keys:this.options.keys,pins:lifecycle?topicLifecyclePins:this.pins,maximumRecords:lifecycle?2*this.memberLimit+2:this.maximumPersonalRecords,...(controls?{controls}:{})};
  }
  private encode(value:unknown,kind:'birth'|'retirement'|'terminal') {
    const cipher=this.options.keys.encrypt(value,DOMAIN+kind),unsigned={schema:1,cipher};
    const bytes=Buffer.from(canonical({...unsigned,mac:this.options.keys.fingerprint({domain:DOMAIN+kind+':mac',value:unsigned})}));
    demand(bytes.length<FRAME);const padded=Buffer.alloc(FRAME,32);bytes.copy(padded);padded[FRAME-1]=10;return padded;
  }
  private decode<T>(bytes:Buffer,kind:'birth'|'retirement'|'terminal'):T {
    demand(bytes.length===FRAME&&bytes[FRAME-1]===10);const value:unknown=JSON.parse(bytes.toString('utf8'));exact(value,['schema','cipher','mac']);
    demand(value.schema===1&&typeof value.mac==='string');exact(value.cipher,['key_version','nonce','data','tag','format']);
    const cipher=value.cipher as unknown as Cipher;
    demand(cipher.format==='padded-json-v1'&&typeof cipher.key_version==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(cipher.key_version)&&value.mac.startsWith(cipher.key_version+':'));
    for(const [field,length] of [[cipher.nonce,12],[cipher.tag,16],[cipher.data,16384]] as const) demand(typeof field==='string'&&Buffer.from(field,'base64').length===length&&Buffer.from(field,'base64').toString('base64')===field);
    const text=Buffer.from(canonical(value)),padded=Buffer.alloc(FRAME,32);demand(text.length<FRAME);text.copy(padded);padded[FRAME-1]=10;demand(padded.equals(bytes));
    demand(this.options.keys.matchesFingerprint({domain:DOMAIN+kind+':mac',value:{schema:1,cipher}},value.mac),'TOPIC_ROOM_AUTHENTICATION');
    return this.options.keys.decrypt<T>(cipher,DOMAIN+kind);
  }
  private phase(phase:TopicRoomPhase) {this.options.controls?.phase?.(phase);}
  private sync(fd:number) {(this.options.controls?.sync??fs.fsyncSync)(fd);}
  private syncDirectory(path:string) {const fd=fs.openSync(path,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY);try {this.sync(fd);} finally {fs.closeSync(fd);}}
  private statFile(stat:fs.Stats) {demand(stat.isFile()&&stat.uid===process.getuid!()&&(stat.mode&0o7777)===0o600&&stat.nlink===1,'TOPIC_ROOM_FILE_UNSAFE');}
  private file<T>(directory:string,name:string,run:(fd:number)=>T) {
    const path=join(directory,name),fd=fs.openSync(path,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
    try {const own=fs.fstatSync(fd),named=fs.lstatSync(path);this.statFile(own);demand(own.dev===named.dev&&own.ino===named.ino,'TOPIC_ROOM_FILE_CHANGED');return run(fd);} finally {fs.closeSync(fd);}
  }
  private read(directory:string,name:string) {
    const bytes=this.readBounded(directory,name,FRAME);demand(bytes.length===FRAME,'TOPIC_ROOM_FILE_SIZE');return bytes;
  }
  private readBounded(directory:string,name:string,maximum:number) {
    return this.file(directory,name,fd=>{
      const before=fs.fstatSync(fd);demand(before.size>0&&before.size<=maximum,'TOPIC_ROOM_FILE_SIZE');const bytes=Buffer.alloc(before.size);let offset=0;
      while(offset<bytes.length) {const count=fs.readSync(fd,bytes,offset,bytes.length-offset,offset);demand(count>0);offset+=count;}
      const after=fs.fstatSync(fd);this.statFile(after);demand(after.size===before.size&&after.mtimeMs===before.mtimeMs&&after.ctimeMs===before.ctimeMs&&
        fs.readSync(fd,Buffer.alloc(1),0,1,offset)===0,'TOPIC_ROOM_FILE_CHANGED');return bytes;
    });
  }
  private publish(directory:string,name:'birth'|'retirement'|'terminal',value:unknown) {
    demand(!present(join(directory,name)),'TOPIC_ROOM_IMMUTABLE_FILE_EXISTS');
    const temporary=join(directory,name+'.new-'+randomBytes(12).toString('hex'));
    const fd=fs.openSync(temporary,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
    try {
      this.statFile(fs.fstatSync(fd));const bytes=this.encode(value,name);
      demand((this.options.controls?.write??((f,b)=>fs.writeSync(f,b)))(fd,bytes)===bytes.length,'TOPIC_ROOM_SHORT_WRITE');
      this.phase(('after-'+name+'-write') as TopicRoomPhase);this.sync(fd);this.phase(('after-'+name+'-sync') as TopicRoomPhase);
      (this.options.controls?.rename??fs.renameSync)(temporary,join(directory,name));this.phase(('after-'+name+'-rename') as TopicRoomPhase);
      this.syncDirectory(directory);this.phase(('after-'+name+'-directory-sync') as TopicRoomPhase);
    } finally {fs.closeSync(fd);if(present(temporary)) fs.unlinkSync(temporary);}
  }
  private directory(path:string) {
    const root=parse(path).root;let prefix=root;
    for(const part of path.slice(root.length).split(sep).filter(Boolean)) {prefix=join(prefix,part);demand(!fs.lstatSync(prefix).isSymbolicLink(),'TOPIC_ROOM_SYMLINK');}
    const named=fs.lstatSync(path),fd=fs.openSync(path,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY|fs.constants.O_NOFOLLOW);
    try {const own=fs.fstatSync(fd);demand(own.isDirectory()&&own.uid===process.getuid!()&&(own.mode&0o7777)===0o700&&own.dev===named.dev&&own.ino===named.ino,'TOPIC_ROOM_DIRECTORY_UNSAFE');return fd;}
    catch(error) {fs.closeSync(fd);throw error;}
  }
  private locked<T>(roomId:string,run:(unit:RoomUnit)=>T,metadataOnly=false):T {
    uuid(roomId);const supplied=this.options.directories(roomId,metadataOnly);exact(supplied,['birthDirectory','personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory']);
    const directories=Object.fromEntries(Object.entries(supplied).map(([key,value])=>[key,resolve(value as string)])) as unknown as RoomStorageDirectories;
    const paths=Object.values(directories);demand(paths.every((path,i)=>paths.every((other,j)=>i===j||(path!==other&&!path.startsWith(other+sep)))),'TOPIC_ROOM_DIRECTORIES');
    const opened:Array<{key:keyof RoomStorageDirectories;fd:number}>=[];
    try {
      for(const key of Object.keys(directories) as Array<keyof RoomStorageDirectories>) {
        if(metadataOnly&&(key==='personalChainDirectory'||key==='personalWitnessDirectory')) continue;
        opened.push({key,fd:this.directory(directories[key])});
      }
      const identities=opened.map(({fd})=>{const s=fs.fstatSync(fd);return s.dev+':'+s.ino;});demand(new Set(identities).size===opened.length,'TOPIC_ROOM_DIRECTORIES');
      const anchors={...directories,...Object.fromEntries(opened.map(({key,fd})=>[key,`/proc/self/fd/${fd}`]))} as RoomUnit['anchors'];
      const lock=join(anchors.birthDirectory,'room.lock');let fd:number;
      try {fd=fs.openSync(lock,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);} catch {throw new TopicRoomLifecycleError('TOPIC_ROOM_BUSY');}
      try {this.statFile(fs.fstatSync(fd));this.syncDirectory(anchors.birthDirectory);return run({directories,anchors});}
      finally {
        let own:fs.Stats,named:fs.Stats;try {own=fs.fstatSync(fd);named=fs.lstatSync(lock);} finally {fs.closeSync(fd);}
        demand(own.dev===named.dev&&own.ino===named.ino,'TOPIC_ROOM_LOCK_CHANGED');fs.unlinkSync(lock);this.syncDirectory(anchors.birthDirectory);
      }
    } finally {for(const {fd} of opened.reverse()) fs.closeSync(fd);}
  }
}
