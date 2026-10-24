/** Record exact active follow-up revisions and previously reserved new drafts in owned copy. */
import fs from 'node:fs';
import path from 'node:path';
import {AuthoringLedger,analyze} from '../../../packages/card-catalog/dist/index.js';
import {digest} from '../../../packages/relationship-engine/dist/index.js';
const full='.docs/content/p04-r2-full',e='.docs/implementation/evidence/p04/review-450-full-coverage';
const write=(name,value)=>fs.writeFileSync(path.join(e,'authoring',name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const changes=JSON.parse(fs.readFileSync(path.join(e,'copied-card-revisions.json'),'utf8')).revisions;
const dispositions=JSON.parse(fs.readFileSync('.docs/content/p04-r2/dispositions.json','utf8')).cards;
const active=fs.readdirSync(path.join(full,'cards')).filter(x=>x.endsWith('.json')).sort().map(x=>JSON.parse(fs.readFileSync(path.join(full,'cards',x),'utf8')));
const history=dispositions.map(row=>active.find(c=>c.id===row.id)??JSON.parse(fs.readFileSync(row.candidate_path??`.docs/content/p04/cards/${row.id}.json`,'utf8')));
const ledger=new AuthoringLedger(path.join(e,'authoring/full-authoring.sqlite'));
try {
 const records=[];
 const batches=new Set(changes.map(row=>active.find(c=>c.id===row.id).authoring.batch_id));
 for(const batch of batches) {const cards=history.filter(c=>c.authoring.batch_id===batch);records.push(ledger.record(batch,cards));console.log('FOLLOWUP_RECORDED '+batch);}
 write('followup-revisions-export.json',ledger.export());
 const index=JSON.parse(fs.readFileSync(path.join(full,'request-index.json'),'utf8')).batches;
 for(const row of index) {const cards=active.filter(c=>c.authoring.batch_id===row.batch_id);records.push(ledger.record(row.batch_id,cards));console.log('NEW_RECORDED '+row.batch_id+' '+cards.length);}
 write('record-transactions.json',records);write('full-after-export.json',ledger.export());
 write('history-selection.json',{schema_version:1,historical_latest_records:522,active_selection_count:active.length,active_catalog_digest:analyze(active).catalog_digest,removed_ids:dispositions.filter(x=>x.decision==='MOVE_TO_RULES').map(x=>x.id),quarantined_ids:['YB-1148'],active_selection:active.map(c=>({id:c.id,revision:c.revision,canonical_sha256:digest(c)})),historical_ledger_is_not_active_pack:true,human_approval:false});
} finally {ledger.close();}
