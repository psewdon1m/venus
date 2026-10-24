import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const root=process.cwd(),out=resolve('.docs/implementation/reviews/p05/topic-method15-recovery-rebind-independent-review-round01');
const draft=JSON.parse(readFileSync('.artifacts/p05-recovery-method15-binding-draft01.json','utf8'));
const snapshot=draft.source_root,runner=join(snapshot,'.artifacts/p05-recovery-method15-browser-run01.mjs');
const original=readFileSync(runner,'utf8');
// Execute exact prefix through all pre-allocation fences; imports supplied by an inert VM.
// The sole syntax relocation is import.meta.url -> runnerURL. No source/predicate rewrite.
const prefix=original.slice(0,original.indexOf("const project='venus-topic-browser-'"))
 .replace(/^import .*;\r?\n/gm,'').replaceAll('import.meta.url','runnerURL');
assert(prefix.includes('const before=inventory()')&&!prefix.includes('const project='));
const sha=b=>createHash('sha256').update(b).digest('hex'),reviewBytes=Buffer.from('{"status":"PASS_OPERATIONAL_REBIND_ONLY","fixture":true}');
const valid={...structuredClone(draft),status:'ROOT_RUN_ACK',rebinding_review_index:join(root,'REVIEW_FIXTURE_ONLY'),rebinding_review_index_sha256:sha(reviewBytes)};
const ack=join(snapshot,'.artifacts/p05-recovery-method15-root-ack01.json');
const cases=[];
function run(name,edit,pass=false){
 const a=structuredClone(valid),overrides=new Map(),inventory={source_identity_sha256:draft.source_identity,files:Object.fromEntries(Array.from({length:1813},(_,i)=>[String(i),'fake-control-only']))};
 const state={a,overrides,inventory,missing:false};edit?.(state);
 let inventoryCalls=0,mutations=0,docker=0,boundary=false,error;
 const read=(p,encoding)=>{
  p=p instanceof URL?resolve(p.pathname.replace(/^\/(?:([A-Za-z]):)/,'$1:')):String(p);
  if(p===ack){if(state.missing)throw Error('ENOENT_ACK');return JSON.stringify(a);}
  let b;if(overrides.has(p))b=overrides.get(p);else if(p===valid.rebinding_review_index)b=reviewBytes;else b=readFileSync(p);
  return encoding?Buffer.from(b).toString(encoding):b;
 };
 const context={assert,resolve:(...p)=>resolve(snapshot,...p),join,createHash,URL,runnerURL:new URL('file:///'+runner.replaceAll('\\','/')),readFileSync:read,process:{platform:'win32',env:{PYTHON:join(root,'.venv/Scripts/python.exe')}},execFileSync:()=>{inventoryCalls++;return JSON.stringify(inventory);},spawnSync:()=>{docker++;throw Error('NO_DOCKER');},mkdtempSync:()=>{mutations++;throw Error('NO_MUTATION');}};
 try{vm.runInNewContext(prefix+'\nboundaryReached();',vm.createContext({...context,boundaryReached:()=>{boundary=true;}}),{timeout:1000});}catch(e){error=e.message;}
 assert.equal(mutations,0);assert.equal(docker,0);assert.equal(boundary,pass,name+': '+error);
 cases.push({name,status:'PASS',accepted_boundary:boundary,inventory_calls:inventoryCalls,mutations,docker_calls:docker,error:error??null});
}
run('valid-root-ACK reaches allocation boundary without executing allocation',null,true);
run('missing ACK refuses',s=>s.missing=true);
run('unapproved draft status refuses',s=>s.a.status=draft.status);
run('wrong runner hash refuses',s=>s.a.runner_sha256='0'.repeat(64));
run('wrong image refuses',s=>s.a.image='sha256:'+'0'.repeat(64));
for(const name of Object.keys(draft.runtime_pins))run('changed runtime '+name+' refuses',s=>s.overrides.set(join(snapshot,'.artifacts/p05-private-batch-browser-producer15',name),Buffer.from('tamper')));
for(const field of ['independent_review_index','image_receipt','rebinding_review_index']){
 run('changed '+field+' bytes refuses',s=>s.overrides.set(s.a[field],Buffer.from('tamper')));
 run('wrong '+field+' hash refuses',s=>s.a[field+'_sha256']='0'.repeat(64));
}
run('unavailable rebind review refuses',s=>s.a.rebinding_review_index=null);
run('changed source identity refuses',s=>s.inventory.source_identity_sha256='0'.repeat(64));
run('changed included count refuses',s=>delete s.inventory.files['0']);
const result={status:'PASS_COLD_PREFLIGHT_CONTROLS_ONLY',controls:cases.length,cases,exact_runner_sha256:sha(Buffer.from(original)),actual_run:false};
writeFileSync(join(out,'preflight-controls.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,controls:cases.length,docker_calls:0,mutations:0}));
