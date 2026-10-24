import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {AuthoringLedger} from '../../../../../packages/card-catalog/dist/index.js';
import {validateBatchSnapshot} from '../../../../../tools/catalog-request-snapshot.mjs';
const r='.docs/implementation/evidence/p04/review470-r4',out='.docs/implementation/reviews/p04/unified-channel-r4-review-round01',file='.artifacts/p04-r4-ledger-independent-replay01.sqlite';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sourcePins=load(r+'/input-pins.json'),sourceLedger=sourcePins.source_ledger.path;
const beforeSha=sha(sourceLedger),candidateSha=sha(r+'/authoring/candidate.sqlite');
assert(!fs.existsSync(file),'FRESH_REPLAY_ONLY');fs.copyFileSync(sourceLedger,file,fs.constants.COPYFILE_EXCL);
const db=new DatabaseSync(r+'/authoring/candidate.sqlite',{readOnly:true}),old=new DatabaseSync(sourceLedger,{readOnly:true});
const requests=new Map(db.prepare('SELECT id,request FROM batches').all().map(x=>[x.id,JSON.parse(x.request)]));
const latest=new Map();for(const row of db.prepare('SELECT body FROM revisions ORDER BY card_id,revision').all()){const card=JSON.parse(row.body);latest.set(card.id,card);}
const oldRequests=new Map(old.prepare('SELECT id,request FROM batches').all().map(x=>[x.id,JSON.parse(x.request)]));db.close();old.close();
const transactions=load(r+'/authoring/transaction-receipts.json'),ledger=new AuthoringLedger(file),initial=ledger.export();
let validated=0,cas=0,records=0;
try{
 const first=transactions.find(x=>x.request_revision),request=requests.get(first.batch_id);
 assert.throws(()=>ledger.revise(request,'0'.repeat(64)),/BATCH_REVISION_CONFLICT/);assert.deepEqual(ledger.export(),initial);
 for(const item of transactions){
  if(item.request_revision){const requestBytes=fs.readFileSync(r+'/authoring/'+item.batch_id+'-request.json');validateBatchSnapshot(requestBytes,fs.readFileSync(sourcePins.source_analysis_manifest.path));validated++;
   ledger.revise(requests.get(item.batch_id),oldRequests.get(item.batch_id).request_sha256);cas++;
  }
  const cards=[...latest.values()].filter(c=>c.authoring.batch_id===item.batch_id).sort((a,b)=>a.id.localeCompare(b.id));
  assert.deepEqual(ledger.record(item.batch_id,cards),item.record);records++;
 }
 assert.deepEqual(ledger.export(),load(r+'/authoring/after-export.json'));
}finally{ledger.close();}
assert.equal(sha(sourceLedger),beforeSha);assert.equal(sha(r+'/authoring/candidate.sqlite'),candidateSha);
const result={status:'PASS_EXISTING_API_REPLAY_IN_FRESH_OWN_LEDGER',request_validators_pass:validated,CAS_revisions_pass:cas,batch_records_pass:records,wrong_expected_CAS_rejected_without_event:true,exact_candidate_event_export_equal:true,source_and_candidate_unchanged:true,own_ledger:file,own_ledger_sha256:sha(file),compiled_api_pins:Object.fromEntries(['packages/card-catalog/dist/authoring.js','packages/card-catalog/dist/catalog.js','tools/catalog-request-snapshot.mjs','tools/validate_card_batch.py'].map(p=>[p,sha(p)])),human_approval:false,runtime_activation:false};
fs.writeFileSync(out+'/ledger-replay-result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
