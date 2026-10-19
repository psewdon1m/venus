/** Replay draft content checks without changing any approval or runtime pointer. */
import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
const output=process.env.VENUS_CATALOG_OUT||`.artifacts/catalog-r2-${randomBytes(6).toString('hex')}`;
mkdirSync('.artifacts',{recursive:true});mkdirSync(output);
const report={schema_version:1,status:'FAIL',scope:'DRAFT_CONTENT_MECHANICAL_CHECKS_NOT_HUMAN_APPROVAL',commands:[],files:{}};
const commands=[
  ['python',['-B','tools/validate_cards.py','.docs/content/p04-r2-full/cards','--report',join(output,'schema.json')]],
  ['node',['tools/card-catalog.mjs','draft-check','.docs/content/p04-r2-full/cards',join(output,'full-check')]],
  ['python',['-B','.docs/content/p04-r2-full/test_full_candidate.py','--coverage-dir',join(output,'full-check'),'--report',join(output,'content-history-tests.json')]],
];
let failure;
try {
  for(const [binary,args] of commands) {
    const result=spawnSync(binary,args,{encoding:'utf8',maxBuffer:32*1024*1024,timeout:900000});
    const log=`command-${report.commands.length+1}.txt`;
    writeFileSync(join(output,log),(result.stdout||'')+(result.stderr||''));
    console.log(((result.stdout||'')+(result.stderr||'')).slice(-2000));
    report.commands.push({binary,args,exit_code:result.status,signal:result.signal,error_code:result.error?.code||null,log});
    if(result.error||result.status!==0) throw new Error('Catalog draft check failed');
  }
  for(const file of ['schema.json','content-history-tests.json','full-check/analysis.json','full-check/manifest.json','full-check/input-index.json','full-check/coverage.json','full-check/coverage-private-chat.json']) {
    report.files[file]=createHash('sha256').update(readFileSync(join(output,file))).digest('hex');
  }
  const schema=JSON.parse(readFileSync(join(output,'schema.json'),'utf8'));
  const tests=JSON.parse(readFileSync(join(output,'content-history-tests.json'),'utf8'));
  if(schema.schema_version!==1||schema.status!=='PASS'||schema.parsed_cards!==450||tests.schema_version!==1||tests.status!=='PASS'||!Number.isSafeInteger(tests.tests_run)||tests.tests_run<14||tests.failures!==0||tests.errors!==0||!Array.isArray(tests.skipped)||tests.skipped.length!==0||tests.human_approval!==false) throw new Error('Catalog receipts failing/incomplete');
  report.status='PASS';
} catch(error) {failure=error;} finally {
  writeFileSync(join(output,'run.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log('Draft catalog receipts:',output);
}
if(failure) throw failure;
