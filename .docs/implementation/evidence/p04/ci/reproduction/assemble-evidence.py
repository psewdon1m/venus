"""Copy unmodified downloaded CI bytes; never fabricate acceptance/reviewer results."""
import hashlib,json,shutil,sys
from pathlib import Path
source=Path(sys.argv[1]).resolve();root=Path(sys.argv[2]).resolve()
target=root/'.docs/implementation/evidence/p04/ci';target.mkdir(parents=True,exist_ok=True)
def copy_file(path,destination):
    data=path.read_bytes();destination.parent.mkdir(parents=True,exist_ok=True)
    if destination.exists():assert destination.read_bytes()==data,str(destination)
    else:destination.write_bytes(data)
    return {'path':destination.relative_to(root).as_posix(),'sha256':hashlib.sha256(data).hexdigest()}
def save(name,value):
    path=target/name;raw=(json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode()
    if path.exists():assert path.read_bytes()==raw,str(path)
    else:path.write_bytes(raw)
    return {'path':path.relative_to(root).as_posix(),'sha256':hashlib.sha256(raw).hexdigest()}
run=json.loads((source/'ci-run.json').read_bytes());metadata=json.loads((source/'artifact-metadata.json').read_bytes())
assert run['status']=='completed' and run['conclusion']=='success' and len(metadata['artifacts'])==9
base={name:copy_file(source/name,target/name) for name in ['ci-run.json','ci-jobs.json','artifact-metadata.json','artifact-job-bindings.json']}
copied={};receipts=[];archives=[]
for artifact in metadata['artifacts']:
    name=artifact['name'];receipt=json.loads((source/name/'download-receipt.json').read_bytes())
    receipts.append(copy_file(source/name/'download-receipt.json',target/'receipts'/(str(artifact['id'])+'.json')))
    archives.append({'artifact_id':artifact['id'],'archive':copy_file(source/'archives'/(str(artifact['id'])+'.zip'),target/'archives'/(str(artifact['id'])+'.zip'))})
    for item in receipt['files']:
        # Full statistical reports remain reproducible inside the retained raw ZIP;
        # avoid a second 20+MiB expanded copy for each already archived report.
        if name.startswith('p03-measurements-'):continue
        key=name+'/'+item['path'];copied[key]=copy_file(source/name/item['path'],target/'members'/name/item['path'])
logs=[]
for binding in json.loads((source/'artifact-job-bindings.json').read_bytes()):
    label=binding['job_name'].replace(' ','-').replace('(','').replace(')','')
    descriptor=copy_file(source/'job-logs'/(label+'.txt'),target/'job-logs'/(label+'.txt'))
    assert descriptor['sha256']==binding['log_sha256']
    logs.append({'job_id':binding['job_id'],'artifact_ids':binding['artifact_ids'],'log':descriptor})
runner=json.loads((root/copied['p04-integration/runtime-runner.json']['path']).read_bytes())
index={'run_id':run['id'],'source_sha':run['head_sha'],'source_identity_sha256':runner['source_identity_sha256'],
       'download_receipts':receipts,'raw_archives':archives,'job_logs':logs,'copied_files':copied}
index_descriptor=save('ci-artifact-index.json',index)
relative=runner['catalog_directory'].removeprefix('.artifacts/p04/')
packet={'gate':'P04-TECHNICAL-1','status':'PASSED','source_sha':run['head_sha'],'source_identity_sha256':runner['source_identity_sha256'],
    'inputs':copied['p04-integration/source-inputs.json'],'runtime':copied['p04-integration/runtime-report.json'],'runtime_runner':copied['p04-integration/runtime-runner.json'],
    'analysis':copied['p04-integration/'+relative+'/analysis.json'],'coverage':copied['p04-integration/'+relative+'/coverage.json'],
    'conditional_coverage':copied['p04-integration/'+relative+'/coverage-private-chat.json'],
    'ci_run':base['ci-run.json'],'ci_jobs':base['ci-jobs.json'],'ci_artifact_metadata':base['artifact-metadata.json'],
    'ci_artifact_index':index_descriptor,'reviews':[]}
# A template is NOT acceptance: the required protection and genuine independent review
# descriptors must be added from their actual records before the validator can pass.
packet['assembly_state']='AWAITING_PROTECTION_AND_INDEPENDENT_REVIEWS'
save('technical-packet-template.json',packet)
print(json.dumps({'run':run['id'],'artifacts':len(archives),'members':len(copied),'identity':runner['source_identity_sha256'],'packet':'template only'}))
