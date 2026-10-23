import {readFileSync} from 'node:fs';
import {validateAuthority,validateReport,validateEvidence} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-bundle-source16/.artifacts/p05-compatible-rollback-producer30/contract.mjs';
const base='C:/.projects/venus/.artifacts/p05-pilot-bundle-source16/.artifacts/',raw=base+'p05/venus-p05-oci-1fa5b5a63911/',producer=base+'p05-compatible-rollback-producer30/';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const runner=read(raw+'runner.json'),binding=read(producer+'BINDING.json'),ack=read(raw+'authority-ack.json');
validateAuthority(binding,ack,'08ad7faf0c45331338fd64e76b615d1793aaea37b79af887d3b25f26feec8d85');
validateReport(runner,binding);
// Existing exact contract hashes the immutable raw envelope without interpreting log/ENV payloads.
validateEvidence(raw,runner);
console.log(JSON.stringify({status:'PASS_EXISTING_AUTHORITY_REPORT_RAW_ENVELOPE_VALIDATORS_READONLY',controls:runner.controls.length,raw_index_entries:Object.keys(read(raw+'RAW_INDEX.json').files).length,Docker:0}));
