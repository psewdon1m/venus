import type {GameSelfActions,GameView} from '@venus/contracts';
import type {AuthToken} from './game-operations.js';
export type SessionAction=keyof GameSelfActions['session_actions'];
export type RoundAction=keyof GameSelfActions['round_actions'];
export type OwnAction=SessionAction|RoundAction;
export interface RefusalEvidence {kind:'invitation'|'action';offer:string;proposal:number;expiresAt:number;active:boolean}
interface RefusalFact {offer:string;proposal:number;until:number;skip:boolean}
export interface ControlContext {auth:AuthToken;game:GameView|null;roomRev:number;memberPresent:boolean}
export interface ControlToken {identity:number;transport:number;room:string;member:string;session:string|null;round:string|null;rev:number|null;roomRev:number;generation:number}
const sessionKeys=['pause','stop','abort','resume','advance','neutral_reset','neutral_reset_aborts_game'] as const;
const roundKeys=['finish','skip','choose_truth','choose_dare','propose_condition','accept_invitation','accept_action','decline_invitation','withdraw_action'] as const;
const safetyKeys=new Set<OwnAction>(['pause','stop','abort']);
const selfActionsMaxAge=5000; // Independent local upper bound; never trust an absolute server clock.
function object(v:unknown):v is Record<string,unknown>{return Boolean(v&&typeof v==='object'&&!Array.isArray(v));}
function exact(v:unknown,keys:readonly string[]):boolean{return object(v)&&Object.keys(v).length===keys.length&&keys.every(k=>typeof v[k]==='boolean');}
const offerId=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(v);
const proposal=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=1;
function expiry(v:unknown):number|null{return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(v)&&Number.isFinite(Date.parse(v))?Date.parse(v):null;}
/** Only call on authenticated responses to this exact own HTTP target. Validate
 * authorization metadata independently of private content's absolute-clock TTL:
 * a behind server clock must not erase the ability to request a refusal. This
 * returns no text/actors/partner and never makes private content renderable. */
export function ownRefusalEvidence(raw:{invitation:unknown;action:unknown;prompt:unknown},session:string,round:string):RefusalEvidence[]{
 const result:RefusalEvidence[]=[],i=raw.invitation,a=raw.action,p=raw.prompt;
 if(object(i)&&i.session_id===session&&i.round_id===round&&i.consent_scope==='invitation'&&offerId(i.offer_id)&&proposal(i.proposal_revision)&&['pending','accepted'].includes(String(i.own_state))){
  const until=expiry(i.expires_at);
  if(until!==null){const promptUntil=object(p)?expiry(p.expires_at):null;const active=object(p)&&p.session_id===session&&p.round_id===round&&p.offer_id===i.offer_id&&p.state==='active'&&proposal(p.proposal_revision)&&promptUntil===until;result.push({kind:'invitation',offer:i.offer_id,proposal:i.proposal_revision,expiresAt:until,active});}
 }
 // ActionConsentState is session-bound by the authenticated request path. Its
 // v1 body has no session field; reject an unexpected one rather than accepting
 // a caller-selected or foreign session from another response shape.
 if(object(a)&&!('session_id' in a)&&a.round_id===round&&a.consent_scope==='action'&&offerId(a.offer_id)&&proposal(a.proposal_revision)&&['pending','accepted'].includes(String(a.own_state))&&['pending','active'].includes(String(a.state))){const until=expiry(a.expires_at);if(until!==null)result.push({kind:'action',offer:a.offer_id,proposal:a.proposal_revision,expiresAt:until,active:a.state==='active'});}
 return result;
}
export function validSelfActions(v:unknown):v is GameSelfActions {
 if(!object(v)||Object.keys(v).length!==11||v.schema_version!==1||typeof v.room_id!=='string'||typeof v.member_id!=='string'||!(v.session_id===null||typeof v.session_id==='string')||!(v.round_id===null||typeof v.round_id==='string')||!(v.game_rev===null||Number.isSafeInteger(v.game_rev)&&Number(v.game_rev)>=0)||!Number.isSafeInteger(v.room_rev)||Number(v.room_rev)<0||typeof v.server_time!=='string'||!Number.isFinite(Date.parse(v.server_time))||typeof v.expires_at!=='string'||!Number.isFinite(Date.parse(v.expires_at)))return false;
 return exact(v.session_actions,sessionKeys)&&exact(v.round_actions,roundKeys);
}
/** No React effects are needed to revoke stale controls. Ordinary permissions
 * have a local bounded lease; clock skew cannot extend it. Previously confirmed
 * own session safety facts survive an expired lease/network loss, visibly
 * unconfirmed, until an explicit fresh false, identity/session change or removal.
 * They only permit a request: POST remains authoritative. */
