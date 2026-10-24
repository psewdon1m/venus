from pathlib import Path
import hashlib,json,subprocess,os
root=Path('C:/.projects/venus');here=Path(__file__).resolve().parent;pins={}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p,expected=None):
    p=Path(p);p=p if p.is_absolute() else root/p
    if expected:assert sha(p)==expected,str(p)
    pins[str(p.relative_to(root)).replace('\\','/')]={'sha256':sha(p),'bytes':p.stat().st_size}
    return json.loads(p.read_text(encoding='utf-8-sig'))
def packet(p,expected=None):
    p=Path(p);p=p if p.is_absolute() else root/p;idx=read(p,expected)
    files=idx['files'];files=[{'path':n,**v} for n,v in files.items()] if isinstance(files,dict) else files
    for row in files:
        child=p.parent/row['path']
        if child.is_dir():
            assert not child.is_symlink() and row['type']=='historical_or_extraction_directory',str(child)
        else:assert sha(child)==row['sha256'] and child.stat().st_size==row['bytes'],str(child)
    return idx
author=root/'.docs/implementation/reviews/p05/a16-oci-wire-layout-bindings-author-round01'
ix=packet(author/'INDEX.json','663454004166df6c32fa4ef655e0edf25bea423099dac96b667a913da8f8fa0c');assert len(ix['files'])==33
prepared=read(author/'PREPARED.json');d={k:Path(v) for k,v in prepared['destinations'].items()};old={k:Path(v) for k,v in prepared['sources'].items()}
oi=packet(d['oci']/'INDEX.json','635fc10f721296e48e43b033949d81cefb6933e4bf141bfb1a7670cfa771989b')
li=packet(d['layout']/'INDEX.json','9ee31012f51f8cb42834d744ccd3f81a601020e9b6f4495fd499f1d64ca2bcde')
wi=read(d['wire']/'INDEX.json','8ba41b8417ba0c95916322f60db4d1cd5a24006548ef640583af15c1e95eea47')
for name,h in wi['producer_files'].items():assert sha(d['wire']/name)==h,name
assert wi['root_run_ack'] is False
assert {str(p.relative_to(d['oci'])):sha(p) for p in d['oci'].rglob('*.mjs')}=={str(p.relative_to(old['oci'])):sha(p) for p in old['oci'].rglob('*.mjs')}
assert len(list(d['oci'].rglob('*.mjs')))==40
for n in ['integration.mjs','positive.mjs','public-wire-observer.mjs','ordinary-observation.mjs','runner.mjs','DESCRIPTOR.json']:assert (d['wire']/n).read_bytes()==(old['wire']/n).read_bytes()
for p in old['layout'].glob('*.mjs'):
    n=p.name;text=(d['layout']/n).read_text()
    if n=='run.mjs':text=text.replace('p05-v2-layout-producer-resume13','p05-v2-layout-producer-resume12').replace('FINAL_A16_BOUND_INDEPENDENT_REVIEW_REQUIRED','FINAL_A15_BOUND_INDEPENDENT_REVIEW_REQUIRED').replace('FINAL_A16_BINDING_REQUIRED','FINAL_A15_BINDING_REQUIRED')
    if n=='runner-policy.mjs':text=text.replace('assert.equal(binding.included_files,1870)','assert.equal(binding.included_files,1869)')
    assert text==p.read_text(),n
