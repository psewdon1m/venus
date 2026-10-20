CREATE TABLE private_chat_scopes (
 round_id uuid PRIMARY KEY,
 room_id uuid NOT NULL,
 session_id uuid NOT NULL,
 boot_id uuid NOT NULL,
 expires_at timestamptz NOT NULL,
 rev bigint NOT NULL DEFAULT 0 CHECK(rev BETWEEN 0 AND 128),
 total integer NOT NULL DEFAULT 0 CHECK(total BETWEEN 0 AND 128),
 minute bigint NOT NULL DEFAULT 0,
 actor_counts jsonb NOT NULL DEFAULT '{}',
 last_sent_at timestamptz,
 FOREIGN KEY(room_id,session_id,round_id) REFERENCES game_rounds(room_id,session_id,id) ON DELETE CASCADE,
 UNIQUE(room_id,session_id,round_id)
);
CREATE TABLE private_chat_messages (
 message_id uuid PRIMARY KEY,
 room_id uuid NOT NULL,
 session_id uuid NOT NULL,
 round_id uuid NOT NULL,
 member_id uuid NOT NULL,
 chat_rev bigint NOT NULL CHECK(chat_rev BETWEEN 1 AND 128),
 cipher jsonb NOT NULL,
 sent_at timestamptz NOT NULL,
 expires_at timestamptz NOT NULL,
 FOREIGN KEY(room_id,session_id,round_id) REFERENCES private_chat_scopes(room_id,session_id,round_id) ON DELETE CASCADE,
 FOREIGN KEY(room_id,session_id,round_id,member_id) REFERENCES game_round_actors(room_id,session_id,round_id,member_id) ON DELETE CASCADE,
 UNIQUE(round_id,chat_rev)
);
CREATE TABLE private_chat_requests (
 room_id uuid NOT NULL,
 session_id uuid NOT NULL,
 round_id uuid NOT NULL,
 member_id uuid NOT NULL,
 request_id uuid NOT NULL,
 request_hash text NOT NULL,
 receipt jsonb NOT NULL,
 expires_at timestamptz NOT NULL,
 PRIMARY KEY(round_id,member_id,request_id),
 FOREIGN KEY(room_id,session_id,round_id) REFERENCES private_chat_scopes(room_id,session_id,round_id) ON DELETE CASCADE,
 FOREIGN KEY(room_id,session_id,round_id,member_id) REFERENCES game_round_actors(room_id,session_id,round_id,member_id) ON DELETE CASCADE
);
CREATE INDEX private_chat_message_expiry ON private_chat_messages(expires_at);
CREATE INDEX private_chat_scope_expiry ON private_chat_scopes(expires_at);
