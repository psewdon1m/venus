import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {createHash} from 'node:crypto';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import ts from '../../../../../node_modules/typescript/lib/typescript.js';
const base='.docs/implementation/reviews/p05/topic-boot-history-prospective-round02',candidate=readFileSync(base+'/topic-games.prospective.ts.bytes'),sha=b=>createHash('sha256').update(b).digest('hex');
if(sha(candidate)!=='0f3f0f28f44a960f88c752a50f338781dfd7099ac73bb83316922fddc275959a')throw Error('Candidate pin changed');mkdirSync(base+'/api',{recursive:true});writeFileSync(base+'/topic-games.prospective.ts.bytes',candidate);const pins=[];
for(const name of ['topic-games','rooms','security','topic-chat-policy','topic-game-model','topic-content-availability']){
 const source='apps/api/src/'+name+'.ts',raw=name==='topic-games'?candidate:readFileSync(base+'/api/'+name+'.ts.bytes');writeFileSync(base+'/api/'+name+'.ts.bytes',raw);
 const transpiled=ts.transpileModule(raw.toString('utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext}}).outputText.replaceAll("from '@venus/relationship-engine'","from '"+pathToFileURL(resolve('.docs/implementation/reviews/p05/topic-anti-repeat-prospective-round01/compiled/index.js')).href+"'");
 writeFileSync(base+'/api/'+name+'.js',transpiled);pins.push({path:source,sha256:sha(raw),kind:name==='topic-games'?'EXCLUDED_PROSPECTIVE':'EXACT_CONTEXT_SOURCE'});
}
writeFileSync(base+'/source-pins.json',JSON.stringify(pins,null,2)+'\n');console.log(JSON.stringify({status:'PREPARED_EXCLUDED_PROSPECTIVE_BOOT',candidate:sha(candidate),api_inputs:pins.length,engine2:'ef1e11228f45ba6351e69f02b13f78726cd158cd7d6810d19de445550d3ea756'}));
