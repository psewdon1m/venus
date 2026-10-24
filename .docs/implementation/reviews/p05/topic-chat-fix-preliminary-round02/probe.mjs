import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const directory=resolve('.docs/implementation/reviews/p05/topic-chat-fix-preliminary-round02'),original='apps/api/src/topic-games.ts',raw=readFileSync(original),source=raw.toString('utf8');
writeFileSync(directory+'/topic-games.ts.bytes',raw);
const transpiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/from ['"]\.\/([^'"]+)['"]/g,(_m,name)=>'from '+JSON.stringify(pathToFileURL(resolve('apps/api/dist',name)).href));
writeFileSync(directory+'/subject.mjs',transpiled);
const {TopicGames}=await import(pathToFileURL(directory+'/subject.mjs').href);
const cases=[['VALID_ASCII','valid',true],['VALID_ASTRAL','\u{1f600}',true],['INVALID_HIGH','\ud800',false],['INVALID_LOW','\udc00',false],['INVALID_EMBEDDED','a\ud800b',false],['INVALID_BIDI','a\u202Eb',false],['INVALID_EMPTY',' ',false]];
let reached=0;const subject=new TopicGames({options:{keys:{}},now:()=>60000},{enabled:true,privateTextChat:true,source:{},safety:{}});subject.mutation=async()=>{reached++;return {reached_mutation:true};};
const checks=[];for(const [id,literal,allowed]of cases){const text=JSON.parse('"'+literal+'"');let error=null;const before=reached;try{await subject.sendChat('room','credential','session','round',{request_id:'11111111-1111-4111-8111-111111111111',conversation_id:'22222222-2222-4222-8222-222222222222',epoch:1,text});}catch(e){error={code:e.code,message:e.message};}const observed=reached>before;checks.push({id,expected_reach_mutation:allowed,actual_reach_mutation:observed,error,status:observed===allowed?'PASS':'FAIL'});}
const report={schema_version:1,status:checks.every(c=>c.status==='PASS')?'PASS':'FAIL',scope:'Independent source-bound direct public sendChat validation; mutation seam records reachability only; not actual HTTP/PG',source_sha256:createHash('sha256').update(raw).digest('hex'),source_unchanged:readFileSync(original).equals(raw),checks};writeFileSync(directory+'/validation-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(report.status!=='PASS')process.exitCode=1;
