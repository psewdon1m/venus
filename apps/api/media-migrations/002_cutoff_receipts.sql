ALTER TABLE room_media_leases ADD COLUMN cutoff_pending boolean NOT NULL DEFAULT false;
CREATE INDEX media_pending_cutoff ON room_media_leases(room_id,member_id) WHERE cutoff_pending;
