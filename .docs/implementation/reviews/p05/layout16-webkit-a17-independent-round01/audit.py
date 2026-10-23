from pathlib import Path
import json,hashlib,collections
r=Path('C:/.projects/venus');out=r/'.docs/implementation/reviews/p05/layout16-webkit-a17-independent-round01'
read=lambda p:json.loads(p.read_text(encoding='utf8'));sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
author=r/'.docs/implementation/reviews/p05/layout16-webkit-a17-author-round01';ai=read(author/'INDEX.json');assert sha(author/'INDEX.json')=='e5e821453be1ce815efc645e840757597dfa7fc4551fc2bc64935dd646a763ff'
assert len(ai['files'])==37
for name,pin in ai['files'].items():assert sha(author/name)==pin['sha256'] and (author/name).stat().st_size==pin['bytes'],name
parent15=r/'.docs/implementation/reviews/p05/layout15-firefox-suffix-independent-round01/INDEX.json';parent14=r/'.docs/implementation/reviews/p05/layout14-window-independent-round01/INDEX.json'
assert sha(parent15).startswith('05e5b389') and sha(parent14).startswith('250e')
for index in [parent15,parent14]:
 entries=read(index)['files'];entries=entries.items() if isinstance(entries,dict) else ((p['path'],p) for p in entries)
 for name,pin in entries:assert sha(index.parent/name)==pin['sha256'],name
old=r/'.artifacts/p05-pilot-bundle-source13/.artifacts/p05-v2-layout-producer-resume15';new=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-v2-layout-producer-resume16'
for name,pin in read(author/'PRODUCER-PINS.json')['files'].items():
 if pin['type']=='file':assert sha(new/name)==pin['sha256'] and (new/name).stat().st_size==pin['bytes'],name
