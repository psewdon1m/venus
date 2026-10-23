import {createHmac} from 'node:crypto';
import policy from './policy.json' with {type:'json'};
import {policyDigest} from './policy-identity.js';
import {FrozenPack,canonical,freeze} from './pack.js';
import {assertEngine,type Snapshot,type Player,type PairClass,type Relation,type RoundPlan,type Card,type Scope} from './types.js';
export const algorithmRevision='RE-1.P03-M1';
const classes:PairClass[]=['X','J','F','G','M','S','R'];
const knownSnapshots=new WeakSet<Snapshot>();
const knownPlans=new WeakMap<RoundPlan,Snapshot>();
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export function progressionStage(round:number,total:number) {
  assertEngine(Number.isInteger(total)&&total>=1&&total<=100&&Number.isInteger(round)&&round>=1&&round<=total,'ROUND_INDEX_INVALID');
  return Math.min(4,1+Math.floor(4*(round-1)/Math.max(1,total-1)));
}
function edge(player:Player,target:string):Relation {return player.edges[target]?.relation??'friendship';}
export function resolvePair(a:Player,b:Player):{pairClass:PairClass;initiator:string|null} {
  const ab=edge(a,b.id),ba=edge(b,a.id),pairClass=policy.pair_class_matrix[ab]?.[ba] as PairClass|undefined;
  assertEngine(pairClass&&classes.includes(pairClass),'RELATION_INVALID');
  return {pairClass,initiator:pairClass!=='G'?null:ab==='friendship'?b.id:a.id};
}
export function immutableSnapshot(input:Snapshot,pack:FrozenPack):Snapshot {
  assertEngine(Object.keys(input).sort().join(',')==='capabilities,context,engine_revision,mode,pack_digest,players,policy_digest,policy_revision,room_id,schema,seed,session_id,total_rounds','SNAPSHOT_FIELDS_INVALID');
  assertEngine(pack instanceof FrozenPack&&input.schema===1&&input.engine_revision===algorithmRevision&&input.policy_revision==='RE-1'&&input.policy_digest===policyDigest&&input.pack_digest===pack.digest,'SNAPSHOT_VERSION_UNSUPPORTED');
  assertEngine(uuid.test(input.session_id)&&uuid.test(input.room_id)&&/^[a-f0-9]{64}$/.test(input.seed),'SNAPSHOT_IDENTITY_INVALID');
  assertEngine(policy.modes.includes(input.mode)&&policy.contexts.includes(input.context)&&input.players.length>=2&&input.players.length<=8,'SNAPSHOT_PROFILE_INVALID');
  progressionStage(1,input.total_rounds);
  const ids=new Set(input.players.map(p=>p.id));assertEngine(ids.size===input.players.length,'SNAPSHOT_IDENTITY_INVALID');
  for(const p of input.players) {
    assertEngine(Object.keys(p).sort().join(',')==='comfort,edges,id'&&uuid.test(p.id)&&Number.isInteger(p.comfort)&&p.comfort>=0&&p.comfort<=4,'SNAPSHOT_PROFILE_INVALID');
    for(const [target,value] of Object.entries(p.edges)) assertEngine(Object.keys(value).sort().join(',')==='explicit,relation'&&target!==p.id&&ids.has(target)&&policy.labels.includes(value.relation)&&typeof value.explicit==='boolean'&&(value.explicit||value.relation==='friendship'),'SNAPSHOT_EDGE_INVALID');
  }
  assertEngine(new Set(input.capabilities).size===input.capabilities.length&&input.capabilities.every(c=>['private_text_chat','music_control','calls'].includes(c)),'SNAPSHOT_CAPABILITY_INVALID');
  const result=JSON.parse(canonical(input)) as Snapshot;result.players.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);result.capabilities.sort();freeze(result);knownSnapshots.add(result);return result;
}
export function comfortAllows(card:Card,players:readonly Player[]) {return players.length>0&&players.every(p=>p.comfort>=card.min_comfort);}
export function eligible(card:Card,snapshot:Snapshot,actors:readonly string[],stage:number) {
  if(card.mode!==snapshot.mode||!card.meeting_contexts.includes(snapshot.context)||card.min_progression_stage>stage||!card.required_capabilities.every(c=>snapshot.capabilities.includes(c))) return false;
  const pair=card.interaction.startsWith('pair_'),privatePair=card.interaction==='pair_private';
  if(new Set(actors).size!==actors.length||actors.some(id=>!snapshot.players.some(p=>p.id===id))||actors.length!==(pair?2:card.interaction==='solo'?1:0)) return false;
  const affected=card.interaction==='group'?snapshot.players:snapshot.players.filter(p=>actors.includes(p.id));
  if(!comfortAllows(card,affected)) return false;
  if(snapshot.context==='online'&&(card.requires_physical_contact||card.requires_going_away)) return false;
  if(card.requires_physical_contact&&(card.min_comfort!==4||card.consent!=='bilateral'||stage<3)) return false;
  if(privatePair&&(stage<3||card.min_comfort<1||card.consent!=='bilateral'||(snapshot.context==='online'&&!snapshot.capabilities.includes('private_text_chat')))) return false;
  // Common-support public repertoire avoids a public card-ID decoder of private class/comfort.
  if(!privatePair&&(card.min_comfort!==0||!['none','acquaintance'].includes(card.relationship_scope)||card.requires_physical_contact||card.requires_going_away)) return false;
  if(pair) {
    const a=snapshot.players.find(p=>p.id===actors[0])!,b=snapshot.players.find(p=>p.id===actors[1])!;
    const {pairClass}=resolvePair(a,b);if(pairClass==='X') return false;
    const minimum=policy.relationship_scope_min_class[card.relationship_scope] as PairClass;
    if(classes.indexOf(pairClass)<classes.indexOf(minimum)) return false;
  } else if(card.relationship_scope!=='none') return false;
  return true;
}
class Random {
  private index=0;
  constructor(private readonly seed:string,private readonly domain:string) {}
  bytes() {return createHmac('sha256',Buffer.from(this.seed,'hex')).update(algorithmRevision+':'+this.domain+':'+this.index++).digest();}
  next() {return this.bytes().readUIntBE(0,6)/281474976710656;}
  choose<T>(values:readonly T[]) {assertEngine(values.length,'SAFE_POOL_EXHAUSTED');return values[Math.floor(this.next()*values.length)]!;}
  weighted<T>(values:readonly T[],weight:(value:T)=>number) {
    const weights=values.map(weight),sum=weights.reduce((a,b)=>a+b,0);assertEngine(sum>0&&weights.every(w=>Number.isFinite(w)&&w>=0),'WEIGHTS_INVALID');
    let target=this.next()*sum;
    for(let i=0;i<values.length;i++) {target-=weights[i]!;if(target<0) return values[i]!;}return values.at(-1)!;
  }
  uuid() {const b=this.bytes().subarray(0,16);b[6]=(b[6]!&15)|64;b[8]=(b[8]!&63)|128;const h=b.toString('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
}
interface Option {actors:string[];kind:'group'|'solo'|'pair_public'|'pair_private';cards:readonly Card[];pairClass:PairClass}
const cache=new WeakMap<Snapshot,WeakMap<FrozenPack,Map<number,readonly Option[]>>>();
function options(snapshot:Snapshot,pack:FrozenPack,stage:number) {
  let packs=cache.get(snapshot);if(!packs) {packs=new WeakMap();cache.set(snapshot,packs);}
  let stages=packs.get(pack);if(!stages) {stages=new Map();packs.set(pack,stages);}const old=stages.get(stage);if(old) return old;
  const result:Option[]=[],players=snapshot.players,modeCards=pack.cards.filter(c=>c.mode===snapshot.mode);
  const add=(kind:Option['kind'],actors:string[],pairClass:PairClass='X')=>{
    const cards=modeCards.filter(c=>c.interaction===kind&&eligible(c,snapshot,actors,stage));
    // A short class-specific private pool must not encode class via its exhaustion time.
    // All F/G/M/S/R classes share sufficient baseline cards for the whole private budget.
    if(kind==='pair_private'&&cards.filter(c=>c.relationship_scope==='friend_or_more'&&c.min_comfort===1&&!c.requires_physical_contact&&!c.requires_going_away).length<Math.ceil(.25*snapshot.total_rounds)) return;
    if(cards.length) result.push({actors,kind,cards,pairClass});
  };
  add('group',[]);for(const p of players) add('solo',[p.id]);
  for(let a=0;a<players.length;a++) for(let b=a+1;b<players.length;b++) {
    const p=players[a]!,q=players[b]!,{pairClass,initiator}=resolvePair(p,q);if(pairClass==='X') continue;
    add('pair_public',[p.id,q.id],pairClass);
    add('pair_private',initiator===q.id?[q.id,p.id]:[p.id,q.id],pairClass);
  }
  const value=freeze(result);stages.set(stage,value);return value;
}
export function selectNextRound(snapshot:Snapshot,history:readonly RoundPlan[],pack:FrozenPack):RoundPlan {
  assertEngine(knownSnapshots.has(snapshot)&&pack instanceof FrozenPack&&snapshot.pack_digest===pack.digest,'SNAPSHOT_VERSION_UNSUPPORTED');
  const index=history.length+1;assertEngine(index<=snapshot.total_rounds,'SESSION_COMPLETE');
  assertEngine(history.every((r,i)=>r.round_index===i+1&&r.pack_digest===pack.digest&&r.policy_digest===policyDigest)&&new Set(history.map(r=>r.card_id)).size===history.length,'HISTORY_INVALID');
  for(const plan of history) if(knownPlans.get(plan)!==snapshot) {
    const card=pack.card(plan.card_id),stage=progressionStage(plan.round_index,snapshot.total_rounds);
    assertEngine(card.revision===plan.card_revision&&card.interaction===plan.interaction&&plan.mode===snapshot.mode&&plan.requires_action_consent===(card.consent==='bilateral')&&plan.stage===stage&&snapshot.players.some(p=>p.id===plan.primary_member_id)&&(plan.actors.length===0||plan.primary_member_id===plan.actors[0])&&eligible(card,snapshot,plan.actors,stage),'HISTORY_INVALID');
  }
  const stage=progressionStage(index,snapshot.total_rounds),rng=new Random(snapshot.seed,canonical({index,history:history.map(r=>r.card_id)}));
  const used=new Set(history.map(r=>r.card_id)),privateHistory=history.filter(r=>r.interaction==='pair_private');
  let pool=options(snapshot,pack,stage).map(o=>({...o,cards:o.cards.filter(c=>!used.has(c.id))})).filter(o=>o.cards.length);
  if(privateHistory.length>=Math.ceil(.25*snapshot.total_rounds)) pool=pool.filter(o=>o.kind!=='pair_private');
  const lastPrivate=privateHistory.at(-1),pairKey=(ids:readonly string[])=>[...ids].sort().join(':');
  if(lastPrivate&&pool.some(o=>o.kind==='pair_private'&&pairKey(o.actors)!==pairKey(lastPrivate.actors))) pool=pool.filter(o=>o.kind!=='pair_private'||pairKey(o.actors)!==pairKey(lastPrivate.actors));
  const previous=history.at(-1);if(previous&&pack.card(previous.card_id).min_comfort>=2&&rng.next()<.35) {
    const softer=pool.map(o=>({...o,cards:o.cards.filter(c=>c.min_comfort<pack.card(previous.card_id).min_comfort)})).filter(o=>o.cards.length);if(softer.length) pool=softer;
  }
  assertEngine(pool.length,'SAFE_POOL_EXHAUSTED');
  const privates=pool.filter(o=>o.kind==='pair_private'),ordinary=pool.filter(o=>o.kind!=='pair_private');
  const target=stage<3?0:stage===3?.22:.4;
  if(privates.length&&rng.next()<target) pool=privates;else if(ordinary.length) pool=ordinary;else pool=privates;
  const publicPairs=pool.filter(o=>o.kind==='pair_public'),general=pool.filter(o=>o.kind==='group'||o.kind==='solo');
  if(publicPairs.length&&general.length) pool=rng.next()<[.2,.4,.6,.6][stage-1]!?publicPairs:general;
  const appearances=new Map<string,number>();for(const round of history) for(const actor of new Set([round.primary_member_id,...round.actors])) appearances.set(actor,(appearances.get(actor)??0)+1);
  const repetition=(o:Option)=>1/(1+o.actors.reduce((sum,id)=>sum+(appearances.get(id)??0),0));
  // Exact proposed P03-M1 epsilon=.05. Both branches retain common pair support.
  const weightedPrior=rng.next()<.05;
  const selected=rng.weighted(pool,o=>repetition(o)*(weightedPrior&&o.kind.startsWith('pair_')?policy.pair_weight_by_class[o.pairClass]:1));
  const card=rng.choose(selected.cards),actors=[...selected.actors];
  // Public role order is independent of private directed-edge initiator hints.
  if(selected.kind==='pair_public'&&rng.next()<.5) actors.reverse();
  const primary=actors[0]??rng.weighted(snapshot.players,p=>1/(1+(appearances.get(p.id)??0))).id;
  const plan:RoundPlan=freeze({round_id:rng.uuid(),round_index:index,card_id:card.id,card_revision:card.revision,actors,primary_member_id:primary,interaction:card.interaction,stage,mode:snapshot.mode,requires_action_consent:card.consent==='bilateral',pack_digest:pack.digest,policy_digest:policyDigest});knownPlans.set(plan,snapshot);return plan;
}
export function preflight(snapshot:Snapshot,pack:FrozenPack) {const plans:RoundPlan[]=[];for(let i=0;i<snapshot.total_rounds;i++) plans.push(selectNextRound(snapshot,plans,pack));return Object.freeze(plans);}
export function AuditProjection(plan:RoundPlan) {
  return plan.interaction==='pair_private'?{round_index:plan.round_index,kind:'generic' as const}:{round_index:plan.round_index,kind:'public' as const,card_id:plan.card_id,actors:[...plan.actors]};
}
export function scopeAllows(scope:Scope,pairClass:PairClass) {return pairClass!=='X'&&classes.indexOf(pairClass)>=classes.indexOf(policy.relationship_scope_min_class[scope] as PairClass);}
