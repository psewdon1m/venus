import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
const ts=(await import(pathToFileURL(resolve('node_modules/typescript/lib/typescript.js')))).default;
const folder=resolve('.artifacts/p05-recovery-source1274-01/.artifacts/p05-oci-rollback-producer-resume04'),old=resolve(folder,'../p05-oci-rollback-producer-resume03'),out=resolve('.docs/implementation/reviews/p05/oci04-host-startup-independent-round01');
const sha=b=>createHash('sha256').update(b).digest('hex'),source=n=>fs.readFileSync(join(folder,n),'utf8');
const funcs=text=>new Map(ts.createSourceFile('x.mjs',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS).statements.filter(ts.isFunctionDeclaration).map(f=>[f.name.text,f.getText()]));
const cases=[],results=[];function pass(name){cases.push({name,status:'PASS'});}
const prior=fs.readFileSync(join(old,'driver.mjs'),'utf8');for(const n of ['producerMap','verifyIncluded']){assert.equal(funcs(prior).get(n),funcs(source('source-proof.mjs')).get(n));pass('exact declaration preserved '+n);}
assert.equal(funcs(prior).get('run'),funcs(source('driver.mjs')).get('run'));pass('driver run including all awaits exact');
assert.equal(fs.readFileSync(join(old,'host-runner.mjs'),'utf8').replaceAll('\r\n','\n').replace("from './driver.mjs'","from './source-proof.mjs'"),source('host-runner.mjs'));pass('hostrunner only import target and CRLF-to-LF changed');
const actualProof=await import(pathToFileURL(join(folder,'source-proof.mjs'))),driver=await import(pathToFileURL(join(folder,'driver.mjs')));
assert.equal(driver.producerMap,actualProof.producerMap);assert.equal(driver.verifyIncluded,actualProof.verifyIncluded);pass('driver reexports identical inert function objects');
assert.deepEqual(actualProof.producerMap(),JSON.parse(fs.readFileSync(join(folder,'INDEX.json'))).source_map);const inv=await actualProof.verifyIncluded();assert.equal(inv.identity,'1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad');assert.equal(Object.keys(inv.files).length,1813);pass('real readonly proof verifies source1813 and producer map');
const root=fs.mkdtempSync(join(tmpdir(),'venus-oci04-review-'));let number=0;
function replaceFunction(file,name,body){const text=fs.readFileSync(file,'utf8'),tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),f=tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);assert(f);fs.writeFileSync(file,text.slice(0,f.getStart(tree))+body+text.slice(f.getEnd()));}
async function fixture({cycle=false,sourceFails=false}={}){
 const parent=join(root,String(++number)),dir=join(parent,'producer');fs.mkdirSync(parent);fs.cpSync(cycle?old:folder,dir,{recursive:true});
 replaceFunction(join(dir,cycle?'driver.mjs':'source-proof.mjs'),'verifyIncluded',sourceFails?"export async function verifyIncluded(){throw Error('EXPLICIT_SOURCE_FAILURE_STUB');}":"export async function verifyIncluded(){await Promise.resolve();globalThis.__source_proof_finished=true;return {fixture:'EXPLICIT_READONLY_SOURCE_STUB_NO_PYTHON'};}");
 replaceFunction(join(dir,'host-runner.mjs'),'executePlan',"export async function executePlan(){assert.equal(globalThis.__source_proof_finished,true);console.log('EXECUTE_ONCE_EXPLICIT_STUB_NO_DOCKER');return {fixture:true};}");
 fs.writeFileSync(join(dir,'oci-resource-guard.mjs'),"export const api_version='P05_OCI_EXTERNAL_RESOURCE_GUARD_1';export async function startOCIResourceGuard(){throw Error('MUST_NOT_RUN_GUARD_CONSTRUCTOR');}\n");
 const b=JSON.parse(fs.readFileSync(join(dir,'BINDING.json')));b.status='ROOT_FROZEN_INDEPENDENTLY_REVIEWED_READY';b.root_run_ack=true;b.resource_guard.sha256=sha(fs.readFileSync(join(dir,'oci-resource-guard.mjs')));fs.writeFileSync(join(dir,'BINDING.json'),JSON.stringify(b));
 const map=(cycle?await import(pathToFileURL(join(dir,'driver.mjs'))):await import(pathToFileURL(join(dir,'source-proof.mjs')))).producerMap;const idx=join(dir,'INDEX.json');fs.writeFileSync(idx,JSON.stringify({source_map:map()}));
 const ack={status:'AUTHORIZED',root_run_ack:true,producer_index_sha256:sha(fs.readFileSync(idx)),attempts:1,statistics_RUN:false,resource_guard_sha256:b.resource_guard.sha256,expanded_image_map_sha256:b.expanded_actual_image_UI_migration_maps_sha256},ackFile=join(parent,'SYNTHETIC_BOUNDARY_ACK.json');fs.writeFileSync(ackFile,JSON.stringify(ack));
 return{dir,ack,ackFile,b,refreeze(){fs.writeFileSync(join(dir,'BINDING.json'),JSON.stringify(b));fs.writeFileSync(idx,JSON.stringify({source_map:map()}));ack.producer_index_sha256=sha(fs.readFileSync(idx));fs.writeFileSync(ackFile,JSON.stringify(ack));}};
}
function cli(name,f,wanted,executed=false){const r=spawnSync(process.execPath,[join(f.dir,'driver.mjs'),'--run-with-ack='+f.ackFile],{encoding:'utf8',timeout:3000,maxBuffer:65536,windowsHide:true});assert.equal(r.status,wanted,name+':'+r.stderr);assert.equal(r.error,undefined);assert.equal(r.stdout.includes('EXECUTE_ONCE_EXPLICIT_STUB_NO_DOCKER'),executed);if(executed)assert.equal(r.stdout.trim(),'EXECUTE_ONCE_EXPLICIT_STUB_NO_DOCKER');results.push({name,status:r.status,stdout:r.stdout,stderr:r.stderr});pass(name);}
try{
 cli('new real driver CLI with explicit machine stubs executes exactly once',await fixture(),0,true);
 cli('old full module cycle remains exit13',await fixture({cycle:true}),13);
 cli('source failure refuses execution',await fixture({sourceFails:true}),1);
 let f=await fixture();fs.writeFileSync(join(f.dir,'EXTRA_UNPINNED_FILE'),'x');cli('changed producer map refuses execution',f,1);
 f=await fixture();f.ack.producer_index_sha256='0'.repeat(64);fs.writeFileSync(f.ackFile,JSON.stringify(f.ack));cli('stale ACK index refuses execution',f,1);
 f=await fixture();f.b.root_run_ack=false;f.refreeze();cli('pending binding refuses execution',f,1);
 f=await fixture();fs.writeFileSync(join(f.dir,'oci-resource-guard.mjs'),"export const api_version='WRONG';export async function startOCIResourceGuard(){}\n");f.b.resource_guard.sha256=sha(fs.readFileSync(join(f.dir,'oci-resource-guard.mjs')));f.ack.resource_guard_sha256=f.b.resource_guard.sha256;f.refreeze();cli('guard API mismatch refuses after hash-valid map',f,1);
 f=await fixture();f.ack.status='NOT_AUTHORIZED';fs.writeFileSync(f.ackFile,JSON.stringify(f.ack));cli('unauthorized ACK refuses execution',f,1);
}finally{assert.equal(dirname(resolve(root)),resolve(tmpdir()));assert(root.includes('venus-oci04-review-'));fs.rmSync(root,{recursive:true,force:true});}
const result={status:'PASS_HOST_STARTUP_METHOD_ONLY',controls:cases.length,cases,subprocesses:results,actual_Docker_calls:0,producer_writes:0,actual_OCI04:'NOT_RUN',fixture_qualification:'Actual driver/module graph with explicit source verification, guard and execute stubs. No functional resource or OCI14 acceptance.'};fs.writeFileSync(join(out,'subprocess-controls.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,controls:cases.length,subprocesses:results.length,actual_Docker_calls:0}));
