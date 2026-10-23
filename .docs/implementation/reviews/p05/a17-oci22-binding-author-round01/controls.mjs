import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateAuthority,controlIds,expected} from '../p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer22/contract.mjs';
const here=new URL('../p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer22/',import.meta.url),read=name=>JSON.parse(readFileSync(new URL(name,here),'utf8'));
const binding=read('BINDING.json'),ack=read('ROOT_RUN_ACK_TEMPLATE.json');
assert.throws(()=>validateAuthority(binding,ack,'0'.repeat(64)),{code:'ERR_ASSERTION'});
assert.equal(binding.root_run_ack,false);assert.equal(ack.root_run_ack,false);assert.equal(ack.status,'NOT_AUTHORIZED');
assert.equal(controlIds.length,14);assert.deepEqual(controlIds,Object.keys(expected));
console.log(JSON.stringify({status:'PASS_COLD_UNAUTHORIZED_TEMPLATE_DENIAL_AND_14_ORACLE_IDS',DB_connections:0,Docker_allocations:0,browser_launches:0,native_runs:0}));
