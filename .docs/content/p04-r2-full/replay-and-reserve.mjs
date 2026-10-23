/** Bounded authoring copy: replay original revisions and reserve unused IDs BEFORE files. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {AuthoringLedger} from '../../../packages/card-catalog/dist/index.js';
const root=process.cwd(),e=path.join(root,'.docs/implementation/evidence/p04/review-450-full-coverage'),full=path.join(root,'.docs/content/p04-r2-full');
const write=(name,value)=>fs.writeFileSync(path.join(e,'authoring',name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const ledgerPath=path.join(e,'authoring/full-authoring.sqlite');
fs.copyFileSync(path.join(e,'authoring/r1-readonly-backup.sqlite'),ledgerPath,fs.constants.COPYFILE_EXCL);
const ledger=new AuthoringLedger(ledgerPath);
try {
 write('r1-before-export.json',ledger.export());
 const revisions=JSON.parse(fs.readFileSync('.docs/implementation/evidence/p04/review-450-processing/authoring/run-02/request-revisions.json','utf8'));
 const d=JSON.parse(fs.readFileSync('.docs/content/p04-r2/dispositions.json','utf8'));
 const history=d.cards.map(row=>JSON.parse(fs.readFileSync(row.candidate_path??`.docs/content/p04/cards/${row.id}.json`,'utf8')));
 for(const row of revisions) {ledger.revise(row.revised_request,row.previous_request.request_sha256);ledger.record(row.revised_request.batch_id,history.filter(c=>c.authoring.batch_id===row.revised_request.batch_id));}
 write('r2-replayed-export.json',ledger.export());
} finally {ledger.close();}
const batches=JSON.parse(fs.readFileSync(path.join(full,'request-index.json'),'utf8')).batches;
for(const row of batches) {
 const output=execFileSync(process.execPath,['tools/card-catalog.mjs','reserve',row.path,'.docs/content/p04/cards','.docs/implementation/evidence/p04/draft-author-450/manifest.json',ledgerPath,'codex-p04-r2-full-coverage-author'],{encoding:'utf8'});
 fs.writeFileSync(path.join(e,'authoring',row.batch_id+'-reservation.txt'),output,{flag:'wx'});
 console.log(row.batch_id+' RESERVED '+row.count);
}
const reserved=new AuthoringLedger(ledgerPath);try {write('reserved-before-materialization-export.json',reserved.export());}finally {reserved.close();}
