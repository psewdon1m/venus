"""Task-local GitHub admin helper. Never emit credentials or secret values."""
import os,sys,json,subprocess,urllib.request,urllib.error,datetime,hashlib,base64
from pathlib import Path
ROOT=Path('C:/.projects/venus');BASE='/repos/psewdon1m/venus'
env=os.environ.copy();env.update(GIT_TERMINAL_PROMPT='0',GCM_INTERACTIVE='never')
p=subprocess.run(['git','-c','credential.interactive=never','credential','fill'],
 input='protocol=https\nhost=github.com\n\n',capture_output=True,text=True,env=env,timeout=25,cwd=ROOT)
values=dict(s.split('=',1)for s in p.stdout.splitlines()if'='in s)
TOKEN=values.get('password');assert p.returncode==0 and TOKEN,'GITHUB_CREDENTIAL_UNAVAILABLE'
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
opener=urllib.request.build_opener(NoRedirect)
def api(path,method='GET',body=None):
 assert path.startswith(BASE)or path=='/user'
 req=urllib.request.Request('https://api.github.com'+path,
  data=json.dumps(body).encode()if body is not None else None,method=method,
  headers={'Authorization':'Bearer '+TOKEN,'Accept':'application/vnd.github+json',
   'X-GitHub-Api-Version':'2022-11-28','User-Agent':'Venus-P06-owner-authorized-release'})
 try:
  with opener.open(req,timeout=45)as response:
   raw=response.read();return response.status,json.loads(raw)if raw else None
 except urllib.error.HTTPError as e:
  return e.code,{'error':'GITHUB_HTTP_'+str(e.code)}
def save(name,value):
 p=ROOT/'.artifacts/p06-service-release01'/name;p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',newline='\n')
 print(json.dumps(value,ensure_ascii=False))
mode=sys.argv[1];now=datetime.datetime.now(datetime.timezone.utc).isoformat()
if mode=='read':
 paths={'repo':BASE,'main':BASE+'/branches/main','protection':BASE+'/branches/main/protection',
  'PR4':BASE+'/pulls/4','environment':BASE+'/environments/venus-release',
  'release':BASE+'/releases/tags/venus-v0.0.1','user':'/user'}
 from concurrent.futures import ThreadPoolExecutor
 with ThreadPoolExecutor(max_workers=5)as pool:
  vals=dict(zip(paths,pool.map(api,paths.values())))
 out={'at_utc':now,'scope':'READ_ONLY','http':{k:v[0]for k,v in vals.items()}}
 for k in ['repo','user','main','PR4','protection']:assert vals[k][0]==200,k+'_UNAVAILABLE'
 repo=vals['repo'][1];out['repo']={'id':repo['id'],'owner_id':repo['owner']['id'],'default_branch':repo['default_branch'],'private':repo['private'],'permissions':repo['permissions']}
 out['user']={k:vals['user'][1][k]for k in ['login','id']}
 out['main']=vals['main'][1]['commit']['sha'];out['protection']=vals['protection'][1]
 pr=vals['PR4'][1];out['PR4']={k:pr.get(k)for k in ['number','state','merged','mergeable','html_url']};out['PR4'].update(head=pr['head']['sha'],branch=pr['head']['ref'])
 out['environment']=vals['environment'][1]if vals['environment'][0]==200 else None
 out['existing_release']=vals['release'][1]if vals['release'][0]==200 else None
 save(sys.argv[2],out)
elif mode=='environment':
 status,repo=api(BASE);assert status==200
 status,prior=api(BASE+'/environments/venus-release')
 assert status in [200,404]
 if status==200:
  # Never overwrite unrelated pre-existing environment settings silently.
  assert prior.get('deployment_branch_policy')=={'protected_branches':False,'custom_branch_policies':True},'EXISTING_ENVIRONMENT_REQUIRES_RECONCILIATION'
 else:
  status,prior=api(BASE+'/environments/venus-release','PUT',{
   'wait_timer':0,'prevent_self_review':False,
   'reviewers':[{'type':'User','id':repo['owner']['id']}],
   'deployment_branch_policy':{'protected_branches':False,'custom_branch_policies':True}})
  assert status==200, 'ENVIRONMENT_CREATE_'+str(status)
 status,policies=api(BASE+'/environments/venus-release/deployment-branch-policies')
 assert status==200
 rows=policies['branch_policies']
 if not rows:
  status,item=api(BASE+'/environments/venus-release/deployment-branch-policies','POST',{'name':'venus-v*','type':'tag'})
  assert status==200,'TAG_POLICY_CREATE_'+str(status)
 else:assert len(rows)==1 and rows[0]['name']=='venus-v*' and rows[0]['type']=='tag'
 status,current=api(BASE+'/environments/venus-release');assert status==200
 status,policies=api(BASE+'/environments/venus-release/deployment-branch-policies');assert status==200
 save(sys.argv[2],{'at_utc':now,'status':'PROTECTED_ENVIRONMENT_CONFIGURED',
  'environment':current,'deployment_policies':policies,'owner_authority':'U-020/ADR-032','secret_uploaded':False})
