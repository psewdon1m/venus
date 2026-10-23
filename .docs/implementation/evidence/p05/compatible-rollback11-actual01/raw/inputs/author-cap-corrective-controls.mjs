import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateIPC} from './ipc-policy.mjs';
const folder=fileURLToPath(new URL('.',import.meta.url));
const run='C:/.projects/venus/.artifacts/p05-pilot-bundle-source04/.artifacts/p05/venus-p05-oci-92449ca228b3',read=p=>JSON.parse(readFileSync(p)),plan=read(run+'/plan.json'),owner=plan.owner,output=plan.output_root,row=JSON.parse(read(run+'/logs/0020.json').stdout)[0],names=new Map([['initialize',plan.project+'-initialize']]);
const line=readFileSync(new URL('./host-runner.mjs',import.meta.url),'utf8').split('\n').find(x=>x.trimStart().startsWith('async function inspect(role)'));
const make=r=>new Function('assert','text','names','plan','owner','output','validateIPC','join',line+';return inspect;')(assert,async()=>JSON.stringify([r]),names,plan,owner,output,validateIPC,join);
let count=0;await make(row)('initialize');count++;
const legacy=structuredClone(row);legacy.HostConfig.CapAdd=['CHOWN'];await make(legacy)('initialize');count++;
for(const caps of [['CAP_SYS_ADMIN'],['CAP_CHOWN','CAP_CHOWN'],['CAP_CHOWN','CAP_NET_RAW'],[]]){const x=structuredClone(row);x.HostConfig.CapAdd=caps;await assert.rejects(make(x)('initialize'));count++;}
for(const mutate of [x=>x.Config.Labels['com.venus.oci.owner']='foreign',x=>x.Image='sha256:'+'0'.repeat(64),x=>x.HostConfig.Memory++,x=>x.Mounts[0].RW=false]){const x=structuredClone(row);mutate(x);await assert.rejects(make(x)('initialize'));count++;}
console.log(JSON.stringify({status:'PASS_EXACT_ACTUAL_INSPECT_COLD_CORRECTIVE_ONLY',checks:count,Docker_RUN:false}));
