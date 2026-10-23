import {readFileSync} from 'node:fs';
import {validateAuthority,validateReport,validateEvidence} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer27/contract.mjs';
const base='C:/.projects/venus/.artifacts/p05-pilot-bundle-source14/.artifacts/',raw=base+'p05/venus-p05-oci-d78e437b4a16/',producer=base+'p05-compatible-rollback-producer27/';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const runner=read(raw+'runner.json'),binding=read(producer+'BINDING.json'),ack=read(raw+'authority-ack.json');
validateAuthority(binding,ack,'4c4d8134eaf7820a98075c60235cadb272cc2ca4a9262dcf6d8208fe3654245c');
validateReport(runner,binding);
// Existing exact contract hashes the immutable raw envelope without interpreting log/ENV payloads.
validateEvidence(raw,runner);
console.log(JSON.stringify({status:'PASS_EXISTING_AUTHORITY_REPORT_RAW_ENVELOPE_VALIDATORS_READONLY',controls:runner.controls.length,raw_index_entries:Object.keys(read(raw+'RAW_INDEX.json').files).length,Docker:0}));
