from pathlib import Path
import ctypes,hashlib,importlib.util,json,subprocess,tempfile,ast
ROOT=Path.cwd();OUT=Path(__file__).resolve().parent;P=ROOT/'.artifacts/p05-recovery-source1274-01/.artifacts/p05-oci-rollback-producer-resume04';node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
spec=importlib.util.spec_from_file_location('diag_exact_scan',P/'oci_allocated_tree.py');scan=importlib.util.module_from_spec(spec);spec.loader.exec_module(scan)
results=[]
with tempfile.TemporaryDirectory(prefix='venus-oci04-native-forensic-') as temp:
 root=Path(temp);target=root/'guard.json';source=root/'guard.json.next';target.write_text('{"counter":1}');source.write_text('{"counter":2}')
 # Native sharing behavior of the exact scanner's real enumeration API.
 dll,Data=scan.stream_api();data=Data();handle=dll.FindFirstStreamW(str(target),0,ctypes.byref(data),0);assert handle!=ctypes.c_void_p(-1).value
 code="const f=require('fs');try{f.renameSync(process.argv[1],process.argv[2]);console.log(JSON.stringify({status:'RENAMED'}));}catch(e){console.log(JSON.stringify({status:'REJECTED',code:e.code,errno:e.errno,source_retained:f.existsSync(process.argv[1])}));}"
 try:
  q=subprocess.run([node,'-e',code,str(source),str(target)],capture_output=True,text=True,timeout=5);assert q.returncode==0;r=json.loads(q.stdout)
 finally:assert dll.FindClose(handle)
 assert r['status']=='REJECTED' and r['code']=='EPERM' and r['source_retained'];results.append({'name':'exact FindFirstStreamW handle blocks replacement on separate Windows fixture','status':'PASS','result':r,'qualification':'Platform causal mechanism only; actual lock holder NOT identified'})
 q=subprocess.run([node,'-e',code,str(source),str(target)],capture_output=True,text=True,timeout=5);assert q.returncode==0;assert json.loads(q.stdout)['status']=='RENAMED';results.append({'name':'same rename succeeds after enumerator handle closes','status':'PASS'})
 row=scan.inspect_tree(root);assert row['files']==1 and row['logical_bytes']==13;results.append({'name':'exact scanner readonly accounts fixture after rename','status':'PASS'})
 # Preserve ADS/hardlink rejection requirements; no live or actual owner paths.
 (root/'guard.json:hidden').write_text('x')
 try:scan.inspect_tree(root)
 except ValueError as e:assert 'ALTERNATE_STREAM' in str(e)
 else:raise AssertionError('ADS silently accepted')
 (root/'guard.json:hidden').unlink();results.append({'name':'named ADS remains rejected','status':'PASS'})
 import os
 os.link(target,root/'other')
 try:scan.inspect_tree(root)
 except ValueError as e:assert 'MULTILINK_FILE' in str(e)
 else:raise AssertionError('hardlink silently accepted')
 (root/'other').unlink();results.append({'name':'hardlink remains rejected','status':'PASS'})
source_text=(P/'oci_allocated_tree.py').read_text(encoding='utf-8');tree=ast.parse(source_text)
assert not any(isinstance(n,ast.Attribute) and n.attr in ['read_bytes','read_text','read','hexdigest'] for n in ast.walk(tree));results.append({'name':'scanner source does metadata/stream accounting, not content hashing','status':'PASS'})
supervisor=(P/'oci-resource-supervisor.mjs').read_text(encoding='utf-8');assert "const p=join(plan.workspace_root,'.venv/Scripts/python.exe'),r=JSON.parse((await bounded(p" in supervisor and "await atomic('guard.json',sample)" in supervisor
results.append({'name':'own supervisor scanner subprocess is awaited before own guard rename','status':'PASS','qualification':'No actual scanner-reader overlap proved from this sequential path'})
data={'status':'PASS_NATIVE_CAUSAL_CLASS_CONTROLS_ONLY','controls':results,'actual_lock_holder':'UNKNOWN','actual_prefix_writes':0,'new_containers_or_starts':0,'source_scanner_sha256':hashlib.sha256((P/'oci_allocated_tree.py').read_bytes()).hexdigest()}
(OUT/'native-controls.json').write_text(json.dumps(data,indent=2)+'\n');print(json.dumps({'status':data['status'],'controls':len(results),'actual_lock_holder':'UNKNOWN'}))
