from pathlib import Path
import datetime,json,os,subprocess,sys
r=Path('C:/.projects/venus');sys.path.insert(0,str(r/'tools'))
from stage_inventory import inventory,identity
before=inventory(r);assert identity(before)=='658b710bdca35b678421a51c1c276028305f28362901b2c065a3867aa754f4de'
out=r/'.artifacts/p05-a15-quality-remainder01';assert not out.exists();out.mkdir()
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';python=str(r/'.venv/Scripts/python.exe');env=os.environ.copy();env['PATH']=str(r/'.venv/Scripts')+';'+str(Path(node).parent)+';'+env['PATH'];env['PYTHONDONTWRITEBYTECODE']='1'
commands=[('reporter',[node,'--test','tests/p05/report-contract.test.mjs'])]
commands += [(Path(n).stem,[python,'-X','utf8','-B','tools/'+n,*args]) for n,args in [('check_schemas.py',[]),('check_relationship_policy.py',[]),('generate_contract_types.py',['--check']),('generate_engine_policy.py',['--check']),('generate_p03_contracts.py',['--check'])]]
commands += [('i18n',[node,'tools/check-i18n.mjs']),('python',[python,'-X','utf8','-B','-m','unittest','discover','-s','tools','-p','test_*.py']),('catalog-r2',[node,'tools/check-catalog-r2.mjs'])]
results=[]
for name,args in commands:
 with (out/(name+'.txt')).open('w',encoding='utf-8') as f:p=subprocess.run(args,cwd=r,env=env,stdout=f,stderr=subprocess.STDOUT)
 results.append({'name':name,'command':args,'exit':p.returncode});print(name,p.returncode,flush=True)
 if p.returncode:break
after=inventory(r);same=before==after
(out/'receipt.json').write_text(json.dumps({'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_identity':identity(before),'source_commit_byte_qualification':'7ce04192c84e1d01620b099a4a0386ab5b291fbc','before_after_exact':same,'results':results,'not_run_here':['already-passed host1083/type/lint','docs/manifest until writers STOP','negative scratch until final evidence assembly'],'full_quality_or_stage_PASS':False},indent=2)+'\n',encoding='utf-8')
assert same
raise SystemExit(any(v['exit'] for v in results))
