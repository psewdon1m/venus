from pathlib import Path
import hashlib,json,shutil,subprocess,datetime
root=Path.cwd(); packet=root/'.docs/implementation/reviews/p05/topic-measurement-design-round03';old=packet.parent/'topic-measurement-design-round02';base=root/'.artifacts/p05-topic-measurement-design-review-round03';out=packet.parent/'topic-measurement-design-review-round03'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
assert sha(packet/'index.json')=='456769820a24b32104f069ca82db38f3674e381d36f914a32f5595b220d9eab8'
assert sha(packet/'HANDOFF.json')=='139444875c5462404843059135917d07fe62b4ad4200dbf7ba0bbbfb15461e1c'
idx=read(packet/'index.json');inputs=[]
for f in idx['files']:
 p=packet/f['path'];assert sha(p)==f['sha256'],f['path'];assert p.stat().st_size==f['bytes'];inputs.append({'path':p.relative_to(root).as_posix(),'sha256':sha(p)})
contracts=['expected-status.json','fixture-support.json','lifecycle-scripts.json','seed-contract.json','anti-repeat.json','source-pins.json']
for n in contracts:assert (packet/n).read_bytes()==(old/n).read_bytes(),n
a=read(packet/'PROPOSED_PREREG.json');b=read(old/'PROPOSED_PREREG.json');assert a.pop('revision')=='PROPOSED_P05_TOPIC_M3';b.pop('revision');assert a==b
af=read(packet/'public-features.json');bf=read(old/'public-features.json'); changed=[k for k in sorted(set(af)|set(bf)) if af.get(k)!=bf.get(k)]
assert set(changed)=={'legacy_prefix','names','names_sha256_canonical_json','public_card_order'},changed
node=r'C:\Temp\venus-p01-toolchain\node-v24.22.0-win-x64\node.exe'
r=subprocess.run([node,str(base/'order-check.mjs')],capture_output=True,text=True,encoding='utf8');(base/'order-check.txt').write_text(r.stdout+r.stderr,encoding='utf8');assert r.returncode==0,r.stderr
guards=read(packet/'expected-status.json')['guard_table'];assert len(guards)==3920
for g in guards:
 e='RULE_EXCLUDED_STAGE' if g['stage']<3 else 'RULE_EXCLUDED_COMFORT' if g['comfort']==0 else 'RULE_EXCLUDED_CLASS' if g['class'] in ['X','J'] else 'CAPABILITY_UNAVAILABLE' if g['context']=='online' and g['capability']=='DEFAULT_OFF' else 'TOPIC_SAFE_EMPTY' if g['topic_regime']=='T1_EMPTY' else 'SUPPORTED_COMPLETE'
 assert g['private_status']==e
out.mkdir(parents=True,exist_ok=False);(out/'inputs').mkdir()
for n in ['HANDOFF.json','index.json','PROPOSED_PREREG.json','public-features.json']+contracts:shutil.copyfile(packet/n,out/'inputs'/n)
for n in ['order-check.mjs','order-check.txt','audit.py']:shutil.copyfile(base/n,out/n)
report={'schema_version':1,'status':'DESIGN_CORRECTIONS_ACCEPTED_NOT_RUN','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/p05_topics_ui_review','author':'/root/p05_topic_games_review','scope':'INDEPENDENT_DESIGN_R03_CANONICAL_ORDER_RECHECK','verified_author_packet_files':len(idx['files']),'exact_inputs':inputs,'checks':{'source_bound_order_checks':7,'guard_rows_independently_classified':3920,'unchanged_contracts':contracts,'prereg_changed_only_revision':True,'changed_feature_keys':changed,'canonical_feature_hash':af['names_sha256_canonical_json']},'closed_design_findings':['TM-DESIGN-R01','TM-DESIGN-R02','TM-DESIGN-R03','TM-DESIGN-R03-ORDER','TM-DESIGN-R04','TM-DESIGN-R05'],'findings':[],'limits':['Design correction acceptance only; no root RUN authorization.','Historical source copies and compiled FrozenPack used; no fresh current included inventory or image checked while root integrates engine2/boot.','Concrete 4930-card fixture, residual-support certificates, adapter/verifier/source parity and preregistered clean source freeze remain required.','Resource proposal 1CPU/1536MiB/32GiB is not feasibility or ETA proof; wallclock/encoding/chunk rules remain pre-RUN gates.','Original thresholds/samples unchanged; no statistical measurement or full fixture generation.','Human450 HOLD, browser failure, restore/product gates and full P05 remain separate.'],'statistics_docker_product_producer_writes':False,'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
(out/'REPORT.md').write_text('''# Measurement design round03 — independent correction review

**DESIGN_CORRECTIONS_ACCEPTED_NOT_RUN.** The remaining TM-DESIGN-R03-ORDER defect is closed prospectively. All author packet hashes and unchanged contracts were independently verified. No statistics, Docker or product/measurement-producer writes occurred.

Seven deterministic source-bound checks pass: actual isolated FrozenPack orders Q9000 before TD/YB, the old dictionary fails canonical equality, and the new dictionary exactly matches the retained historical feature-name initializer. Q9000 is histogram index384/full feature index500. All1075 names are unique and hash to2eba539a5104c8102606b8880f5d0113448a8d8fba11f1838cca16d50ad88bdd; appended features are unchanged. The new proposal retains every prior sample, seed and threshold and changes only its revision. Six remaining contracts are byte-identical to round02;3920 guard rows were independently reclassified.

This accepts design corrections only. Historical exact source/compiled pack demonstrate ordering; they do not bind the newly edited current source or image. Concrete fixture bytes, residual-support certificates, adapter/verifier parity, final clean statistical freeze, resource/retention/wallclock rules and root authorization remain prerequisites. No full4930-card fixture was generated. Human450 HOLD, runtime browser/restore/product gates and full P05 remain unaccepted.
''',encoding='utf8')
for f in inputs:assert sha(root/f['path'])==f['sha256']
files=[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.rglob('*')) if p.is_file()]
(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n',encoding='utf8')
print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
