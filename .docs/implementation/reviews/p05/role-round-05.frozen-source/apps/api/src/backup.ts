/** P02 disposable backup primitive; deployment scheduling/operator workflow is P06. */
import {Keyring,requireThat,type Cipher,hash,canonical} from './security.js';
import {timers} from './rooms.js';
export interface BackupEnvelope {schema:1;created_at:number;expires_at:number;cipher:Cipher;plain_sha256:string}
export function sealBackup(bytes:Buffer,keys:Keyring,now:number):BackupEnvelope {
  const header={schema:1 as const,created_at:now,expires_at:now+timers.backup,plain_sha256:hash(bytes.toString('base64'))};
  return {...header,cipher:keys.encrypt({dump:bytes.toString('base64')},'venus:database-backup:1:'+canonical(header),false)};
}
export function openBackup(envelope:BackupEnvelope,keys:Keyring,now:number) {
  requireThat(envelope.schema===1&&Number.isSafeInteger(envelope.created_at)&&Number.isSafeInteger(envelope.expires_at)&&envelope.expires_at-envelope.created_at===timers.backup&&envelope.expires_at>now&&envelope.created_at<=now,'BACKUP_EXPIRED_OR_INVALID',403);
  const header={schema:envelope.schema,created_at:envelope.created_at,expires_at:envelope.expires_at,plain_sha256:envelope.plain_sha256};
  const value=keys.decrypt<{dump:string}>(envelope.cipher,'venus:database-backup:1:'+canonical(header));
  requireThat(hash(value.dump)===envelope.plain_sha256,'BACKUP_CORRUPT',503);return Buffer.from(value.dump,'base64');
}
