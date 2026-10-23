import type {TopicConversationView,TopicChatView,TopicRoundTarget} from '@venus/contracts';
import {presentationNow} from './presentation-clock.js';
import type {RefusalEvidence} from './game-controls.js';
export interface TopicScope {room:string;member:string;identity:number;transport:number;session:string;round:string;rev:number}
export interface TopicRead {generation:number;scope:string}
const obj=(v:unknown):v is Record<string,unknown>=>Boolean(v&&typeof v==='object'&&!Array.isArray(v));
const integer=(v:unknown)=>Number.isSafeInteger(v)&&Number(v)>=0;
const date=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const offer=(v:unknown,kind:string)=>v===null||obj(v)&&typeof v.offer_id==='string'&&v.consent_scope===kind&&integer(v.proposal_revision)&&['pending','accepted'].includes(String(v.own_state))&&['pending','active'].includes(String(v.state))&&date(v.expires_at);
export function validTopicTarget(value:unknown,scope:TopicScope):value is TopicRoundTarget{return obj(value)&&value.schema_version===2&&value.room_id===scope.room&&value.session_id===scope.session&&value.round_id===scope.round&&value.game_rev===scope.rev&&integer(value.content_revision)&&offer(value.invitation,'invitation')&&offer(value.action,'action')&&[null,'truth','dare'].includes(value.choice as null)&&(value.condition===null||obj(value.condition)&&integer(value.condition.revision)&&typeof value.condition.text==='string');}
export function validTopicConversation(v:unknown,s:TopicScope):v is TopicConversationView{
 if(!obj(v)||v.schema_version!==2||v.room_id!==s.room||v.session_id!==s.session||v.round_id!==s.round||v.game_rev!==s.rev||typeof v.conversation_id!=='string'||!integer(v.revision)||!integer(v.epoch)||!['empty','pending','active','closed'].includes(String(v.state))||!date(v.server_time)||!date(v.expires_at)||!Array.isArray(v.advice)||v.advice.length>32)return false;
 const o=v.offer;if(o!==undefined&&(!obj(o)||typeof o.offer_id!=='string'||o.epoch!==v.epoch||!integer(o.proposal_revision)||typeof o.token!=='string'||typeof o.own_accepted!=='boolean'||!date(o.expires_at)||!Array.isArray(o.topics)||o.topics.length<1||o.topics.length>64||new Set(o.topics.map(t=>obj(t)?t.topic_id:null)).size!==o.topics.length||!o.topics.every(t=>obj(t)&&typeof t.topic_id==='string'&&typeof t.label==='string')))return false;
 if(v.prompt!==undefined&&(v.state!=='active'||!obj(o)||o.own_accepted!==true||!obj(v.prompt)||typeof v.prompt.text!=='string'||!(v.prompt.condition===null||typeof v.prompt.condition==='string')||![null,'truth','dare'].includes(v.prompt.choice as null)))return false;
 return v.advice.every(a=>obj(a)&&typeof a.advice_id==='string'&&integer(a.revision)&&a.epoch===v.epoch&&['sent','received'].includes(String(a.direction))&&['pending','accepted'].includes(String(a.state))&&date(a.expires_at)&&(a.text===undefined||typeof a.text==='string')&&!(a.direction==='received'&&a.state!=='accepted'&&a.text!==undefined));
}
export function validTopicChat(v:unknown,c:TopicConversationView):v is TopicChatView{return obj(v)&&v.schema_version===2&&v.conversation_id===c.conversation_id&&v.epoch===c.epoch&&integer(v.revision)&&['active','cleared'].includes(String(v.state))&&Array.isArray(v.messages)&&v.messages.length<=256&&v.messages.every(m=>obj(m)&&typeof m.message_id==='string'&&integer(m.sequence)&&['sent','received'].includes(String(m.direction))&&typeof m.text==='string');}
/** A local presentation cache, never an authorization source. A clear destroys
 * private values and changes the generation before effects/network promises run.
 * Server durations are anchored at request START, bounded independently of clock
 * skew, and cannot extend a previously seen grant phase or revive a prior epoch. */
