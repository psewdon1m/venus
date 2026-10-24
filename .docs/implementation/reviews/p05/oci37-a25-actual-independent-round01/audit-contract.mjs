import {readFileSync} from 'node:fs';
import {validateAuthority,validateReport,validateEvidence} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-bundle-source22/.artifacts/p05-compatible-rollback-producer37/contract.mjs';
const base='C:/.projects/venus/.artifacts/p05-pilot-bundle-source22/.artifacts/',raw=base+'p05/venus-p05-oci-c1a84717e07b/',producer=base+'p05-compatible-rollback-producer37/';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const runner=read(raw+'runner.json'),binding=read(producer+'BINDING.json'),ack=read(raw+'authority-ack.json');
validateAuthority(binding,ack,'964db19233c22e6f4df9b3c30e52b3d7b514b6032cbb64885001b9946bb6d92a');
validateReport(runner,binding);
// Existing exact contract hashes the immutable raw envelope without interpreting log/ENV payloads.
validateEvidence(raw,runner);
console.log(JSON.stringify({status:'PASS_EXISTING_AUTHORITY_REPORT_RAW_ENVELOPE_VALIDATORS_READONLY',controls:runner.controls.length,raw_index_entries:Object.keys(read(raw+'RAW_INDEX.json').files).length,Docker:0}));
