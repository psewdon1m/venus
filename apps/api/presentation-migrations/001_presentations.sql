CREATE TABLE room_presentation_state (
 room_id uuid PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE, rev bigint NOT NULL DEFAULT 0 CHECK(rev>=0),
 live_document uuid,live_version uuid,live_page integer
);
CREATE TABLE room_presentation_documents (
 id uuid PRIMARY KEY,room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 content_version uuid NOT NULL,rev bigint NOT NULL CHECK(rev>=0),title text NOT NULL,
 default_mode text NOT NULL CHECK(default_mode IN ('scroll','slides')),allow_switch boolean NOT NULL,
 page_count integer NOT NULL CHECK(page_count BETWEEN 1 AND 100),binding_sha256 text NOT NULL
);
CREATE INDEX room_presentation_documents_room ON room_presentation_documents(room_id);
CREATE TABLE room_presentation_versions (
 content_version uuid PRIMARY KEY,document_id uuid NOT NULL,room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 title text NOT NULL,default_mode text NOT NULL,allow_switch boolean NOT NULL,
 manifest jsonb NOT NULL,binding_sha256 text NOT NULL,created_at timestamptz NOT NULL
);
CREATE TABLE room_presentation_assets (
 content_version uuid NOT NULL REFERENCES room_presentation_versions(content_version) ON DELETE CASCADE,
 page_index integer NOT NULL CHECK(page_index BETWEEN -1 AND 99),cipher bytea NOT NULL,sha256 text NOT NULL,
 PRIMARY KEY(content_version,page_index)
);
CREATE TABLE room_presentation_jobs (
 id uuid PRIMARY KEY,room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,document_id uuid NOT NULL,
 content_version uuid NOT NULL,owner_member_id uuid NOT NULL,session_hash text NOT NULL,socket_generation bigint NOT NULL,
 api_epoch uuid NOT NULL,nonce uuid NOT NULL,expected_rev bigint NOT NULL,
 title text NOT NULL,default_mode text NOT NULL,allow_switch boolean NOT NULL,source_bytes integer NOT NULL,
 source_sha256 text NOT NULL,output_budget_bytes integer NOT NULL,reserved_bytes bigint NOT NULL,
 state text NOT NULL CHECK(state IN ('awaiting_upload','rendering','ready','failed','cancelled')),
 failure text,expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX room_presentation_one_import ON room_presentation_jobs((true)) WHERE state IN ('awaiting_upload','rendering');
CREATE INDEX room_presentation_jobs_room ON room_presentation_jobs(room_id,created_at DESC);

-- Unreleased presentation module revision: preserve the complete existing audit
-- allowlist and add its seven fixed mutation codes. No source/body is audited.
ALTER TABLE audit_events DROP CONSTRAINT audit_events_action_check;
ALTER TABLE audit_events ADD CONSTRAINT audit_events_action_check CHECK(action IN
 ('create','join','context','profile','preferences','skip','leave','close','reaccept','idle_close',
 'game_prepare','game_start','game_advance','game_response','game_stop','game_pause','game_resume','game_choice','game_condition','game_finish','game_transport','game_expire','game_quiesce',
 'music_queue','music_play','music_pause','music_seek','music_next','music_previous',
 'media_start','media_join','media_source','media_stop','media_leave','media_expire','media_revoke',
 'presentation_import','presentation_cancel','presentation_settings','presentation_delete','presentation_start','presentation_page','presentation_stop'));
