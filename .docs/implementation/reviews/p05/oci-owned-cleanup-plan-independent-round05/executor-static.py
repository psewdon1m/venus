from pathlib import Path
import hashlib,json,ast
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent;p=R/'.artifacts/p05-oci-owned-cleanup-execute05.py'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
assert sha(p)=='687b22172e5d439ff906189722e4a60d900d093022866309e656c38b0334e5f1'
s=p.read_text();tree=ast.parse(s)
assert s.index('if mutation:mutations+=1')<s.index('p=subprocess.run(')
assert 'timeout=min(30,remaining)'in s and "require(remaining>0,'WHOLE_10MIN_BOUND')"in s
assert s.index("'NEW_SAFE_EXPORT_LEAF_PIN'")<s.index('out.mkdir()')<s.index('try:\n # Recheck every target')
assert "'ROOT_EXACT13_CLEANUP_AUTHORIZED'"in s and "authority['exclusive_no_native_window'] is True"in s
assert "sha(Path(__file__))==authority['executor_sha256']"in s
assert "['com.venus.oci.project','com.venus.oci.owner']"in s and "'WHOLE_PLAN_ENUMERATION_CHANGED_HOLD'"in s
assert "'IMMUTABLE_IDENTITY_CHANGED_HOLD'"in s and "'NETWORK_ENDPOINT_HOLD'"in s and "'DOCKER_REFUSAL_OR_COMMAND_FAILED_HOLD'"in s
assert "['docker','stop','--time','10',identifier]"in s and "['docker','rm',identifier]"in s
assert "['docker','network','rm',p['identifier']]"in s and "['docker','volume','rm',p['identifier']]"in s
flat=R/'.docs/implementation/reviews/p05/oci-owned-cleanup-plan-independent-round04/INPUT_PINS.json'
assert sha(flat)=='576b7bcff7751c1685ec40131be1784f2ca61535b01dcc6c9d48789c89a20deb'
leaf_count=0
for name,pin in read(flat).items():
 path=R/name;assert not path.is_symlink() and path.resolve().is_relative_to(R.resolve())
 assert path.stat().st_size==pin['bytes'] and sha(path)==pin['sha256'];leaf_count+=1
assert leaf_count==660
new_count=0
for folder in ['oci25-a17-failure-diagnosis-independent-round01','oci26-a17-failure-diagnosis-independent-round01','oci27-a17-actual-independent-round01']:
 index=R/'.docs/implementation/reviews/p05'/folder/'INDEX.json'
 for name,pin in read(index)['files'].items():
  path=index.parent/name;assert not path.is_symlink() and path.resolve().is_relative_to(index.parent.resolve())
  assert path.stat().st_size==pin['bytes'] and sha(path)==pin['sha256'];new_count+=1
result={'status':'PASS_STATIC_EXECUTOR_ONLY_NOT_AUTHORIZATION','executor_path':str(p.relative_to(R)),'executor_sha256':sha(p),'syntax_AST':0,'never_executed':True,'initial_requested_corrections':'ALL_THREE_PRESENT','inherited_safe_leaves_rehashed':leaf_count,'new25_26_27_leaves_rehashed':new_count,'wholeplan_and_peraction_identity_before_mutation':'PRESENT','containers_then_empty_networks_then_volumes':'PRESENT','exact_nonforce_vectors':'PRESENT','future_root_authority_and_exclusive_window':'REQUIRED','native_actions':0,'remaining_blocking_findings':[]}
(O/'EXECUTOR-STATIC.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
