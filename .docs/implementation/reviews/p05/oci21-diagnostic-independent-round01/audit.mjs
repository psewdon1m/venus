import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root='C:/.projects/venus',out=fileURLToPath(new URL('.',import.meta.url));
const author=join(root,'.docs/implementation/reviews/p05/oci21-diagnostic-author-round01');
const parent=join(root,'.artifacts/p05-pilot-bundle-source13/.artifacts/p05-compatible-rollback-producer20');
const producer=parent.replace(/20$/,'21'),pins={};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function pin(path){const bytes=readFileSync(path),result={bytes:bytes.length,sha256:sha(bytes)};pins[relative(root,path).replaceAll('\\','/')]=result;return result;}
function expected(path,want){assert.deepEqual(pin(path),want,path);}
assert.equal(pin(join(author,'INDEX.json')).sha256,'fd1308756dc711389ef419be80af46558f807fbccc5ec0dc75fc76921ae566ce');
assert.equal(pin(join(producer,'INDEX.json')).sha256,'7045afa7d30ea2e1f94eb6c0efcaa54cb83b00cc65f05a636a726ca645487596');
const ai=JSON.parse(readFileSync(join(author,'INDEX.json')));assert.equal(Object.keys(ai.files).length,15);
for(const [name,want] of Object.entries(ai.files))expected(join(author,name),want);
for(const [name,want] of Object.entries(JSON.parse(readFileSync(join(author,'INPUT_PINS.json')))))expected(join(root,name),want);
function modules(dir){const result={};function visit(path){for(const child of readdirSync(path,{withFileTypes:true})){const p=join(path,child.name);if(child.isDirectory())visit(p);else if(child.name.endsWith('.mjs'))result[relative(dir,p).replaceAll('\\','/')]=p;}}visit(dir);return result;}
const pm=modules(parent),nm=modules(producer);assert.deepEqual(Object.keys(nm).sort(),Object.keys(pm).sort());assert.equal(Object.keys(nm).length,40);
const changed=[];for(const name of Object.keys(nm)){if(pin(nm[name]).sha256!==pin(pm[name]).sha256)changed.push(name);}
assert.deepEqual(changed,['browser-child.mjs']);
const pi=JSON.parse(readFileSync(join(producer,'INDEX.json')));
const parentIndex=JSON.parse(readFileSync(join(parent,'INDEX.json')));
const indexedAdded=Object.keys(pi.files).filter(name=>!Object.hasOwn(parentIndex.files,name));
const indexedRemoved=Object.keys(parentIndex.files).filter(name=>!Object.hasOwn(pi.files,name));
const indexedChanged=Object.keys(pi.files).filter(name=>Object.hasOwn(parentIndex.files,name)&&(pi.files[name].sha256!==parentIndex.files[name].sha256||pi.files[name].bytes!==parentIndex.files[name].bytes));
assert.deepEqual(indexedAdded,['OPERATIONAL_REVISION21.json']);assert.deepEqual(indexedRemoved,[]);assert.deepEqual(indexedChanged,['browser-child.mjs']);
for(const [name,path] of Object.entries(nm)){const actual=pin(path);assert.equal(actual.bytes,pi.files[name].bytes);assert.equal(actual.sha256,pi.files[name].sha256);}
for(const name of ['BINDING.json','OPERATIONAL_REVISION21.json','ROOT_RUN_ACK_TEMPLATE.json','PROFILE.json']){pin(join(producer,name));}
const before=readFileSync(join(parent,'browser-child.mjs'),'utf8'),after=readFileSync(join(producer,'browser-child.mjs'),'utf8');
let inverse=after.slice(0,after.indexOf('/** OCI21 public diagnostic only:'))+after.slice(after.indexOf('/** Browser-native transport hold only;'));
inverse=inverse.replace("import {readFileSync,existsSync,statfsSync,openSync,constants,fstatSync,writeSync,closeSync} from 'node:fs';\nimport {setInterval,clearInterval} from 'node:timers';","import {readFileSync,existsSync} from 'node:fs';");
inverse=inverse.replace("const read=name=>JSON.parse(readFileSync('/private/'+name+'.json')),diagnostic=createBrowserDiagnostic(lease,gates);","const read=name=>JSON.parse(readFileSync('/private/'+name+'.json'));");
inverse=inverse.replace("await diagnostic.awaiting(diagnosticPhase,diagnosticStep,()=>host.context().close());diagnosticStep='B2_OBSERVER_PAGE_OPEN';const observer=await diagnostic.awaiting(diagnosticPhase,diagnosticStep,()=>page(b.A,b.A.members[3],1001000));","await host.context().close();diagnosticStep='B2_OBSERVER_PAGE_OPEN';const observer=await page(b.A,b.A.members[3],1001000);");
inverse=inverse.replace("report.gate_overflow=gates.length>4;report.status='FAIL';try{diagnostic.caught(error,diagnosticPhase,diagnosticStep);}catch{report.diagnostic_write_failed=true;}}","report.gate_overflow=gates.length>4;report.status='FAIL';}");
inverse=inverse.replace("finally{const diagnosticClean=diagnostic.close();if(!diagnosticClean){report.diagnostic_write_failed=true;report.status='FAIL';}for(const gate of gates)gate.dispose();let clean=true;","finally{for(const gate of gates)gate.dispose();let clean=true;");
const literalInverse=inverse===before;
assert.equal(inverse.replaceAll('\r\n','\n'),before.replaceAll('\r\n','\n'),'inverse normalized source must equal OCI20');
assert.equal(after.match(/diagnostic\.awaiting\(/g).length,2);
assert(after.indexOf('diagnostic.caught(')<after.indexOf('finally{const diagnosticClean=diagnostic.close()'));
assert(after.indexOf('diagnostic.close()')<after.indexOf('for(const c of contexts)'));
for(const name of ['BINDING.json','ROOT_RUN_ACK_TEMPLATE.json'])assert.equal(JSON.parse(readFileSync(join(producer,name))).root_run_ack,false);
const originalSteps=[...new Set([...before.matchAll(/diagnosticStep='([^']+)'/g)].map(m=>m[1]))].sort();
const diagnosticSteps=JSON.parse(after.match(/steps=new Set\((\[[^\n]+?\])\);/)[1]).sort();assert.deepEqual(diagnosticSteps,originalSteps);assert.equal(diagnosticSteps.length,37);
// Freeze an independently executable copy of the focused author controls with only absolute input URL rebasing.
let controls=readFileSync(join(author,'controls.mjs'),'utf8');
controls=controls.replace("'../p05-pilot-bundle-source13/.artifacts/p05-compatible-rollback-producer21/bound-profile.mjs'",JSON.stringify(pathToFileURL(join(producer,'bound-profile.mjs')).href));
controls=controls.replace("new URL('../p05-pilot-bundle-source13/.artifacts/p05-compatible-rollback-producer21/browser-child.mjs',import.meta.url)",JSON.stringify(join(producer,'browser-child.mjs')));
writeFileSync(join(out,'focused-controls.mjs'),controls);
writeFileSync(join(out,'INPUT_PINS.json'),JSON.stringify(pins,null,2)+'\n');
console.log(JSON.stringify({status:'PASS_STATIC_METHOD_ONLY_WITH_EOL_QUALIFICATION',author_children:15,recursive_MJS:40,unchanged_MJS:39,changed_MJS:changed,indexedAdded,indexedRemoved,indexedChanged,inverse_browser_bytes_exact:literalInverse,inverse_browser_normalized_source_exact:true,parent_browser_CRLF:before.includes('\r\n'),new_browser_CRLF:after.includes('\r\n'),static_steps:37,root_run_ack:false,source_A17_binding_required:true,checks_scope:'author children + supplied pins + 40 recursive MJS + indexed non-MJS delta; no credential contents read; producer full non-MJS map not rehashed'}));