files={p.name:sha(p) for p in new.glob('*.mjs')};oldfiles={p.name:sha(p) for p in old.glob('*.mjs')};assert files.keys()==oldfiles.keys() and len(files)==27
changed=sorted(n for n in files if files[n]!=oldfiles[n]);assert changed==['run.mjs','runner-policy.mjs','x11.mjs']
assert (new/'run.mjs').read_bytes()==(old/'run.mjs').read_bytes().replace(b'p05-v2-layout-producer-resume15',b'p05-v2-layout-producer-resume16').replace(b'FINAL_A16_BOUND_INDEPENDENT_REVIEW_REQUIRED',b'FINAL_A17_BOUND_INDEPENDENT_REVIEW_REQUIRED').replace(b'FINAL_A16_BINDING_REQUIRED',b'FINAL_A17_BINDING_REQUIRED')
assert (new/'runner-policy.mjs').read_bytes()==(old/'runner-policy.mjs').read_bytes().replace(b'assert.equal(binding.included_files,1870)',b'assert.equal(binding.included_files,1871)')
a=(old/'x11.mjs').read_text();b=(new/'x11.mjs').read_text()
assert a[a.index('export async function readyOwnedWindow'):]==b[b.index('export async function readyOwnedWindow'):]
inverse=b.replace("// WebKit's measured Playwright prefix still contains the full exact own nonce.","// WebKit remains exact-title-only: its native identity/template is unresolved.")
inverse=inverse.replace("const webkitWindowPrefix='\\u{1f3ad} Playwright: ';\nfunction vendorWindowPrefix(engine){return engine==='webkit'?webkitWindowPrefix:'';}\n",'')
inverse=inverse.replace("checkWindowNonce(title);const prefix=vendorWindowPrefix(engine),suffix=vendorWindowSuffix(engine);return '^'+(prefix?'('+prefix+')?':'')+title+(suffix?'('+suffix+')?':'')+'$';","checkWindowNonce(title);const suffix=vendorWindowSuffix(engine);return '^'+title+(suffix?'('+suffix+')?':'')+'$';")
inverse=inverse.replace("checkWindowNonce(title);const prefix=vendorWindowPrefix(engine),suffix=vendorWindowSuffix(engine);return typeof value==='string'&&(value===title||value===prefix+title+suffix);","checkWindowNonce(title);const suffix=vendorWindowSuffix(engine);return typeof value==='string'&&(value===title||(suffix!==''&&value===title+suffix));")
assert inverse==a,'X11_ONLY_EXACT_PREFIX_DELTA_REQUIRED'
for n in ['expected-cells.json','real-text-fixture.json','DESIGN.md']:assert (new/n).read_bytes()==(old/n).read_bytes()
cells=read(new/'expected-cells.json');assert cells['count']==len(cells['cells'])==459
groups=collections.Counter((c['engine'],c['locale']) for c in cells['cells']);assert len(groups)==9 and set(groups.values())=={51}
assert '/proc/' not in b and "'getwindowpid'" not in b and 'windows[0]' in b and "assert.equal(windows.length,1,'EXACT_V2_WINDOW_REQUIRED')" in b
assert "assert(ownWindowTitle(title,engine,xdo(xserver.name,'getwindowname',id)),'EXACT_V2_WINDOW_REQUIRED')" in b
binding=read(new/'binding.json');ack=read(new/'ROOT_RUN_ACK.json');freezePath=r/'.artifacts/p05-pilot-bundle-source-freeze14.json';freeze=read(freezePath);receiptPath=r/'.artifacts/p05-pilot-bundle-image-binding14/receipt.json';receipt=read(receiptPath);prodPath=r/'.artifacts/p05-pilot-bundle-production-image-binding14/receipt.json';prod=read(prodPath)
assert binding['source_identity']==freeze['identity']==receipt['source_identity']==ai['source_identity']=='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d'
assert binding['included_files']==freeze['included_files']==receipt['included_files']==1871
assert binding['image']==receipt['image']==ai['image']=='sha256:f9e93cf5aa8cadbe5ee69d72e2af760c0f3c5a81772c45d41d47427740ce75c2'
assert binding['source_snapshot_sha256']==sha(freezePath) and binding['root_build_receipt_sha256']==sha(receiptPath)=='80cdcce2693859be3fbb0cf88c5e6f4826b113fa002e7e923250281ae8d47e82'
assert sha(prodPath)=='60c1386a075f581c78b0f711b3fff015941db129c012e4892fd02ceb67365ec3' and prod['build_metadata']['source_revision']==freeze['git_source_commit']=='3abad03309ebd19f04fc0b61532627a5188d855c'
for name,h in freeze['files'].items():assert sha(new.parent.parent/name)==h,name
assert ack['root_run_ack'] is False and ack['independent_producer_review']=='PENDING' and ack['independent_review_path'] is None and ack['producer_runtime_digest'] is None
probe=read(author/'webkit-probe/stdout.json');terminal=read(author/'webkit-probe/TERMINAL.json');command=read(author/'webkit-probe/COMMAND.json')
assert probe['status']=='MEASURED_OWN_SINGLE_WINDOW_NOT_LAYOUT_PASS' and probe['cleanup']=='PASS' and probe['page_title_is_own_nonce'] is True and len(probe['windows'])==1
w=probe['windows'][0];assert w['window_pid']==28 and w['owner_role']=='MiniBrowser' and w['verified_owned_descendant'] is True and w['root_PID_match'] is False and w['normalized_template']=='\\u{1f3ad} Playwright: VENUS_NONCE'
assert terminal['worker_exit']==0 and terminal['remaining_owned_containers']==[] and terminal['image']=='sha256:b3ff0e81571977b5950cb8dd97d2c9a2bfb2ec70c65da25b5fee914b67ce765f' and terminal['cleanup']=='PASS_OWNED_STOPPED_CONTAINER_REMOVED'
assert '--network' in command['argv'] and command['argv'][command['argv'].index('--network')+1]=='none'
controls=read(out/'controls01.txt');assert controls['status'].startswith('PASS') and len(controls['rows'])==6 and controls['producer_runtime_digest']==ai['producer_runtime_digest']=='4a18ef21bef61e66765e998ca04eb46efff22083e22bc62efda684e08aee82c8'
pins={}
for p in [author/'INDEX.json',parent15,parent14,freezePath,receiptPath,prodPath,new/'binding.json',new/'ROOT_RUN_ACK.json',new/'x11.mjs',new/'run.mjs',new/'runner-policy.mjs',new/'expected-cells.json',author/'webkit-probe/stdout.json',author/'webkit-probe/TERMINAL.json']:
 pins[p.relative_to(r).as_posix()]={'bytes':p.stat().st_size,'sha256':sha(p)}
result={'status':'PASS_METHOD_ONLY','source_identity':binding['source_identity'],'image':binding['image'],'producer_runtime_digest':ai['producer_runtime_digest'],'raw_MJS_unchanged':24,'MJS_total':27,'binding_literal_inverses':['run.mjs','runner-policy.mjs'],'only_behavioral_delta':'MEASURED_EXACT_WEBKIT_PREFIX_AND_FINAL_NATIVE_TITLE_EQUALITY','x11_inverse_LF_exact15':True,'ready_budget_ambiguity_query_failure_focus_native200_reset_screenshot_exact15':True,'fixed_cells':459,'shards':9,'cells_per_shard':51,'materialized_source_checked':1871,'own_cold_controls':6,'native_runs':0,'findings':[],'actual_layout16':'NOT_RUN_BY_REVIEWER','stage_PASS':False}
(out/'CHECKS.json').write_text(json.dumps(result,indent=2)+'\n');(out/'INPUT_PINS.json').write_text(json.dumps(pins,indent=2)+'\n');print(json.dumps(result))
