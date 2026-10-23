import {readFileSync} from 'node:fs';
import {validateAuthority,validateReport,validateEvidence} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-bundle-source24/.artifacts/p05-compatible-rollback-producer39/contract.mjs';
const base='C:/.projects/venus/.artifacts/p05-pilot-bundle-source24/.artifacts/',raw=base+'p05/venus-p05-oci-dd076142151a/',producer=base+'p05-compatible-rollback-producer39/';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const runner=read(raw+'runner.json'),binding=read(producer+'BINDING.json'),ack=read(raw+'authority-ack.json');
validateAuthority(binding,ack,'63e4f3a745c79a80c9bb5baac78868f53f455a89c9935fd5b472e0c3d7633d2b');
validateReport(runner,binding);
// Existing exact contract hashes the immutable raw envelope without interpreting log/ENV payloads.
validateEvidence(raw,runner);
console.log(JSON.stringify({status:'PASS_EXISTING_AUTHORITY_REPORT_RAW_ENVELOPE_VALIDATORS_READONLY',controls:runner.controls.length,raw_index_entries:Object.keys(read(raw+'RAW_INDEX.json').files).length,Docker:0}));