export class OwnControls {
 private context:ControlContext|null=null;private packet:GameSelfActions|null=null;private until=0;private wall=0;private requested=0;private accepted=0;
 private generation=0;private fingerprint='';
 private lastRoundSignal:unknown=null;
 private refusalFacts:Partial<Record<RefusalEvidence['kind'],RefusalFact>>={};
 private refusalLimits:Partial<Record<RefusalEvidence['kind'],number>>={};
 private seenRefusals:Partial<Record<RefusalEvidence['kind'],string>>={};private refusalMismatch=false;
 private leaseStart=0;
 private safety:Pick<GameSelfActions['session_actions'],'pause'|'stop'|'abort'>|null=null;
 bind(context:ControlContext):ControlToken {
  const fingerprint=JSON.stringify([context.auth.room,context.auth.member,context.auth.identity,context.auth.transport,context.game?.session_id,context.game?.current_round?.round_id,context.game?.current_round?.state,context.game?.game_rev,context.game?.state,context.roomRev,context.memberPresent]);
  if(fingerprint!==this.fingerprint){this.fingerprint=fingerprint;this.generation++;}
  const before=this.context,identity=before&&before.auth.room===context.auth.room&&before.auth.member===context.auth.member&&before.auth.identity===context.auth.identity;
  if(!identity||before?.game?.session_id!==context.game?.session_id||before?.game?.game_rev!==context.game?.game_rev||before?.game?.current_round?.round_id!==context.game?.current_round?.round_id||!context.memberPresent||!context.game||!['active','paused'].includes(context.game.state)||context.game.current_round&&['completed','skipped','stopped'].includes(context.game.current_round.state)){this.refusalFacts={};this.refusalLimits={};this.seenRefusals={};this.refusalMismatch=false;}
  if(!identity||before?.game?.session_id!==context.game?.session_id||!context.memberPresent||!context.game||!['active','paused'].includes(context.game.state)){this.packet=null;this.safety=null;this.until=0;}
  if(before&&before.auth.transport!==context.auth.transport){this.packet=null;this.until=0;}
  this.context=context;return this.token();
 }
 token():ControlToken {const c=this.context!;return {identity:c.auth.identity,transport:c.auth.transport,room:c.auth.room,member:c.auth.member,session:c.game?.session_id??null,round:c.game?.current_round?.round_id??null,rev:c.game?.game_rev??null,roomRev:c.roomRev,generation:this.generation};}
 updateGame(game:GameView|null){if(this.context){const known=this.context.game;if(known&&game?.session_id===known.session_id&&game.game_rev<known.game_rev)return;this.bind({...this.context,game});}}
 revokeRound(signal:unknown){if(signal!==this.lastRoundSignal){this.lastRoundSignal=signal;this.packet=null;this.refusalFacts={};this.refusalLimits={};this.seenRefusals={};this.until=0;this.generation++;}}
 same(token:ControlToken){const c=this.token();return Object.keys(c).every(k=>c[k as keyof ControlToken]===token[k as keyof ControlToken]);}
 begin(){return ++this.requested;}
 accept(value:unknown,token:ControlToken,sequence:number,started:number,received:number):boolean {
  this.wall=Math.max(this.wall,received);if(!this.context||!this.same(token)||sequence<=this.accepted||!validSelfActions(value))return false;
  const c=this.context,g=c.game;
  if(g&&!['active','paused'].includes(g.state))return false;
  if(!c.memberPresent||value.room_id!==c.auth.room||value.member_id!==c.auth.member||value.session_id!==(g?.session_id??null)||value.round_id!==(g?.current_round?.round_id??null)||value.game_rev!==(g?.game_rev??null)||value.room_rev<c.roomRev||this.packet&&value.room_rev<this.packet.room_rev)return false;
  // A current authenticated negative can revoke even if its short display lease
  // aged in flight. Never authorize a positive from that aged response.
  this.accepted=sequence;
  if(this.packet){const session_actions={...this.packet.session_actions},round_actions={...this.packet.round_actions};for(const key of sessionKeys)if(!value.session_actions[key])session_actions[key]=false;for(const key of roundKeys)if(!value.round_actions[key])round_actions[key]=false;this.packet={...this.packet,session_actions,round_actions};}
  if(this.safety)for(const key of ['pause','stop','abort'] as const)if(!value.session_actions[key])this.safety[key]=false;
  if(!value.round_actions.decline_invitation)delete this.refusalFacts.invitation;
  if(!value.round_actions.withdraw_action)delete this.refusalFacts.action;
  if(!value.round_actions.skip)for(const fact of Object.values(this.refusalFacts))if(fact)fact.skip=false;
  const duration=Math.min(selfActionsMaxAge,Date.parse(value.expires_at)-Date.parse(value.server_time));
  if(!Number.isFinite(started)||!Number.isFinite(received)||received<started||duration<=0||started+duration<=this.wall)return false;
  this.packet=value;this.leaseStart=started;this.until=started+duration;this.safety={pause:value.session_actions.pause,stop:value.session_actions.stop,abort:value.session_actions.abort};return true;
 }
 /** Called only for authenticated/scoped own offer metadata after a fresh own
  * boolean. No invitation text, prompt, peer identity or accept permission is
  * retained. Same-offer observations can shorten, never extend the local bound. */
 observeRefusals(evidence:readonly RefusalEvidence[],token:ControlToken,now:number){
  this.wall=Math.max(this.wall,now);if(!this.same(token)||!this.fresh(now)||!this.packet||this.refusalMismatch)return false;
  for(const e of evidence){
   if(!e.offer||!Number.isSafeInteger(e.proposal)||e.proposal<1||!Number.isFinite(e.expiresAt))continue;
   const tuple=JSON.stringify([e.offer,e.proposal]),seen=this.seenRefusals[e.kind];
   if(seen&&seen!==tuple){this.refusalFacts={};this.packet=null;this.until=0;this.refusalMismatch=true;this.generation++;return false;}
   this.seenRefusals[e.kind]=tuple;
   const allowed=this.packet.round_actions[e.kind==='invitation'?'decline_invitation':'withdraw_action'];if(!allowed)continue;
   const duration=Math.min(e.active?180000:30000,e.expiresAt-Date.parse(this.packet.server_time)),until=Math.min(this.leaseStart+duration,this.refusalLimits[e.kind]??Infinity);
   this.refusalLimits[e.kind]=until;
   if(duration>0&&until>this.wall)this.refusalFacts[e.kind]={offer:e.offer,proposal:e.proposal,until,skip:this.packet.round_actions.skip};
  }
  return true;
 }
 private retainedRound(action:OwnAction){const facts=action==='decline_invitation'?[this.refusalFacts.invitation]:action==='withdraw_action'?[this.refusalFacts.action]:action==='skip'?Object.values(this.refusalFacts).filter(f=>f?.skip):[];return facts.some(f=>f&&this.wall<f.until);}
 private fresh(now:number){this.wall=Math.max(this.wall,now);const p=this.packet,c=this.context;return Boolean(p&&c&&c.auth.connected&&p.room_rev>=c.roomRev&&p.game_rev===(c.game?.game_rev??null)&&p.round_id===(c.game?.current_round?.round_id??null)&&this.wall<this.until);}
 allowed(action:OwnAction,token:ControlToken,now:number):boolean {
  this.wall=Math.max(this.wall,now);
  if(!this.context||!this.same(token)||!this.context.memberPresent)return false;
  if(action==='neutral_reset')return true;
  if(safetyKeys.has(action))return Boolean(this.safety?.[action as 'pause'|'stop'|'abort']);
  if(roundKeys.includes(action as RoundAction)&&this.context.game?.current_round&&['completed','skipped','stopped'].includes(this.context.game.current_round.state))return false;
  if(['decline_invitation','withdraw_action','skip'].includes(action)&&this.refusalMismatch)return false;
  if(this.retainedRound(action))return true;
  if(action==='decline_invitation'&&this.seenRefusals.invitation||action==='withdraw_action'&&this.seenRefusals.action||action==='skip'&&Object.keys(this.seenRefusals).length>0)return false;
  if(!this.fresh(now)||!this.packet)return false;
  return action in this.packet.session_actions?this.packet.session_actions[action as SessionAction]:this.packet.round_actions[action as RoundAction];
 }
 unconfirmed(now:number){this.wall=Math.max(this.wall,now);return Boolean((this.safety&&Object.values(this.safety).some(Boolean)||Object.values(this.refusalFacts).some(f=>f&&this.wall<f.until))&&!this.fresh(now));}
 resetAborts(now:number){return this.fresh(now)&&this.packet?.session_actions.neutral_reset_aborts_game===true;}
}
