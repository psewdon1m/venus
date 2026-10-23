import { DomainError } from './security.js';
/** Only known content-source outages may omit a room game projection. They do
 * not authorize gameplay or suppress room/member/credential/personal authority,
 * SQL, ciphertext or engine failures. HTTP content endpoints still fail closed. */
const unavailable = new Set([
    'TOPIC_GAMES_DISABLED', 'TOPIC_SOURCE_UNAVAILABLE', 'TOPIC_SOURCE_BUNDLE_UNAVAILABLE',
    'TOPIC_SOURCE_UNREVIEWED', 'TOPIC_SOURCE_PINS_CHANGED', 'TOPIC_PINS_CHANGED',
    'CATALOG_LEDGER_UNAVAILABLE', 'CATALOG_RECONCILIATION_REQUIRED', 'CATALOG_WITHDRAWN',
    'CATALOG_UNAVAILABLE', 'CATALOG_BUNDLE_UNAVAILABLE'
]);
export function unavailableTopicContent(error) {
    return error instanceof DomainError && error.statusCode === 503 && unavailable.has(error.code);
}
