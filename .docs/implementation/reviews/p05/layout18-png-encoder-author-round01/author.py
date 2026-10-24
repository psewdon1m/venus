from pathlib import Path
import datetime, hashlib, json, shutil, subprocess

r = Path('C:/.projects/venus')
s = r/'.artifacts/p05-pilot-bundle-source14'
old = s/'.artifacts/p05-v2-layout-producer-resume17'
new = s/'.artifacts/p05-v2-layout-producer-resume18'
out = r/'.docs/implementation/reviews/p05/layout18-png-encoder-author-round01'
node = 'C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
save = lambda p,v: p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert not new.exists() and not out.exists()
diagnosis = r/'.docs/implementation/reviews/p05/a17-layout17-failure-diagnosis-independent-round01/INDEX.json'
assert sha(diagnosis)=='63e6ec171c78070a3537e65ce1260faa7dd6749c362a356500add932d7adf4c0'
shutil.copytree(old,new)
out.mkdir(parents=True)
before=(old/'x11.mjs').read_bytes()
needle=b"'-frames:v','1',path]"
replacement=b"'-frames:v','1','-threads:v','1',path]"
assert before.count(needle)==1
(new/'x11.mjs').write_bytes(before.replace(needle,replacement))
run=(old/'run.mjs').read_bytes()
assert run.count(b'p05-v2-layout-producer-resume17')==1
(new/'run.mjs').write_bytes(run.replace(b'p05-v2-layout-producer-resume17',b'p05-v2-layout-producer-resume18'))
ack=json.loads((new/'ROOT_RUN_ACK.json').read_bytes())
ack.update(root_run_ack=False,independent_producer_review='PENDING',independent_review_path='',independent_review_index_sha256='',status='NOT_AUTHORIZED_PENDING_NEW_INDEPENDENT_REVIEW')
save(new/'ROOT_RUN_ACK.json',ack)
checks=[]
def command(args, name, expected=0, cwd=r):
    p=subprocess.run(args,cwd=cwd,capture_output=True,timeout=60)
    (out/(name+'.stdout.txt')).write_bytes(p.stdout)
    (out/(name+'.stderr.txt')).write_bytes(p.stderr)
    checks.append({'name':name,'argv':args,'exit_code':p.returncode,'expected_exit_code':expected})
    assert p.returncode==expected,(name,p.returncode)
    return p.stdout
for name in ['x11.mjs','run.mjs']:
    command([node,'--check',str(new/name)],'syntax-'+name)
unchanged=[]
for p in old.glob('*.mjs'):
    if p.name not in ['x11.mjs','run.mjs']:
        assert (new/p.name).read_bytes()==p.read_bytes()
        unchanged.append(p.name)
assert len(unchanged)==25
assert (new/'x11.mjs').read_bytes().replace(replacement,needle)==before
assert (new/'run.mjs').read_bytes().replace(b'p05-v2-layout-producer-resume18',b'p05-v2-layout-producer-resume17')==run
digest_script="import {captureProducer,runtimeDigest} from './runner-policy.mjs'; console.log(runtimeDigest(captureProducer('.')));"
digest=command([node,'--input-type=module','-e',digest_script],'actual-js-runtime-digest',cwd=new).decode().strip()
assert len(digest)==64
ack['producer_runtime_digest']=digest
save(new/'ROOT_RUN_ACK.json',ack)
files={p.name:({'type':'file','sha256':sha(p),'bytes':p.stat().st_size} if p.is_file() else {'type':'historical_or_extraction_directory'}) for p in sorted(new.iterdir(),key=lambda p:p.name) if p.name!='INDEX.json'}
save(new/'INDEX.json',{'status':'AUTHOR_COLD_PASS_PENDING_INDEPENDENT_NO_NATIVE','source_identity':'93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d','producer_runtime_digest':digest,'root_ACK':False,'files':files})
command([node,str(new/'run.mjs')],'false-ack-refusal',expected=1,cwd=s)
assert 'ROOT_RUN_ACK_REQUIRED' in (out/'false-ack-refusal.stderr.txt').read_text()
for name in ['x11.mjs','run.mjs','INDEX.json','ROOT_RUN_ACK.json']:
    shutil.copyfile(new/name,out/name)
save(out/'INPUTS.json',{'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'diagnosis':{'path':str(diagnosis.relative_to(r)),'sha256':sha(diagnosis)},'parent_runtime_digest':'c9f2f15310a1f02aff053727638997775b41edd9698e799b9d4d39e62ff6be8c','runtime_digest':digest,'producer':str(new),'unchanged25MJS':unchanged,'native_runs':0,'APP_changes':False,'actual_cause':'PNG encoder initialization failure observed; deeper cause UNKNOWN; one encoding thread is prospective containment, not a proved remedy'})
save(out/'CHECKS.json',{'commands':checks,'inverse_exact':True,'all_original_459_oracles_and_budgets_unchanged':True,'root_ACK':False,'native_runs':0})
(out/'REPORT.md').write_text('# METHOD18: bounded PNG encoder\n\nThe prior native run retains 17 PASS / 1 FAIL / 33 NOT_RUN and cleanup PASS. Saved FFmpeg stderr proves PNG frame encoder initialization failed; the deeper cause remains unknown.\n\nOnly the PNG output encoder argv adds `-threads:v 1`; the output remains one native X11-grab PNG. Physical zoom, window ownership/focus, source geometry, invitation redaction, no-overwrite, timeout and every final validation are unchanged. This bounds encoding concurrency inside the existing resource profile; no APP change, quota increase, oracle waiver or actual remedy claim. `run.mjs` changes only the successor directory literal. The other 25 MJS files are byte-exact METHOD17.\n\nChanged-file syntax, actual JS runtime digest, exact inverse and false-ACK refusal pass. Independent review and a new root ACK are required before native execution.\n',encoding='utf-8')
shutil.copyfile(Path(__file__),out/'author.py')
save(out/'PACKET_INDEX.json',{'status':'AUTHOR_COLD_PASS_NOT_NATIVE_OR_STAGE','producer_runtime_digest':digest,'files':{p.name:{'bytes':p.stat().st_size,'sha256':sha(p)}for p in sorted(out.iterdir(),key=lambda p:p.name)if p.is_file() and p.name!='PACKET_INDEX.json'}})
print(json.dumps({'packet_index':str(out/'PACKET_INDEX.json'),'sha256':sha(out/'PACKET_INDEX.json'),'runtime_digest':digest,'producer_index_sha256':sha(new/'INDEX.json'),'native_runs':0}))
