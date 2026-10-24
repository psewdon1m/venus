from pathlib import Path
import json,hashlib
r=Path('C:/.projects/venus');o=Path(__file__).parent;sha=lambda b:hashlib.sha256(b).hexdigest()
for path,pin in json.loads((o/'INPUT_PINS.json').read_bytes()).items():
 b=(r/path).read_bytes()
 if len(b)!=pin['bytes'] or sha(b)!=pin['sha256']:raise RuntimeError('Input changed: '+path)
index={'status':'SOURCE_ONLY_HARD_IMPOSSIBILITY_NOT_PROVEN','scope':'OFFLINE_SOURCE_DESIGN_CAPACITY_RISK_NOT_ACTUAL_ACCEPTANCE','original_inference_cases':126000,'original_jobs':2609,'original_lanes':8,'hard_original_stratum_impossibility_proved':False,'original_fixed_seed_outcomes':'UNKNOWN_NOT_EXECUTED','static_capacity_risk_confirmed':True,'matched_prior_public_history_bound':'CONDITIONAL_YB_R100_MAX98_OR99_WHEN_PRIOR_PUBLIC20_OR19_NOT_ORIGINAL_INFERENCE','APP_defect_proved':False,'contract_contradiction_proved':False,'current_full8_intervention_authorized':False,'current_full8_changed_or_stopped':False,'new_tests_or_framework':False,'model_executions':0,'tests_executed':0,'native_Docker_actions':0,'APP_core_producer_ACK_registry_manifest_Git_edits':False,'actual_acceptance':False,'writes':'COMPLETE_STOP','files':{}}
for f in sorted(o.iterdir()):
 if f.is_file() and f.name!='INDEX.json':index['files'][f.name]={'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())}
if (o/'INDEX.json').exists():raise RuntimeError('Refuse replacement')
b=(json.dumps(index,indent=2)+'\n').encode();(o/'INDEX.json').write_bytes(b);print(sha(b))
