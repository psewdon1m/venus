import type {TopicConversationView,TopicOfferReference} from '@venus/contracts';
import type {TopicScope} from './topic-state.js';
interface SafetyReference extends TopicOfferReference {until:number}
/** A previously confirmed own safety ATTEMPT, without content or Accept grant.
 * It can survive WS loss but cannot outlive the original offer duration or move
 * to another identity/session/round/revision. The exact POST remains authoritative. */
export class OtherQuestionSafety{
 private fingerprint='';private value:SafetyReference|null=null;private wall=0;
 bind(scope:TopicScope|null){const fingerprint=scope?JSON.stringify([scope.room,scope.member,scope.identity,scope.session,scope.round,scope.rev]):'';if(fingerprint!==this.fingerprint){this.clear();this.fingerprint=fingerprint;}}
 clear(){this.value=null;}
 observe(view:TopicConversationView,started:number,received:number,confirmed:boolean){this.wall=Math.max(this.wall,received);if(!confirmed){this.clear();return;}const o=view.offer;if(!o){this.clear();return;}const duration=Math.min(view.state==='pending'?30000:180000,Date.parse(o.expires_at)-Date.parse(view.server_time));const same=this.value&&this.value.offer_id===o.offer_id&&this.value.epoch===o.epoch&&this.value.proposal_revision===o.proposal_revision&&this.value.token===o.token;const until=Math.min(started+duration,same?this.value!.until:Infinity);if(!Number.isFinite(until)||received<started||until<=this.wall){this.clear();return;}this.value={offer_id:o.offer_id,epoch:o.epoch,proposal_revision:o.proposal_revision,token:o.token,until};}
 current(now:number){this.wall=Math.max(this.wall,now);if(this.value&&this.wall>=this.value.until)this.clear();return this.value;}
}
