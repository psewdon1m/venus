import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['.docs/implementation/evidence/p05/ledger-preparation-01/agent/lifecycle-03/*.test.ts'],testTimeout:120000}});
