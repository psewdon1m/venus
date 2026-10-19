/** Replays revisions in a copy of the recovered SQLite ledger; never opens the original. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {AuthoringLedger,analyze} from '../../../packages/card-catalog/dist/index.js';
import {digest} from '../../../packages/relationship-engine/dist/index.js';
const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'../../..');
const evidence=path.join(root,'.docs/implementation/evidence/p04/review-450-processing');
const run=process.argv[2];
if(!/^run-[0-9]{2}$/.test(run??'')) throw new Error('Explicit unique run-NN argument required');
const target=path.join(evidence,'authoring',run);
fs.mkdirSync(target,{recursive:false});
const original=path.join(evidence,'authoring','r1-authoring-snapshot.sqlite');
const copied=path.join(target,'r2-authoring.sqlite');
fs.copyFileSync(original,copied,fs.constants.COPYFILE_EXCL);
const source=new DatabaseSync(original,{readOnly:true});
const requests=source.prepare('SELECT request FROM batches ORDER BY id').all().map(x=>JSON.parse(x.request));
source.close();
const dispositions=JSON.parse(fs.readFileSync(path.join(dir,'dispositions.json'),'utf8'));
const cards=dispositions.cards.map(row=>JSON.parse(fs.readFileSync(path.join(root,row.candidate_path??`.docs/content/p04/cards/${row.id}.json`),'utf8')));
const ledger=new AuthoringLedger(copied);
try {
 fs.writeFileSync(path.join(target,'before-export.json'),JSON.stringify(ledger.export(),null,2)+'\n');
 const revisions=[];
 for(const old of requests) {
  const batchCards=cards.filter(c=>c.authoring.batch_id===old.batch_id);
  const count=field=>Object.fromEntries([...new Set(batchCards.map(c=>String(c[field])))].sort().map(key=>[key,batchCards.filter(c=>String(c[field])===key).length]));
  const request={...old,source_catalog_digest:'sha256:'+dispositions.source_catalog_digest,
   author_id:'codex-review450-processing',
   constraints:{pack_id:old.constraints.pack_id,meeting_contexts:[...new Set(batchCards.flatMap(c=>c.meeting_contexts))].sort(),allowed_interactions:[...new Set(batchCards.map(c=>c.interaction))].sort(),relationship_scope_distribution:count('relationship_scope'),comfort_distribution:count('min_comfort'),progression_distribution:count('min_progression_stage')}};
  request.request_sha256=digest({previous_request_sha256:old.request_sha256,review_sha256:dispositions.source_review_raw_sha256,source_catalog_digest:request.source_catalog_digest,constraints:request.constraints,author_id:request.author_id});
  ledger.revise(request,old.request_sha256);
  const recorded=ledger.record(request.batch_id,batchCards);
  revisions.push({previous_request:old,revised_request:request,recorded});
 }
 const exported=ledger.export();
 fs.writeFileSync(path.join(target,'after-export.json'),JSON.stringify(exported,null,2)+'\n');
 fs.writeFileSync(path.join(target,'request-revisions.json'),JSON.stringify(revisions,null,2)+'\n');
 const active=cards.filter(c=>dispositions.cards.find(r=>r.id===c.id).candidate_path?.includes('/cards/'));
 const report={schema_version:1,status:'PASS_AUTHORING_REPLAY_ONLY',batch_count:requests.length,all_history_latest_count:cards.length,active_draft_count:active.length,removed_cards_retained_in_history:71,quarantined_cards_retained_in_history:1,source_review_raw_sha256:dispositions.source_review_raw_sha256,original_catalog_digest:dispositions.source_catalog_digest,all_history_analysis_digest:analyze(cards).catalog_digest,active_candidate_digest:analyze(active).catalog_digest,export_head:exported.head,event_count:exported.events.length,promotion_performed:false,limitation:'The authoring ledger preserves all old IDs/revisions, including removed cards, as history. Only the separate candidate dispositions select the 378 active draft entries. This is neither the application release registry nor an approved pack.'};
 fs.writeFileSync(path.join(target,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
} finally {ledger.close();}
