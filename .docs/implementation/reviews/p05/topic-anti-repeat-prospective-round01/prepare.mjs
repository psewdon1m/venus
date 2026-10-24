import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from '../../../../../node_modules/typescript/lib/typescript.js';
import {createRequire} from 'node:module';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
const base='.docs/implementation/reviews/p05/topic-anti-repeat-prospective-round01',src='packages/relationship-engine/src',pins=[];
mkdirSync(base+'/compiled',{recursive:true});
for(const n of readdirSync(src).sort())if((n.endsWith('.ts')&&!n.endsWith('.test.ts'))||n.endsWith('.json')){
 const raw=readFileSync(src+'/'+n),dest=base+'/compiled/'+n.replace(/\.ts$/,'.js');
 let compiled=n.endsWith('.ts')?ts.transpileModule(n==='topic-planner.ts'?readFileSync(base+'/topic-planner.prospective.ts.bytes','utf8'):raw.toString('utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext}}).outputText:null;
 if(compiled){const require=createRequire(resolve(src+'/'+n));for(const specifier of ['ajv/dist/2020.js','ajv-formats'])compiled=compiled.replaceAll("from '"+specifier+"'","from '"+pathToFileURL(require.resolve(specifier)).href+"'");}
 writeFileSync(dest,compiled??raw);
 pins.push({path:src+'/'+n,sha256:createHash('sha256').update(raw).digest('hex'),snapshot:dest.slice(base.length+1),kind:n.endsWith('.ts')?'ISOLATED_TRANSPILE_NOT_SOURCE_MUTATION':'EXACT_JSON_BYTES'});
}
const f=readFileSync('tests/p05-topic-games/fixtures.mjs','utf8');
writeFileSync(base+'/fixture-adapter.mjs',f.replace('../../apps/api/dist/security.js','../../../../../apps/api/dist/security.js').replace('./context-fixture.mjs','../../../../../tests/p05-topic-games/context-fixture.mjs').replace('../../packages/relationship-engine/dist/index.js','./compiled/index.js').replace('../../packages/relationship-engine/dist/topic-map.js','./compiled/topic-map.js'));
for(const path of ['tests/p05-topic-games/fixtures.mjs','tests/p05-topic-games/context-fixture.mjs','tests/p03/fixtures.mjs','tests/p03/planner-diagnostics.mjs','.docs/implementation/p03-measurement-protocol-v3.json']){const raw=readFileSync(path);pins.push({path,sha256:createHash('sha256').update(raw).digest('hex')});}
writeFileSync(base+'/source-pins.json',JSON.stringify(pins,null,2)+'\n');
console.log(JSON.stringify({status:'PREPARED',inputs:pins.length,scope:'ISOLATED_EXACT_SOURCE_TRANSPILE_NO_PRODUCT_WRITE'}));

const planner=base+'/compiled/topic-planner.js';writeFileSync(planner,readFileSync(planner,'utf8')+'\nexport {effectivePrivateCards};\n');
