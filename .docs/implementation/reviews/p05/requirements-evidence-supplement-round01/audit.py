"""Bounded read-only retained packet audit. No Docker or product execution."""
from pathlib import Path
import hashlib,json,re,sys,zipfile,subprocess
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[4]
sys.path.insert(0,str(ROOT/'tools'));import stage_inventory
def sha(b):return hashlib.sha256(b).hexdigest()
def load(path):return json.loads(path.read_text(encoding='utf-8'))
def need(value,message):
 if not value:raise AssertionError(message)
files=stage_inventory.inventory(ROOT);identity=stage_inventory.identity(files)
need(identity=='ef009b7c3cf262028bc9dc20c6f06798d125d864ac19bb530e9b038a3701c571' and len(files)==1811,'frozen included source changed')
freeze=ROOT/'.docs/implementation/evidence/p05/engine2-source-freeze-01';need(load(freeze/'inputs.json')['files']==files,'freeze map')
need(sha((freeze/'included-source.zip').read_bytes())=='5a622f20a18c427cde591b0f0f78a61f52b892b7dec3fff5ff14833d532b82af','archive SHA')
with zipfile.ZipFile(freeze/'included-source.zip') as z:
 names=[i.filename for i in z.infolist() if not i.is_dir()];need(len(names)==len(set(names))==1811 and set(names)==set(files),'archive entry inventory')
 for n in names:need(sha(z.read(n))==files[n],'archive raw bytes '+n)
packets=[];pins=[]
expected={'engine2-baseline-browser-preflight-01':'7fd138e77d11a5f62cac99408ecc908f4499897d547747da24f915da946d1443','engine2-linux-units-preflight-02':'16151362147c592bca2e7e6fabd95e265794fc2052b4bea44e5f74baa44bb4f2','engine2-additional-host-checks-01':'d933e5168f268b56d72aafeffe18eac0d63cd8434dff54e79a2580e6af44c6e6','engine2-linux-units-attempt01':None}
for name,expected_sha in expected.items():
 p=ROOT/'.docs/implementation/evidence/p05'/name;index=load(p/'index.json');h=sha((p/'index.json').read_bytes());need(expected_sha is None or h==expected_sha,'index SHA '+name)
 pins.append({'path':(p/'index.json').relative_to(ROOT).as_posix(),'sha256':h})
 for item in index['files']:
  raw=(p/item['path']).read_bytes();need(len(raw)==item['bytes'] and sha(raw)==item['sha256'],'indexed child '+name+'/'+item['path'])
 maps=[]
 for n in ['run/inputs-before.json','run/inputs-after.json']:
  if (p/n).exists():need(load(p/n)['files']==files,'map '+name+'/'+n);maps.append(n)
 packets.append({'packet':name,'index_sha256':h,'indexed_files_verified':len(index['files']),'full_current_maps_verified':maps,'status':index['status'],'reviewer_reexecuted':False})
