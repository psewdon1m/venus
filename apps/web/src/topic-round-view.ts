import type {TopicRoundView} from '@venus/contracts';
import {validSelfActions} from './game-controls.js';
import {validTopicTarget,validTopicConversation,validTopicChat,type TopicScope} from './topic-state.js';
/** Validate one envelope, never assemble grants from independently aged reads. */
export function validTopicRoundView(raw:unknown,scope:TopicScope):raw is TopicRoundView{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(',')!=='chat,conversation,own,schema_version,target'||v.schema_version!==2||!validSelfActions(v.own,2)||v.own.schema_version!==2)return false;
 const own=v.own;
 if(own.room_id!==scope.room||own.member_id!==scope.member||own.session_id!==scope.session||own.round_id!==scope.round||own.game_rev!==scope.rev)return false;
 const duration=Date.parse(own.expires_at)-Date.parse(own.server_time);if(duration<=0||duration>5000)return false;
 if(v.target!==null&&!validTopicTarget(v.target,scope))return false;
 if(v.conversation!==null&&(!validTopicConversation(v.conversation,scope)||v.target===null||v.conversation.server_time!==own.server_time))return false;
 if(v.chat!==null&&(!validTopicConversation(v.conversation,scope)||v.conversation.state!=='active'||!validTopicChat(v.chat,v.conversation)))return false;
 return !own.conversation_actions.chat||!validTopicConversation(v.conversation,scope)||v.conversation.state!=='active'||v.chat!==null;
}
