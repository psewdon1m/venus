from pathlib import Path
import json,hashlib
o=Path(__file__).parent;r=Path('C:/.projects/venus');sha=lambda b:hashlib.sha256(b).hexdigest()
for path,pin in json.loads((o/'INPUT_PINS.json').read_text()).items():
 b=(r/path).read_bytes();assert len(b)==pin['bytes'] and sha(b)==pin['sha256'],path
index={'status':'ACTUAL_FAIL_RETAINED_FOCUSED_DIAGNOSIS_COMPLETE','source_identity':'a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866','included_files':1872,'image':'sha256:181f591d4ebef7446de991275cc8820369d90dbfce378da9cd82f4c282a32616','runtime_digest':'f1be316048622bdd55c4a5e3a4e0ce381303dc902ea6678c4154f67ab5a7e658','method_review_sha256':'ea2bace0b98a3908cdd383d730eabde358b2aefad2e6263054bab10a88b91dfd','counts':{'PASS':11,'FAIL':1,'NOT_RUN':4},'root_exit':1,'cleanup':'PASS_SAVED_EMPTY_OWNED_INVENTORIES','confirmed_failure':'AUTHENTICATED_CURRENT_429_IN_TB12_PREPARATION_BEFORE_WALL_ROLLBACK','actual_rate_counter_and_precise_attribution':'UNKNOWN_NOT_EXPORTED','source_proven_duplicate_context_GET_pressure':True,'APP_feedback_loop_established':False,'memo_alone_proved_sufficient':False,'prospective_recommendation':'FRESH_POST_INVOCATION_AUTHENTICATED_NORMAL_PAGE_FULL_CURRENT_DTO_ORIGINAL_COHERENTROUND_AND_8S','recommendation_is_implemented_or_accepted_method':False,'quota_deadline_retry_waiver':False,'native_actions':0,'actual_acceptance':False,'writes':'COMPLETE_STOP','files':{}}
for f in sorted(o.iterdir()):
 if f.is_file() and f.name!='INDEX.json':index['files'][f.name]={'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())}
assert not (o/'INDEX.json').exists();b=(json.dumps(index,indent=2)+'\n').encode();(o/'INDEX.json').write_bytes(b);print(sha(b))
