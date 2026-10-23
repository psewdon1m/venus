import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
export default defineConfig({resolve:{alias:{'ajv/dist/2020.js':fileURLToPath(new URL('../../../../../packages/relationship-engine/node_modules/ajv/dist/2020.js',import.meta.url))}},test:{include:['.docs/implementation/evidence/p05/planner-targeted-review-01/source/packages/relationship-engine/src/{engine,topic-map,topic-planner}.test.ts'],testTimeout:120000}});