elif mode=='upload':
 sys.path.insert(0,str(ROOT/'.artifacts/p06-gh-libs'))
 from nacl.public import PublicKey,SealedBox
 from cryptography.hazmat.primitives import serialization
 keydir=Path('C:/Users/pc/.codex/secrets/venus-release-e2749416-6f63-467d-81a0-f6cbac36d5ff')
 raw=(keydir/'venus-service-signing.pem').read_bytes()
 private=serialization.load_pem_private_key(raw,password=None)
 public=private.public_key().public_bytes(serialization.Encoding.DER,serialization.PublicFormat.SubjectPublicKeyInfo)
 keyid=hashlib.sha256(public).hexdigest();assert keyid=='59a72237edc78adf5874cd609471324108e55b2ac6e81f7ac63ed31f1038e1fb'
 trust=json.loads((ROOT/'infra/venus/release-trust.json').read_text());assert trust['owner_approved'] and trust['key_id']==keyid
 challenge=os.urandom(32);private.public_key().verify(private.sign(challenge),challenge)
 status,e=api(BASE+'/environments/venus-release');assert status==200
 assert e['deployment_branch_policy']=={'protected_branches':False,'custom_branch_policies':True}
 status,policies=api(BASE+'/environments/venus-release/deployment-branch-policies');assert status==200
 assert len(policies['branch_policies'])==1 and policies['branch_policies'][0]['type']=='tag' and policies['branch_policies'][0]['name']=='venus-v*'
 status,k=api(BASE+'/environments/venus-release/secrets/public-key');assert status==200
 cipher=base64.b64encode(SealedBox(PublicKey(base64.b64decode(k['key']))).encrypt(raw)).decode()
 status,_=api(BASE+'/environments/venus-release/secrets/VENUS_RELEASE_PRIVATE_KEY','PUT',{'encrypted_value':cipher,'key_id':k['key_id']})
 assert status in [201,204],'SECRET_UPLOAD_'+str(status)
 code,metadata=api(BASE+'/environments/venus-release/secrets/VENUS_RELEASE_PRIVATE_KEY');assert code==200
 descriptor=json.loads((keydir/'PUBLIC-KEY-IDENTITY.json').read_text());descriptor.update(owner_approval='APPROVED_U020',uploaded_to_GitHub=True,production_signing_readiness=False)
 (keydir/'PUBLIC-KEY-IDENTITY.json').write_text(json.dumps(descriptor,sort_keys=True,separators=(',',':'))+'\n',newline='\n')
 save(sys.argv[2],{'at_utc':now,'status':'APPROVED_KEY_ENCRYPTED_ENVIRONMENT_SECRET_UPLOADED',
  'key_id':keyid,'keypair_challenge_verified':True,'owner_authority':'U-020/ADR-032',
  'HTTP_upload':status,'secret_metadata':metadata,'private_material_printed_or_saved_in_repo':False,
  'credential_printed_or_saved':False,'encryption':'LibSodium sealed box / PyNaCl1.5.0 cffi2.0.0',
  'production_deployment_claimed':False})
elif mode=='request':
 method,path,out=sys.argv[2:5]
 body=json.loads(Path(sys.argv[5]).read_text())if len(sys.argv)>5 else None
 status,data=api(path,method,body)
 save(out,{'at_utc':now,'method':method,'endpoint':path,'http_status':status,'data':data})
 if status not in [200,201,202,204]:sys.exit(1)
else:raise SystemExit('UNKNOWN_MODE')
