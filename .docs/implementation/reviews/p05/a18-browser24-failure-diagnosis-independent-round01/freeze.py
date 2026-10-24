import pathlib,json,hashlib,datetime
p=pathlib.Path(__file__).parent;root=pathlib.Path('C:/.projects/venus')
pins=json.loads((p/'INPUT_PINS.json').read_text())
for f,v in pins.items():
 b=(root/f).read_bytes();assert len(b)==v['bytes'] and hashlib.sha256(b).hexdigest()==v['sha256'],f
fields={'status':'ACTUAL_FAIL_RETAINED_FOCUSED_DIAGNOSIS_COMPLETE','source_identity':'a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866','source_count':1872,'image':'sha256:181f591d4ebef7446de991275cc8820369d90dbfce378da9cd82f4c282a32616','project':'venus-topic-browser-5de54fa63bc8','counts':{'PASS':13,'FAIL':1,'NOT_RUN':2},'root_exit':1,'cleanup':'PASS_SAVED_EMPTY_OWNED_INVENTORIES','confirmed_failure':'DRIVER_AUTHENTICATED_CURRENT_429_DURING_CASE14_PREPARATION_BEFORE_HOLD_SCENARIO','actual_limiter_counter_and_attribution':'UNKNOWN_NOT_EXPORTED','APP_feedback_loop_established':False,'source_proven_avoidable_helper_pressure':True,'minimal_next_action':'PASSIVE_NORMAL_UI_TUPLE_GATE_BEFORE_EXTRA_GENUINE_CURRENT_WITH_ORIGINAL_200_COHERENCE_AND_8S','quota_timeout_retry_waiver':False,'native_queries':0,'actual_acceptance':False,'owned_writes':'COMPLETE_STOP','files':{}}
for f in sorted(p.iterdir()):
 if f.name=='INDEX.json' or not f.is_file():continue
 b=f.read_bytes();fields['files'][f.name]={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
index=p/'INDEX.json';index.write_text(json.dumps(fields,indent=2)+'\n');print(hashlib.sha256(index.read_bytes()).hexdigest())
