import {defineConfig} from 'vitest/config';
import {createRequire} from 'node:module';
const api=createRequire('C:/.projects/venus/apps/api/package.json');
const frozen='C:/.projects/venus/.artifacts/p05-pilot-bundle-source01';
const dep=['@fastify/cookie','@fastify/static','@fastify/websocket','fastify','pg','ajv','ajv-formats'].map(name=>({find:new RegExp('^'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$'),replacement:api.resolve(name)}));
export default defineConfig({resolve:{alias:[{find:'ajv/dist/2020.js',replacement:api.resolve('ajv/dist/2020.js')},...dep,{find:'@venus/contracts/schemas',replacement:frozen+'/packages/contracts/src/schemas.json'},...['contracts','i18n','relationship-engine','card-catalog'].map(name=>({find:new RegExp('^@venus/'+name+'$'),replacement:frozen+'/packages/'+name+'/src/index.ts'}))]},test:{include:['C:/.projects/venus/.docs/implementation/reviews/p05/ordinary03-500-independent-diagnosis-round01/observability.test.ts'],testTimeout:10000}});
