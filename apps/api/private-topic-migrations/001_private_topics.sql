-- Additive family. A protocol2 room is classified at birth; normal UPDATE cannot
-- downgrade it or convert an existing protocol1 room after a database restore.
ALTER TABLE rooms ADD COLUMN private_protocol smallint NOT NULL DEFAULT 1
 CHECK(private_protocol IN (1,2));
CREATE FUNCTION venus_private_protocol_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.private_protocol<>OLD.private_protocol THEN
  RAISE EXCEPTION 'Room private protocol is immutable';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER immutable_private_protocol BEFORE UPDATE OF private_protocol ON rooms
 FOR EACH ROW EXECUTE FUNCTION venus_private_protocol_immutable();

CREATE TABLE private_topic_room_births (
 room_id uuid PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
 incarnation uuid NOT NULL UNIQUE,
 minimum_sequence bigint NOT NULL CHECK(minimum_sequence BETWEEN 1 AND 4096),
 taxonomy_digest text NOT NULL CHECK(taxonomy_digest ~ '^[a-f0-9]{64}$'),
 policy_digest text NOT NULL CHECK(policy_digest ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL
);
CREATE FUNCTION venus_private_topic_birth_required() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM rooms WHERE id=NEW.id AND private_protocol=2)
  AND NOT EXISTS(SELECT 1 FROM private_topic_room_births WHERE room_id=NEW.id) THEN
  RAISE EXCEPTION 'Protocol2 room requires a birth record';
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER required_private_topic_birth AFTER INSERT ON rooms
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION venus_private_topic_birth_required();
CREATE FUNCTION venus_private_topic_birth_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='UPDATE' THEN
  RAISE EXCEPTION 'Room topic birth is immutable';
 ELSIF TG_OP='INSERT' THEN
  IF NOT EXISTS(SELECT 1 FROM rooms WHERE id=NEW.room_id AND private_protocol=2) THEN
   RAISE EXCEPTION 'Birth requires protocol2 room';
  END IF;
 ELSIF EXISTS(SELECT 1 FROM rooms WHERE id=OLD.room_id AND private_protocol=2)
  AND NOT EXISTS(SELECT 1 FROM private_topic_room_births WHERE room_id=OLD.room_id) THEN
  RAISE EXCEPTION 'Cannot remove birth of a live protocol2 row';
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER guarded_private_topic_birth AFTER INSERT OR UPDATE OR DELETE ON private_topic_room_births
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION venus_private_topic_birth_guard();
CREATE TABLE private_topic_preferences (
 room_id uuid NOT NULL,
 owner_member_id uuid NOT NULL,
 rev bigint NOT NULL CHECK(rev BETWEEN 1 AND 9007199254740991),
 cipher jsonb NOT NULL,
 PRIMARY KEY(room_id,owner_member_id),
 FOREIGN KEY(room_id) REFERENCES private_topic_room_births(room_id) ON DELETE CASCADE,
 FOREIGN KEY(room_id,owner_member_id) REFERENCES room_members(room_id,id) ON DELETE CASCADE
);
CREATE TABLE private_topic_requests (
 room_id uuid NOT NULL,
 owner_member_id uuid NOT NULL,
 request_id uuid NOT NULL,
 request_hash text NOT NULL,
 created_at timestamptz NOT NULL,
 PRIMARY KEY(room_id,owner_member_id,request_id),
 FOREIGN KEY(room_id) REFERENCES private_topic_room_births(room_id) ON DELETE CASCADE,
 FOREIGN KEY(room_id,owner_member_id) REFERENCES room_members(room_id,id) ON DELETE CASCADE
);
