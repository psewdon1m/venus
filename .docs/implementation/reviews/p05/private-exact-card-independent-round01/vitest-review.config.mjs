import {defineConfig} from 'vitest/config';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const dep=createRequire(resolve('packages/relationship-engine/package.json'));
const frozen=resolve('.artifacts/p05-engine3-prebundle-source01');
export default defineConfig({root:frozen,cacheDir:resolve('.docs/implementation/reviews/p05/private-exact-card-independent-round01/runtime-cache'),resolve:{alias:[{find:'ajv/dist/2020.js',replacement:dep.resolve('ajv/dist/2020.js')},{find:'ajv-formats',replacement:dep.resolve('ajv-formats')},{find:'@venus/contracts/schemas',replacement:resolve(frozen,'packages/contracts/src/schemas.json')},...['contracts','i18n','relationship-engine','card-catalog'].map(name=>({find:new RegExp('^@venus/'+name+'$'),replacement:resolve(frozen,'packages/'+name+'/src/index.ts')}))]},test:{include:['packages/relationship-engine/src/topic-planner.test.ts','apps/api/src/topic-algorithm-compatibility.test.ts'],testTimeout:120000,hookTimeout:120000,cache:false}});
