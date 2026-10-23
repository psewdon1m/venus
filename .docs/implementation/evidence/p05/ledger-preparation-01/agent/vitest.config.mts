import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['.docs/implementation/evidence/p05/ledger-preparation-01/agent/private-topic-ledger.test.ts'],testTimeout:120000}});
