from pathlib import Path
import json,hashlib,datetime
p=Path(__file__).resolve().parent;sha=lambda b:hashlib.sha256(b).hexdigest();r=Path('C:/.projects/venus')
refs={'a16-image-host-linux-n4-independent-round01':'ed5a86508474aa156702e82fe34f298a4c95d0803347c60236323d88bf58e9ed','a16-n4-actual-independent-round01':'620621feeaa840866f85713639f3b7d9b83378971118ad524384134d18bb3a37','a16-questions-cohorts-actual-independent-round01':'774c7a4fe0dcec211074f34551606f4c1024648c76c0f66ea513de918bd2a298','a16-wire07-layout14-actual-independent-round01':'cbf1723ce7672e3033da1d0160e50d98e125b4139f1de925b41b666698bde19b'}
for name,h in refs.items():assert sha((r/'.docs/implementation/reviews/p05'/name/'INDEX.json').read_bytes())==h
a=json.loads((p/'AUDIT.json').read_text())
handoff={k:a[k] for k in ['status','source_identity','included_files','git_commit','test_image','production_image','test_receipt','production_receipt','compiled_all69_exact_A16','SQL7_PG2_exact','JS_content_exact','CSS_HTML_new','pending_cohorts']}
handoff.update({'writes':'COMPLETE_STOP','carry_original_indices':refs,'native_actions':0,'APP_edits':False,'ACK_edits':False,'audit_exit':0,'cold_exit':0,'browser_runtime9_exact':True,'browser_wrapper_four_literals_only':True,'whole_A17_APP_browser_layout_PASS':False,'full42_PASS':False,'stage_PASS':False})
(p/'HANDOFF.json').write_text(json.dumps(handoff,indent=2)+'\n',encoding='utf-8')
files={f.name:{'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())} for f in sorted(p.iterdir()) if f.is_file() and f.name!='INDEX.json'}
index={k:handoff[k] for k in ['status','writes','source_identity','included_files','git_commit','test_image','production_image','native_actions','whole_A17_APP_browser_layout_PASS','full42_PASS','stage_PASS']}
index.update({'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'findings':[],'files':files})
b=(json.dumps(index,indent=2)+'\n').encode();(p/'INDEX.json').write_bytes(b);print(json.dumps({'sha256':sha(b),'bytes':len(b),'children':len(files)}))
