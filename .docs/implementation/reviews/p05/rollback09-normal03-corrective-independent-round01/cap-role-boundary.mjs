import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {validateIPC} from '../p05-pilot-bundle-source04/.artifacts/p05-compatible-rollback-producer09/ipc-policy.mjs';
const root='C:/.projects/venus/.artifacts/p05-pilot-bundle-source04/.artifacts/p05/venus-p05-oci-92449ca228b3',read=p=>JSON.parse(readFileSync(p)),plan=read(root+'/plan.json');
const row=JSON.parse(read(root+'/logs/0020.json').stdout)[0];row.Name='/'+plan.project+'-bootstrap';row.Config.User='1000:1000';row.Config.Labels['com.venus.oci.role']='bootstrap';row.HostConfig.CapAdd=[];
const line=readFileSync(new URL('../p05-pilot-bundle-source04/.artifacts/p05-compatible-rollback-producer09/host-runner.mjs',import.meta.url),'utf8').split('\n').find(x=>x.trimStart().startsWith('async function inspect(role)'));
const make=r=>new Function('assert','text','names','plan','owner','output','validateIPC','join',line+';return inspect;')(assert,async()=>JSON.stringify([r]),new Map([['bootstrap',plan.project+'-bootstrap']]),plan,plan.owner,plan.output_root,validateIPC,join);
await make(row)('bootstrap');console.log('PASS noninitializer empty capabilities accepted');
for(const caps of [['CAP_CHOWN'],['CHOWN']]){const changed=structuredClone(row);changed.HostConfig.CapAdd=caps;await assert.rejects(make(changed)('bootstrap'));}
console.log('PASS both CHOWN spellings remain forbidden for noninitializer');