export class TopicCache{
 private lastSignal:unknown=null;
 revoke(signal:unknown){if(signal!==this.lastSignal){this.lastSignal=signal;this.clear();return true;}return false;}
 private scope='';private boundScope:TopicScope|null=null;private generation=0;private clock=0;private deadlines=new Map<string,number>();private phaseFloors=new Map<string,number>();private epochFloor=-1;private revisionFloor=-1;private contentFloor=-1;private conversationId='';
 target:TopicRoundTarget|null=null;conversation:TopicConversationView|null=null;chat:TopicChatView|null=null;until=0;
 now(value=presentationNow()){return this.clock=Math.max(this.clock,value);}
 bind(scope:TopicScope|null){const key=JSON.stringify(scope);if(key!==this.scope){const previous=this.boundScope;this.clear();if(scope&&(!previous||previous.room!==scope.room||previous.member!==scope.member||previous.identity!==scope.identity||previous.session!==scope.session||previous.round!==scope.round)){this.deadlines.clear();this.phaseFloors.clear();this.epochFloor=-1;this.revisionFloor=-1;this.contentFloor=-1;this.conversationId='';}if(scope)this.boundScope={...scope};this.scope=key;}return this.issue();}
 private discard(){this.target=null;this.conversation=null;this.chat=null;this.until=0;}
 clear(){this.generation++;this.discard();}
 issue():TopicRead{return {generation:this.generation,scope:this.scope};}
 current(read:TopicRead){return read.generation===this.generation&&read.scope===this.scope;}
 deadline(key:string,expires:string,server:string,started:number,max:number){const duration=Math.min(max,Date.parse(expires)-Date.parse(server));if(!Number.isFinite(duration)||duration<=0)return 0;return Math.min(started+duration,this.deadlines.get(key)??Infinity);}
 accept(read:TopicRead,scope:TopicScope,target:unknown,conversation:unknown,chat:unknown,serverTime:string,started:number,received:number,permissionExpires?:string){
  if(!this.current(read)||received<started)return false;this.now(received);
  if(target!==null&&!validTopicTarget(target,scope))return false;if(conversation!==null&&!validTopicConversation(conversation,scope))return false;
  const t=target as TopicRoundTarget|null,c=conversation as TopicConversationView|null;
  if(t&&t.content_revision<this.contentFloor)return false;
  if(c&&(c.epoch<this.epochFloor||c.epoch===this.epochFloor&&c.revision<this.revisionFloor||this.conversationId&&this.conversationId!==c.conversation_id))return false;
  // Bilateral acceptance creates a new authenticated grant phase with its own
  // server expiry. A refresh within that phase still cannot extend its deadline.
  const grants:{key:string;phase:number;expires:string;server:string;max:number}[]=[];
  if(t)for(const k of ['invitation','action'] as const){const o=t[k];if(o)grants.push({key:`${k}:${o.offer_id}:${o.proposal_revision}`,phase:o.state==='pending'?0:1,expires:o.expires_at,server:serverTime,max:o.state==='pending'?30000:180000});}
  if(c){grants.push({key:`conversation:${c.conversation_id}:${c.epoch}`,phase:['empty','pending','active','closed'].indexOf(c.state),expires:c.expires_at,server:c.server_time,max:180000});for(const a of c.advice)grants.push({key:`advice:${a.advice_id}:${a.revision}`,phase:a.state==='pending'?0:1,expires:a.expires_at,server:c.server_time,max:a.state==='pending'?30000:180000});}
  if(grants.some(g=>g.phase<(this.phaseFloors.get(g.key)??-1)))return false;
  let until=started+Math.min(5000,permissionExpires===undefined?5000:Date.parse(permissionExpires)-Date.parse(serverTime));
  const deadlines=grants.map(g=>({key:`${g.key}:phase:${g.phase}`,until:this.deadline(`${g.key}:phase:${g.phase}`,g.expires,g.server,started,g.max)}));
  for(const d of deadlines)until=Math.min(until,d.until);
  if(until<=this.clock){this.clear();return false;}
  if(c){this.epochFloor=c.epoch;this.revisionFloor=c.revision;this.conversationId=c.conversation_id;}if(t)this.contentFloor=t.content_revision;
  for(const d of deadlines)this.deadlines.set(d.key,d.until);
  for(const g of grants)this.phaseFloors.set(g.key,g.phase);
  this.target=t;this.conversation=c;this.chat=c&&validTopicChat(chat,c)?chat:null;this.until=until;return true;
 }
 // Passive lease expiry discards values immediately. A fresh in-flight read
 // still needs its own unexpired permission; explicit revocation fences it.
 visible(now=presentationNow()){if(this.now(now)>=this.until){if(this.until>0)this.discard();return false;}return true;}
}
export function topicRefusals(t:TopicRoundTarget):RefusalEvidence[]{return (['invitation','action'] as const).flatMap(kind=>{const o=t[kind];return o?[{kind,offer:o.offer_id,proposal:o.proposal_revision,expiresAt:Date.parse(o.expires_at),active:o.state==='active'}]:[];});}
export interface OwnTopics{schema_version:1;room_id:string;owner_member_id:string;rev:number;safety_revision:number;taxonomy_digest:string;allow_topic_ids:string[];exclude_topic_ids:string[]}
export interface TopicTaxonomy{schema_version:1;taxonomy_digest:string;topics:{topic_id:string;labels:Record<'ru'|'en'|'tr',string>}[]}
export function validOwnTopics(v:unknown,room:string,owner:string,t:TopicTaxonomy):v is OwnTopics{return obj(v)&&v.schema_version===1&&v.room_id===room&&v.owner_member_id===owner&&integer(v.rev)&&integer(v.safety_revision)&&v.taxonomy_digest===t.taxonomy_digest&&[v.allow_topic_ids,v.exclude_topic_ids].every(a=>Array.isArray(a)&&a.length<=64&&new Set(a).size===a.length&&a.every(id=>t.topics.some(topic=>topic.topic_id===id)))&&!(v.allow_topic_ids as string[]).some(id=>(v.exclude_topic_ids as string[]).includes(id));}
export function validTaxonomy(v:unknown):v is TopicTaxonomy{return obj(v)&&v.schema_version===1&&typeof v.taxonomy_digest==='string'&&/^[a-f0-9]{64}$/.test(v.taxonomy_digest)&&Array.isArray(v.topics)&&v.topics.length>=1&&v.topics.length<=64&&new Set(v.topics.map(t=>obj(t)?t.topic_id:null)).size===v.topics.length&&v.topics.every(t=>obj(t)&&typeof t.topic_id==='string'&&obj(t.labels)&&['ru','en','tr'].every(l=>typeof (t.labels as Record<string,unknown>)[l]==='string'));}
