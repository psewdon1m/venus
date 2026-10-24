CREATE TABLE game_packs (
 digest text PRIMARY KEY CHECK(digest ~ '^sha256:[a-f0-9]{64}$'),
 manifest jsonb NOT NULL,
 cards jsonb NOT NULL,
 synthetic boolean NOT NULL,
 created_at timestamptz NOT NULL
);
CREATE TABLE game_sessions (
 seq bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
 id uuid PRIMARY KEY,
 room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 state text NOT NULL CHECK(state IN ('waiting','active','paused','completed','aborted')),
 pause_reason text CHECK(pause_reason IN ('transport','safety')),
 rev bigint NOT NULL DEFAULT 1 CHECK(rev BETWEEN 0 AND 9007199254740991),
 mode text NOT NULL CHECK(mode IN ('questions','truth_or_dare','yes_but')),
 round_count integer NOT NULL CHECK(round_count BETWEEN 1 AND 100),
 current_round integer NOT NULL DEFAULT 0 CHECK(current_round BETWEEN 0 AND 100),
 draft_cipher jsonb NOT NULL,
 snapshot_cipher jsonb,
 pack_digest text REFERENCES game_packs(digest),
 created_at timestamptz NOT NULL,
 updated_at timestamptz NOT NULL,
 UNIQUE(room_id,id),
 CHECK(current_round<=round_count),
 CHECK((state='paused')=(pause_reason IS NOT NULL)),
 CHECK(state NOT IN ('active','paused') OR (snapshot_cipher IS NOT NULL AND pack_digest IS NOT NULL))
);
CREATE UNIQUE INDEX one_running_game ON game_sessions(room_id) WHERE state IN ('waiting','active','paused');
CREATE INDEX games_by_room ON game_sessions(room_id,created_at DESC);
CREATE TABLE game_participants (
 room_id uuid NOT NULL,
 session_id uuid NOT NULL,
 member_id uuid NOT NULL,
 PRIMARY KEY(room_id,session_id,member_id),
 FOREIGN KEY(room_id,session_id) REFERENCES game_sessions(room_id,id) ON DELETE CASCADE,
 FOREIGN KEY(room_id,member_id) REFERENCES room_members(room_id,id) ON DELETE CASCADE
);
CREATE TABLE game_rounds (
 id uuid PRIMARY KEY,
 room_id uuid NOT NULL,
 session_id uuid NOT NULL,
 round_index integer NOT NULL CHECK(round_index BETWEEN 1 AND 100),
 state text NOT NULL CHECK(state IN ('pending','active','completed','skipped','stopped')),
 cipher jsonb NOT NULL,
 created_at timestamptz NOT NULL,
 UNIQUE(session_id,round_index),
 UNIQUE(room_id,session_id,id),
 FOREIGN KEY(room_id,session_id) REFERENCES game_sessions(room_id,id) ON DELETE CASCADE
);
CREATE TABLE game_private_streams (
 room_id uuid NOT NULL,
 member_id uuid NOT NULL,
 rev bigint NOT NULL DEFAULT 0 CHECK(rev BETWEEN 0 AND 9007199254740991),
 PRIMARY KEY(room_id,member_id),
 FOREIGN KEY(room_id,member_id) REFERENCES room_members(room_id,id) ON DELETE CASCADE
);
CREATE TABLE game_round_actors (
 room_id uuid NOT NULL,
 session_id uuid NOT NULL,
 round_id uuid NOT NULL,
 member_id uuid NOT NULL,
 role text NOT NULL CHECK(role IN ('primary','secondary')),
 PRIMARY KEY(round_id,member_id),
 UNIQUE(round_id,role),
 UNIQUE(room_id,session_id,round_id,member_id),
 FOREIGN KEY(room_id,session_id,round_id) REFERENCES game_rounds(room_id,session_id,id) ON DELETE CASCADE,
 FOREIGN KEY(room_id,session_id,member_id) REFERENCES game_participants(room_id,session_id,member_id) ON DELETE CASCADE
);
CREATE TABLE game_consent_actors (
 room_id uuid NOT NULL,
 session_id uuid NOT NULL,
 round_id uuid NOT NULL,
 offer_id uuid NOT NULL,
 scope text NOT NULL CHECK(scope IN ('invitation','action')),
 member_id uuid NOT NULL,
 role text NOT NULL CHECK(role IN ('primary','secondary')),
 PRIMARY KEY(offer_id,member_id),
 UNIQUE(offer_id,role),
 UNIQUE(room_id,session_id,round_id,scope,role),
 FOREIGN KEY(room_id,session_id,round_id,member_id) REFERENCES game_round_actors(room_id,session_id,round_id,member_id) ON DELETE CASCADE
);
CREATE FUNCTION game_consent_pair_complete() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE n integer; bindings integer; resource uuid; proposal uuid;
BEGIN
 resource=COALESCE(NEW.round_id,OLD.round_id); proposal=COALESCE(NEW.offer_id,OLD.offer_id);
 IF EXISTS(SELECT 1 FROM game_rounds WHERE id=resource) THEN
  SELECT count(*),count(DISTINCT (room_id,session_id,round_id,scope)) INTO n,bindings FROM game_consent_actors WHERE offer_id=proposal;
  IF n<>2 OR bindings<>1 THEN RAISE EXCEPTION 'Consent proposal requires exactly two scoped actor rows' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER consent_pair_complete AFTER INSERT OR DELETE OR UPDATE ON game_consent_actors
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION game_consent_pair_complete();
CREATE FUNCTION game_identity_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Game identity rows are immutable' USING ERRCODE='23514'; END $$;
CREATE TRIGGER immutable_game_participant BEFORE UPDATE ON game_participants FOR EACH ROW EXECUTE FUNCTION game_identity_immutable();
CREATE FUNCTION game_participant_before_start() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM game_sessions WHERE room_id=NEW.room_id AND id=NEW.session_id AND state='waiting') THEN
  RAISE EXCEPTION 'Game participants are frozen at start' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER participant_before_start BEFORE INSERT ON game_participants FOR EACH ROW EXECUTE FUNCTION game_participant_before_start();
