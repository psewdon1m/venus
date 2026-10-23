import type {GameView,GameSelfActions} from './index.js';
/** Versioned transport only; exact current backend ACL is authoritative. */
export const topicGameProtocol=2 as const;
export interface TopicGamePrepare {request_id:string;expected_rev:number;mode:'questions'|'truth_or_dare'|'yes_but';round_count:number;players:string[]}
export interface TopicGameStart {request_id:string;draft_rev:number}
export interface TopicGameMutation {request_id:string;expected_rev?:number}
export interface TopicGameCondition extends TopicGameMutation {expected_rev:number;text:string}
export interface TopicGameFinish extends TopicGameMutation {expected_rev:number}
export interface TopicRoundTarget {
 schema_version:2;room_id:string;session_id:string;round_id:string;game_rev:number;content_revision:number;
 invitation:{offer_id:string;consent_scope:'invitation';proposal_revision:number;own_state:'pending'|'accepted';state:string;expires_at:string}|null;
 action:{offer_id:string;consent_scope:'action';proposal_revision:number;own_state:'pending'|'accepted';state:string;expires_at:string}|null;
 choice:'truth'|'dare'|null;condition:{revision:number;text:string}|null;
}
export interface TopicOfferReference {offer_id:string;epoch:number;proposal_revision:number;token:string}
export interface TopicConversationCommand extends TopicGameMutation {
 kind:'offer_topic'|'respond_topic'|'other_question'|'stop'|'offer_advice'|'respond_advice'|'revoke_advice';
 expected_epoch?:number;topic_ids?:string[];offer_id?:string;epoch?:number;proposal_revision?:number;token?:string;
 decision?:'accept'|'decline';exclude_current_topics?:boolean;text?:string;advice_id?:string;replaces_id?:string;
}
export interface TopicGameReceipt {schema_version:2;request_id:string;game_rev:number;conversation_id?:string;epoch?:number;advice_id?:string}
export interface TopicAdviceView {advice_id:string;revision:number;epoch:number;direction:'sent'|'received';state:'pending'|'accepted';expires_at:string;text?:string}
export interface TopicConversationView {
 schema_version:2;room_id:string;session_id:string;round_id:string;conversation_id:string;game_rev:number;revision:number;epoch:number;
 state:'empty'|'pending'|'active'|'closed';server_time:string;expires_at:string;
 offer?:{offer_id:string;epoch:number;proposal_revision:number;token:string;topics:readonly {topic_id:string;label:string}[];own_accepted:boolean;expires_at:string};
 prompt?:{text:string;condition:string|null;choice:'truth'|'dare'|null};advice:TopicAdviceView[];
}
export interface TopicChatSend {request_id:string;conversation_id:string;epoch:number;text:string}
export interface TopicChatView {schema_version:2;conversation_id:string;epoch:number;revision:number;state:'active'|'cleared';messages:{message_id:string;sequence:number;direction:'sent'|'received';text:string}[]}
export interface TopicGameSelfActions extends Omit<GameSelfActions,'schema_version'> {schema_version:2;conversation_actions:{offer_topic:boolean;other_question:boolean;respond_topic:boolean;offer_advice:boolean;chat:boolean}}
export type TopicGamePublicView=GameView;
