/** Room-owned topic settings adapter. Not activated by server.ts. Its required
 * lifecycle and revocation hooks are trust boundaries, not authenticated HTTP
 * claims. A restored protocol2 room is NEVER initialized by a read or mutation. */
import type pg from 'pg';
import {Rooms,revision,timers} from './rooms.js';
import {canonical,hash,requireThat,type Cipher} from './security.js';
import type {PrivateTopicLedger,RequiredTopicLedger,TopicPins,TopicSafetyState} from './private-topic-ledger.js';
import type {TopicSafetyState as PlannerTopicSafetyState} from '@venus/relationship-engine';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
type Auth=Awaited<ReturnType<Rooms['access']>>;
export interface TopicRoomBirth extends RequiredTopicLedger {taxonomy_digest:string;policy_digest:string}
export interface PrivateTopicLifecycle {
 /** Must check a protected external birth/retirement descriptor and preserve the
  * same live driver instance/process floor. Must not create missing files. */
 open(roomId:string,birth:TopicRoomBirth):Pick<PrivateTopicLedger,'read'|'narrow'>;
 /** Synchronous final external retirement/instance fence; no IO awaits after it. */
 assertLive(roomId:string,birth:TopicRoomBirth):void;
 /** Under the room transaction lock, revoke every dependent epoch/chat/advice
  * and queued delivery before publishing a changed setting. Never a no-op in a
  * serving implementation. Any failure aborts DB mutation; ledger stays strict. */
 revoke(c:pg.PoolClient,roomId:string,ownerId:string):Promise<void>;
}
export interface PrivateTopicView {
 schema_version:1;room_id:string;owner_member_id:string;rev:number;safety_revision:number;
 taxonomy_digest:string;allow_topic_ids:readonly string[];exclude_topic_ids:readonly string[];
}
export interface PrivateTopicsPut {request_id:string;expected_rev:number;taxonomy_digest:string;allow_topic_ids:string[];exclude_topic_ids:string[]}
export interface PrivateTopicsExclude {request_id:string;taxonomy_digest:string;topic_ids:string[]}
interface Preference {schema_version:1;room_id:string;owner_member_id:string;rev:number;incarnation:string;taxonomy_digest:string;policy_digest:string;allow:string[];excluded:string[]}
interface PreferenceRow {rev:string;cipher:Cipher}
function exact(value:unknown,fields:string[]):asserts value is Record<string,unknown> {
 requireThat(value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===[...fields].sort().join(','),'INVALID_REQUEST',400);
}
function topicList(value:unknown,vocabulary:readonly string[]):string[] {
 requireThat(Array.isArray(value)&&value.length<=64&&value.every(t=>typeof t==='string'&&vocabulary.includes(t))&&new Set(value).size===value.length,'INVALID_TOPIC_IDS',400);
 return [...value].sort();
}
function requestBase(value:Record<string,unknown>,taxonomy:string) {
 requireThat(typeof value.request_id==='string'&&UUID.test(value.request_id),'INVALID_REQUEST',400);
 requireThat(value.taxonomy_digest===taxonomy,'TOPIC_TAXONOMY_MISMATCH',409);
}
export class PrivateTopicPreferences {
 readonly pins:TopicPins;
 private readonly observed=new WeakMap<PlannerTopicSafetyState,{client:pg.PoolClient;room:string;members:{id:string;loaded:Awaited<ReturnType<PrivateTopicPreferences['loadOwner']>>}[]}>();
 constructor(readonly rooms:Rooms,private readonly lifecycle:PrivateTopicLifecycle,pins:TopicPins) {
  requireThat(/^[a-f0-9]{64}$/.test(pins.taxonomy)&&/^[a-f0-9]{64}$/.test(pins.policy)&&pins.vocabulary.length>0&&pins.vocabulary.length<=64&&pins.vocabulary.every(t=>/^[a-z][a-z0-9_]{0,47}$/.test(t))&&new Set(pins.vocabulary).size===pins.vocabulary.length,'TOPIC_POLICY_INVALID',503);
  this.pins=Object.freeze({...pins,vocabulary:Object.freeze([...pins.vocabulary].sort())});
 }
 private async birth(c:pg.PoolClient,roomId:string):Promise<TopicRoomBirth> {
  const room=(await c.query<{private_protocol:number}>('SELECT private_protocol FROM rooms WHERE id=$1',[roomId])).rows[0];
  requireThat(room?.private_protocol===2,'PRIVATE_TOPICS_UNAVAILABLE',404);
  const row=(await c.query<{incarnation:string;minimum_sequence:string;taxonomy_digest:string;policy_digest:string}>('SELECT incarnation,minimum_sequence,taxonomy_digest,policy_digest FROM private_topic_room_births WHERE room_id=$1',[roomId])).rows[0];
  requireThat(row&&UUID.test(row.incarnation)&&row.taxonomy_digest===this.pins.taxonomy&&row.policy_digest===this.pins.policy,'TOPIC_BIRTH_UNAVAILABLE',503);
  const minimumSequence=revision(row.minimum_sequence);requireThat(minimumSequence>=1&&minimumSequence<=4096,'TOPIC_BIRTH_UNAVAILABLE',503);
  return Object.freeze({incarnation:row.incarnation,minimumSequence,taxonomy_digest:row.taxonomy_digest,policy_digest:row.policy_digest});
 }
 private aad(roomId:string,owner:string,birth:TopicRoomBirth,rev:number) {return `private-topics:${roomId}:${owner}:${birth.incarnation}:${rev}:1`;}
 private async load(c:pg.PoolClient,a:Auth) {
  return this.loadOwner(c,a.room.id,a.member.id);
 }
 private async loadOwner(c:pg.PoolClient,room:string,owner:string) {
  const birth=await this.birth(c,room),ledger=this.lifecycle.open(room,birth);
  const row=(await c.query<PreferenceRow>('SELECT rev,cipher FROM private_topic_preferences WHERE room_id=$1 AND owner_member_id=$2',[room,owner])).rows[0];
  const rev=row?revision(row.rev):0;
  let allow:string[]=[],excluded:string[]=[];
  if(row) {
   const data=this.rooms.options.keys.decrypt<Preference>(row.cipher,this.aad(room,owner,birth,rev));
   exact(data,['schema_version','room_id','owner_member_id','rev','incarnation','taxonomy_digest','policy_digest','allow','excluded']);
   requireThat(data.schema_version===1&&data.room_id===room&&data.owner_member_id===owner&&data.rev===rev&&data.incarnation===birth.incarnation&&data.taxonomy_digest===this.pins.taxonomy&&data.policy_digest===this.pins.policy,'TOPIC_PREFERENCES_INVALID',503);
   allow=topicList(data.allow,this.pins.vocabulary);excluded=topicList(data.excluded,this.pins.vocabulary);
   requireThat(!allow.some(t=>excluded.includes(t)),'TOPIC_PREFERENCES_INVALID',503);
  }
  const safety=ledger.read({roomId:room,ownerId:owner});
  requireThat(safety.incarnation===birth.incarnation&&safety.taxonomy===this.pins.taxonomy&&safety.policy===this.pins.policy&&safety.sequence>=birth.minimumSequence&&excluded.every(t=>safety.excluded.includes(t)),'TOPIC_LEDGER_DB_AHEAD',503);
  return {birth,ledger,rev,safety,allow:allow.filter(t=>!safety.excluded.includes(t))};
 }
 /** Internal planner adapter; caller owns the Rooms transaction/advisory lock.
  * Exact returned objects carry process-local proofs and cannot be recreated
  * from restored JSON, cached projections, or HTTP supplied member IDs. */
 async readForPlanner(c:pg.PoolClient,roomId:string,exactMemberIds:readonly string[]):Promise<PlannerTopicSafetyState> {
  requireThat(exactMemberIds.length>=2&&exactMemberIds.length<=8&&new Set(exactMemberIds).size===exactMemberIds.length&&exactMemberIds.every(id=>UUID.test(id)),'TOPIC_SAFETY_MEMBERS_INVALID',503);
  const ids=[...exactMemberIds].sort(),rows=(await c.query<{id:string}>('SELECT id FROM room_members WHERE room_id=$1 AND id=ANY($2::uuid[]) AND removed_at IS NULL AND slot IS NOT NULL ORDER BY id',[roomId,ids])).rows;
  requireThat(canonical(rows.map(r=>r.id).sort())===canonical(ids),'TOPIC_SAFETY_MEMBERS_CHANGED',409);
  const members=[];
  for(const id of ids) members.push({id,loaded:await this.loadOwner(c,roomId,id)});
  const sequence=members[0]!.loaded.safety.sequence;
  requireThat(members.every(m=>m.loaded.safety.sequence===sequence&&m.loaded.rev<=4096),'TOPIC_STATE_CHANGED',409);
  // There are at most eight DB revisions of <=4096 each. A single durable
  // exclusion increments the protected ledger high part by 65536, exceeding
  // every possible rollback of the DB low part. Allow removal always requires
  // such an exclusion. A pure allow-addition rollback only makes access stricter.
  const stride=65536;
  const state:PlannerTopicSafetyState=Object.freeze({room_id:roomId,
   revision:sequence*stride+members.reduce((sum,m)=>sum+m.loaded.rev,0)+1,
   members:Object.freeze(members.map(({id,loaded})=>Object.freeze({member_id:id,revision:loaded.safety.revision*stride+loaded.rev+1,
    allow_topic_ids:Object.freeze([...loaded.allow]),excluded_topic_ids:Object.freeze([...loaded.safety.excluded])}))) });
  requireThat(Number.isSafeInteger(state.revision)&&state.members.every(m=>Number.isSafeInteger(m.revision)),'REVISION_OVERFLOW',503);
  this.observed.set(state,{client:c,room:roomId,members});this.assertPlannerCurrent(roomId,state);return state;
 }
 assertPlannerCurrent(roomId:string,state:PlannerTopicSafetyState):void {
  const proof=this.observed.get(state);requireThat(proof&&proof.room===roomId&&state.room_id===roomId,'TOPIC_OBSERVATION_REQUIRED',503);
  for(const {id,loaded} of proof.members) {
   this.lifecycle.assertLive(roomId,loaded.birth);
   const fresh=loaded.ledger.read({roomId,ownerId:id},loaded.safety.revision);
   requireThat(fresh.incarnation===loaded.safety.incarnation&&fresh.sequence===loaded.safety.sequence&&fresh.revision===loaded.safety.revision&&canonical(fresh.excluded)===canonical(loaded.safety.excluded),'TOPIC_STATE_CHANGED',409);
  }
 }
 async excludeForPlannerLocked(c:pg.PoolClient,a:Auth,observed:PlannerTopicSafetyState,requestId:string,topics:readonly string[]):Promise<PlannerTopicSafetyState> {
  const proof=this.observed.get(observed);
  requireThat(proof&&proof.client===c&&proof.room===a.room.id&&proof.members.some(m=>m.id===a.member.id),'TOPIC_OBSERVATION_REQUIRED',503);
  requireThat(UUID.test(requestId),'INVALID_REQUEST',400);
  const exclude=topicList(topics,this.pins.vocabulary);requireThat(exclude.length>0,'INVALID_TOPIC_IDS',400);
  this.assertPlannerCurrent(a.room.id,observed);
  // changeLocked performs a fresh exact session/offer/TTL/external fence after
  // all awaited reads and BEFORE irreversible narrowing. No nested transaction.
  await this.changeLocked(c,a,requestId,{kind:'exclude',exclude});
  return this.readForPlanner(c,a.room.id,proof.members.map(m=>m.id));
 }
 private view(a:Auth,loaded:Awaited<ReturnType<PrivateTopicPreferences['load']>>):PrivateTopicView {
  return Object.freeze({schema_version:1,room_id:a.room.id,owner_member_id:a.member.id,rev:loaded.rev,safety_revision:loaded.safety.revision,taxonomy_digest:this.pins.taxonomy,allow_topic_ids:Object.freeze([...loaded.allow]),exclude_topic_ids:Object.freeze([...loaded.safety.excluded])});
 }
 private async finalFence(c:pg.PoolClient,a:Auth,loaded:Awaited<ReturnType<PrivateTopicPreferences['load']>>) {
  // This is the final awaited read. The enclosing room lock serializes normal
  // removal/reaccept/close; current time and external state are checked after it.
  const row=(await c.query<{member_id:string;expires_at:Date;offer_version:string;offer_digest:string}>(`SELECT s.member_id,s.expires_at,e.offer_version,e.offer_digest
   FROM room_sessions s JOIN room_members m ON m.room_id=s.room_id AND m.id=s.member_id
   JOIN entry_acceptances e ON e.room_id=m.room_id AND e.member_id=m.id
   WHERE s.room_id=$1 AND s.token_hash=$2 AND s.revoked_at IS NULL AND m.removed_at IS NULL`,[a.room.id,a.sessionHash])).rows[0];
  const fresh=loaded.ledger.read({roomId:a.room.id,ownerId:a.member.id},loaded.safety.revision);
  requireThat(fresh.revision===loaded.safety.revision&&canonical(fresh.excluded)===canonical(loaded.safety.excluded),'TOPIC_STATE_CHANGED',409);
  this.lifecycle.assertLive(a.room.id,loaded.birth);
  const closed=this.rooms.options.ledger.contains(a.room.id),offer=this.rooms.options.offer(),now=this.rooms.now();
  requireThat(row&&row.member_id===a.member.id&&row.expires_at.getTime()>now,'AUTH_REQUIRED',401);
  requireThat(offer&&row.offer_version===offer.version&&row.offer_digest===offer.digest,'ENTRY_REACCEPT_REQUIRED',403);
  requireThat(a.room.state==='open'&&a.room.last_activity_at.getTime()+timers.idle>now&&!closed,'ROOM_CLOSED',403);
 }
 async dispatch(roomId:string,session:string|undefined,enqueue:(view:PrivateTopicView)=>void) {
  return this.rooms.transaction(async c=>{
   const a=await this.rooms.access(c,roomId,session,false,true),loaded=await this.load(c,a);
   await this.finalFence(c,a,loaded);enqueue(this.view(a,loaded));
  });
 }
 async put(roomId:string,session:string|undefined,input:unknown) {
  exact(input,['request_id','expected_rev','taxonomy_digest','allow_topic_ids','exclude_topic_ids']);requestBase(input,this.pins.taxonomy);
  requireThat(Number.isSafeInteger(input.expected_rev)&&(input.expected_rev as number)>=0,'INVALID_REQUEST',400);
  const allow=topicList(input.allow_topic_ids,this.pins.vocabulary),exclude=topicList(input.exclude_topic_ids,this.pins.vocabulary);
  requireThat(!allow.some(t=>exclude.includes(t)),'TOPIC_SETS_OVERLAP',400);
  return this.change(roomId,session,input.request_id as string,{kind:'put',expected_rev:input.expected_rev,allow,exclude});
 }
 async exclude(roomId:string,session:string|undefined,input:unknown) {
  exact(input,['request_id','taxonomy_digest','topic_ids']);requestBase(input,this.pins.taxonomy);
  const exclude=topicList(input.topic_ids,this.pins.vocabulary);requireThat(exclude.length>0,'INVALID_TOPIC_IDS',400);
  return this.change(roomId,session,input.request_id as string,{kind:'exclude',exclude});
 }
 private async change(roomId:string,session:string|undefined,requestId:string,command:{kind:'put'|'exclude';expected_rev?:unknown;allow?:string[];exclude:string[]}) {
  return this.rooms.transaction(async c=>{
   const a=await this.rooms.access(c,roomId,session,false,true);
   return this.changeLocked(c,a,requestId,command);
  });
 }
 private async changeLocked(c:pg.PoolClient,a:Auth,requestId:string,command:{kind:'put'|'exclude';expected_rev?:unknown;allow?:string[];exclude:string[]}) {
   const roomId=a.room.id,loaded=await this.load(c,a);
   const input={taxonomy:this.pins.taxonomy,...command};
   const old=(await c.query<{request_hash:string}>('SELECT request_hash FROM private_topic_requests WHERE room_id=$1 AND owner_member_id=$2 AND request_id=$3',[roomId,a.member.id,requestId])).rows[0];
   if(old) {
    requireThat(this.rooms.options.keys.matchesFingerprint(input,old.request_hash),'IDEMPOTENCY_CONFLICT',409);
    await this.finalFence(c,a,loaded);return this.view(a,loaded);
   }
   const count=(await c.query<{count:string}>('SELECT count(*) AS count FROM private_topic_requests WHERE room_id=$1',[roomId])).rows[0];
   requireThat(Number(count?.count)<4096,'TOPIC_REQUEST_CAPACITY',503);
   let allow=loaded.allow;
   if(command.kind==='put') {
    requireThat(command.expected_rev===loaded.rev,'REVISION_CONFLICT',409);allow=command.allow!;
    requireThat(!allow.some(t=>loaded.safety.excluded.includes(t)),'TOPIC_EXCLUSION_PERMANENT',409);
    requireThat(loaded.allow.every(t=>allow.includes(t)||command.exclude.includes(t)),'EXPLICIT_TOPIC_EXCLUSION_REQUIRED',400);
   }
   let safety:TopicSafetyState=loaded.safety;
   const narrower=command.exclude.filter(t=>!safety.excluded.includes(t));
   // Ledger publication cannot roll back with PostgreSQL. Recheck credentials,
   // expiry and external retirement AFTER all preceding awaited reads and before
   // the first durable change, as well as fencing the eventual response below.
   await this.finalFence(c,a,loaded);
   if(narrower.length) {
    // Deterministic internal operation ID avoids reusing the request UUID as a
    // global ledger operation across independent members or endpoint kinds.
    const hex=hash(canonical({roomId,owner:a.member.id,requestId,kind:command.kind}));
    const operationId=`${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
    safety=loaded.ledger.narrow({roomId,ownerId:a.member.id,operationId,expectedRevision:safety.revision,exclude:narrower});
   }
   allow=allow.filter(t=>!safety.excluded.includes(t));
   const rev=loaded.rev+1;requireThat(Number.isSafeInteger(rev),'REVISION_OVERFLOW',503);
   await this.lifecycle.revoke(c,roomId,a.member.id);
   const data:Preference={schema_version:1,room_id:roomId,owner_member_id:a.member.id,rev,incarnation:loaded.birth.incarnation,taxonomy_digest:this.pins.taxonomy,policy_digest:this.pins.policy,allow,excluded:[...safety.excluded]};
   const cipher=this.rooms.options.keys.encrypt(data,this.aad(roomId,a.member.id,loaded.birth,rev));
   await c.query(`INSERT INTO private_topic_preferences(room_id,owner_member_id,rev,cipher) VALUES($1,$2,$3,$4)
    ON CONFLICT(room_id,owner_member_id) DO UPDATE SET rev=$3,cipher=$4`,[roomId,a.member.id,rev,cipher]);
   await c.query('INSERT INTO private_topic_requests(room_id,owner_member_id,request_id,request_hash,created_at) VALUES($1,$2,$3,$4,$5)',[roomId,a.member.id,requestId,this.rooms.options.keys.fingerprint(input),new Date(this.rooms.now())]);
   const next={...loaded,rev,allow,safety};
   await this.finalFence(c,a,next);
   return this.view(a,next);
 }
}