CREATE TRIGGER immutable_round_actor BEFORE UPDATE ON game_round_actors FOR EACH ROW EXECUTE FUNCTION game_identity_immutable();
CREATE TRIGGER immutable_consent_actor BEFORE UPDATE ON game_consent_actors FOR EACH ROW EXECUTE FUNCTION game_identity_immutable();
CREATE TABLE game_outbox_refs (
 seq bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 event_id uuid NOT NULL UNIQUE,
 room_id uuid NOT NULL,
 session_id uuid NOT NULL,
 round_id uuid NOT NULL,
 member_id uuid NOT NULL,
 stream_rev bigint NOT NULL CHECK(stream_rev BETWEEN 0 AND 9007199254740991),
 game_rev bigint NOT NULL CHECK(game_rev BETWEEN 0 AND 9007199254740991),
 kind text NOT NULL CHECK(kind IN ('invitation','prompt','action','condition','cleared')),
 created_at timestamptz NOT NULL,
 UNIQUE(room_id,member_id,stream_rev),
 FOREIGN KEY(room_id,session_id,round_id) REFERENCES game_rounds(room_id,session_id,id) ON DELETE CASCADE,
 FOREIGN KEY(room_id,member_id) REFERENCES room_members(room_id,id) ON DELETE CASCADE
);
CREATE INDEX game_outbox_by_member ON game_outbox_refs(room_id,member_id,stream_rev);
ALTER TABLE audit_events DROP CONSTRAINT audit_events_action_check;
ALTER TABLE audit_events ADD CONSTRAINT audit_events_action_check CHECK(action IN
 ('create','join','context','profile','preferences','skip','leave','close','reaccept','idle_close',
 'game_prepare','game_start','game_advance','game_response','game_stop','game_pause','game_resume','game_choice','game_condition','game_finish','game_transport','game_expire','game_quiesce'));
