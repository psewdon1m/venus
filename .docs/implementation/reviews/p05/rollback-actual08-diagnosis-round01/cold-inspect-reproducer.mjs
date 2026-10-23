import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const root='C:/.projects/venus/.artifacts/p05-pilot-bundle-source04',run=root+'/.artifacts/p05/venus-p05-oci-92449ca228b3',producer=root+'/.artifacts/p05-compatible-rollback-producer08';
const read=p=>JSON.parse(readFileSync(p));const plan=read(run+'/plan.json'),owner=plan.owner,output=plan.output_root,row=JSON.parse(read(run+'/logs/0020.json').stdout)[0];
const {validateIPC}=await import(pathToFileURL(producer+'/ipc-policy.mjs'));
const line=readFileSync(producer+'/host-runner.mjs','utf8').split('\n').find(x=>x.trimStart().startsWith('async function inspect(role)'));
const names=new Map([['initialize',plan.project+'-initialize']]);
const make=(s,r)=>new Function('assert','text','names','plan','owner','output','validateIPC','join',s+';return inspect;')(assert,async()=>JSON.stringify([r]),names,plan,owner,output,validateIPC,join);
let caught;try{await make(line,row)('initialize');}catch(e){caught=e;}assert(caught);assert.deepEqual(caught.actual,['CAP_CHOWN']);assert.deepEqual(caught.expected,['CHOWN']);
console.log(JSON.stringify({status:'CONFIRMED_ORIGINAL_INSPECT_CANONICAL_CAP_REJECTION',actual:caught.actual,expected:caught.expected,container_state:row.State.Status,Docker_RUN:false}));
const normalize=line.replace("r.HostConfig.CapAdd??[]", "(r.HostConfig.CapAdd??[]).map(c=>c==='CAP_CHOWN'?'CHOWN':c)");
await make(normalize,row)('initialize');
for(const caps of [['CAP_SYS_ADMIN'],['CAP_CHOWN','CAP_CHOWN'],['CAP_CHOWN','CAP_NET_RAW'],[]]){const x=structuredClone(row);x.HostConfig.CapAdd=caps;await assert.rejects(make(normalize,x)('initialize'));}
console.log(JSON.stringify({status:'PASS_NARROW_CAP_NORMALIZATION_MODEL_ALL_OTHER_INSPECT_GUARDS',counterexamples_rejected:4,Docker_RUN:false}));
