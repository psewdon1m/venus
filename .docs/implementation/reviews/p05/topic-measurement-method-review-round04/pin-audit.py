"""Independent read-only byte audit; no Docker or producer execution."""
import hashlib,json,sys,datetime
from pathlib import Path
ROOT=Path.cwd().resolve(); OUT=Path(__file__).parent
PACKET=ROOT/'.docs/implementation/reviews/p05/topic-measurement-method-preparation-round04'
sha=lambda b:hashlib.sha256(b).hexdigest()
def load(p):return json.loads(p.read_bytes())
index=load(PACKET/'INDEX.json')
assert sha((PACKET/'INDEX.json').read_bytes())=='cbf037f5e54bb1956b437c73bb751e721d76cc325f9387c0bbef092b6578eaab'
checked=[]
for row in index['files']:
    p=PACKET/row['path'];b=p.read_bytes();assert not p.is_symlink() and len(b)==row['bytes'] and sha(b)==row['sha256'];checked.append(row)
assert len(checked)==33
handoff=load(PACKET/'HANDOFF.json'); deps=load(PACKET/'readonly-dependency-pins.json'); receipt=load(PACKET/'reference-build-receipt.json')
for row in handoff['code']:
    assert sha((PACKET/row['snapshot_path']).read_bytes())==row['sha256']
    assert sha((ROOT/row['original_path']).read_bytes())==row['sha256']
checked_maps={}
for key,value in deps.items():
    if isinstance(value,dict) and all(isinstance(v,str) and len(v)==64 for v in value.values()):
        if key=='image_source_reference':
            assert value==receipt['image_files_sha256']
            checked_maps[key+'_receipt_map_only_not_live_image_probe']=len(value)
            continue
        for name,digest in value.items():assert sha((ROOT/name).read_bytes())==digest,(key,name)
        checked_maps[key]=len(value)
for row in deps['snapshot_mapping']:
    assert sha((PACKET/row['snapshot_path']).read_bytes())==row['sha256']
    assert sha((ROOT/row['original_path']).read_bytes())==row['sha256']
checked_maps['common_snapshot_mapping']=len(deps['snapshot_mapping'])
assert len(deps['host_compiled_files_sha256'])==64
assert deps['host_compiled_files_sha256']==receipt['host_compiled_files_sha256']
sys.path.insert(0,str(ROOT/'tools'))
import stage_inventory
files=stage_inventory.inventory(ROOT);identity=stage_inventory.identity(files)
assert identity=='1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad' and len(files)==1813
result={'status':'PASS_INDEPENDENT_EXACT_BYTE_AUDIT_ONLY','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'packet_index_sha256':sha((PACKET/'INDEX.json').read_bytes()),'packet_children':checked,'new_code_original_and_snapshot_pins':len(handoff['code']),'maps_checked_against_actual_files':checked_maps,'source_identity':identity,'included_files':len(files),'reference_image':receipt['image'],'reference_receipt_sha256':sha((PACKET/'reference-build-receipt.json').read_bytes()),'Docker_calls':0,'selector_invocations':0,'statistical_samples':0,'runtime_proven':False}
(OUT/'pin-audit-result.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in result.items() if k!='packet_children'}))
