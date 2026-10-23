import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync('C:/.projects/venus/.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer26/host-runner.mjs','utf8');
const file=ts.createSourceFile('host.mjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const names=['safeCommandFailureMetadata','stderrFailureClass','publicEvidencePurpose'];
const code=file.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)).map(n=>n.getText(file).replace(/^export /,'')).join('\n');
const f=Function(code+';return{safeCommandFailureMetadata,stderrFailureClass,publicEvidencePurpose};')();
for(const code of [-1,256,1.5,NaN,Infinity,'137',null]){const m=f.safeCommandFailureMetadata('CANARY_PHASE','CANARY_PURPOSE',code,2**31,-1,NaN,'CANARY_HASH','CANARY_REASON','CANARY_STDERR');assert.equal(m.exit_code,null);assert.equal(m.stdout_bytes,null);assert.equal(m.stderr_bytes,null);assert.equal(m.stderr_captured_bytes,null);assert.equal(JSON.stringify(m).includes('CANARY'),false);}
const hash='a'.repeat(64),m=f.safeCommandFailureMetadata('A3','EVIDENCE_PHASE_TERMINAL',137,0,100,4,hash,'CAPTURE_LIMIT','RESOURCE_TOKEN');assert.equal(m.capture_complete,false);assert.equal(m.stderr_bytes,100);assert.equal(m.stderr_captured_bytes,4);assert.equal(m.stderr_captured_sha256,hash);
assert.equal(f.stderrFailureClass(Buffer.from('unknown CANARY_PRIVATE_ERROR')),'UNCLASSIFIED');
assert.equal(f.publicEvidencePurpose('phase-A3-terminal.json'),'EVIDENCE_PHASE_TERMINAL');assert.equal(f.publicEvidencePurpose('phase-A3-terminal.json;CANARY'),'PUBLIC_EVIDENCE_READ');
console.log(JSON.stringify({status:'PASS_INDEPENDENT_PROJECTION_BOUNDARIES',invalid_exit_variants:7,captured_prefix_not_full_stream:true,unknown_stderr_and_purpose_failclosed:true,raw_canary_projection:false}));
