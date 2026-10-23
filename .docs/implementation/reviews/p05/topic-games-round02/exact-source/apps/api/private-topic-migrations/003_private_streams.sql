-- Additive correction after the offline-only V2 core preflight. Preserve002.
-- These refs are ephemeral prepared deliveries, never durable permissions.
DELETE FROM topic_game_private_refs;
ALTER TABLE topic_game_private_refs ADD COLUMN stream_rev bigint NOT NULL
 CHECK(stream_rev BETWEEN 1 AND 9007199254740991);
CREATE UNIQUE INDEX topic_game_refs_own_stream ON topic_game_private_refs(room_id,member_id,stream_rev);
