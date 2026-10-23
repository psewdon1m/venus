import {defineConfig} from 'vitest/config';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),target=resolve(root,'packages/relationship-engine/src/topic-map.ts').replaceAll('\\','/'),candidate=resolve(root,'.artifacts/p05-map-index-candidate01/topic-map.ts'),raw=readFileSync(candidate),sha=createHash('sha256').update(raw).digest('hex');
if(sha!=='fc3848000a087e83dbc9b010fa08fde11a1dc526e50539c9252c4e29d8dab58b')throw Error('candidateSHAchanged');let hits=0;
export default defineConfig({plugins:[{name:'independent-sha-pinned-prospective-topic-map',enforce:'pre',load(id){if(id.split('?')[0].replaceAll('\\','/')===target){hits++;writeFileSync(resolve(root,'.docs/implementation/reviews/p05/map-index-review-round01/plugin-receipt.json'),JSON.stringify({target,candidate,sha256:sha,hits,source_substitution_only:true})+'\n');return raw.toString('utf8');}}}],resolve:{alias:[{find:'@venus/contracts/schemas',replacement:resolve(root,'packages/contracts/src/schemas.json')},...['contracts','i18n','relationship-engine','card-catalog'].map(name=>({find:new RegExp('^@venus/'+name+'$'),replacement:resolve(root,'packages/'+name+'/src/index.ts')}))]},test:{include:['packages/relationship-engine/src/topic-map.test.ts'],testTimeout:120000,hookTimeout:120000}});
