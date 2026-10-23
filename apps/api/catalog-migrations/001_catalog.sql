CREATE TABLE venus_catalog_state (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 active_digest text,
 generation bigint NOT NULL DEFAULT 0 CHECK(generation>=0),
 ledger_head text NOT NULL CHECK(ledger_head ~ '^[0-9a-f]{64}$')
);
INSERT INTO venus_catalog_state(singleton,ledger_head) VALUES(true,repeat('0',64));
CREATE TABLE venus_catalog_withdrawals (
 card_id text NOT NULL CHECK(card_id ~ '^(Q|TD|YB)-[0-9]{4}$'),
 revision integer NOT NULL CHECK(revision>=1),
 ledger_hash text NOT NULL UNIQUE,
 PRIMARY KEY(card_id,revision)
);
CREATE TABLE venus_catalog_events (
 seq bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 kind text NOT NULL CHECK(kind IN ('activate','rollback','withdraw','reconcile')),
 digest text,
 generation bigint NOT NULL,
 operator_id text NOT NULL,
 at timestamptz NOT NULL
);
