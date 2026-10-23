import {assertEngine} from './types.js';
import {freeze} from './pack.js';
export type ConsentScope='invitation'|'action';
export type ConsentState='pending'|'active'|'declined'|'expired'|'stopped'|'completed';
/** Private server state, encrypted at rest; never a room projection. */
export interface ConsentOffer {
  offer_id:string;scope:ConsentScope;proposal_revision:number;actors:string[];acks:string[];state:ConsentState;
  created_at:number;deadline:number;last_ack_at:number|null;activated_at:number|null;active_until:number|null;limit:number|null;
}
export const consentTimers={pending:30000,active:180000,action:30000} as const;
export function proposeConsent(offerId:string,actors:readonly string[],scope:ConsentScope,now:number,limit:number|null=null):ConsentOffer {
  assertEngine(actors.length===2&&new Set(actors).size===2&&Number.isSafeInteger(now)&&now>=0,'CONSENT_PROPOSAL_INVALID');
  assertEngine(scope==='invitation'||scope==='action','CONSENT_SCOPE_INVALID');
  assertEngine(scope==='invitation'?limit===null:limit!==null&&Number.isSafeInteger(limit)&&limit>now,'CONSENT_SCOPE_INVALID');
  return freeze({offer_id:offerId,scope,proposal_revision:1,actors:[...actors],acks:[],state:'pending',created_at:now,deadline:Math.min(now+consentTimers.pending,limit??Infinity),last_ack_at:null,activated_at:null,active_until:null,limit});
}
export function reconcileConsent(offer:ConsentOffer,now:number):ConsentOffer {
  if((offer.state==='pending'&&now>=offer.deadline)||(offer.state==='active'&&now>=(offer.active_until??0))) return freeze({...offer,state:'expired',acks:[]});
  return offer;
}
export function consentAllows(offer:ConsentOffer,actor:string,now:number) {
  return offer.state==='active'&&offer.actors.includes(actor)&&offer.acks.length===2&&
    Number.isSafeInteger(now)&&Number.isSafeInteger(offer.created_at)&&
    Number.isSafeInteger(offer.last_ack_at)&&Number.isSafeInteger(offer.activated_at)&&
    offer.last_ack_at!==null&&offer.activated_at!==null&&offer.active_until!==null&&
    now>=Math.max(offer.created_at,offer.last_ack_at,offer.activated_at)&&now<offer.active_until;
}
export function consentResponse(offer:ConsentOffer,actor:string,kind:'accept'|'decline'|'stop'|'skip'|'finish',now:number,reference?:{offer_id:string;scope:ConsentScope;proposal_revision:number}):ConsentOffer {
  assertEngine(offer.actors.includes(actor),'CONSENT_ACTOR_REQUIRED');const current=reconcileConsent(offer,now);
  if(kind==='accept') {
    assertEngine(reference?.offer_id===current.offer_id&&reference.scope===current.scope&&reference.proposal_revision===current.proposal_revision,'CONSENT_PROPOSAL_STALE');
    assertEngine(current.state==='pending'||current.state==='active','CONSENT_TERMINAL');
    assertEngine(Number.isSafeInteger(now)&&now>=current.created_at&&
      (current.last_ack_at===null||Number.isSafeInteger(current.last_ack_at)&&now>=current.last_ack_at),'CONSENT_TIME_INVALID');
    if(current.acks.includes(actor)) return current;
    assertEngine(current.state==='pending'&&now<current.deadline,'CONSENT_EXPIRED');
    const acks=[...current.acks,actor],active=acks.length===2;
    return freeze({...current,acks,state:active?'active':'pending',last_ack_at:now,activated_at:active?now:null,active_until:active?(current.scope==='invitation'?now+consentTimers.active:current.limit):null});
  }
  if(['declined','stopped','expired','completed'].includes(current.state)) return current;
  if(kind==='finish') {assertEngine(consentAllows(current,actor,now),'CONSENT_NOT_ACTIVE');return freeze({...current,state:'completed',acks:[]});}
  // A late refusal revokes even an already activated offer; no stale revision blocks it.
  return freeze({...current,state:current.state==='pending'&&kind==='decline'?'declined':'stopped',acks:[]});
}
export function replacePendingAction(offer:ConsentOffer,now:number):ConsentOffer {
  const current=reconcileConsent(offer,now);
  assertEngine(current.scope==='action'&&current.state==='pending'&&current.limit!==null&&current.limit>now,'CONSENT_NOT_PENDING');
  assertEngine(Number.isSafeInteger(now)&&now>=current.created_at&&
    (current.last_ack_at===null||Number.isSafeInteger(current.last_ack_at)&&now>=current.last_ack_at),'CONSENT_TIME_INVALID');
  assertEngine(current.proposal_revision<Number.MAX_SAFE_INTEGER,'REVISION_OVERFLOW');
  // This is a new proposal revision: its own acknowledgements cannot predate the changed condition.
  return freeze({...current,proposal_revision:current.proposal_revision+1,created_at:now,acks:[],last_ack_at:null,activated_at:null,deadline:Math.min(now+consentTimers.action,current.limit)});
}
