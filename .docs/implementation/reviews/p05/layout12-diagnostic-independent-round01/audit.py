from pathlib import Path
import json,hashlib,subprocess,re,datetime,os
R=Path(__file__).resolve().parents[5];O=Path(__file__).resolve().parent
S=R/'.artifacts/p05-pilot-bundle-source12';P=S/'.artifacts/p05-v2-layout-producer-resume12';B=P.with_name('p05-v2-layout-producer-resume11')
A=R/'.docs/implementation/reviews/p05/layout12-diagnostic-author-round01'
def data(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def need(v,label):
 if not v:raise AssertionError(label)
inputs={}
def pin(p):inputs[p.relative_to(R).as_posix()]={'sha256':sha(p),'bytes':p.stat().st_size}
def index(p,h):
 need(sha(p)==h,'index');pin(p);d=data(p);f=d['files']
 if isinstance(f,dict):f=[{'path':n,**v}for n,v in f.items()]
 for v in f:need(sha(p.parent/v['path'])==v['sha256']and(p.parent/v['path']).stat().st_size==v['bytes'],'child '+v['path'])
 return len(f)
checks={'author_children':index(A/'INDEX.json','490d9a5a476ae24a34e8f5d6a91193824013c7352a65480ec3374ad1eb5a5b3c'),
 'prior_failure_diagnosis_children':index(R/'.docs/implementation/reviews/p05/layout11-a15-firstcell-diagnosis-independent-round01/INDEX.json','1a82fa26701389d96934443f26869e61e7c5b50507b872ff913071e556e972ed')}
stored=data(A/'PRODUCER-PINS.json')
for n,v in stored['files'].items():
 if v['type']=='file':need(sha(P/n)==v['sha256']and(P/n).stat().st_size==v['bytes'],'producer '+n)
runtime={n:v for n,v in stored['files'].items()if n.endswith('.mjs')or n in ['binding.json','DESIGN.md']}
digest=hashlib.sha256(json.dumps(runtime,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
need(digest==stored['producer_runtime_digest']=='22999846eadad87ae42913880e5de5aff3d3c61214763dd04bddba5da79c2fc2','digest')
names=sorted(p.name for p in B.glob('*.mjs'));need(len(names)==27 and names==sorted(p.name for p in P.glob('*.mjs')),'27 same MJS names')
changed=[n for n in names if(B/n).read_bytes()!=(P/n).read_bytes()];need(changed==['probe-policy.mjs','run.mjs'],'only2 modules')
need((P/'run.mjs').read_bytes()==(B/'run.mjs').read_bytes().replace(b'p05-v2-layout-producer-resume11',b'p05-v2-layout-producer-resume12'),'run path inverse')
old=(B/'probe-policy.mjs').read_bytes();new=(P/'probe-policy.mjs').read_bytes();prefix=new[:new.index(b'// Literal diagnostic labels only.')]
prefix=prefix.replace(b"\nimport {types} from 'node:util';\nimport {fileURLToPath} from 'node:url';\n",b'')
need(prefix==old[:old.index(b'export function safeFailure(error)')],'all original policy functions byteexact')
for n in ['binding.json','expected-cells.json','real-text-fixture.json','DESIGN.md']:need((B/n).read_bytes()==(P/n).read_bytes(),'fixed fixture '+n)
checks.update({'other_mjs_exact':25,'original_policy_and_oracles_byteexact':True,'run_literal_only':True,'fixed_fixtures_design_binding_exact':True})
text=new.decode();codes=json.loads(re.search(r'const failureCodes=new Set\((\[.*?\])\);',text).group(1));mods=json.loads(re.search(r'const failureModules=(\[.*?\]);',text).group(1));sources=data(A/'STATIC-CODE-SOURCES.json')
need(len(codes)==len(set(codes))==74 and set(codes)==set(sources['codes'])-{'OBSERVER_'},'static74 codes');need(len(mods)==len(set(mods))==15 and mods==sources['modules'],'static15 modules')
for u in sources['uses']:need(u['code']in(B/(u['module']+'.mjs')).read_text().splitlines()[u['line']-1],'literal source use')
checks['static_literal_labels']=74;checks['own_module_labels']=15
need('function safeErrorChain'in text and 'types.isProxy(current)'in text and 'depth<8'in text and 'types.isNativeError(error)'in text,'bounded native/proxy guard')
need("message.split(/[\\r\\n]/,1)[0].split(':',1)[0]"in text and 'failureCodes.has(prefix)'in text,'firstline colon allowlist')
need('stack.slice(header.length+1)'in text and 'stack.startsWith(header+\'\\n\')'in text and '.slice(0,16)'in text and 'source_line>1000000||source_column>100000'in text,'header/frame numeric bounds')
ack=data(P/'ROOT_RUN_ACK.json');need(ack['root_run_ack']is False and ack['independent_producer_review']=='PENDING'and ack['independent_review_index_sha256']is None,'false ACK')
freeze=data(R/'.artifacts/p05-pilot-bundle-source-freeze12.json');need(len(freeze['files'])==1869,'A15count')
for n,h in freeze['files'].items():need(sha(S/n)==h,'A15 materialized source '+n)
checks['materialized_A15_files_exact']=1869
authorchecks=data(A/'CHECKS.json');need(authorchecks['finite_controls']==16 and authorchecks['syntax_modules']==27 and all(v['exit_code']==v['expected_exit']for v in authorchecks['commands']),'author recorded checks')
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';commands=[]
def run(label,argv,cwd=R,expect=0):
 v=subprocess.run(argv,cwd=cwd,env={**os.environ,'PYTHON':str(R/'.venv/Scripts/python.exe')},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=30)
 (O/(label+'.txt')).write_bytes(v.stdout);commands.append({'name':label,'argv':argv,'cwd':str(cwd),'exit':v.returncode,'expected':expect});need(v.returncode==expect,'command '+label);return v
c=run('cold-controls',[node,str(A/'controls.mjs')]);need(data(A/'controls02.stdout.txt')['controls']==16,'recorded16');need(json.loads(c.stdout)['controls']==16,'current16')
for n in changed:run('syntax-'+n,[node,'--check',str(P/n)])
outroot=S/'.artifacts/p05';before=sorted(p.name for p in outroot.iterdir());ackbefore=sha(P/'ROOT_RUN_ACK.json')
v=run('pending-ACK-denied',[node,str(P/'run.mjs')],S,1);need(b'ROOT_RUN_ACK_REQUIRED'in v.stdout,'denial cause');need(before==sorted(p.name for p in outroot.iterdir())and ackbefore==sha(P/'ROOT_RUN_ACK.json'),'no output/ACK mutation')
checks.update({'finite_controls_rerun':16,'changed_modules_syntax_exit':0,'pending_ACK_exit':1,'no_output_or_ACK_mutation':True})
for p in [P/n for n in names]+[P/'binding.json',P/'expected-cells.json',P/'real-text-fixture.json',P/'ROOT_RUN_ACK.json']:pin(p)
result={'status':'PASS_LAYOUT_DIAGNOSTIC_METHOD_ONLY_NATIVE_AND_FUTURE_BINDING_REQUIRED','at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'source_identity':freeze['identity'],'image':data(P/'binding.json')['image'],'producer_runtime_digest':digest,'checks':checks,'commands':commands,
 'prior_native_failure_location':'UNKNOWN_UNTIL_NEW_ACTUAL','APP_edits':False,'native_runs':False,'ACK_activation':False,'full459_PASS':False}
(O/'CHECKS.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');(O/'INPUT_PINS.json').write_text(json.dumps(inputs,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in result.items()if k!='commands'}))
