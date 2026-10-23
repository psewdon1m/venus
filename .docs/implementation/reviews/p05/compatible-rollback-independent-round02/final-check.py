from pathlib import Path
import json,hashlib
r=Path(__file__).parent;p=Path('.artifacts/p05-compatible-rollback-producer02');old=Path('.artifacts/p05-compatible-rollback-producer01');read=lambda p:json.loads(p.read_text(encoding='utf-8'));sha=lambda b:hashlib.sha256(b).hexdigest()
binding=read(p/'BINDING.json');prior=read(old/'BINDING.json');assert {k for k in binding if binding[k]!=prior[k]}=={'previous_known_issues','previous_known_UI_bug'}
browser=(old/'browser-child.mjs').read_text(encoding='utf-8').replace('b244 timing P2 and coalesced WS notification P2;','b244 timing P2 and unbounded WS poll queue / heartbeat-starvation P2;');assert browser==(p/'browser-child.mjs').read_text(encoding='utf-8')
profile=read(p/'PROFILE.json');prior_profile=read(old/'PROFILE.json');diff={k:{'old':prior_profile.get(k),'new':profile.get(k)}for k in set(profile)|set(prior_profile) if profile.get(k)!=prior_profile.get(k)}
assert set(diff)=={'B_known_issues'};assert profile['B_known_issues']==binding['previous_known_issues']
for folder,index_pin in [(old,'684f3ea06fb1754c494edf5d3d1123e6ac3c7023e2dedde732386737473f652c'),(p,'5778b19607e31246b1fc222da34f2742b59e5e5bdc215194cba9fd18823dca3a')]:
 assert sha((folder/'INDEX.json').read_bytes())==index_pin
 for name,row in read(folder/'INDEX.json')['files'].items():assert len((folder/name).read_bytes())==row['bytes'] and sha((folder/name).read_bytes())==row['sha256']
(r/'final-check.json').write_text(json.dumps({'status':'PASS_EXACT_CORRECTION_BOUNDARIES_ONLY','binding_delta_keys':['previous_known_issues','previous_known_UI_bug'],'browser_only_report_literal_changed':True,'profile_diff':diff,'old77_new99_unchanged_after_controls':True,'functional_run':False},indent=2)+'\n',encoding='utf-8');print('PASS exact correction and immutable77/99')
