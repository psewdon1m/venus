/** Read-only, exact pinned production validators. No cache acceptance instrumentation. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';
import ts from 'typescript';
const pins={'apps/web/src/topic-state.ts':'a04cc196ae20773acd179b33ecb413918f9628bb6b0a723c4714f2255becaf1a','apps/web/src/presentation-clock.ts':'f9a1120a1fbff31454eafdfac269ea8163d9e7ef99d916f6ceeecb2f4cceccb0'};
const sha=b=>createHash('sha256').update(b).digest('hex');
export function loadFrontendValidators(root=process.cwd()){
 const proof={typescript:ts.version,inputs:{},compiled:{},module:'CommonJS',target:'ES2022',cache_accept_observed:false,react_auth_boundary_observed:false};
 function load(path,imports){const source=readFileSync(resolve(root,path));assert.equal(sha(source),pins[path],`Exact validator source pin required: ${path}`);proof.inputs[path]=sha(source);const result=ts.transpileModule(source.toString('utf8'),{fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});assert(!(result.diagnostics??[]).some(d=>d.category===ts.DiagnosticCategory.Error));proof.compiled[path]=sha(result.outputText);const module={exports:{}};vm.runInNewContext(result.outputText,{module,exports:module.exports,require:name=>{assert(Object.hasOwn(imports,name),'Unexpected production validator dependency');return imports[name];},Date,performance},{filename:path,timeout:1000});return module.exports;}
 const clock=load('apps/web/src/presentation-clock.ts',{}),state=load('apps/web/src/topic-state.ts',{'./presentation-clock.js':clock});
 return {proof,target:state.validTopicTarget,conversation:state.validTopicConversation,chat:state.validTopicChat};
}
