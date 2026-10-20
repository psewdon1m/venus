import {createHash} from 'node:crypto';
import {FrozenPack,immutableSnapshot,eligible,preflight,policyDigest,algorithmRevision,EngineError,type Mode,type Context,type Player,type PairClass,type Snapshot,type Card} from '@venus/relationship-engine';
import {modes,requireCatalog} from './catalog.js';
const contexts:Context[]=['online','in_person'],classes:PairClass[]=['X','J','F','G','M','S','R'];
const playerId=(i:number)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`;
export function coverageSnapshot(pack:FrozenPack,size:number,mode:Mode,context:Context,comfort:number,pairClass:PairClass,rounds:number,capabilities:string[]):Snapshot {
  const players:Player[]=Array.from({length:size},(_,i)=>({id:playerId(i),comfort,edges:{}}));
  for(let a=0;a<size;a++) for(let b=0;b<size;b++) if(a!==b) {
    const relation=({X:'not_a_friend',J:'just_met',F:'friendship',G:a<b?'crush':'friendship',M:'crush',S:'situationship',R:'in_relationships'} as const)[pairClass];
    players[a]!.edges[players[b]!.id]={relation,explicit:true};
  }
  return immutableSnapshot({schema:1,session_id:'22222222-2222-4222-8222-222222222222',room_id:'11111111-1111-4111-8111-111111111111',engine_revision:algorithmRevision,
    policy_revision:'RE-1',policy_digest:policyDigest,pack_digest:pack.digest,seed:createHash('sha256').update(`venus:P04:C1:${size}:${mode}:${context}:${comfort}:${pairClass}:${rounds}`).digest('hex'),
    mode,context,total_rounds:rounds,players,capabilities},pack);
}
function actorSets(card:Card,snapshot:Snapshot):string[][] {
  const ids=snapshot.players.map(p=>p.id);
  if(card.interaction==='group') return [[]];if(card.interaction==='solo') return ids.map(id=>[id]);
  return ids.flatMap(a=>ids.filter(b=>a!==b).map(b=>[a,b]));
}
/** Uses the same complete planner as Start. Result is generic and contains no cards,
 * actors, real edges or class-specific eligible counts. Preview is not authorization. */
export function safeAvailability(snapshot:Snapshot,pack:FrozenPack) {
  try {preflight(snapshot,pack);return {available:true,requested_rounds:snapshot.total_rounds,reason:null};}
  catch(error) {if(error instanceof EngineError&&error.code==='SAFE_POOL_EXHAUSTED') return {available:false,requested_rounds:snapshot.total_rounds,reason:'INSUFFICIENT_SAFE_CARDS' as const};throw error;}
}
export function coverageReport(pack:FrozenPack,capabilities:string[]=[],rounds:readonly number[]=Array.from({length:100},(_,i)=>i+1)) {
  requireCatalog(rounds.length>0&&new Set(rounds).size===rounds.length&&rounds.every(n=>Number.isSafeInteger(n)&&n>=1&&n<=100),'COVERAGE_ROUNDS_INVALID');
  const cells:{mode:Mode;context:Context;size:number;stage:number;comfort:number;resolved_class:PairClass;effective_eligible_card_count:number;by_interaction:Record<string,number>;private_baseline_card_count:number;private_profile_status:string;rule_exclusions:string[]}[]=[],sessions:{mode:Mode;context:Context;size:number;rounds:number;profile:string;status:string;reason:string|null}[]=[],privateSessions:{mode:Mode;context:Context;size:number;comfort:number;resolved_class:PairClass;rounds:number;status:string;private_rounds:number}[]=[];
  for(const mode of modes) for(const context of contexts) for(let size=2;size<=8;size++) {
    const modeCards=pack.cards.filter(c=>c.mode===mode&&c.meeting_contexts.includes(context));
    const privateCards=modeCards.filter(c=>c.interaction==='pair_private');
    const privateChannelUnavailable=!capabilities.includes('private_text_chat')&&(context==='online'||privateCards.length>0&&privateCards.every(c=>c.required_capabilities.includes('private_text_chat')));
    for(let comfort=0;comfort<=4;comfort++) for(const pairClass of classes) {
      const snapshot=coverageSnapshot(pack,size,mode,context,comfort,pairClass,20,capabilities);
      for(let stage=1;stage<=4;stage++) {
        const candidates=modeCards.filter(c=>actorSets(c,snapshot).some(actors=>eligible(c,snapshot,actors,stage)));
        const baseline=candidates.filter(c=>c.interaction==='pair_private'&&c.relationship_scope==='friend_or_more'&&c.min_comfort===1&&!c.requires_physical_contact&&!c.requires_going_away).length;
        const privateStatus=stage<3?'RULE_EXCLUDED_STAGE':comfort===0?'RULE_EXCLUDED_COMFORT':['X','J'].includes(pairClass)?'RULE_EXCLUDED_CLASS':privateChannelUnavailable?'CAPABILITY_UNAVAILABLE':baseline<25?'CONTENT_GAP':'SUPPORTED';
        cells.push({mode,context,size,stage,comfort,resolved_class:pairClass,effective_eligible_card_count:candidates.length,
          by_interaction:Object.fromEntries(['group','solo','pair_public','pair_private'].map(kind=>[kind,candidates.filter(c=>c.interaction===kind).length])),private_baseline_card_count:baseline,private_profile_status:privateStatus,
          rule_exclusions:[...(stage<3?['pair_private_before_S3']:[]),...(privateChannelUnavailable?[context==='online'?'online_private_without_chat':'private_cards_require_unavailable_chat']:[]),
            'public_common_support_requires_comfort0_none_or_acquaintance',...(pairClass==='X'?['all_targeted_pairs_vetoed']:[])]});
      }
    }
    for(const requested of rounds) {
      const snapshot=coverageSnapshot(pack,size,mode,context,0,'F',requested,capabilities),availability=safeAvailability(snapshot,pack);
      if(availability.available) {
        const plans=preflight(snapshot,pack);requireCatalog(plans.length===requested&&new Set(plans.map(p=>p.card_id)).size===plans.length,'COVERAGE_REPEAT_OR_INCOMPLETE');
      }
      sessions.push({mode,context,size,rounds:requested,profile:'neutral_C0_F',status:availability.available?'PASS':'SAFE_REFUSAL',reason:availability.reason});
    }
    if(mode==='yes_but') {
      const availability=safeAvailability(coverageSnapshot(pack,size,mode,context,0,'X',20,capabilities),pack);
      requireCatalog(!availability.available,'COVERAGE_X_VETO_BROKEN');sessions.push({mode,context,size,rounds:20,profile:'all_X',status:'EXPECTED_REFUSAL',reason:availability.reason});
    }
    for(const comfort of [1,4]) for(const pairClass of ['F','G','M','S','R'] as const) {
      if(privateChannelUnavailable) {privateSessions.push({mode,context,size,comfort,resolved_class:pairClass,rounds:100,status:'CAPABILITY_UNAVAILABLE',private_rounds:0});continue;}
      const snapshot=coverageSnapshot(pack,size,mode,context,comfort,pairClass,100,capabilities);
      try {
        const plans=preflight(snapshot,pack),privatePlans=plans.filter(p=>p.interaction==='pair_private');
        requireCatalog(new Set(plans.map(p=>p.card_id)).size===100&&privatePlans.length<=25&&privatePlans.every(p=>p.stage>=3),'COVERAGE_PRIVATE_CAP_OR_REPEAT');
        privateSessions.push({mode,context,size,comfort,resolved_class:pairClass,rounds:100,status:'PASS',private_rounds:privatePlans.length});
      } catch(error) {if(error instanceof EngineError&&error.code==='SAFE_POOL_EXHAUSTED') privateSessions.push({mode,context,size,comfort,resolved_class:pairClass,rounds:100,status:'SAFE_REFUSAL',private_rounds:0});else throw error;}
    }
  }
  return {schema_version:1,protocol:'P04-C2',pack_digest:pack.digest,synthetic:pack.synthetic,capabilities,cells,sessions,private_sessions:privateSessions,
    private_budget_rounds:100,private_baseline_required:25,private_coverage:cells.some(c=>c.private_profile_status==='CONTENT_GAP')?'CONTENT_GAP':'PASS',
    neutral20:rounds.includes(20)?sessions.filter(s=>s.rounds===20&&s.profile==='neutral_C0_F').every(s=>s.status==='PASS')?'PASS':'INSUFFICIENT_SAFE_CARDS':'NOT_RUN',
    limitations:['Synthetic uniform-class profiles, not all mixed directed graphs.','Eligibility coverage counts stable card IDs, never actor permutations.','Rule exclusions explain forbidden interactions; zero supported counts remain visible content gaps.','Planner availability is seed/snapshot-specific and must be rechecked inside the Start transaction.']};
}
