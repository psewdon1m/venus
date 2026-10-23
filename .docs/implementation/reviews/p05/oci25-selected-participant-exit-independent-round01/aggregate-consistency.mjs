import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const p='C:/.projects/venus/.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer25/';
const parse=n=>ts.createSourceFile(n,readFileSync(p+n,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const file=parse('host-runner.mjs');let facts;
function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(file)==='facts')facts=n.initializer.getText(file);ts.forEachChild(n,visit);}visit(file);
const fn=file.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='completeReplay');
const complete=Function(fn.getText(file).replace(/^export /,'')+';return completeReplay;')();
const raw='C:/.projects/venus/.artifacts/p05-pilot-bundle-source14/.artifacts/p05/venus-p05-oci-e353fdd389fc/evidence/';
const phase=n=>JSON.parse(readFileSync(raw+'phase-'+n+'-terminal.json','utf8'));
const a=phase('A1'),b=phase('B2'),c=phase('A3');
assert(complete(b.replay)&&complete(c.replay));
for(const rows of [b.replay,c.replay]){assert.equal(complete([...rows,rows[12]]),false);assert.equal(complete(rows.toReversed()),false);const wrong=[...rows];wrong[3]={kind:'exact_and_new_ID'};assert.equal(complete(wrong),false);const sparse=Array(13);assert.equal(complete(sparse),false);}
// Conditional structural check only: these four inputs are future-success prerequisites,
// not recorded native successes. Existing saved phase fields supply all other values.
c.final_current={safe_exit:true,narrowed_policy_preserved:true};
const report={source_producer_unchanged:true,browser:{actual_B_UI:true,retained_A_cleared:true,browser_safe_exit:true}};
const values=Function('a','b','c','quiescent','report','cleanup','erased','resource','completeReplay','return '+facts)(a,b,c,[1,2,3],report,'completed',true,{status:'PASS_QRB_BOUND_ONLY_PROFILE'},complete);
assert.deepEqual(Object.keys(values),Array.from({length:14},(_,i)=>'OCI'+String(i+1).padStart(2,'0')));
assert(Object.values(values).every(Boolean));
console.log(JSON.stringify({status:'PASS_CONDITIONAL_STATIC_AGGREGATE_NOT_NATIVE_ACCEPTANCE',saved_B2_A3_completeReplay:true,independent_negative_cases:8,all14_fact_keys_and_existing_phase_fields_consistent:true,future_inputs_simulated:['A3_final_current','browser_complete','three_stopped_phases_and_exact_source','completed_cleanup_erasure_resourcePASS']}));
