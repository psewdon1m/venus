import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createApp} from './app.js';
import {database} from './database.js';
import type {Version} from '@venus/contracts';
const metadata = JSON.parse(readFileSync(new URL('../../../build-metadata.json', import.meta.url), 'utf8')) as {version: string; source_revision: string};
const version: Version = {service: 'venus', version: metadata.version, source_revision: metadata.source_revision,
  image_digest: process.env.IMAGE_DIGEST ?? 'unreleased', contract_revision: 'P00-2'};
const db = database();
const app = await createApp({probe: db.probe, version, staticRoot: fileURLToPath(new URL('../../web/dist', import.meta.url))});
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
  void app.close().then(() => db.close()).catch(() => {process.exitCode = 1;});
});
try {await app.listen({port: 4300, host: '0.0.0.0'});} catch {
  app.log.error({event: 'startup_failed'}, 'startup_failed'); await db.close(); process.exitCode = 1;
}
