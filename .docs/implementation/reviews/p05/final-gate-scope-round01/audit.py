"""Read-only final scope qualification; not a product test or stage gate runner."""
from pathlib import Path
import sys,json,hashlib,subprocess,datetime
ROOT=Path(__file__).resolve().parents[5]
sys.path.insert(0,str(ROOT/'tools'))
from stage_inventory import inventory,identity
OUT=Path(__file__).parent
def read(p): return json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
current=inventory(ROOT); old=read('.artifacts/p05-renewal-freeze-context01.json')['files']
delta=[{'path':p,'before':old.get(p),'after':current.get(p)} for p in sorted(set(current)|set(old)) if current.get(p)!=old.get(p)]
older=read('.artifacts/p05-grant-phase-freeze-context01.json')['files']
compat_delta=[{'path':p,'before':older.get(p),'after':old.get(p)} for p in sorted(set(older)|set(old)) if older.get(p)!=old.get(p)]
inputs=read('.artifacts/p05-final-audit-inputs01.json')
refs=[]
for item in inputs.get('evidence',inputs.get('evidence_indexes',[])):
    pass
# Preserve all canonical proof references while avoiding copying the 1816-file input map twice.
for key,value in inputs.items():
    if key!='files': refs.append({'key':key,'value':value})
selected=['engine2-current-runtime-audit-round01','topic-grant-phase-regression-audit-round01','topic-renewal-regression-audit-round01','requirements-coverage-round01','requirements-evidence-supplement-round01','topic-restore-mapindex-actual-round02','topic-measurement-method10-actual-independent-round01','topic-method17-actual-diagnosis-round01','oci04-actual-diagnosis-round01','topic-layout-independent-review-resume-round02','topic-statistics-runtime-wip-resume04-stop01','topic-archive-encoding-independent-review-round01']
indexes=[]
for name in selected:
    folder=ROOT/'.docs/implementation/reviews/p05'/name
    found=[p for p in folder.glob('*') if p.name.lower()=='index.json']
    if len(found)!=1: raise RuntimeError(f'index count {name}')
    path=found[0]; data=json.loads(path.read_text(encoding='utf-8-sig')); children=data.get('files',[])
    # These review packets are the reusable independent acceptance boundary, not a new execution of their tests.
    checked=0
    for entry in children:
        p=folder/entry['path']; actual=sha(p)
        if actual!=entry['sha256'] or ('bytes' in entry and p.stat().st_size!=entry['bytes']): raise RuntimeError(f'changed review proof {p}')
        checked+=1
    indexes.append({'path':str(path.relative_to(ROOT)).replace('\\','/'),'sha256':sha(path),'verified_children':checked})
compiled=[]
receipt=read('.artifacts/p05-recovery-image-a-receipt01.json')
for rel,expected in receipt['host_compiled_files_sha256'].items():
    p=ROOT/rel; frozen=ROOT/'.artifacts/p05-recovery-source1274-01'/rel
    compiled.append({'path':rel,'sha256':sha(p),'historical_equal':frozen.is_file() and sha(p)==sha(frozen)==expected})
result={'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'READONLY_SCOPE_AUDIT_NOT_STAGE_PASS','source_identity':identity(current),'included_files':len(current),'root_input_matches':current==inputs['files'],'source_delta_from_1274':delta,'source_delta_13b_to_1274':compat_delta,'runtime_included_paths_unchanged':all(not d['path'].startswith(('apps/','packages/','tests/')) for d in delta),'compiled_count':len(compiled),'compiled_all_historical_equal':all(r['historical_equal'] for r in compiled),'compiled':compiled,'git_head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'git_dirty':bool(subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True).strip()),'independent_review_indexes':indexes,'root_input_sha256':sha(ROOT/'.artifacts/p05-final-audit-inputs01.json'),'canonical_inputs':refs}
(OUT/'qualification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:result[k] for k in ['source_identity','included_files','root_input_matches','source_delta_from_1274','runtime_included_paths_unchanged','compiled_count','compiled_all_historical_equal','git_head','git_dirty','independent_review_indexes']},ensure_ascii=False,indent=2))
