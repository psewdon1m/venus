import { requireThat } from "file:///C:/.projects/venus/apps/api/dist/security.js";
export const topicChatLimits = { perMinute: 12, perRound: 128, buffer: 32 };
export function newTopicChatQuota(round) { return { schema_version: 1, round_id: round, total: 0, minute: 0, actor_counts: {}, last_sent_at: null }; }
export function chargeTopicChat(quota, round, actors, member, now) {
    requireThat(quota && Object.keys(quota).sort().join(',') === 'actor_counts,last_sent_at,minute,round_id,schema_version,total' && quota.schema_version === 1 && quota.round_id === round && Number.isSafeInteger(quota.total) && quota.total >= 0 && quota.total <= topicChatLimits.perRound && Number.isSafeInteger(quota.minute) && quota.minute >= 0 && quota.actor_counts && typeof quota.actor_counts === 'object' && !Array.isArray(quota.actor_counts) && actors.length === 2 && new Set(actors).size === 2 && actors.includes(member) && Object.entries(quota.actor_counts).every(([id, n]) => actors.includes(id) && Number.isSafeInteger(n) && n >= 1 && n <= topicChatLimits.perMinute) && Object.values(quota.actor_counts).reduce((a, b) => a + b, 0) <= quota.total && (quota.total === 0 ? quota.last_sent_at === null : Object.keys(quota.actor_counts).length > 0 && Number.isSafeInteger(quota.last_sent_at) && quota.last_sent_at >= 0 && Math.floor(quota.last_sent_at / 60000) === quota.minute), 'TOPIC_CHAT_QUOTA_INVALID', 503);
    requireThat(Number.isSafeInteger(now) && now >= 0 && (quota.last_sent_at === null || now >= quota.last_sent_at), 'PRIVATE_CHAT_TIME_INVALID', 409);
    const minute = Math.floor(now / 60000), counts = minute === quota.minute ? quota.actor_counts : {}, count = counts[member] ?? 0;
    requireThat(count < topicChatLimits.perMinute, 'RATE_LIMITED', 429);
    requireThat(quota.total < topicChatLimits.perRound, 'PRIVATE_CHAT_VOLUME_LIMIT', 429);
    return { schema_version: 1, round_id: round, total: quota.total + 1, minute, actor_counts: { ...counts, [member]: count + 1 }, last_sent_at: now };
}
