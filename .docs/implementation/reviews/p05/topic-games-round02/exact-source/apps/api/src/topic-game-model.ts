import {createHash} from 'node:crypto';
import type pg from 'pg';
import type {GameView,PublicRound} from '@venus/contracts';
import {digest,consentAllows,topicPublicProjection,type FrozenPack,type TopicRound,type TopicPlannerHistory,type ConsentOffer,type PrivateConversation,type ConversationCandidate,type TopicMapPins} from '@venus/relationship-engine';
import {Keyring,requireThat,type Cipher} from './security.js';
import {revision} from './rooms.js';
export type TopicLocale='ru'|'en'|'tr';
export interface TopicGameRow {id:string;room_id:string;state:GameView['state'];pause_reason:GameView['pause_reason'];rev:string;mode:'questions'|'truth_or_dare'|'yes_but';round_count:number;current_round:number;draft_cipher:Cipher;snapshot_cipher:Cipher|null;pack_digest:string|null;created_at:Date;updated_at:Date}
export interface TopicRoundData {schema_version:2;plan:TopicRound;state:PublicRound['state'];clock_floor:number;invitation:ConsentOffer|null;action:ConsentOffer|null;choice:'truth'|'dare'|null;condition:{revision:number;text:string}|null;conversation_id:string|null;boot_id:string;content_revision:number}
export interface TopicRoundRow {id:string;room_id:string;session_id:string;round_index:number;state:PublicRound['state'];cipher:Cipher;created_at:Date}
export interface TopicCandidateBinding {candidate_ref:string;card_id:string;card_revision:number;card_sha256:string;side:'truth'|'dare'|null;condition:string|null}
export interface StoredConversation {schema_version:2;state:Omit<PrivateConversation,'topics'|'candidates'>;bindings:TopicCandidateBinding[]}
export const topicObjectLimits={chunkBytes:11000,maxBytes:8*1024*1024,maxChunks:800,historyRows:30000,chatMessages:100,chatBytes:65536} as const;
type ObjectKind='history'|'conversation'|'chat'|'projection';
export interface TopicObjectScope {room:string;session:string;id:string;kind:ObjectKind}
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
export const topicAad={draft:(r:string,s:string)=>`topic-game-draft:${r}:${s}:2`,snapshot:(r:string,s:string)=>`topic-game-snapshot:${r}:${s}:2`,round:(r:string,s:string,x:string)=>`topic-game-round:${r}:${s}:${x}:2`,pins:(r:string,s:string)=>`topic-game-pins:${r}:${s}:2`};
const chunkAad=(s:TopicObjectScope,rev:number,index:number,count:number)=>`topic-game-object:${s.room}:${s.session}:${s.id}:${s.kind}:${rev}:${index}:${count}:2`;
export function encodeTopicObject(keys:Keyring,scope:TopicObjectScope,rev:number,value:unknown):{bytes:number;chunks:Cipher[]} {
 requireThat(Number.isSafeInteger(rev)&&rev>=1,'TOPIC_OBJECT_INVALID',503);
 const bytes=Buffer.from(JSON.stringify(value));requireThat(bytes.length>0&&bytes.length<=topicObjectLimits.maxBytes,'TOPIC_OBJECT_CAPACITY',503);
 const count=Math.ceil(bytes.length/topicObjectLimits.chunkBytes),digest=sha(bytes);requireThat(count<=topicObjectLimits.maxChunks,'TOPIC_OBJECT_CAPACITY',503);
 const chunks=Array.from({length:count},(_,index)=>keys.encrypt({schema_version:2,bytes:bytes.length,digest,index,count,segment:bytes.subarray(index*topicObjectLimits.chunkBytes,(index+1)*topicObjectLimits.chunkBytes).toString('base64')},chunkAad(scope,rev,index,count)));
 return {bytes:bytes.length,chunks};
}
export function decodeTopicObject<T>(keys:Keyring,scope:TopicObjectScope,rev:number,bytes:number,chunks:readonly Cipher[]):T {
 requireThat(Number.isSafeInteger(bytes)&&bytes>0&&bytes<=topicObjectLimits.maxBytes&&chunks.length===Math.ceil(bytes/topicObjectLimits.chunkBytes)&&chunks.length<=topicObjectLimits.maxChunks,'TOPIC_OBJECT_INVALID',503);
 let digest='';const parts=chunks.map((cipher,index)=>{const data=keys.decrypt<{schema_version:number;bytes:number;digest:string;index:number;count:number;segment:string}>(cipher,chunkAad(scope,rev,index,chunks.length));
  requireThat(Object.keys(data).sort().join(',')==='bytes,count,digest,index,schema_version,segment'&&data.schema_version===2&&data.bytes===bytes&&data.index===index&&data.count===chunks.length&&/^[a-f0-9]{64}$/.test(data.digest)&&typeof data.segment==='string'&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data.segment),'TOPIC_OBJECT_INVALID',503);
  if(index===0)digest=data.digest;requireThat(data.digest===digest,'TOPIC_OBJECT_INVALID',503);const part=Buffer.from(data.segment,'base64');requireThat(part.toString('base64')===data.segment&&part.length===Math.min(topicObjectLimits.chunkBytes,bytes-index*topicObjectLimits.chunkBytes),'TOPIC_OBJECT_INVALID',503);return part;});
 const joined=Buffer.concat(parts);requireThat(joined.length===bytes&&sha(joined)===digest,'TOPIC_OBJECT_INVALID',503);const text=joined.toString('utf8');requireThat(Buffer.from(text).equals(joined),'TOPIC_OBJECT_INVALID',503);return JSON.parse(text) as T;
}
export async function storeTopicObject(c:pg.PoolClient,keys:Keyring,scope:TopicObjectScope,value:unknown) {
 const old=(await c.query<{revision:string}>('SELECT revision FROM topic_game_objects WHERE room_id=$1 AND session_id=$2 AND object_id=$3 AND kind=$4 FOR UPDATE',[scope.room,scope.session,scope.id,scope.kind])).rows[0];const rev=old?revision(old.revision)+1:1,encoded=encodeTopicObject(keys,scope,rev,value);
 await c.query('INSERT INTO topic_game_objects(room_id,session_id,object_id,kind,revision,chunk_count,byte_length) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(room_id,session_id,object_id,kind) DO UPDATE SET revision=$5,chunk_count=$6,byte_length=$7',[scope.room,scope.session,scope.id,scope.kind,rev,encoded.chunks.length,encoded.bytes]);
 await c.query('DELETE FROM topic_game_chunks WHERE room_id=$1 AND session_id=$2 AND object_id=$3 AND kind=$4',[scope.room,scope.session,scope.id,scope.kind]);
 for(let index=0;index<encoded.chunks.length;index++)await c.query('INSERT INTO topic_game_chunks VALUES($1,$2,$3,$4,$5,$6)',[scope.room,scope.session,scope.id,scope.kind,index,encoded.chunks[index]]);return rev;
}
export async function loadTopicObject<T>(c:pg.PoolClient,keys:Keyring,scope:TopicObjectScope):Promise<T|null> {
 const args=[scope.room,scope.session,scope.id,scope.kind],row=(await c.query<{revision:string;chunk_count:number;byte_length:number}>('SELECT revision,chunk_count,byte_length FROM topic_game_objects WHERE room_id=$1 AND session_id=$2 AND object_id=$3 AND kind=$4',args)).rows[0];if(!row)return null;
 requireThat(row.chunk_count>=1&&row.chunk_count<=topicObjectLimits.maxChunks,'TOPIC_OBJECT_INVALID',503);
 const chunks=(await c.query<{chunk_index:number;cipher:Cipher}>('SELECT chunk_index,cipher FROM topic_game_chunks WHERE room_id=$1 AND session_id=$2 AND object_id=$3 AND kind=$4 ORDER BY chunk_index LIMIT 801',args)).rows;
 requireThat(chunks.length===row.chunk_count&&chunks.every((part,i)=>part.chunk_index===i),'TOPIC_OBJECT_INVALID',503);return decodeTopicObject<T>(keys,scope,revision(row.revision),row.byte_length,chunks.map(part=>part.cipher));
}
export function candidateFromBinding(pack:FrozenPack,b:TopicCandidateBinding,topics:readonly string[]):ConversationCandidate {
 const card=pack.card(b.card_id);requireThat(card.revision===b.card_revision&&digest(card)===b.card_sha256,'TOPIC_CANDIDATE_INVALID',503);
 const prompt=Object.fromEntries((['ru','en','tr'] as const).map(locale=>{const t=card.text[locale],text=card.mode==='questions'?t.question:card.mode==='truth_or_dare'?b.side?t[b.side]:null:t.proposal;requireThat(text,'TOPIC_CHOICE_REQUIRED',409);return [locale,text+(card.mode==='yes_but'?' '+t.responder+(b.condition?' '+b.condition:''):'')];})) as Record<TopicLocale,string>;
 return {candidate_ref:b.candidate_ref,card_id:card.id,card_revision:card.revision,card_sha256:b.card_sha256,prompt,topic_ids:[...topics]};
}
export function topicGameView(game:TopicGameRow,data:TopicRoundData|null,pack:FrozenPack|null,history:TopicPlannerHistory|null,locale:TopicLocale,names:readonly {id:string;display_name:string}[],now=0):GameView {
 let round:PublicRound|null=null;if(data){const base={round_id:data.plan.round_id,round_index:data.plan.round_index,state:data.state},released=topicPublicProjection(data.plan,history??undefined);round={...base,kind:'generic'};
  if(released.kind==='public'&&pack&&(data.plan.interaction!=='pair_public'||data.invitation&&consentAllows(data.invitation,data.plan.actors[0]!,now))){const card=pack.card(released.card!.card_id),raw=card.text[locale],sub=(text:string)=>text.replace(/\{P([12])\}/g,(_m,index:string)=>names.find(n=>n.id===[data.plan.primary_member_id,data.plan.actors[1]][Number(index)-1])?.display_name??'');const common={...base,kind:'public' as const,card_id:card.id,card_revision:card.revision,actors:data.plan.actors.length?[...data.plan.actors]:game.mode==='truth_or_dare'?[data.plan.primary_member_id]:[],response_state:data.state==='completed'?'completed' as const:['skipped','stopped'].includes(data.state)?'skipped' as const:data.action?.state==='active'?'accepted' as const:data.condition?'condition_proposed' as const:'pending' as const,proposal_revision:data.content_revision};
   round=game.mode==='questions'?{...common,mode:'questions',text:{question:sub(raw.question!)},choice:null}:game.mode==='truth_or_dare'?{...common,mode:'truth_or_dare',text:data.choice?{prompt:sub(raw[data.choice]!)}:null,choice:data.choice}:{...common,mode:'yes_but',text:{proposal:sub(raw.proposal!),responder:sub(raw.responder!)},choice:null};}}
 return {session_id:game.id,game_rev:revision(game.rev),state:game.state,mode:game.mode,total_rounds:game.round_count,current_round:round,pause_reason:game.pause_reason};
}
export function checkedPins(keys:Keyring,cipher:Cipher,room:string,session:string):TopicMapPins {const pins=keys.decrypt<TopicMapPins>(cipher,topicAad.pins(room,session));requireThat(pins&&typeof pins.map_sha256==='string'&&/^[a-f0-9]{64}$/.test(pins.map_sha256),'TOPIC_PINS_INVALID',503);return pins;}
