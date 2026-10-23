/** Consumers of exact actor wire records; never redact forbidden bytes into PASS. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const allowedRoot=new Set(['schema_version','room_id','session_id','round_id','conversation_id','game_rev','revision','epoch','state','server_time','expires_at','offer','prompt','advice']);
const never=new Set(['allow_topic_ids','excluded_topic_ids','peer_allow','peer_exclusions','reason','refusal_reason','eligible_count','candidate_count','card_id','card_sha256','candidate_ref','candidate_hash','prompt_hash','advice_hash','preview','text_length']);
function recursive(value,path=''){if(value&&typeof value==='object')for(const[key,v]of Object.entries(value)){assert(!never.has(key),'PRIVATE_PREACCEPT_FORBIDDEN:'+path+'.'+key);recursive(v,path+'.'+key);}}
function keys(value,allowed,path){assert(value&&typeof value==='object'&&!Array.isArray(value),'PRIVATE_SHAPE:'+path);for(const key of Object.keys(value))assert(allowed.includes(key),'PRIVATE_UNKNOWN_FIELD:'+path+'.'+key);}
export function assertActorConversation(raw,{bilateral_topic_accepted,recipient_advice_accept_ids=[]}){
 assert(typeof raw==='string');const v=JSON.parse(raw);for(const k of Object.keys(v))assert(allowedRoot.has(k),'PRIVATE_UNKNOWN_ROOT:'+k);assert.equal(v.schema_version,2);recursive(v);
 if(!bilateral_topic_accepted)assert(!Object.hasOwn(v,'prompt'),'PROMPT_BEFORE_BILATERAL');
 if(v.offer){keys(v.offer,['offer_id','epoch','proposal_revision','token','topics','own_accepted','expires_at'],'offer');assert(Array.isArray(v.offer.topics));for(const topic of v.offer.topics)keys(topic,['topic_id','label'],'offer.topics');}
 if(v.prompt)keys(v.prompt,['text','condition','choice'],'prompt');
 assert(Array.isArray(v.advice));for(const advice of v.advice){keys(advice,['advice_id','revision','epoch','direction','state','expires_at','text'],'advice');assert(['sent','received'].includes(advice.direction));if(advice.direction==='received'&&!recipient_advice_accept_ids.includes(advice.advice_id))assert(!Object.hasOwn(advice,'text'),'UNACCEPTED_ADVICE_TEXT');}
 return{bytes:Buffer.byteLength(raw),sha256:createHash('sha256').update(raw).digest('hex'),view:v};
}
/** Exact equal visible bytes for same provided transport values/own action state. */
export function sameOfferedUnionCounterfactual(a,b,context){const left=assertActorConversation(a,context),right=assertActorConversation(b,context);assert.equal(a,b,'UNUSED_PEER_SETTINGS_CHANGED_VISIBLE_BYTES');return{status:'AUTHOR_EXACT_COUNTERFACTUAL_EQUAL',bytes:left.bytes,sha256:left.sha256};}
export function publicChatNoBump(before,after){assert.equal(after.room_rev,before.room_rev,'CHAT_PUBLIC_ROOM_BUMP');assert.equal(after.game_rev,before.game_rev,'CHAT_PUBLIC_GAME_BUMP');assert.equal(after.public_frame_count,before.public_frame_count,'CHAT_PUBLIC_FRAME_BUMP');assert(after.private_chat_revision>before.private_chat_revision,'CHAT_REVISION_NOT_ADVANCED');}
