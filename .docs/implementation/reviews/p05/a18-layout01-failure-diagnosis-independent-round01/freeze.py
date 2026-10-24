from pathlib import Path
import json,hashlib
r=Path('C:/.projects/venus');o=Path(__file__).parent;sha=lambda b:hashlib.sha256(b).hexdigest()
for path,pin in json.loads((o/'INPUT_PINS.json').read_text()).items():
 b=(r/path).read_bytes();assert len(b)==pin['bytes'] and sha(b)==pin['sha256'],path
index={'status':'ACTUAL_FAIL_RETAINED_FOCUSED_DIAGNOSIS_COMPLETE','source_identity':'a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866','included_files':1872,'image':'sha256:181f591d4ebef7446de991275cc8820369d90dbfce378da9cd82f4c282a32616','project':'venus-v2-layout-5dbf0e43c54f','producer_runtime_digest':'a85898fa9aa7b90b96614ce04a6a7addd380fb7d3f334af6c1832e8dcdf0e4f6','operational_resource_profile':'LAYOUT21_BROWSER_PID512','browser_pids_limit':512,'counts':{'PASS':36,'FAIL':1,'NOT_RUN':14},'root_exit':1,'cleanup':'PASS_SAVED_EMPTY_OWNED_INVENTORIES','actual_failure':'KEYBOARD_FOCUS_OUTSIDE_PRIMARY_PRIVATE_ACTIVE_W320_MEASUREMENT','actual_failed_control':'UNKNOWN_NOT_EXPORTED','actual_failed_rect':'UNKNOWN_NOT_EXPORTED','persistent_APP_issue':'UNKNOWN','native_Tab_settlement_cause':'UNKNOWN','minimum_next_action':'ONE_SAFE_ORIGINAL_FIRST_SAMPLE_KEYBOARD_FAILURE_PROJECTION_BEFORE_UNCHANGED_ASSERT_AND_CLEANUP','RAF_APP_or_budget_change_justified':False,'native_actions':0,'actual_acceptance':False,'writes':'COMPLETE_STOP','files':{}}
for f in sorted(o.iterdir()):
 if f.is_file() and f.name!='INDEX.json':index['files'][f.name]={'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())}
assert not (o/'INDEX.json').exists();b=(json.dumps(index,indent=2)+'\n').encode();(o/'INDEX.json').write_bytes(b);print(sha(b))
