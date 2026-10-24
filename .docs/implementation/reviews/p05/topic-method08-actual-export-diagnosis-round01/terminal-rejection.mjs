import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {verifyTerminal}=await import(pathToFileURL(resolve('.artifacts/p05-recovery-source1274-01/.artifacts/p05/r100-v3-7da46d477970/inputs/next/verify-terminal.mjs')));
const stdout=readFileSync('.artifacts/p05-recovery-method08-run01.txt','utf8'),exitCode=Number(readFileSync('.artifacts/p05-recovery-method08-run01-exit.txt','utf8').trim()),prep=JSON.parse(readFileSync('.artifacts/p05-recovery-source1274-01/.artifacts/p05/r100-v3-7da46d477970/preparation.json'));
assert.equal(exitCode,1);assert.equal(JSON.parse(stdout).status,'NOT_ACCEPTED');let error;
try{verifyTerminal(stdout,{exitCode,prep,supervisor:null,ownedAfter:null});}catch(e){error=e.message;}
assert(error,'actual failed run must be refused');
const result={status:'PASS_NEGATIVE_CONTROL_ONLY',actual_exit_code:exitCode,actual_accepted:false,missing_receipts_synthesized:false,rejection:error};
writeFileSync('.docs/implementation/reviews/p05/topic-method08-actual-export-diagnosis-round01/terminal-rejection.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
