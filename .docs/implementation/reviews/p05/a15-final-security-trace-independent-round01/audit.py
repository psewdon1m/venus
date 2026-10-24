"""Read-only pins/obligation audit; no tests, native processes or APP writes."""
from pathlib import Path
import hashlib,json,subprocess,datetime

ROOT=Path(__file__).resolve().parents[5]
OUT=Path(__file__).resolve().parent
MAT=ROOT/'.artifacts/p05-pilot-bundle-source12'
OLD=ROOT/'.artifacts/p05-pilot-bundle-source10'
WIT=Path('C:/Users/pc/.codex/worktrees/p05-final-source/venus')
COMMIT='7ce04192c84e1d01620b099a4a0386ab5b291fbc'
DRAFT=ROOT/'.docs/implementation/evidence/p05/a15-closure-matrix-draft01'
def obj(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def need(v,why):
 if not v:raise AssertionError(why)
checks={};pins={}
def index(p):
 d=obj(p);pins[p.relative_to(ROOT).as_posix()]=sha(p)
 children=d['files']
 if isinstance(children,dict):children=[{'path':n,**({'sha256':v}if isinstance(v,str)else v)}for n,v in children.items()]
 for f in children:
  n=p.parent/f['path'];need(n.is_file(),str(n));need(sha(n)==f['sha256'],'child hash '+str(n))
  if 'bytes'in f:need(n.stat().st_size==f['bytes'],'size '+str(n))
 return d

freeze=obj(ROOT/'.artifacts/p05-pilot-bundle-source-freeze12.json')
need(freeze['identity']=='658b710bdca35b678421a51c1c276028305f28362901b2c065a3867aa754f4de','identity')
need(len(freeze['files'])==freeze['included_files']==1869,'count')
for n,h in freeze['files'].items():need(sha(ROOT/n)==sha(MAT/n)==h,'frozen source '+n)
checks['live_and_materialized_source_files_exact']=1869
pins['.artifacts/p05-pilot-bundle-source-freeze12.json']=sha(ROOT/'.artifacts/p05-pilot-bundle-source-freeze12.json')
need(subprocess.check_output(['git','-C',str(WIT),'rev-parse','HEAD'],text=True).strip()==COMMIT,'commit')
need(subprocess.check_output(['git','-C',str(WIT),'status','--porcelain=v1'],text=True).strip()=='','clean working tree')
query=''.join(COMMIT+':'+n+'\n' for n in freeze['files']).encode()
data=subprocess.check_output(['git','-C',str(WIT),'cat-file','--batch'],input=query);cursor=0
for n,h in freeze['files'].items():
 end=data.index(b'\n',cursor);header=data[cursor:end].split();need(len(header)==3 and header[1]==b'blob','git header '+n)
 size=int(header[2]);cursor=end+1;blob=data[cursor:cursor+size];cursor+=size
 need(hashlib.sha256(blob).hexdigest()==h,'git blob '+n);need(data[cursor:cursor+1]==b'\n','git framing');cursor+=1
need(cursor==len(data),'git exact bytes')
checks['clean_commit_gitblobs_exact']=1869
index(DRAFT/'INDEX.json')
triage=obj(ROOT/'.docs/implementation/reviews/p05/requirements44-current-triage-round02/matrix.json')
facts=obj(ROOT/'.docs/implementation/reviews/p05/a13-app-threat-privacy-code-audit-round01/requirements44-code-facts.json')
rows=obj(DRAFT/'REQUIREMENTS44.json')['rows'];original=triage['rows'];need(len(rows)==len(original)==44,'44 count')
need([x['id']for x in rows]==[x['id']for x in original],'original ordered IDs')
tests=set();anchors=set()
for row,old in zip(rows,original):
 for k in ['id','requirement','expected','source_card_ids','current_card_applicability','historical_actual_check_ids']:
  need(row[k]==old[k],row['id']+' '+k)
 need(row['full_requirement_acceptance'] is False,'no invented acceptance '+row['id'])
 for t in row['current_tests']['test_files']:
  need(freeze['files'][t['path']]==t['A15_sha256']==sha(MAT/t['path']),'test '+t['path']);tests.add(t['path'])
 for a in row['code']['source_anchors']:
  if 'A13_source'not in a:continue
  n,l=a['A13_source'].rsplit(':',1);line=a['A15_equal_line']
  need(freeze['files'][a['A15_path']]==a['A15_sha256'],'anchor pin')
  if line is not None:
   need((OLD/n).read_text().splitlines()[int(l)-1]==(MAT/a['A15_path']).read_text().splitlines()[line-1],'equal anchor '+n+':'+l)
  anchors.add(a['A13_source'])
checks['original_obligations_preserved']=44
checks['original_moved_UX_obligations_preserved']=sum(x['id'].startswith('P04-UX-')for x in rows)
checks['original_unique_retired_card_triggers']=triage['source_card_trigger_unique_absent']
checks['current_test_files_pinned']=sorted(tests)
checks['unique_anchors_reconciled']=len(anchors)
carry=obj(DRAFT/'SOURCE_CARRY.json');changed=[]
for n,v in carry['files'].items():
 need(sha(MAT/n)==v['A15_sha256']and sha(OLD/n)==v['A13_sha256'],'carry '+n)
 need(v['byteexact_A13']==(v['A15_sha256']==v['A13_sha256']),'carry equality '+n)
 if not v['byteexact_A13']:changed.append(n)
checks['source_carry_files']=len(carry['files']);checks['changed_files_no_blanket_carry']=changed
proofs=obj(DRAFT/'PROOFS.json')
for k,p in proofs.items():
 n=ROOT/p['path'];need(sha(n)==p['sha256'],'proof index '+k);index(n)
checks['referenced_proof_indexes_and_direct_children_verified']=len(proofs)
for n in ['GATES_AND_E2E.json','CI_RIP.json']:
 d=obj(DRAFT/n)
 lists=[v for v in d.values()if isinstance(v,list)and v and isinstance(v[0],dict)]
 for rows0 in lists:
  for row in rows0:
   f,l=row['norm_source'].rsplit(':',1);line=(MAT/f).read_text().splitlines()[int(l)-1]
   need(row['text']in line,'normative row '+row['id'])
gates=obj(DRAFT/'GATES_AND_E2E.json');ci=obj(DRAFT/'CI_RIP.json')
need(len(gates['exit_p05'])==5 and len(gates['critical_e2e_04_section8'])==10 and len(ci['rows'])==9,'normative counts')
checks['normative_exit_e2e_ci_rows_exact']={'EXIT':5,'E2E':10,'CI_RIP':9}
for n in ['.docs/implementation/evidence/p05/a15-clean-source-witness01/INDEX.json',
 '.docs/implementation/reviews/p05/socket-projection-work-independent-round01/INDEX.json',
 '.docs/implementation/reviews/p05/ws-safe-failure-logging-independent-round01/INDEX.json',
 '.docs/implementation/reviews/p05/own-exclusion-refresh-independent-round03/INDEX.json']:
 index(ROOT/n)
result={'status':'PASS_READONLY_PINS_OBLIGATION_AND_SOURCE_IDENTITY_CHECKS_NOT_RUNTIME_OR_STAGE',
 'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_identity':freeze['identity'],
 'included_files':1869,'clean_commit':COMMIT,'checks':checks,'input_index_sha256':pins,
 'no_native_tests_or_APP_edits':True}
(OUT/'CHECKS.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':result['status'],'checks':checks},ensure_ascii=False))
