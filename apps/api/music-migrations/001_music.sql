CREATE TABLE room_music_state (
 room_id uuid PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
 rev bigint NOT NULL DEFAULT 0 CHECK (rev >= 0),
 queue jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(queue)='array' AND jsonb_array_length(queue)<=128),
 catalog_digest text NOT NULL DEFAULT '',
 track_index integer NOT NULL DEFAULT 0 CHECK (track_index>=0 AND track_index<=127),
 playing boolean NOT NULL DEFAULT false,
 position_ms integer NOT NULL DEFAULT 0 CHECK(position_ms>=0 AND position_ms<=86400000),
 anchored_at timestamptz NOT NULL
);
-- Preserve existing room/game actions; music commands use the same transactional audit.
ALTER TABLE audit_events DROP CONSTRAINT audit_events_action_check;
ALTER TABLE audit_events ADD CONSTRAINT audit_events_action_check CHECK(action IN
 ('create','join','context','profile','preferences','skip','leave','close','reaccept','idle_close',
 'game_prepare','game_start','game_advance','game_response','game_stop','game_pause','game_resume','game_choice','game_condition','game_finish','game_transport','game_expire','game_quiesce',
 'music_queue','music_play','music_pause','music_seek','music_next','music_previous'));
