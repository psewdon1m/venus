export type Relation='just_met'|'friendship'|'crush'|'situationship'|'in_relationships'|'not_a_friend';
export type PairClass='X'|'J'|'F'|'G'|'M'|'S'|'R';
export type Mode='questions'|'truth_or_dare'|'yes_but';
export type Context='online'|'in_person';
export type Interaction='group'|'solo'|'pair_public'|'pair_private';
export type Scope='none'|'acquaintance'|'friend_or_more'|'gentle_initiative'|'mutual_romantic'|'established_couple';
export interface Edge {relation:Relation;explicit:boolean}
export interface Player {id:string;comfort:number;edges:Record<string,Edge>}
export interface Snapshot {
  schema:1;session_id:string;room_id:string;engine_revision:'RE-1.P03-M1';policy_revision:'RE-1';policy_digest:string;pack_digest:string;
  seed:string;mode:Mode;context:Context;total_rounds:number;players:Player[];capabilities:string[];
}
export interface CardText {question?:string;truth?:string;dare?:string;proposal?:string;responder?:string}
export interface Card {
  schema_version:1;id:string;revision:number;pack_id:string;mode:Mode;status:'draft'|'reviewed'|'rejected';category:string;
  interaction:Interaction;participants_required:0|1|2;meeting_contexts:Context[];relationship_scope:Scope;
  min_comfort:number;min_progression_stage:number;consent:'none'|'individual'|'bilateral';
  requires_physical_contact:boolean;requires_going_away:boolean;required_capabilities:string[];safety_tags:string[];
  expected_duration_seconds:number;text:Record<'ru'|'en'|'tr',CardText>;
  authoring:{origin:'example'|'human'|'agent';batch_id:string;created_at:string;reviewed_by:string|null;reviewed_at:string|null;rights_status:'needs_review'|'original_verified';policy_revision:'RE-1';instruction_revision:number;source_notes:string};
}
/** Private server plan. Public projection never serializes this object wholesale. */
export interface RoundPlan {
  round_id:string;round_index:number;card_id:string;card_revision:number;actors:string[];interaction:Interaction;
  primary_member_id:string;
  stage:number;mode:Mode;requires_action_consent:boolean;pack_digest:string;policy_digest:string;
}
export class EngineError extends Error {constructor(readonly code:string) {super(code);}}
export function assertEngine(condition:unknown,code:string):asserts condition {if(!condition) throw new EngineError(code);}
