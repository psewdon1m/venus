"""Regression for independent E08: immutable ZIP(A) with substituted receipt/member(B)."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
import zipfile
from p04_gate import validate_ci_artifacts,JOBS

def digest(raw):return hashlib.sha256(raw).hexdigest()

def fixture(root,tamper=False):
    sha='a'*40;cid='b'*64;run=123
    def put(path,value):
        raw=json.dumps(value,sort_keys=True).encode();target=root/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
        return {'path':path,'sha256':digest(raw)}
    packet={'source_sha':sha,'source_identity_sha256':cid};ci={'id':run};jobs=[{'id':100+i,'name':name} for i,name in enumerate(sorted(JOBS))]
    runner={'catalog_directory':'.artifacts/p04/catalog-probe'};artifacts=[];receipts=[];copied={};artifacts_for_job={};raw_archives=[]
    names=['negative-gates','container-smoke','p02-integration','p03-integration','p04-integration']+['p03-measurements-'+s for s in ['invariants','fairness','gf','inference']]
    negative={'source_sha':sha,'source_identity_sha256':cid,'source_dirty':False,'status':'PASS','cases':[{'id':i,'status':'PASS','positive_exit':0,'negative_exit':1} for i in ['schema','locale','type','unit']]}
    p04_keys={'runtime':'runtime-report.json','runtime_runner':'runtime-runner.json','inputs':'source-inputs.json','analysis':'catalog-probe/analysis.json','coverage':'catalog-probe/coverage.json','conditional_coverage':'catalog-probe/coverage-private-chat.json'}
    for offset,name in enumerate(names):
        aid=1000+offset
        bodies={'negative-gates.json':negative} if name=='negative-gates' else {path:{'status':'PASS','version':'B'} for path in p04_keys.values()} if name=='p04-integration' else {'proof.json':{'status':'PASS'}}
        zip_path=root/f'raw/{aid}.zip';zip_path.parent.mkdir(parents=True,exist_ok=True)
        with zipfile.ZipFile(zip_path,'w') as archive:
            for path,body in bodies.items():
                true_body={'status':'FAIL','version':'A'} if tamper and name=='p04-integration' and path=='runtime-report.json' else body
                archive.writestr(path,json.dumps(true_body,sort_keys=True).encode())
        archive_sha=digest(zip_path.read_bytes());manifest=[];raw_archives.append({'artifact_id':aid,'archive':{'path':zip_path.relative_to(root).as_posix(),'sha256':archive_sha}})
        for path,body in bodies.items():
            descriptor=put('copied/'+name+'/'+path,body);raw=(root/descriptor['path']).read_bytes()
            manifest.append({'path':path,'bytes':len(raw),'sha256':digest(raw)});copied[name+'/'+path]=descriptor
            if name=='p04-integration':
                for key,expected in p04_keys.items():
                    if path==expected:packet[key]=descriptor
        receipts.append(put(f'receipts/{aid}.json',{'artifact_id':aid,'run_id':run,'source_sha':sha,'archive_sha256':archive_sha,'files':manifest}))
        artifacts.append({'id':aid,'name':name,'digest':'sha256:'+archive_sha,'workflow_run':{'id':run,'head_sha':sha}})
        job_name='quality' if name=='negative-gates' else 'p03-integration' if name=='p04-integration' else 'p03-measurements ('+name.removeprefix('p03-measurements-')+')' if name.startswith('p03-measurements-') else name
        artifacts_for_job.setdefault(job_name,[]).append(aid)
    logs=[]
    for job in jobs:
        ids=artifacts_for_job[job['name']];raw='\n'.join('Artifact ID is '+str(aid) for aid in ids).encode();path='logs/'+str(job['id'])+'.txt';target=root/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
        logs.append({'job_id':job['id'],'artifact_ids':ids,'log':{'path':path,'sha256':digest(raw)}})
    packet['ci_artifact_index']=put('index.json',{'run_id':run,'source_sha':sha,'source_identity_sha256':cid,'download_receipts':receipts,'job_logs':logs,'raw_archives':raw_archives,'copied_files':copied})
    packet['ci_artifact_metadata']=put('metadata.json',{'artifacts':artifacts})
    return packet,ci,jobs,runner

class ActualZipBinding(unittest.TestCase):
    def test_true_bytes_manifest_and_member_are_accepted(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);validate_ci_artifacts(root,*fixture(root))

    def test_correct_api_zip_digest_does_not_authorize_substituted_receipt_member(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            with self.assertRaisesRegex(ValueError,'actual ZIP members'):validate_ci_artifacts(root,*fixture(root,tamper=True))

if __name__=='__main__':unittest.main()
