import {readFileSync} from 'node:fs';
import {validateAuthority,validateReport,validateEvidence} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-bundle-source15/.artifacts/p05-compatible-rollback-producer28/contract.mjs';
const base='C:/.projects/venus/.artifacts/p05-pilot-bundle-source15/.artifacts/',raw=base+'p05/venus-p05-oci-58825426c411/',producer=base+'p05-compatible-rollback-producer28/';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const runner=read(raw+'runner.json'),binding=read(producer+'BINDING.json'),ack=read(raw+'authority-ack.json');
validateAuthority(binding,ack,'3618665392fb08884cdfa39438d5429020c9c9ab8225cd7e6593bb7ab3dd1230');
validateReport(runner,binding);
// Existing exact contract hashes the immutable raw envelope without interpreting log/ENV payloads.
validateEvidence(raw,runner);
console.log(JSON.stringify({status:'PASS_EXISTING_AUTHORITY_REPORT_RAW_ENVELOPE_VALIDATORS_READONLY',controls:runner.controls.length,raw_index_entries:Object.keys(read(raw+'RAW_INDEX.json').files).length,Docker:0}));
