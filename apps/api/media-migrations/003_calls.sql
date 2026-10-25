CREATE TABLE room_call_scopes (
 id uuid PRIMARY KEY,
 room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('general_call','pair_call')),
 state text NOT NULL CHECK(state IN ('pending','active','ended')),
 rev bigint NOT NULL DEFAULT 1 CHECK(rev BETWEEN 1 AND 9007199254740991),
 upstream_room text NOT NULL UNIQUE CHECK(length(upstream_room)<=100),
 api_epoch uuid NOT NULL,
 created_by uuid NOT NULL,
 target_member_id uuid,
 a_session text NOT NULL,
 b_session text,
 a_generation bigint NOT NULL CHECK(a_generation>0),
 b_generation bigint,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL,
 updated_at timestamptz NOT NULL,
 FOREIGN KEY(room_id,created_by) REFERENCES room_members(room_id,id) ON DELETE CASCADE,
 FOREIGN KEY(room_id,target_member_id) REFERENCES room_members(room_id,id) ON DELETE CASCADE,
 CHECK((kind='general_call' AND target_member_id IS NULL AND state<>'pending') OR (kind='pair_call' AND target_member_id IS NOT NULL AND target_member_id<>created_by)),
 CHECK(kind<>'pair_call' OR state<>'active' OR (b_session IS NOT NULL AND b_generation>0))
);
CREATE UNIQUE INDEX call_one_general ON room_call_scopes(room_id) WHERE kind='general_call' AND state='active';
CREATE INDEX call_room_lifecycle ON room_call_scopes(room_id,state,expires_at);
ALTER TABLE room_media_leases ADD COLUMN allow_audio boolean NOT NULL DEFAULT false;
ALTER TABLE room_media_leases ADD COLUMN allow_video boolean NOT NULL DEFAULT false;
ALTER TABLE room_media_leases ADD CONSTRAINT call_source_flags CHECK(kind='cinema' OR publisher=(allow_audio OR allow_video));
