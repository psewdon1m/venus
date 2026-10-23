/** Execute exact host-runner AST in an inert VM with every Docker/filesystem call intercepted. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import {captureProducer,assertBinding,runtimeDigest,assertUnchanged,assertShard,sha} from './runner-policy.mjs';
import {inertShard} from './inert-report-fixture.mjs';
const root='.artifacts/p05-v2-layout-producer-resume03',source=readFileSync(root+'/run.mjs','utf8'),ast=ts.createSourceFile('run.mjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);assert.equal(ast.parseDiagnostics.length,0);
let text=source;for(const node of [...ast.statements].reverse())if(ts.isImportDeclaration(node))text=text.slice(0,node.getFullStart())+text.slice(node.end);
const binding=JSON.parse(readFileSync(root+'/binding.json','utf8')),buildBytes=readFileSync(binding.root_build_receipt_path),results=[];
function replay(change={}){
 const project='venus-v2-layout-'+'01'.repeat(6),files=new Map(),fds=new Map(),commands=[],removals=[];let nextFd=10,sourceCaptures=0,producerCaptures=0;
 const producerBefore={'run.mjs':{type:'file',sha256:sha(Buffer.from(source)),bytes:Buffer.byteLength(source)},'binding.json':{type:'file',sha256:sha(Buffer.from(JSON.stringify(binding))),bytes:1}},ack={root_run_ack:true,independent_producer_review:'PASS',independent_review_index_sha256:'a'.repeat(64),source_identity:binding.source_identity,image:binding.image,producer_runtime_digest:runtimeDigest(producerBefore)},report=inertShard();change.ack?.(ack);change.report?.(report);
 const reportPath=resolve('.artifacts/p05/'+project+'/layout-report.json');files.set(reportPath,Buffer.from(JSON.stringify(report)));
 const reviewObject={status:change.reviewFail?'FAIL':'PASS_LAYOUT_PRODUCER_METHOD_ONLY',source_identity:change.reviewSource?'f'.repeat(64):binding.source_identity,image:change.reviewImage?'sha256:'+'f'.repeat(64):binding.image,producer_runtime_digest:change.reviewRuntime?'f'.repeat(64):runtimeDigest(producerBefore)};if(change.reviewNoImage)delete reviewObject.image;if(change.reviewNoRuntime)delete reviewObject.producer_runtime_digest;
 const review=Buffer.from(JSON.stringify(reviewObject));ack.independent_review_path='.docs/implementation/reviews/p05/INERT/index.json';ack.independent_review_index_sha256=sha(review);if(change.reviewHash)ack.independent_review_index_sha256='f'.repeat(64);
 const read=path=>{path=String(path);if(path.endsWith('ROOT_RUN_ACK.json'))return Buffer.from(JSON.stringify(ack));if(path===ack.independent_review_path)return review;if(path.endsWith('binding.json'))return Buffer.from(JSON.stringify(binding));if(path===binding.root_build_receipt_path)return buildBytes;return files.get(path)??Buffer.from('INERT');};
 const write=(path,value)=>files.set(String(path),Buffer.from(value));
 const command=(exe,argv,options={})=>{
  assert.equal(exe,'docker');commands.push(argv);let status=0,stdout='',stderr='';
  if(argv[0]==='image')stdout=binding.image+'\n';
  else if(argv[0]==='container'&&argv[1]==='inspect'){if(change.liveWorker){stdout=JSON.stringify([{Config:{Labels:{'venus.p05.project':change.foreignWorker?'foreign':project,'venus.p05.role':'browser'}}}]);}else{status=1;stderr='No such container';}}
  else if(argv.includes('run')&&change.workerFail)status=1;
  else if(argv.includes('down')&&change.cleanupFail)status=1;
  else if(['ps','volume','network'].includes(argv[0])&&change.leftover===argv[0])stdout='inert-leftover';
  if(options.stdio?.[1]!==undefined){write(fds.get(options.stdio[1]),stdout+stderr);return {status};}return {status,stdout,stderr};
 };
 const inventory=()=>{const entries=Object.fromEntries(Array.from({length:1819},(_,i)=>['file'+i,'0'.repeat(64)]));sourceCaptures++;if(change.sourceChanged&&sourceCaptures>1)entries.file0='1'.repeat(64);return {files:entries,source_identity:binding.source_identity};};
 const ctx={assert,spawnSync:command,execFileSync:()=>JSON.stringify(inventory()),readFileSync:(path,encoding)=>encoding?read(path).toString('utf8'):read(path),writeFileSync:write,mkdtempSync:prefix=>prefix+'inert',mkdirSync:()=>{},rmSync:path=>removals.push(path),openSync:path=>{const fd=nextFd++;fds.set(fd,path);return fd;},closeSync:()=>{},copyFileSync:()=>{},resolve,join,dirname,tmpdir:()=>resolve('.artifacts/INERT-TMP'),randomBytes:n=>Buffer.alloc(n,1),sha,assertBinding,runtimeDigest,assertUnchanged,assertShard,captureProducer:()=>{producerCaptures++;const p=structuredClone(producerBefore);if(change.producerAdded&&producerCaptures>1)p['added.mjs']={type:'file',sha256:'f'.repeat(64),bytes:1};if(change.producerChanged&&producerCaptures>1)p['run.mjs'].sha256='e'.repeat(64);return p;},process:{env:{},platform:'win32',exitCode:0},console:{log:()=>{}},Buffer,JSON};
 let thrown=null;try{vm.runInNewContext(text,ctx,{timeout:10000});}catch(e){thrown=e;}
 const result=files.get(resolve('.artifacts/p05/'+project+'/runner.json'));
 return {thrown,result:result?JSON.parse(result):null,commands,removals,sourceCaptures,producerCaptures,exitCode:ctx.process.exitCode};
}
const test=(name,fn)=>{fn();results.push({name,status:'PASS'});};
test('baseline-inert-exact-runner-cleanup-pass',()=>{const r=replay();assert(!r.thrown);assert.equal(r.result.status,'PASS');assert.equal(r.result.cleanup,'PASS');assert.equal(r.sourceCaptures,2);assert.equal(r.producerCaptures,2);assert.equal(r.removals.length,1);});
test('ACKfalse-exits-before-any-Docker',()=>{const r=replay({ack:a=>a.root_run_ack=false});assert(r.thrown);assert.equal(r.commands.length,0);assert.equal(r.removals.length,0);});
test('unreviewed-producer-exits-before-Docker',()=>{const r=replay({ack:a=>a.independent_producer_review='PENDING'});assert(r.thrown);assert.equal(r.commands.length,0);});
test('wrong-runtime-digest-exits-before-Docker',()=>{const r=replay({ack:a=>a.producer_runtime_digest='b'.repeat(64)});assert(r.thrown);assert.equal(r.commands.length,0);});
for(const [name,change]of [['review-hash-mismatch',{reviewHash:true}],['review-verdict-fail',{reviewFail:true}],['review-source-mismatch',{reviewSource:true}]])test(name+'-before-Docker',()=>{const r=replay(change);assert(r.thrown);assert.equal(r.commands.length,0);});
for(const [name,change]of [['review-runtime-mismatch',{reviewRuntime:true}],['review-image-mismatch',{reviewImage:true}],['review-runtime-missing',{reviewNoRuntime:true}],['review-image-missing',{reviewNoImage:true}]])test(name+'-before-allocation-Docker',()=>{const r=replay(change);assert(r.thrown);assert.equal(r.commands.length,0);assert.equal(r.removals.length,0);assert.equal(r.sourceCaptures,0);});
for(const[name,change]of [
 ['added-producer-file',{producerAdded:true}],['changed-producer-bytes',{producerChanged:true}],['same-identity-different-full-source',{sourceChanged:true}],['worker-nonzero',{workerFail:true}],['cleanup-nonzero',{cleanupFail:true}],['leftover-container',{leftover:'ps'}],['leftover-volume',{leftover:'volume'}],['leftover-network',{leftover:'network'}],['forced-worker-removal',{liveWorker:true}],['missing-cell',{report:r=>r.records.pop()}],['missing-role',{report:r=>r.records[0].roles=[]}],['duplicate-cell',{report:r=>r.records[0]=r.records[1]}],['P1-protocol',{report:r=>r.records[0].protocol=1}],['CSS-native-claim',{report:r=>r.records.find(v=>v.native).native_measurement.css_zoom='2'}],['worker-cleanup-failed',{report:r=>r.cleanup='FAIL'}],['pageerror',{report:r=>r.page_errors.push({name:'Error'})}],['observer-truncation',{report:r=>r.request_metadata_overflow=true}],['fake-action-groups',{report:r=>r.keyboard_actions[0].scene='invented'}],['missing-action-receipt',{report:r=>r.keyboard_actions.find(a=>a.receipt_matches).receipt_matches=false}]
])test(name+'-FAIL',()=>{const r=replay(change);assert(!r.thrown);assert.equal(r.result.status,'FAIL');assert.equal(r.exitCode,1);});
test('foreign-worker-never-removed',()=>{const r=replay({liveWorker:true,foreignWorker:true});assert.equal(r.result.status,'FAIL');assert.equal(r.result.cleanup,'FAIL');assert(!r.commands.some(argv=>argv[0]==='container'&&argv[1]==='rm'));});
console.log(JSON.stringify({scope:'INERT_VM_EXACT_HOST_RUNNER_NOT_DOCKER',source_sha256:sha(Buffer.from(source)),count:results.length,results,actual_captureProducer_export_type:typeof captureProducer},null,2));
