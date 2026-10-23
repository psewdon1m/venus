import type {GameSelfActions,GameView} from '@venus/contracts';
import type {AuthToken} from './game-operations.js';
export type SessionAction=keyof GameSelfActions['session_actions'];
export type RoundAction=keyof GameSelfActions['round_actions'];
export type OwnAction=SessionAction|RoundAction;
export interface ControlContext {auth:AuthToken;game:GameView|null;roomRev:number;memberPresent:boolean}
export interface ControlToken {identity:number;transport:number;room:string;member:string;session:string|null;round:string|null;rev:number|null;roomRev:number;generation:number}
const sessionKeys=['pause','stop','abort','resume','advance','neutral_reset','neutral_reset_aborts_game'] as const;
const roundKeys=['finish','skip','choose_truth','choose_dare','propose_condition','accept_invitation','accept_action','decline_invitation','withdraw_action'] as const;
const safetyKeys=new Set<OwnAction>(['pause','stop','abort']);
const selfActionsMaxAge=5000; // Independent local upper bound; never trust an absolute server clock.
function object(v:unknown):v is Record<string,unknown>{return Boolean(v&&typeof v==='object'&&!Array.isArray(v));}
function exact(v:unknown,keys:readonly string[]):boolean{return object(v)&&Object.keys(v).length===keys.length&&keys.every(k=>typeof v[k]==='boolean');}
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
 private safety:Pick<GameSelfActions['session_actions'],'pause'|'stop'|'abort'>|null=null;
 bind(context:ControlContext):ControlToken {
  const fingerprint=JSON.stringify([context.auth.room,context.auth.member,context.auth.identity,context.auth.transport,context.game?.session_id,context.game?.current_round?.round_id,context.game?.game_rev,context.game?.state,context.roomRev,context.memberPresent]);
  if(fingerprint!==this.fingerprint){this.fingerprint=fingerprint;this.generation++;}
  const before=this.context,identity=before&&before.auth.room===context.auth.room&&before.auth.member===context.auth.member&&before.auth.identity===context.auth.identity;
  if(!identity||before?.game?.session_id!==context.game?.session_id||!context.memberPresent||!context.game||!['active','paused'].includes(context.game.state)){this.packet=null;this.safety=null;this.until=0;}
  if(before&&before.auth.transport!==context.auth.transport){this.packet=null;this.until=0;}
  this.context=context;return this.token();
 }
 token():ControlToken {const c=this.context!;return {identity:c.auth.identity,transport:c.auth.transport,room:c.auth.room,member:c.auth.member,session:c.game?.session_id??null,round:c.game?.current_round?.round_id??null,rev:c.game?.game_rev??null,roomRev:c.roomRev,generation:this.generation};}
 updateGame(game:GameView|null){if(this.context){const known=this.context.game;if(known&&game?.session_id===known.session_id&&game.game_rev<known.game_rev)return;this.bind({...this.context,game});}}
 revokeRound(signal:unknown){if(signal!==this.lastRoundSignal){this.lastRoundSignal=signal;this.packet=null;this.until=0;this.generation++;}}
 same(token:ControlToken){const c=this.token();return Object.keys(c).every(k=>c[k as keyof ControlToken]===token[k as keyof ControlToken]);}
 begin(){return ++this.requested;}
 accept(value:unknown,token:ControlToken,sequence:number,started:number,received:number):boolean {
  this.wall=Math.max(this.wall,received);if(!this.context||!this.same(token)||sequence<=this.accepted||!validSelfActions(value))return false;
  const c=this.context,g=c.game;
  if(g&&!['active','paused'].includes(g.state))return false;
  if(!c.memberPresent||value.room_id!==c.auth.room||value.member_id!==c.auth.member||value.session_id!==(g?.session_id??null)||value.round_id!==(g?.current_round?.round_id??null)||value.game_rev!==(g?.game_rev??null)||value.room_rev<c.roomRev||this.packet&&value.room_rev<this.packet.room_rev)return false;
  const duration=Math.min(selfActionsMaxAge,Date.parse(value.expires_at)-Date.parse(value.server_time));
  if(!Number.isFinite(started)||!Number.isFinite(received)||received<started||duration<=0||started+duration<=this.wall)return false;
  this.accepted=sequence;this.packet=value;this.until=started+duration;this.safety={pause:value.session_actions.pause,stop:value.session_actions.stop,abort:value.session_actions.abort};return true;
 }
 private fresh(now:number){this.wall=Math.max(this.wall,now);const p=this.packet,c=this.context;return Boolean(p&&c&&c.auth.connected&&p.room_rev>=c.roomRev&&p.game_rev===(c.game?.game_rev??null)&&p.round_id===(c.game?.current_round?.round_id??null)&&this.wall<this.until);}
 allowed(action:OwnAction,token:ControlToken,now:number):boolean {
  this.wall=Math.max(this.wall,now);
  if(!this.context||!this.same(token)||!this.context.memberPresent)return false;
  if(action==='neutral_reset')return true;
  if(safetyKeys.has(action))return Boolean(this.safety?.[action as 'pause'|'stop'|'abort']);
  if(!this.fresh(now)||!this.packet)return false;
  return action in this.packet.session_actions?this.packet.session_actions[action as SessionAction]:this.packet.round_actions[action as RoundAction];
 }
 unconfirmed(now:number){return Boolean(this.safety&&Object.values(this.safety).some(Boolean)&&!this.fresh(now));}
 resetAborts(now:number){return this.fresh(now)&&this.packet?.session_actions.neutral_reset_aborts_game===true;}
}
