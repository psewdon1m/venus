/** Ordinary server configuration. Released topic profiles are compiled into the
 * application; environment values select enablement/paths, never cards or maps.
 * Taxonomy changes require an explicit compatibility/quiesce procedure. */
import { isAbsolute } from 'node:path';
import { bundledTopicSources } from '@venus/card-catalog';
import { canonical, hash, requireThat } from './security.mjs';
export function topicGamesEnabled(value) {
    requireThat(value === undefined || value === 'false' || value === 'true', 'TOPIC_GAME_CONFIG_INVALID', 503);
    return value === 'true';
}
export function releasedRoomTopicProfile() {
    const first = bundledTopicSources[0];
    if (!first)
        return null;
    const taxonomy = first.map.pins.taxonomy_digest, topics = first.map.topics;
    requireThat(/^[a-f0-9]{64}$/.test(taxonomy) && bundledTopicSources.every(value => value.map.pins.taxonomy_digest === taxonomy && canonical(value.map.topics) === canonical(topics)), 'TOPIC_PROFILE_COMPATIBILITY_REQUIRED', 503);
    const vocabulary = Object.freeze(topics.map(t => t.topic_id).sort());
    const policy = hash(canonical({ schema_version: 1, policy_revision: 'ROOM-TOPIC-1', taxonomy_digest: taxonomy, vocabulary }));
    return Object.freeze({ pins: Object.freeze({ taxonomy, policy, vocabulary }), topics });
}
export function topicStorageDirectories(env) {
    const paths = { birthDirectory: env.TOPIC_BIRTH_DIRECTORY ?? '/var/lib/venus/topic-births',
        personalChainDirectory: env.TOPIC_PERSONAL_CHAIN_DIRECTORY ?? '/var/lib/venus/topic-personal',
        personalWitnessDirectory: env.TOPIC_PERSONAL_WITNESS_DIRECTORY ?? '/var/lib/venus/topic-personal-witness',
        lifecycleChainDirectory: env.TOPIC_LIFECYCLE_CHAIN_DIRECTORY ?? '/var/lib/venus/topic-lifecycle',
        lifecycleWitnessDirectory: env.TOPIC_LIFECYCLE_WITNESS_DIRECTORY ?? '/var/lib/venus/topic-lifecycle-witness' };
    requireThat(Object.values(paths).every(path => isAbsolute(path) && path.length > 1), 'TOPIC_ROOTS_INVALID', 503);
    return Object.freeze(paths);
}
