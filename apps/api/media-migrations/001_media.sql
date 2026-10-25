CREATE TABLE venus_media_runtime (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 api_epoch uuid NOT NULL,
 sfu_epoch uuid,
 last_authority_at timestamptz,
 cutoff_confirmed boolean NOT NULL DEFAULT false
);
CREATE TABLE room_cinema_state (
 room_id uuid PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
 rev bigint NOT NULL DEFAULT 0 CHECK(rev>=0),
 scope_id uuid NOT NULL,
 upstream_room text NOT NULL CHECK(length(upstream_room)<=100),
 state text NOT NULL CHECK(state IN ('idle','starting','live','ended','transport_unavailable')),
 source_member_id uuid,
 reason text NOT NULL DEFAULT 'idle' CHECK(reason IN ('idle','starting','live','ended','no_audio','denied','revoked','transport_unavailable')),
 updated_at timestamptz NOT NULL
);
CREATE TABLE room_media_leases (
 id uuid PRIMARY KEY,
 room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 member_id uuid NOT NULL,
 session_hash text NOT NULL REFERENCES room_sessions(token_hash) ON DELETE CASCADE,
 socket_generation bigint NOT NULL CHECK(socket_generation>=0),
 kind text NOT NULL CHECK(kind IN ('cinema','general_call','pair_call')),
 scope_id uuid NOT NULL,
 upstream_room text NOT NULL CHECK(length(upstream_room)<=100),
 publisher boolean NOT NULL,
 api_epoch uuid NOT NULL,
 sfu_epoch uuid NOT NULL,
 binding_sha256 text NOT NULL CHECK(binding_sha256 ~ '^[a-f0-9]{64}$'),
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL,
 FOREIGN KEY(room_id,member_id) REFERENCES room_members(room_id,id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX media_one_active_scope_member ON room_media_leases(room_id,member_id,kind,scope_id) WHERE revoked_at IS NULL;
CREATE INDEX media_active_expiry ON room_media_leases(expires_at) WHERE revoked_at IS NULL;

ALTER TABLE audit_events DROP CONSTRAINT audit_events_action_check;
ALTER TABLE audit_events ADD CONSTRAINT audit_events_action_check CHECK(action IN
 ('create','join','context','profile','preferences','skip','leave','close','reaccept','idle_close',
 'game_prepare','game_start','game_advance','game_response','game_stop','game_pause','game_resume','game_choice','game_condition','game_finish','game_transport','game_expire','game_quiesce',
 'music_queue','music_play','music_pause','music_seek','music_next','music_previous',
 'media_start','media_join','media_source','media_stop','media_leave','media_expire','media_revoke'));
