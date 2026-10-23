from pathlib import Path
import hashlib,json,shutil,datetime,sys
root=Path.cwd();base=root/'.artifacts/p05-topic-restore-producer-review-round01';p=root/'.artifacts/p05-topic-restore';out=root/'.docs/implementation/reviews/p05/topic-restore-producer-round01'
def sha(x):return hashlib.sha256(x.read_bytes()).hexdigest()
def read(x):return json.loads(x.read_text(encoding='utf8'))
assert sha(p/'HANDOFF.json')=='b069b21f7047f5ae06a8dcba5552f59d337dec44faeb40799d36b10c0c0889a1';snap=p/'producer-checkpoint04';assert sha(snap/'index.json')=='43ecb30bd64e815af2e2b5b61d15c3b2a7cb527176d340cc48c083b3b63034b2'
h=read(p/'HANDOFF.json');inputs=[]
for n,v in h['pins'].items():assert sha(p/n)==v,n;inputs.append({'path':(p/n).relative_to(root).as_posix(),'sha256':v})
idx=read(snap/'index.json')
for r in idx['files']:assert sha(snap/r['path'])==r['sha256']
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
source=inventory();assert identity(source)==h['source_identity'];assert len(source)==1811
assert read(base/'counterexamples.json')['rows'].__len__()==5
reruns=read(base/'rerun-results.json');assert all(r['exit']==0 for r in reruns)
counts={n:len(read(base/n)['rows']) for n in ['author-controls-results.json','runner-controls-results.json','replay-controls-results.json']};assert sorted(counts.values())==[20,34,39]
out.mkdir(parents=True,exist_ok=False);(out/'source').mkdir();(out/'probes').mkdir()
runtime=['factory.mjs','observations.mjs','replay-observations.mjs','phases.mjs','child.mjs','controller.mjs','run.mjs']
for n in runtime+['HANDOFF.json','BINDING.json','DESIGN.md','DESIGN-round02.md','DESIGN-round03.md','DESIGN-round04.md']:shutil.copyfile(p/n,out/'source'/n)
shutil.copyfile(snap/'index.json',out/'source'/'author-index.json')
for f in base.iterdir():
 if f.is_file():shutil.copyfile(f,out/'probes'/f.name)
findings=[{'id':'RESTORE-PRODUCER-R01-SEQUENCE_STATE','severity':'P2','source':'observations.mjs rawDatabase/assertRestored','problem':'Sequence projection contains only schema/name/last_value while claiming all_sequences_equal; definition and is_called divergences are invisible.','counterexamples':['increment_by','cache_size','cycle','is_called'],'required_fix':'Snapshot full sequence definition plus actual relation last_value/is_called under quiescence; compare exact before/after and preserve explicit metadata scope. Retain old4 false-accepts, new negative controls reject and positive exact roundtrip passes.'},{'id':'RESTORE-PRODUCER-R02-FILESET','severity':'P2','source':'run.mjs producerEntries/producerNames/producerPins','problem':'Final producerPins iterates the initial filename list, so newly added top-level file leaves maps equal. Initial-only symlink check also does not bind final entry types.','required_fix':'Re-enumerate and validate exact declared top-level regular-file inventory at before/after-runtime/finally, rejecting additions/removals/type or symlink changes, then compare names and hashes. Do not recurse into historical excluded artifact/control directories.'}]
report={'schema_version':1,'status':'CHANGES_REQUESTED','scope':'INDEPENDENT_CONCRETE_RESTORE04_PRODUCER_STATIC_ONLY','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/p05_topics_ui_review','author':'/root/p05_topics_ui','exact_inputs':inputs,'source_identity':identity(source),'included_files':len(source),'snapshot_files_verified':len(idx['files']),'findings':findings,'checks':{'own_confirmed_false_accept_counterexamples':5,'copied_author_controls_rerun':counts,'seven_runtime_modules_reviewed':runtime},'reviewed_positive_contracts':['Exactly seven finite harness substitutions retain real auth/lifecycle/routes/source composition and existing external roots/keyring.','Three distinct child PIDs and nonrewind fixed clocks; live D all scopes/presence/projections positive before boot; raw revokedD observer precedes legacy/maintain/listen.','Actual wholeDB custom pg_dump/pg_restore after child/pool shutdown and independent pg_stat_activity quiescence.','Exactreceipt200 canonical fullreceipt comparison; private/newID typed404/409/no newreceipt, all-table equality with narrow admission counter and decrypted stopped-round floor exception.','Root tree bytes/inode/hash comparisons survive actualDBrollback; missingauthority cannot selfrepair.','Runner14uniqueIDs/3successfulchildren/cleanup/fullincludedmaps gate remains failclosed in copied20inert scenarios.'],'failed_attempts':['Own inline Python copy command quoting exit1 no output/no writes; corrected saved rerun.py, all three copied scripts exit0; note retained.'],'no_docker_functional_run_or_product_producer_writes':True,'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
(out/'REPORT.md').write_text('''# Restore04 concrete producer — independent round01

**CHANGES_REQUESTED: two P2 producer gaps.** All exact author/source pins and snapshot hashes were checked. No Docker, PostgreSQL restore, product or producer writes occurred. Prior design acceptance remains design-only.

## RESTORE-PRODUCER-R01-SEQUENCE_STATE

rawDatabase records only sequence schema/name/last_value. assertRestored then reports all_sequences_equal. Four exact inert counterexamples change increment, cache, cycle or is_called while the observer still accepts equality. Record full sequence definition and direct relation last_value/is_called, then compare exact state. Preserve the old failures and prove new negatives reject. Raw whole-table equality remains absolute.

## RESTORE-PRODUCER-R02-FILESET

producerPins closes over the initial producerNames array. An added top-level helper is absent from final maps, which still compare equal. Re-enumerate the declared top-level regular-file set and entry types at every capture, rejecting additions/removals/symlink changes before comparing names/hashes. Historical nested artifact/control directories need no arbitrary recursive binding.

The remaining mechanisms were source-reviewed: seven finite harness seams, real pg_dump/restore/quiescence, three fresh processes, unchanged external roots, live future D and pre-listen raw boot revocation, fourteen fixed IDs, exact receipt compatibility and narrow accounting/revocation effects. Copied39 observer,20 runner and34 receipt controls all pass but do not cover the two findings. Own five counterexamples demonstrate test gaps, not product revivals or an actual restore failure.

Corrected immutable producer bytes, independent repeat and root binding/RUN authorization remain required. No full P05 or human450 acceptance follows.
''',encoding='utf8')
for r in inputs:assert sha(root/r['path'])==r['sha256']
assert inventory()==source
files=[{'path':q.relative_to(out).as_posix(),'bytes':q.stat().st_size,'sha256':sha(q)} for q in sorted(out.rglob('*')) if q.is_file()]
(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n')
print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