assert len(list(d['layout'].glob('*.mjs')))==27
receipt=read('.artifacts/p05-pilot-bundle-image-binding13/receipt.json','0637dd45ad6c224ff8ab06f53ded83418227b4af34a06dd2f0b9a89ffdf431d9')
prod=read('.artifacts/p05-pilot-bundle-production-image-binding13/receipt.json','bb29900493ceed77715e62a6665eeab5eff2e1c377f6907fb95af35b5bcf1c4f')
binding=read(d['oci']/'BINDING.json');maps=read(d['oci']/'actual-image-maps.json');oldmaps=read(old['oci']/'actual-image-maps.json')
assert maps['maps']['A']['files']=={**receipt['compiled_files'],**receipt['migration_files'],**receipt['web_dist_files'],**receipt['pg_dependency_files']}
assert len(maps['maps']['A']['files'])==81 and len(maps['maps']['B']['files'])==78 and maps['maps']['B']==oldmaps['maps']['B']
assert len(binding['per_image_compiled']['A'])==64 and len(binding['per_image_additional']['A'])==5
assert all(receipt['image_files_sha256'][n]==h for n,h in {**binding['per_image_compiled']['A'],**binding['per_image_additional']['A']}.items())
assert binding['root_run_ack'] is False and prod['build_metadata']['source_revision']=='b6fea8592e0ac5a56a2f0e66f1abc6022026a5fc'
browser_path=root/'.docs/implementation/reviews/p05/browser23-a15-actual-independent-round01/INDEX.json'
assert sha(browser_path).startswith('6399aee3');browser=packet(browser_path)
assert browser['actual_records_PASS']==16 and browser['source_identity']=='658b710bdca35b678421a51c1c276028305f28362901b2c065a3867aa754f4de'
parent=read('.artifacts/p05-pilot-bundle-image-binding12/receipt.json');assert receipt['web_dist_files']==parent['web_dist_files']
assert sorted(n for n in receipt['compiled_files'] if receipt['compiled_files'][n]!=parent['compiled_files'][n])==['apps/api/dist/private-topic-ledger.js','apps/api/dist/topic-games.js']
packet('.docs/implementation/reviews/p05/a16-image-host-linux-n4-independent-round01/INDEX.json','ed5a86508474aa156702e82fe34f298a4c95d0803347c60236323d88bf58e9ed')
packet('.docs/implementation/reviews/p05/ledger-inspection-memo-product-independent-round01/INDEX.json','5cc6389f4625cd099b2df49e6b4e18098356c230696b7317b52f425a5e530f75')
packet('.docs/implementation/reviews/p05/oci19-host-context-independent-round01/INDEX.json','3d3ff370769694fee2477f3541a1a45ff928ecc99a4a279c43d8b5e2a7ce5177')
packet('.docs/implementation/reviews/p05/public-wire-adjunct-independent-round06/INDEX.json','583a969cb948be3f27ff36f1d9c29ab5d5380a73e943b5fee44b38f609c00c6e')
packet('.docs/implementation/reviews/p05/layout12-diagnostic-independent-round01/INDEX.json','7dac437a8613b667e037c94a3be29e0befb3016ba20699a97fc4b34d86e814e9')
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';source=root/'.artifacts/p05-pilot-bundle-source13';outdir=source/'.artifacts/p05'
before=sorted(p.name for p in outdir.iterdir()) if outdir.exists() else []
commands=[('oci',[node,'--max-old-space-size=192',str(d['oci']/'driver.mjs'),'--run','--ack='+str(d['oci']/'ROOT_RUN_ACK_TEMPLATE.json')],b'NOT_ACCEPTED_BEFORE_OR_DURING_PLAN'),('wire',[node,str(d['wire']/'runner.mjs'),str(d['wire']/'ROOT-ACK.template.json')],b'NOT_AUTHORIZED'),('layout',[node,str(d['layout']/'run.mjs')],b'ROOT_RUN_ACK_REQUIRED')]
for name,args,marker in commands:
    run=subprocess.run(args,cwd=source,env={**os.environ,'PYTHON':str(root/'.venv/Scripts/python.exe')},capture_output=True,timeout=30)
    (here/(name+'-pending.txt')).write_bytes(run.stdout+run.stderr);assert run.returncode==1 and marker in run.stderr,name
after=sorted(p.name for p in outdir.iterdir()) if outdir.exists() else [];assert before==after
out={'status':'PASS_LAYOUT_PRODUCER_METHOD_ONLY','source_identity':receipt['source_identity'],'image':receipt['image'],'producer_runtime_digest':'69163b36ef75c717e950bbe77c049eaf8c443ec6edabfb15d732948650a63ab6','OCI20':'40MJS_EXACT19_81A78B_PINS','wire07':'5MJS_DESCRIPTOR_EXACT06_23CHECKPOINTS','layout13':'25MJS_EXACT12_TWO_LITERAL_INVERSIONS_459CELLS','cold_controls_PASS':12,'pending_denials':3,'new_project_outputs':0,'browser_A15_actual_index_sha256':sha(browser_path),'browser_prerequisite':'COMPATIBLE_UI_FUNCTIONAL_COMPONENT_CARRY_ONLY_NOT_A16_BROWSER_ACTUAL','new_native_actions':0,'APP_ACK_writes':False}
(here/'AUDIT.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');(here/'INPUT-PINS.json').write_text(json.dumps(pins,indent=2)+'\n',encoding='utf-8');print(json.dumps(out))
