/** Server-only implementation. Exposure still depends on reviewed pack and accepted later gates. */
export * from './types.js';
export * from './pack.js';
export * from './engine.js';
export * from './consent.js';
export * from './public-pair-opt-in.js';
export {policyDigest} from './policy-identity.js';
export const engineAvailability={available:false,prerequisite:'EXIT-P03/P04/P05'} as const;
export {FrozenTopicMap,TOPIC_MAP_VERSION} from './topic-map.js';
export type {TopicMapPins,TopicMapBytes,TrustedTopicPins,TopicReference,TopicMapEntry} from './topic-map.js';
export {TOPIC_ALGORITHM,TOPIC_PRIVATE_POLICY,TOPIC_RECOVERY_POLICY,immutableTopicSnapshot,immutableTopicHistory,createTopicHistory,selectNextTopicRound,replaceTopicCandidate,recordTopicOutcome,topicPublicProjection,preflightTopics} from './topic-planner.js';
export type {TopicSnapshot,TopicSafetyState,TopicHistoryRecord,TopicAttempt,TopicRound,TopicPlannerHistory,TopicPlanningResult} from './topic-planner.js';
export {TOPIC_TARGETED_REPLACEMENT_VERSION,replaceTopicCandidateForTopics} from './topic-planner.js';
export type {TargetedTopicReplacementRequest} from './topic-planner.js';
export {PRIVATE_CONVERSATION_VERSION,createPrivateConversation,applyPrivateConversation,projectPrivateConversation,projectOwnTopicPreferences,privateTopicOfferRestriction} from './private-conversation.js';
export type {ConversationScope,ConversationPins,ConversationTopic,ConversationCandidate,TopicPreference,PrivateConversation,ConversationContext,PrivateConversationCommand,ConversationError,ConversationResult,PrivateConversationView} from './private-conversation.js';
