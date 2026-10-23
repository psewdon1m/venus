-- V2 lifecycle markers. Legacy rows/codecs/AAD are never migrated in place.
CREATE TABLE topic_game_sessions (
 room_id uuid NOT NULL, session_id uuid PRIMARY KEY, schema_version smallint NOT NULL CHECK(schema_version=2),
 pins_cipher jsonb NOT NULL,
 FOREIGN KEY(room_id) REFERENCES private_topic_room_births(room_id) ON DELETE CASCADE,
 FOREIGN KEY(room_id,session_id) REFERENCES game_sessions(room_id,id) ON DELETE CASCADE,
 UNIQUE(room_id,session_id)
);
CREATE TABLE topic_game_objects (
 room_id uuid NOT NULL,session_id uuid NOT NULL,object_id uuid NOT NULL,kind text NOT NULL,
 revision bigint NOT NULL CHECK(revision BETWEEN 1 AND 9007199254740991),
 chunk_count integer NOT NULL CHECK(chunk_count BETWEEN 1 AND 800),byte_length integer NOT NULL CHECK(byte_length BETWEEN 1 AND 8388608),
 PRIMARY KEY(room_id,session_id,object_id,kind),
 FOREIGN KEY(room_id,session_id) REFERENCES topic_game_sessions(room_id,session_id) ON DELETE CASCADE,
 CHECK(kind IN ('history','conversation','chat','projection'))
);
CREATE TABLE topic_game_chunks (
 room_id uuid NOT NULL,session_id uuid NOT NULL,object_id uuid NOT NULL,kind text NOT NULL,
 chunk_index integer NOT NULL CHECK(chunk_index BETWEEN 0 AND 799),cipher jsonb NOT NULL,
 PRIMARY KEY(room_id,session_id,object_id,kind,chunk_index),
 FOREIGN KEY(room_id,session_id,object_id,kind) REFERENCES topic_game_objects(room_id,session_id,object_id,kind) ON DELETE CASCADE
);
CREATE TABLE topic_game_requests (
 room_id uuid NOT NULL,member_id uuid NOT NULL,request_id uuid NOT NULL,operation text NOT NULL,
 request_hash text NOT NULL,receipt_cipher jsonb NOT NULL,created_at timestamptz NOT NULL,
 PRIMARY KEY(room_id,member_id,request_id),
 FOREIGN KEY(room_id) REFERENCES private_topic_room_births(room_id) ON DELETE CASCADE,
 FOREIGN KEY(room_id,member_id) REFERENCES room_members(room_id,id) ON DELETE CASCADE
);
CREATE TABLE topic_game_private_refs (
 sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,event_id uuid NOT NULL UNIQUE,
 room_id uuid NOT NULL,session_id uuid NOT NULL,round_id uuid NOT NULL,member_id uuid NOT NULL,
 game_rev bigint NOT NULL CHECK(game_rev BETWEEN 1 AND 9007199254740991),created_at timestamptz NOT NULL,
 FOREIGN KEY(room_id,session_id) REFERENCES topic_game_sessions(room_id,session_id) ON DELETE CASCADE,
 FOREIGN KEY(room_id,session_id,round_id,member_id) REFERENCES game_round_actors(room_id,session_id,round_id,member_id) ON DELETE CASCADE
);
CREATE INDEX topic_game_refs_member ON topic_game_private_refs(room_id,member_id,sequence);
