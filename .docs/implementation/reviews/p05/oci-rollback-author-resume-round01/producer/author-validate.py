"""Finite author syntax/lint/cold/model checks. Never Docker/DB/browser execution."""
from pathlib import Path
import subprocess,json,datetime,sys
ROOT=Path.cwd().resolve();OUT=Path(__file__).parent;NODE=Path(r'C:\Temp\venus-p01-toolchain\node-v24.22.0-win-x64\node.exe');rows=[]
def run(name,args,timeout=45):
    r=subprocess.run([str(NODE),*args],cwd=ROOT,capture_output=True,timeout=timeout);assert len(r.stdout)+len(r.stderr)<=1024*1024
    rows.append({'name':name,'arguments':args,'exit_code':r.returncode,'stdout':r.stdout.decode('utf8',errors='replace'),'stderr':r.stderr.decode('utf8',errors='replace')})
for p in sorted(OUT.glob('*.mjs')):run('syntax '+p.name,['--check',str(p)])
for n in ['driver','api-child','browser-child','gateway','bootstrap','volume-admin','oci-resource-supervisor']:run('cold '+n,[str(OUT/(n+'.mjs'))])
run('exact supervisor body and final receipt controls',[str(OUT/'oci-supervisor-author-controls.mjs')])
run('resource512/900 pure policy negative controls',[str(OUT/'oci-resource-author-controls.mjs')])
run('author models and owned tiny-files only',[str(OUT/'author-controls.mjs')])
run('inert exact factory derivation and generated syntax only',[str(OUT/'author-factory-controls.mjs')])
files=[str(p) for p in sorted(OUT.glob('*.mjs'))]
run('authored module lint',[str(ROOT/'node_modules/eslint/bin/eslint.js'),'--config',str(OUT/'eslint.config.mjs'),'--format','json',*files])
attempt=1
while (OUT/('author-validation-attempt%02d.json'%attempt)).exists():attempt+=1
result={'status':'AUTHOR_CHECKS_PASS_NOT_RUNTIME' if all(r['exit_code']==0 for r in rows) else 'AUTHOR_CHECKS_FAIL_NOT_RUNTIME','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':rows,'Docker_commands':0,'actual_OCI_switches':0,'resource_guard_ready':False,'root_run_ack':False,'independent_acceptance':False}
(OUT/('author-validation-attempt%02d.json'%attempt)).write_text(json.dumps(result,indent=2)+'\n',encoding='utf8');print(json.dumps({'status':result['status'],'commands':len(rows),'failed':[{k:r[k] for k in ['name','exit_code','stdout','stderr']} for r in rows if r['exit_code']!=0]}));sys.exit(0 if result['status']=='AUTHOR_CHECKS_PASS_NOT_RUNTIME' else 1)
