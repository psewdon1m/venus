import type {GameSelfActions} from '@venus/contracts';
import {consentAllows,consentResponse,replacePendingAction,EngineError} from '@venus/relationship-engine';
import {DomainError,requireThat} from './security.js';
import type {GameRow,RoundData} from './games-model.js';
/** These assertions are shared by authoritative mutations and the read-only own
 * display projection. Errors/codes and idempotent POST semantics are preserved. */
export function requireOwnRole(role:string|undefined,expected?:'primary'|'secondary') {requireThat(role&&(!expected||role===expected),'ROUND_ACTOR_REQUIRED');}
export function requireHost(host:boolean) {requireThat(host,'HOST_REQUIRED');}
export function requireParticipant(participant:boolean) {requireThat(participant,'GAME_PARTICIPANT_REQUIRED');}
export function requireFinish(data:RoundData,member:string,now:number) {
 requireThat(data.state==='active','ROUND_NOT_ACTIVE',409);
 if(data.invitation) requireThat(consentAllows(data.invitation,member,now),'CONSENT_NOT_ACTIVE');
 if(data.plan.requires_action_consent) requireThat(data.action&&consentAllows(data.action,member,now),'ACTION_CONSENT_REQUIRED');
 else requireThat(data.plan.primary_member_id===member,'ROUND_ACTOR_REQUIRED');
}
export function requireChoice(data:RoundData,member:string,side:'truth'|'dare',now:number) {
 requireThat(data.plan.mode==='truth_or_dare','WRONG_GAME_MODE',409);requireThat(['pending','active'].includes(data.state),'ROUND_NOT_ACTIVE',409);
 if(data.invitation) requireThat(consentAllows(data.invitation,member,now),'CONSENT_NOT_ACTIVE');
 requireThat(!data.choice||data.choice===side,'CHOICE_LOCKED',409);
}
export function requireCondition(data:RoundData,member:string,now:number) {
 requireThat(data.plan.mode==='yes_but'&&data.action&&data.state==='pending','CONDITION_NOT_ALLOWED',409);
 if(data.invitation) requireThat(consentAllows(data.invitation,member,now),'CONSENT_NOT_ACTIVE');
}
function permits(check:()=>unknown):boolean {try {check();return true;}catch(error){if(error instanceof DomainError||error instanceof EngineError)return false;throw error;}}
export function ownActions({game,data,member,role,participant,host,ordinary,present,now}:{game:GameRow|null;data:RoundData|null;member:string;role:string|undefined;participant:boolean;host:boolean;ordinary:boolean;present:boolean;now:number}):Pick<GameSelfActions,'session_actions'|'round_actions'> {
 const running=Boolean(game&&['active','paused'].includes(game.state)),active=game?.state==='active';
 const session_actions={pause:running&&permits(()=>requireParticipant(participant)),stop:running&&permits(()=>requireParticipant(participant)),abort:running&&permits(()=>requireHost(host)),resume:ordinary&&game?.state==='paused'&&present&&host,advance:ordinary&&active&&host&&Boolean(data&&['completed','skipped','stopped'].includes(data.state)),neutral_reset:true,neutral_reset_aborts_game:running&&participant};
 const round_actions:GameSelfActions['round_actions']={finish:false,skip:false,choose_truth:false,choose_dare:false,propose_condition:false,accept_invitation:false,accept_action:false,decline_invitation:false,withdraw_action:false};
 if(!data||!game)return {session_actions,round_actions};
 const actor=permits(()=>requireOwnRole(role)),live=['pending','active'].includes(data.state);
 // Skip/refusal are safety operations; no catalogue lookup may disable them.
 round_actions.skip=running&&live&&actor;
 round_actions.decline_invitation=running&&live&&actor&&Boolean(data.invitation&&['pending','active'].includes(data.invitation.state));
 round_actions.withdraw_action=running&&live&&actor&&Boolean(data.action&&['pending','active'].includes(data.action.state));
 if(!ordinary||!active||!actor)return {session_actions,round_actions};
 round_actions.finish=permits(()=>requireFinish(data,member,now));
 const primary=permits(()=>requireOwnRole(role,'primary'));
 round_actions.choose_truth=primary&&!data.choice&&permits(()=>requireChoice(data,member,'truth',now));
 round_actions.choose_dare=primary&&!data.choice&&permits(()=>requireChoice(data,member,'dare',now));
 round_actions.propose_condition=permits(()=>{requireOwnRole(role,'secondary');requireCondition(data,member,now);replacePendingAction(data.action!,now);});
 for(const scope of ['invitation','action'] as const){const offer=data[scope];round_actions[scope==='invitation'?'accept_invitation':'accept_action']=live&&Boolean(offer&&!offer.acks.includes(member)&&permits(()=>consentResponse(offer,member,'accept',now,{offer_id:offer.offer_id,scope,proposal_revision:offer.proposal_revision})));}
 return {session_actions,round_actions};
}
