import {createHash} from 'node:crypto';
const hash=value=>createHash('sha256').update(value).digest('hex');
const labels=['just_met','friendship','crush','situationship','in_relationships','not_a_friend'];
const playerId=i=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`;
export function profileFactory({pack,engine}){
 const {immutableSnapshot,algorithmRevision,policyDigest}=engine;
function profile(seed,size,mode,context,total,kind='exchangeable',pairClass='F') {
  const players=Array.from({length:size},(_,i)=>({id:playerId(i),comfort:kind==='random'?parseInt(hash(seed+':player:'+i).slice(0,8),16)%5:kind==='gf'?1:4,edges:{}}));
  for(let a=0;a<size;a++) for(let b=0;b<size;b++) if(a!==b) players[a].edges[players[b].id]={relation:kind==='random'?labels[parseInt(hash(seed+':edge:'+a+':'+b).slice(0,8),16)%6]:'friendship',explicit:true};
  if(kind!=='random'&&pairClass!=='F') {players[0].edges[players[1].id].relation='crush';if(pairClass==='M') players[1].edges[players[0].id].relation='crush';}
  return immutableSnapshot({schema:1,session_id:'22222222-2222-4222-8222-222222222222',room_id:'11111111-1111-4111-8111-111111111111',engine_revision:algorithmRevision,policy_revision:'RE-1',policy_digest:policyDigest,pack_digest:pack.digest,seed:hash(seed),mode,context,total_rounds:total,players,capabilities:['private_text_chat']},pack);
}
 return profile;
}