base=ROOT/'.docs/implementation/evidence/p05/engine2-baseline-browser-preflight-01';b=load(base/'run/browser-report.json');r=load(base/'run/runner.json');image=(base/'run/image-id.txt').read_text(encoding='utf-8').strip()
need(r['source_identity_sha256']==r['source_identity_after']==identity and r['source_unchanged'] and r['status']=='PASS','browser runner source status')
need(r['image']==image and image in (base/'run/build.txt').read_text(encoding='utf-8'),'browser image/build export')
need(load(base/'resources-after-cleanup.json')=={'containers':[],'networks':[],'volumes':[]},'browser retained cleanup')
need(len(b['records'])==30 and len(b['matrix'])==216 and len(b['native_zoom'])==27,'browser dimensions')
png=list((base/'run').rglob('*.png'));need(len(png)==270 and all(x.read_bytes().startswith(b'\x89PNG\r\n\x1a\n') for x in png),'PNG inventory/signatures')
command=[r'C:\Temp\venus-p01-toolchain\node-v24.22.0-win-x64\node.exe','--input-type=module','-e','import{readFileSync}from "node:fs";import{validateBrowserReport}from "./tests/p05/report-contract.mjs";const report=JSON.parse(readFileSync(".docs/implementation/evidence/p05/engine2-baseline-browser-preflight-01/run/browser-report.json"));console.log(JSON.stringify({valid:validateBrowserReport(report),versions:report.versions,page_errors:report.page_errors.length}));']
control=subprocess.run(command,cwd=ROOT,capture_output=True,timeout=10);need(control.returncode==0,'actual report validator');(OUT/'browser-validator.txt').write_bytes(control.stdout+control.stderr)
first=ROOT/'.docs/implementation/evidence/p05/engine2-linux-units-attempt01';second=ROOT/'.docs/implementation/evidence/p05/engine2-linux-units-preflight-02'
inspect=(first/'run/image-inspect.json').read_bytes();need(inspect==(second/'run/image-inspect.json').read_bytes(),'unit prior/same image inspect');unit= json.loads(inspect)[0];unitid=unit['Id']
need(unitid in (first/'run/build.txt').read_text(encoding='utf-8') and unitid==(second/'run/image-id.txt').read_text(encoding='utf-8').strip(),'unit image ID/build export');need(load(second/'run/remaining-containers.json')==[],'unit retained cleanup')
ansi=re.compile(r'\x1b\[[0-?]*[ -/]*[@-~]');raw=(second/'run/tests.txt').read_text(encoding='utf-8');plain=ansi.sub('',raw)
need('965 passed | 3 skipped (968)' in plain and '57 passed (57)' in plain,'actual unit raw rendered counts')
need("node_modules/typescript/bin/tsc','-b','--force'" in (second/'runner.py').read_text(encoding='utf-8'),'explicit prerequisite build')
supp=ROOT/'.docs/implementation/evidence/p05/engine2-additional-host-checks-01';need('Ran 117 tests' in (supp/'python.txt').read_text(encoding='utf-8'),'Python117');need('pass 44' in (supp/'reporter.txt').read_text(encoding='utf-8'),'reporter44')
summary={'schema_version':1,'scope':'BOUNDED_RETAINED_RAW_EVIDENCE_AUDIT_NO_REEXECUTION','source_identity':identity,'included_files':1811,'shared_zip_all1811_raw_entries_verified':True,'packets':packets,'browser':{'actual_report_validator_executed':True,'records':30,'layout_cells':216,'native_zoom':27,'png_files_signature_checked':270,'image':image,'image_build_export_and_receipt_match':True,'live_docker_or_image_content_inspection_by_reviewer':False,'baseline_protocol':1,'v2_topic_ui_accepted':False,'retained_resource_query_empty':True,'versions':b['versions']},'linux_units':{'passed':965,'skipped':3,'test_files':57,'image':unitid,'same_prior_image_inspect_and_input_map':True,'attempt01_failure_preserved':True,'full_quality_accepted':False,'retained_container_query_empty':True},'supplement':{'python_pass':117,'reporter_pass':44,'own_full_before_after_maps_present':False,'boundary':'Root index supplies source_identity/source_unchanged assertion; this4-log packet has no per-command full input maps.'},'initial_audit_attempts_preserved_in_journal':'Initial unnamed assertion compared ANSI-colored raw unit summary to uncolored literal; corrected parse removes terminal ANSI only. One exploratory read used default Windows encoding and failed before write.','source_unchanged':stage_inventory.inventory(ROOT)==files,'full_stage_acceptance':False}
(OUT/'checks.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8');(OUT/'input-pins.json').write_text(json.dumps(pins,indent=2)+'\n',encoding='utf-8');print(json.dumps({'packets':len(packets),'indexed_child_hashes_verified':sum(x['indexed_files_verified'] for x in packets),'browser':'30/216/27','linux_units':'965PASS/3skip/57files','source_unchanged':summary['source_unchanged']}))
