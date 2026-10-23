import {readFileSync} from 'node:fs';
import {validateAuthority,validateReport,validateEvidence} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-bundle-source17/.artifacts/p05-compatible-rollback-producer31/contract.mjs';
const base='C:/.projects/venus/.artifacts/p05-pilot-bundle-source17/.artifacts/',raw=base+'p05/venus-p05-oci-e5faee7e9085/',producer=base+'p05-compatible-rollback-producer31/';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const runner=read(raw+'runner.json'),binding=read(producer+'BINDING.json'),ack=read(raw+'authority-ack.json');
validateAuthority(binding,ack,'057b3bac1bbddbe2f161b3a39f2e09cac7877597b9b22a7a23851c592eb21577');
validateReport(runner,binding);
// Existing exact contract hashes the immutable raw envelope without interpreting log/ENV payloads.
validateEvidence(raw,runner);
console.log(JSON.stringify({status:'PASS_EXISTING_AUTHORITY_REPORT_RAW_ENVELOPE_VALIDATORS_READONLY',controls:runner.controls.length,raw_index_entries:Object.keys(read(raw+'RAW_INDEX.json').files).length,Docker:0}));
