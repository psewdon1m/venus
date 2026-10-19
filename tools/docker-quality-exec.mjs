/** Container-side producer: retain the actual quality exit and exact input maps. */
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const output='.artifacts/docker-quality';mkdirSync(output,{recursive:true});
const report={schema_version:1,status:'FAIL',scope:'LOCAL_DOCKER_QUALITY_ONLY'};
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim();
function inputs(name) {
  const raw=execFileSync('python',['-B','-c',"import sys,json;sys.path.insert(0,'tools');from stage_inventory import inventory,identity;files=inventory();print(json.dumps({'files':files,'source_identity_sha256':identity(files)}))"],{encoding:'utf8',maxBuffer:16*1024*1024});
  writeFileSync(`${output}/${name}`,raw);return JSON.parse(raw).source_identity_sha256;
}
try {
  report.source_sha=git(['rev-parse','HEAD']);report.source_dirty=Boolean(git(['status','--porcelain']));report.source_identity_before=inputs('inputs-before.json');
  const result=spawnSync('npm',['run','quality'],{stdio:'inherit',env:{...process.env,VENUS_CATALOG_OUT:'.artifacts/catalog-r2-check'}});report.actual_exit_code=result.status;
  report.source_identity_after=inputs('inputs-after.json');report.source_sha_after=git(['rev-parse','HEAD']);report.source_dirty_after=Boolean(git(['status','--porcelain']));
  report.source_unchanged=report.source_identity_before===report.source_identity_after&&report.source_sha===report.source_sha_after;
  if(result.status===0&&report.source_unchanged&&!report.source_dirty&&!report.source_dirty_after) report.status='PASS';
} catch {report.failure_code='CONTAINER_QUALITY_UNAVAILABLE';} finally {
  writeFileSync(`${output}/run.json`,JSON.stringify(report,null,2)+'\n');
}
process.exitCode=report.status==='PASS'?0:1;
