import assert from 'node:assert/strict';
import {publicFeatureNames} from './feature-names.mjs';
export function accumulator(pack,players){
 const names=publicFeatureNames(pack.cards.filter(c=>c.interaction!=='pair_private')),values=new Float64Array(names.length),positions=new Map(names.map((n,i)=>[n,i]));
 const inc=(name,value=1)=>{assert(positions.has(name),name);values[positions.get(name)]+=value;};
 let frames=0,lastRevision=0,lastTick=0;
 return {names,add(frame){
  assert.equal(frame.model,'DOMAIN_MODEL_NOT_ACTUAL_AUTH');const r=frame.payload.current_round;assert(r);
  const forbidden=new Set(['edges','comfort','pairClass','pair_class','relationship_scope','invitation','condition','private_text','refusal_reason','seed','candidate_ref','topic_ids','topic_id','token','epoch','advice','chat']);
  const inspect=v=>{if(v&&typeof v==='object')for(const [key,value]of Object.entries(v)){assert(!forbidden.has(key),'public forbidden key '+key);inspect(value);}};inspect(frame.payload);
  if(r.kind==='generic')assert.equal(Object.keys(r).sort().join(','),'kind,round_id,round_index,state');
  const publicObservation={type:'game.snapshot',stream:'game',stream_rev:frame.payload.game_rev,game_rev:frame.payload.game_rev,at_tick:frame.modeled_tick,payload:frame.payload};
  inc('frames');inc('serialized_bytes',Buffer.byteLength(JSON.stringify(publicObservation)));inc('round_state:'+r.state);
  if(r.kind==='generic')inc('generic_frames');else{
   inc('response_state:'+r.response_state);inc('proposal_revision',r.proposal_revision);inc('choice:'+(r.choice??'none'));
   const visible=new Set(r.actors);for(const [i,p]of players.entries())if(JSON.stringify(r.text).includes('OBSERVER_ROLE_'+i+'_END'))visible.add(p.id);
   for(const id of visible)inc('visible_role:'+players.findIndex(p=>p.id===id));
   const actors=r.actors.map(id=>players.findIndex(p=>p.id===id));if(actors.length)inc('ordered_first:'+actors[0]);if(actors.length>1){inc('ordered_second:'+actors[1]);inc('ordered_pair:'+actors[0]+':'+actors[1]);}
  }
  frames++;lastRevision=frame.payload.game_rev;lastTick=frame.modeled_tick;
 },selected(round){inc('interaction:'+(round.interaction==='pair_private'?'generic':round.interaction));if(round.interaction==='pair_private')inc('private_stage:'+round.stage);else inc('card:'+round.card.card_id);},finish(completedRounds){
  inc('last_game_revision',lastRevision);inc('last_stream_revision',lastRevision);inc('elapsed_ticks',lastTick);
  return {names,features:Array.from(values,x=>x/Math.max(1,completedRounds)),normalization_rounds:completedRounds,frames,model:'DOMAIN_MODEL_NOT_ACTUAL_AUTH',actual_WS_frames:false};
 }};
}
