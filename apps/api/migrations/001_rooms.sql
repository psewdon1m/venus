CREATE TABLE rooms (
 id uuid PRIMARY KEY,
 host_member_id uuid NOT NULL,
 meeting_context text NOT NULL CHECK (meeting_context IN ('online','in_person')),
 state text NOT NULL DEFAULT 'open' CHECK (state IN ('open','closed')),
 rev bigint NOT NULL DEFAULT 1 CHECK (rev BETWEEN 0 AND 9007199254740991),
 invite_hash text NOT NULL UNIQUE,
 created_at timestamptz NOT NULL,
 last_activity_at timestamptz NOT NULL,
 closed_at timestamptz,
 CHECK ((state='closed') = (closed_at IS NOT NULL))
);
CREATE TABLE room_members (
 room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 id uuid NOT NULL,
 display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 192),
 locale text NOT NULL CHECK (locale IN ('ru','en','tr')),
 role text NOT NULL CHECK (role IN ('host','member')),
 slot smallint CHECK (slot BETWEEN 1 AND 8),
 socket_generation bigint NOT NULL DEFAULT 0 CHECK (socket_generation BETWEEN 0 AND 9007199254740991),
 presence text NOT NULL DEFAULT 'reconnecting' CHECK (presence IN ('online','reconnecting','inactive')),
 heartbeat_at timestamptz NOT NULL,
 reserved_until timestamptz NOT NULL,
 removed_at timestamptz,
 PRIMARY KEY(room_id,id),
 UNIQUE(room_id,slot)
);
CREATE UNIQUE INDEX one_room_host ON room_members(room_id) WHERE role='host';
ALTER TABLE rooms ADD CONSTRAINT host_in_own_room FOREIGN KEY(id,host_member_id)
 REFERENCES room_members(room_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE room_sessions (
 token_hash text PRIMARY KEY,
 room_id uuid NOT NULL,
 member_id uuid NOT NULL,
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 FOREIGN KEY(room_id,member_id) REFERENCES room_members(room_id,id) ON DELETE CASCADE
);
CREATE TABLE entry_acceptances (
 room_id uuid NOT NULL,
 member_id uuid NOT NULL,
 offer_version text NOT NULL,
 offer_digest text NOT NULL,
 accepted_at timestamptz NOT NULL,
 adult_declared_at timestamptz NOT NULL,
 rev bigint NOT NULL DEFAULT 1 CHECK (rev BETWEEN 0 AND 9007199254740991),
 PRIMARY KEY(room_id,member_id),
 FOREIGN KEY(room_id,member_id) REFERENCES room_members(room_id,id) ON DELETE CASCADE
);
CREATE TABLE private_preferences (
 room_id uuid NOT NULL,
 owner_member_id uuid NOT NULL,
 cipher jsonb NOT NULL,
 ready boolean NOT NULL DEFAULT false,
 rev bigint NOT NULL DEFAULT 0 CHECK (rev BETWEEN 0 AND 9007199254740991),
 PRIMARY KEY(room_id,owner_member_id),
 FOREIGN KEY(room_id,owner_member_id) REFERENCES room_members(room_id,id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX unique_preference_nonce ON private_preferences((cipher->>'key_version'),(cipher->>'nonce'));
CREATE TABLE ws_tickets (
 token_hash text PRIMARY KEY,
 room_id uuid NOT NULL,
 member_id uuid NOT NULL,
 session_hash text NOT NULL REFERENCES room_sessions(token_hash) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,
 FOREIGN KEY(room_id,member_id) REFERENCES room_members(room_id,id) ON DELETE CASCADE
);
CREATE TABLE idempotency_keys (
 scope text NOT NULL,
 key uuid NOT NULL,
 room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 member_id uuid NOT NULL,
 request_hash text NOT NULL,
 result_cipher jsonb NOT NULL,
 created_at timestamptz NOT NULL,
 PRIMARY KEY(scope,key),
 FOREIGN KEY(room_id,member_id) REFERENCES room_members(room_id,id) ON DELETE CASCADE
);
CREATE TABLE outbox_events (
 seq bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 event_id uuid NOT NULL UNIQUE,
 room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 room_rev bigint NOT NULL CHECK(room_rev BETWEEN 0 AND 9007199254740991),
 payload jsonb NOT NULL,
 created_at timestamptz NOT NULL
);
CREATE TABLE admission_limits (
 scope_hash text PRIMARY KEY,
 window_start bigint NOT NULL,
 requests integer NOT NULL CHECK(requests>0)
);
CREATE INDEX rooms_idle ON rooms(last_activity_at) WHERE state='open';
CREATE INDEX rooms_deletion ON rooms(closed_at) WHERE state='closed';
CREATE INDEX outbox_by_room ON outbox_events(room_id,seq);
CREATE INDEX sessions_by_member ON room_sessions(room_id,member_id);

CREATE TABLE audit_events (
 seq bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 actor_member_id uuid,
 action text NOT NULL CHECK(action IN ('create','join','context','profile','preferences','skip','leave','close','reaccept','idle_close')),
 request_id uuid NOT NULL,
 created_at timestamptz NOT NULL,
 FOREIGN KEY(room_id,actor_member_id) REFERENCES room_members(room_id,id) ON DELETE CASCADE
);
CREATE INDEX audit_by_room ON audit_events(room_id,seq);
