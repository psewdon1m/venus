/** Genuine authoring API transactions in a NEW ledger copy. No direct SQLite writes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {AuthoringLedger} from '../../../packages/card-catalog/dist/index.js';
import {FrozenPack,canonical,digest} from '../../../packages/relationship-engine/dist/index.js';
import {validateBatchSnapshot} from '../../../tools/catalog-request-snapshot.mjs';

const root='.docs/content/p04-r3', e='.docs/implementation/evidence/p04/review470-r3';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const pins=load(e+'/input-pins.json'), changes=load(e+'/changes139.json').changed;
const sha=b=>createHash('sha256').update(b).digest('hex');
const save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const out=e+'/authoring';assert(!fs.existsSync(out));fs.mkdirSync(out);
const originalRaw=fs.readFileSync(pins.source_ledger.path);assert.equal(sha(originalRaw),pins.source_ledger.sha256);
fs.writeFileSync(out+'/rollback-470r2.sqlite',originalRaw,{flag:'wx'});
fs.writeFileSync(out+'/candidate.sqlite',originalRaw,{flag:'wx'});
const inspect=new DatabaseSync(out+'/candidate.sqlite',{readOnly:true});
const latest=new Map();for(const row of inspect.prepare('SELECT body FROM revisions ORDER BY card_id,revision').all()){
  const c=JSON.parse(row.body);latest.set(c.id,c);
}
const requests=new Map(inspect.prepare('SELECT id,request FROM batches').all().map(r=>[r.id,JSON.parse(r.request)]));
const beforeCounts=Object.fromEntries(['batches','reservations','revisions','events'].map(t=>[t,inspect.prepare('SELECT count(*) n FROM '+t).get().n]));inspect.close();
const cards=fs.readdirSync(root+'/cards').sort().map(n=>load(root+'/cards/'+n));
for(const card of cards){assert(latest.has(card.id));latest.set(card.id,card);}
const sourceCards=pins.cards.map(p=>load(p.source_path));
const sourceManifestPath=pins.source+'/draft-manifest.json';
const sourceManifestBytes=fs.readFileSync(sourceManifestPath);
const pack=FrozenPack.load(sourceCards,JSON.parse(sourceManifestBytes),true);
const changedBatches=[...new Set(changes.map(c=>cards.find(a=>a.id===c.id).authoring.batch_id))].sort();
const ledger=new AuthoringLedger(out+'/candidate.sqlite');
const beforeExport=ledger.export();save(out+'/before-export.json',beforeExport);
const receipts=[];
try{
  for(const batchId of changedBatches){
    const old=requests.get(batchId),batchCards=[...latest.values()].filter(c=>c.authoring.batch_id===batchId).sort((a,b)=>a.id.localeCompare(b.id));
    assert.equal(batchCards.length,old.count);
    const counts=field=>Object.fromEntries([...new Set(batchCards.map(c=>String(c[field])))].sort().map(v=>[v,batchCards.filter(c=>String(c[field])===v).length]));
    const constraints={pack_id:old.constraints.pack_id,meeting_contexts:[...new Set(batchCards.flatMap(c=>c.meeting_contexts))].sort(),allowed_interactions:[...new Set(batchCards.map(c=>c.interaction))].sort(),relationship_scope_distribution:counts('relationship_scope'),comfort_distribution:counts('min_comfort'),progression_distribution:counts('min_progression_stage')};
    // Set equality for contexts/interactions; zero-valued distribution keys are immaterial.
    const normalized=v=>({...v,meeting_contexts:[...v.meeting_contexts].sort(),allowed_interactions:[...v.allowed_interactions].sort(),...Object.fromEntries(['relationship_scope_distribution','comfort_distribution','progression_distribution'].map(k=>[k,Object.fromEntries(Object.entries(v[k]).filter(([,n])=>n>0))]))});
    let revisionReceipt=null;
    if(canonical(normalized(constraints))!==canonical(normalized(old.constraints))){
      const request={schema_version:1,batch_id:batchId,pack_id:constraints.pack_id,policy_revision:'RE-1',mode:old.mode,count:old.count,id_range:[old.first,old.first+old.count-1],meeting_contexts:constraints.meeting_contexts,allowed_interactions:constraints.allowed_interactions,relationship_scope_distribution:constraints.relationship_scope_distribution,comfort_distribution:constraints.comfort_distribution,progression_distribution:constraints.progression_distribution,languages:['ru','en','tr'],forbidden_categories:['explicit_sex','pressure','humiliation','unsafe_separation'],source_catalog_digest:pack.digest,requested_by:'codex-p04-review470-r3-root',human_review_required:true};
      const requestBytes=Buffer.from(JSON.stringify(request,null,2)+'\n');
      fs.writeFileSync(out+'/'+batchId+'-request.json',requestBytes,{flag:'wx'});
      validateBatchSnapshot(requestBytes,sourceManifestBytes);
      const reservation={...old,source_catalog_digest:pack.digest,request_sha256:sha(requestBytes),author_id:request.requested_by,constraints};
      ledger.revise(reservation,old.request_sha256);
      revisionReceipt={expected_request_sha256:old.request_sha256,new_request_sha256:sha(requestBytes),new_source_pack_digest:pack.digest};
    }
    const record=ledger.record(batchId,batchCards);receipts.push({batch_id:batchId,request_revision:revisionReceipt,record});
    console.log('RECORDED '+batchId+' '+batchCards.length);
  }
  const afterExport=ledger.export();assert.deepEqual(afterExport.events.slice(0,beforeExport.events.length),beforeExport.events);
  save(out+'/after-export.json',afterExport);save(out+'/transaction-receipts.json',receipts);
}finally{ledger.close();}
assert.equal(sha(fs.readFileSync(pins.source_ledger.path)),pins.source_ledger.sha256);
const db=new DatabaseSync(out+'/candidate.sqlite',{readOnly:true});
const afterCounts=Object.fromEntries(['batches','reservations','revisions','events'].map(t=>[t,db.prepare('SELECT count(*) n FROM '+t).get().n]));
assert.equal(afterCounts.revisions-beforeCounts.revisions,139);
for(const card of cards){const row=db.prepare('SELECT hash,body FROM revisions WHERE card_id=? AND revision=?').get(card.id,card.revision);assert.equal(row.hash,digest(card));assert.deepEqual(JSON.parse(row.body),card);}
db.close();
save(out+'/receipt.json',{schema_version:1,status:'DRAFT_HISTORY_RECORDED_NOT_APPROVED',source_ledger_sha256:pins.source_ledger.sha256,after_ledger_sha256:sha(fs.readFileSync(out+'/candidate.sqlite')),before_counts:beforeCounts,after_counts:afterCounts,batch_records:receipts.length,request_revisions:receipts.filter(r=>r.request_revision).length,active_cards:470,changed_cards:139,source_prefix_preserved:true,historical_latest_is_not_active_selection:true,runtime_activation:false,human_approval:false});
console.log(JSON.stringify({before:beforeCounts,after:afterCounts,batches:receipts.length}));
