/* global structuredClone */
/** Finite controls of the exact extracted helper, not an actual browser run. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parse} from 'acorn';

const parent='.artifacts/p05-private-batch-browser-producer17',root='.artifacts/p05-private-batch-browser-producer18';
const text=readFileSync(root+'/browser.mjs','utf8'),old=readFileSync(parent+'/browser.mjs','utf8');
const hash=value=>createHash('sha256').update(value).digest('hex');
assert.equal(hash(old),'fc2e776d4100424b88e0cfdc28fa8904e5f83d1fc8898342ad35574f6c88c0b8');
const ast=parse(text,{ecmaVersion:'latest',sourceType:'module'}),oldAst=parse(old,{ecmaVersion:'latest',sourceType:'module'});
const declaration=ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='startPrivate');assert(declaration);
const helper=text.slice(declaration.start,declaration.end),eol=text.includes('\r\n')?'\r\n':'\n';
let restored=text.replace(eol+helper+eol,'');
const reverse=[['const f=await startPrivate(mode);await invite(f);','await start(mode);const f=await seekPrivate();await invite(f);'],["q=await startPrivate('questions');qPair=","await start('questions');q=await seekPrivate();qPair="],["const f=await startPrivate('truth_or_dare');await invite(f);","await start('truth_or_dare');const f=await seekPrivate();await invite(f);"],["const f=await startPrivate('yes_but');await invite(f,{condition:true});","await start('yes_but');const f=await seekPrivate();await invite(f,{condition:true});"]];
for(const [a,b]of reverse){assert.equal(restored.split(a).length-1,1);restored=restored.replace(a,b);}
const metadataReverse=[[
 "assert(rows.length<2048,'METHOD12_MUTATION_RECORD_CAP')","assert(rows.length<256,'METHOD12_MUTATION_RECORD_CAP')"],
 ['if(report.request_metadata.length<2048)','if(report.request_metadata.length<400)'],
 [';else report.request_metadata_overflow=true;',';'],
 ["assert(!report.request_metadata_overflow,'METHOD18_REQUEST_METADATA_OVERFLOW');",''],
 ["if(report.request_metadata_overflow)report.status='FAIL';",'']];
for(const [a,b]of metadataReverse){assert.equal(restored.split(a).length-1,1);restored=restored.replace(a,b);}
assert.equal(restored,old,'Only helper/four setup calls and explicitly authorized metadata caps/overflow gates may differ');
const functions=tree=>new Map(tree.body.filter(n=>n.type==='FunctionDeclaration').map(n=>[n.id.name,n]));
const previous=functions(oldAst),current=functions(ast);let unchangedFunctions=0;
for(const [name,node]of previous)if(!['freshPrivate','recordMutation','actor'].includes(name)){const now=current.get(name);assert.equal(text.slice(now.start,now.end),old.slice(node.start,node.end));unchangedFunctions++;}
function cases(tree,source){const found=new Map();function visit(node){if(!node||typeof node!=='object')return;if(node.type==='CallExpression'&&node.callee.name==='check'&&Number.isInteger(node.arguments[0]?.value)){found.set(node.arguments[0].value,source.slice(node.arguments[1].start,node.arguments[1].end));}for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}visit(tree);return found;}
const beforeCases=cases(oldAst,old),afterCases=cases(ast,text);assert.equal(beforeCases.size,16);assert.equal(afterCases.size,16);
for(let i=1;i<=16;i++){let body=afterCases.get(i);for(const [a,b]of reverse)body=body.replace(a,b);assert.equal(body,beforeCases.get(i),'All case assertions and actions exact17 after setup-call normalization');}
const runtime=['delivery-diagnostics.mjs','DESIGN.md','frontend-validators.mjs','observations.mjs','private-batch-observer.mjs','readiness-diagnostics.mjs','request-emission.mjs','run.mjs','runtime.mjs'];
for(const name of runtime)assert.deepEqual(readFileSync(root+'/'+name),readFileSync(parent+'/'+name));
const build=new Function('assert','report','actors','phase','start','seekPrivate','save','console',`return (${helper});`);
const known='No real private encounter within declared20-round bound',room='11111111-1111-4111-8111-111111111111';
const session=i=>'22222222-2222-4222-8222-'+String(i).padStart(12,'0');
function fixture({outcomes=[],startFailure,duplicate=false,roomChange=false,mismatch=false,prefilled=0}={}){
 const report={private_setup_sessions:Array.from({length:prefilled},()=>({attempt:1}))},actors=[{room}],saved=[],logs=[],history=[],modes=[];let starts=0,seeks=0,last;
 const start=async mode=>{starts++;modes.push(mode);if(startFailure)throw startFailure;last=session(duplicate?1:starts);history.push(last);if(roomChange)actors[0].room='33333333-3333-4333-8333-333333333333';return {session:last};};
 const seek=async()=>{const outcome=outcomes[seeks++];if(outcome!==undefined)throw outcome;return {session:mismatch?session(99):last,plan:{round_index:11}};};
 const run=build(assert,report,actors,'questions-private-invitation',start,seek,()=>saved.push(structuredClone(report)),{log:line=>logs.push(JSON.parse(line))});
 return {run,report,saved,logs,history,modes,starts:()=>starts,seeks:()=>seeks};
}
const controls=[];
async function test(name,fn){await fn();controls.push({name,status:'PASS'});}
await test('static exact17 except helper/four setup calls/authorized metadata caps;16case assertions/all other functions and9runtime files exact',async()=>{});
for(const failures of [0,1,2])await test('positive encounter after '+failures+' explicitly logged no-draw sessions',async()=>{
 const f=fixture({outcomes:Array.from({length:failures},()=>Error(known))}),result=await f.run('questions');assert.equal(f.starts(),failures+1);assert.equal(f.seeks(),failures+1);assert.equal(result.session,session(failures+1));assert.equal(f.report.private_setup_sessions.length,failures+1);assert.equal(f.logs.length,failures+1);assert.equal(f.history.length,failures+1);assert.equal(new Set(f.history).size,failures+1);assert(f.modes.every(m=>m==='questions'));
 for(const r of f.report.private_setup_sessions.slice(0,failures)){assert.equal(r.outcome,'NO_PRIVATE_DRAW');assert.equal(r.observed_rounds,20);assert.equal(r.round_bound,20);assert.equal(r.room_id,room);}
 const row=f.report.private_setup_sessions.at(-1);assert.equal(row.outcome,'PRIVATE_SELECTED');assert.equal(row.selected_actual_session,result.session);assert.equal(row.selected_round_index,11);assert(f.saved.some(s=>s.private_setup_sessions.at(-1).outcome==='RUNNING'));assert.equal(f.saved.at(-1).private_setup_sessions.at(-1).outcome,'PRIVATE_SELECTED');
});
await test('three no-draw sessions produce explicit setupFAIL and never a fourth session',async()=>{const f=fixture({outcomes:[Error(known),Error(known),Error(known),Error('MUST_NOT_RUN')]});await assert.rejects(f.run('truth_or_dare'),{message:'METHOD18_PRIVATE_SETUP_NO_ENCOUNTER_WITHIN_3_SESSIONS'});assert.equal(f.starts(),3);assert.equal(f.seeks(),3);assert(f.report.private_setup_sessions.every(r=>r.outcome==='NO_PRIVATE_DRAW'&&r.observed_rounds===20));assert(f.modes.every(m=>m==='truth_or_dare'));});
for(const failure of [Error('HTTP409'),Error('CONSENT_EXPIRED'),Error('ROUND_STALE'),Error('EXACT_RECEIPT_FAILED'),Error('DEADLINE_EXPIRED'),Error('SOURCE_UNAVAILABLE'),Error(known+' '),{name:'Error',message:known},known,new(class ApiError extends Error {})(known),new assert.AssertionError({message:known})])await test('no retry for non-exact/non-native error '+controls.length,async()=>{const f=fixture({outcomes:[failure]});await assert.rejects(f.run('questions'),error=>error===failure);assert.equal(f.starts(),1);assert.equal(f.seeks(),1);assert.equal(f.report.private_setup_sessions[0].outcome,'FAIL');});
await test('even exact no-draw text from start is a fatal setup failure, not seek absence',async()=>{const failure=Error(known),f=fixture({startFailure:failure});await assert.rejects(f.run('questions'),error=>error===failure);assert.equal(f.starts(),1);assert.equal(f.seeks(),0);assert.equal(f.report.private_setup_sessions[0].outcome,'FAIL');});
await test('a selected foreign session cannot trigger a retry',async()=>{const f=fixture({mismatch:true});await assert.rejects(f.run('questions'));assert.equal(f.starts(),1);assert.equal(f.report.private_setup_sessions[0].outcome,'FAIL');});
await test('room changes cannot trigger a retry',async()=>{const f=fixture({roomChange:true});await assert.rejects(f.run('questions'));assert.equal(f.starts(),1);assert.equal(f.seeks(),0);});
await test('duplicate session fails rather than resetting or pretending a new history',async()=>{const f=fixture({outcomes:[Error(known)],duplicate:true});await assert.rejects(f.run('questions'));assert.equal(f.starts(),2);assert.equal(f.seeks(),1);assert.equal(f.report.private_setup_sessions[1].outcome,'FAIL');});
await test('bounded24 setup record cap refuses before starting another session',async()=>{const f=fixture({prefilled:24});await assert.rejects(f.run('questions'),{message:'METHOD18_PRIVATE_SETUP_RECORD_CAP'});assert.equal(f.starts(),0);});
await test('unknown mode refuses without a UI action',async()=>{const f=fixture();await assert.rejects(f.run('UNKNOWN'),{message:'METHOD18_PRIVATE_SETUP_MODE'});assert.equal(f.starts(),0);});
await test('setup outcome metadata never copies error text/body/token/canary',async()=>{const failure=Object.assign(Error('PRIVATE_CANARY_TOKEN_BODY'),{body:{secret:'PRIVATE_CANARY_TOKEN_BODY'}}),f=fixture({outcomes:[failure]});await assert.rejects(f.run('yes_but'));assert(!JSON.stringify([f.report,f.saved,f.logs]).includes('PRIVATE_CANARY_TOKEN_BODY'));assert.equal(f.report.private_setup_sessions[0].outcome,'FAIL');});

await test('mutation metadata accepts2048 and fails before record2049',async()=>{
 const r={},node=current.get('recordMutation'),fn=new Function('assert','report',`return (${text.slice(node.start,node.end)});`)(assert,r);
 for(let i=0;i<2048;i++)fn({control:'finite'});assert.equal(r.mutation_dispatches.length,2048);assert.throws(()=>fn({control:'overflow'}),{message:'METHOD12_MUTATION_RECORD_CAP'});assert.equal(r.mutation_dispatches.length,2048);
});
await test('request metadata flags overflow and cannot reachPASS or survive final cleanup asPASS',async()=>{
 let listener;function visit(node){if(!node||typeof node!=='object')return;if(node.type==='CallExpression'&&node.callee.type==='MemberExpression'&&node.callee.property.name==='on'&&node.arguments[0]?.value==='response')listener=node.arguments[1];for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}visit(current.get('actor'));assert(listener);
 const r={request_metadata:Array.from({length:2047},()=>({})),status:'FAIL'},fn=new Function('report','locale','phase','a','URL',`return (${text.slice(listener.start,listener.end)});`)(r,'en','finite',{},URL),response={url:()=> 'https://fixture.test/api/v2/rooms/'+room+'/game',request:()=>({method:()=> 'POST',url:()=> 'https://fixture.test/api/v2/rooms/'+room+'/game',postDataJSON:()=>({kind:'accept',scope:'invitation'})}),status:()=>200};
 await fn(response);assert.equal(r.request_metadata.length,2048);assert.equal(r.request_metadata_overflow,undefined);await fn(response);assert.equal(r.request_metadata.length,2048);assert.equal(r.request_metadata_overflow,true);
 const gate="assert(!report.request_metadata_overflow,'METHOD18_REQUEST_METADATA_OVERFLOW');",final="if(report.request_metadata_overflow)report.status='FAIL';";assert(text.includes(gate));assert(text.includes(final));assert.throws(()=>new Function('assert','report',gate+"report.status='PASS';")(assert,r),{message:'METHOD18_REQUEST_METADATA_OVERFLOW'});assert.equal(r.status,'FAIL');r.status='PASS';new Function('report',final)(r);assert.equal(r.status,'FAIL');
});
const result={status:'PASS_METHOD18_FINITE_ONLY_NOT_ACTUAL_BROWSER',controls:controls.length,unchanged_other_functions:unchangedFunctions,cases:16,unchanged_runtime_files:9,parent_browser_sha256:hash(old),browser_sha256:hash(text),results:controls};
writeFileSync('.docs/implementation/reviews/p05/topic-browser-method18-independent-review-round01/author-repeat-result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,results:undefined}));
