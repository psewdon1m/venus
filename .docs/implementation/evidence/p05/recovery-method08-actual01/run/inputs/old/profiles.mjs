import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {algorithmRevision,policyDigest,TOPIC_ALGORITHM,TOPIC_PRIVATE_POLICY,TOPIC_RECOVERY_POLICY,immutableTopicSnapshot,digest,createTopicHistory} from '../../packages/relationship-engine/dist/index.js';
export const policy=JSON.parse(readFileSync(new URL('../../packages/relationship-engine/src/policy.json',import.meta.url)));
export const playerId=i=>'00000000-0000-4000-8000-'+String(i+1).padStart(12,'0');
export const room='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222';
export const hash=s=>createHash('sha256').update(s).digest('hex');
export const labels=policy.labels;
export const capabilities=(context,capability)=>context==='online'&&capability==='CHAT_ON'?['private_text_chat']:[];
const pairs={X:['not_a_friend','friendship'],J:['just_met','just_met'],F:['friendship','friendship'],G:['crush','friendship'],M:['crush','crush'],S:['situationship','situationship'],R:['in_relationships','in_relationships']};
export function players({size,seed_literal,comfort=4,class_profile='F',random=false,targetOnly=false}){
 const rows=Array.from({length:size},(_,i)=>({id:playerId(i),comfort:random?parseInt(hash(seed_literal+':player:'+i).slice(0,8),16)%5:comfort,edges:{}}));
 for(let a=0;a<size;a++)for(let b=0;b<size;b++)if(a!==b){let relation=random?labels[parseInt(hash(seed_literal+':edge:'+a+':'+b).slice(0,8),16)%6]:'friendship';if(!random&&(!targetOnly||a+b===1))relation=pairs[class_profile][a<b?0:1];rows[a].edges[rows[b].id]={relation,explicit:true};}
 return rows;
}
export function makeSnapshot(f,input){return immutableTopicSnapshot({schema:2,engine_revision:TOPIC_ALGORITHM,private_policy_revision:TOPIC_PRIVATE_POLICY,recovery_policy_revision:TOPIC_RECOVERY_POLICY,pins_digest:digest(f.map.pins),baseline:{schema:1,session_id:input.session_id??session,room_id:input.room_id??room,engine_revision:algorithmRevision,policy_revision:'RE-1',policy_digest:policyDigest,pack_digest:f.pack.digest,seed:hash(input.seed_literal),mode:input.mode,context:input.context,total_rounds:input.rounds,players:players(input),capabilities:capabilities(input.context,input.capability)}},f.pack,f.map);}
export function makeSafety(snapshot,regime='T0_ALL',exclusionClass='E0'){
 const all=['creative','music','romance'];return{room_id:snapshot.baseline.room_id,revision:1,members:snapshot.baseline.players.map((p,i)=>{const excluded_topic_ids=i===0?(regime==='T3_ASYMMETRIC_EXCLUSION'?['creative']:exclusionClass==='E1'?['music']:exclusionClass==='E2'?['romance']:[]):[];return{member_id:p.id,revision:1,allow_topic_ids:(regime==='T1_EMPTY'?[]:regime==='T2_COMMON'?['creative']:all).filter(t=>!excluded_topic_ids.includes(t)),excluded_topic_ids};})};
}
export function priorRecords(f,snapshot,regime){
 const result={public_history:[],private_history:[]};if(!['T4_PRIVATE_PRIOR','T5_PUBLIC_AND_PRIVATE_PRIOR'].includes(regime))return result;
 const ids=snapshot.baseline.players.slice(0,2).map(p=>p.id),modes=['questions','truth_or_dare','yes_but'],prefix=['Q','TD','YB'];
 for(let i=0;i<3;i++)for(const visibility of regime==='T5_PUBLIC_AND_PRIVATE_PRIOR'?['private','public']:['private']){
  const context=snapshot.baseline.context,cardId=prefix[i]+'-'+String(visibility==='private'?2000+2*i+(context==='in_person'?1:0):(i===2?i:256+i)).padStart(4,'0'),card=f.pack.card(cardId),target=result[visibility+'_history'];
  target.push({card_id:card.id,card_revision:card.revision,card_sha256:digest(card),sequence:target.length+1,room_id:snapshot.baseline.room_id,session_id:'33333333-3333-4333-8333-33333333333'+String(i+1),round_id:(visibility==='private'?'44444444':'55555555')+'-4444-4444-8444-44444444444'+String(i+1),pack_digest:f.pack.digest,map_sha256:f.map.pins.map_sha256,repertoire_digest:f.map.pins.repertoire_digest,mode:modes[i],context,interaction:card.interaction,actors:ids,primary_member_id:ids[0],stage:visibility==='private'?3:1,disclosure:'disclosed'});
 }
 return result;
}
export function makeHistory(f,snapshot,regime){return createTopicHistory(snapshot,f.pack,f.map,priorRecords(f,snapshot,regime));}
