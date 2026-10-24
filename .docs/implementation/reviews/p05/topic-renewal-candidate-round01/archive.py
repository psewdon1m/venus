from pathlib import Path
import sys,json,hashlib,datetime,shutil,difflib
sys.path.insert(0,'tools')
from stage_inventory import inventory,identity
c=Path('.artifacts/p05-renewal-candidate01');base=Path('.artifacts/p05-renewal-candidate-review-round01');out=Path('.docs/implementation/reviews/p05/topic-renewal-candidate-round01');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text('utf-8'))
assert sha(c/'topic-state.ts')=='04c18ef53573590c7ffee1c5ff4fdc891d1a6e8f14c0f98cc080f14721cb1678' and sha(c/'topic-state.test.ts')=='41269b2da2821eb6b4adc59f415ba5745ef80890dd18e8f5680fafe71f4dc036'
for n,h in read(c/'HANDOFF.json')['pins'].items():assert sha(c/n)==h
source=inventory();assert identity(source)=='13b24714f3dd2d6e2ea08e911042defb4ce0161b956a9bcc74af533d3795120e' and len(source)==1813
old=Path('apps/web/src/topic-state.ts').read_text('utf-8');new=(c/'topic-state.ts').read_text('utf-8')
assert old[:old.index(' clear(){')]==new[:new.index(' private discard(){')]
assert old[old.index(' issue():'):old.index(' visible(now=')]==new[new.index(' issue():'):new.index(' // Passive lease expiry')]
assert old[old.index('export function topicRefusals'):]==new[new.index('export function topicRefusals'):]
assert "private discard(){this.target=null;this.conversation=null;this.chat=null;this.until=0;}" in new and "clear(){this.generation++;this.discard();}" in new
assert "visible(now=presentationNow()){if(this.now(now)>=this.until){if(this.until>0)this.discard();return false;}return true;}" in new
assert (c/'topic-state.test.ts').read_text('utf-8').startswith(Path('apps/web/src/topic-state.test.ts').read_text('utf-8'))
v=read(base/'vitest-results.json');assert v['numPassedTests']==v['numTotalTests']==50 and v['numFailedTests']==0
loaded=read(base/'loaded-inputs.json');assert any(x['sha256']==sha(c/'topic-state.ts') for x in loaded) and any(x['sha256']==sha(c/'topic-state.test.ts') for x in loaded)
assert len(read(base/'probes.json')['rows'])==11
tsx=read(base/'prospective-tsx.json');assert tsx['result']['renewalPrompt'] and not tsx['result']['freshOwnResponseIgnored'] and tsx['retry']['posts']==1 and tsx['retry']['callbackDestroyed']
out.mkdir(parents=True,exist_ok=False);inputs=[]
for p in [c/'HANDOFF.json',c/'topic-state.ts',c/'topic-state.test.ts',Path('apps/web/src/topic-state.ts'),Path('apps/web/src/topic-games-panel.tsx'),Path('apps/web/src/topic-test-harness.ts')]:
 dest=out/'inputs'/p;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest);inputs.append({'path':p.as_posix(),'sha256':sha(p)})
for p in base.iterdir():
 if p.is_file():shutil.copyfile(p,out/p.name)
(out/'finite.diff').write_text(''.join(difflib.unified_diff(old.splitlines(True),new.splitlines(True),fromfile='included13b',tofile='candidate01')),'utf-8')
status='SCOPED_PASSIVE_EXPIRY_RENEWAL_CANDIDATE01_PROSPECTIVE_PASS_ACTUAL_PENDING'
r={'schema_version':1,'status':status,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/p05_topics_ui_review','candidate_author':'/root','exact_inputs':inputs,'findings':[],'finding_remediation':'TG-UI-PASSIVE-EXPIRY-001 scoped prospective repair; integratedactualproof pending','checks':{'own_exact_old_new_cache_controls':11,'own_candidate_TSX_cases':['originalrenewal positive oldvaluesdiscarded freshwithin5sresponsepublishes','oldretainedretryhandler nosecondPOST callbackdestroyed'], 'independent_unique_cache_Vitest':50,'finite_change':'Private discard extracted from clear; clear still gen++ then discard; visible passiveexpiry uses discard. All accept/phase/scope/permission validators exact13b. Tests prior47 retained plus3 appended.','source13b_1813_unchanged':True},'limits':['Exact synthetic cache and deterministic hook/API TSX with a single SHA-hardchecked candidate read substitution, not actualbrowserRUN. StandardVitestpanelharness reads includedsource and is not falsely claimed candidate-substituted; own separate loader provides that coverage.','No product/candidatewrites or functionalDockerRUN. No budget/TTL/method10/schema/API/serverchange; integratedfreeze/image/actualunchangedmethod10/independentaudit still required.','HistoricalFAIL/human450/fullP05/production remain separate.'],'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(r,indent=2)+'\n','utf-8');(out/'REPORT.md').write_text('''# Passive expiry renewal candidate01: independent review

**SCOPED_PASSIVE_EXPIRY_RENEWAL_CANDIDATE01_PROSPECTIVE_PASS_ACTUAL_PENDING.** No findings on source04c18ef/tests41269b2d; included13b/1813 remains unchanged. Eleven own old/new cache controls pass. Two exact included-harness/panel cases with only SHA-pinned candidate cache read substitution pass: the original delayed fresh renewal now publishes while expired old values are immediately hidden; a retained expired private retry handler cannot resend and its private callback is destroyed. Independent unique-cache Vitest50PASS; load hashes verified.

Finite change extracts private discard from clear. Explicit clear still increments generation and drops values; only visible's passive expiration uses discard without cancelling an independently issued read. All acceptance, phase floors, scope binding, epoch/revision,5s own permission and protocol validators remain exact13b. Prior47 tests stay intact with3 appended controls.

Own negatives retain explicit clear/revoke/null/transport/round/identity fences, expired-new-own5s rejection, expired same-phase nonextension and old epoch rejection after discard. Private values do not stay visible past old expiry, and the successful new read uses its own original request-start5s bound. No method10/timer/TTL/schema/server change occurs.

The standard Vitest TSX harness reads included files through node:fs; it is not silently counted as candidate-substituted. Separate own exact read loader supplies the two candidate TSX cases. No product/candidate writes or functional Docker/browser RUN occurred. Integration/newsource/image/actual unchanged method10 and independent audit remain necessary to close the product finding. Historical FAIL/fullP05/human450 remain separate.
''','utf-8')
entries=[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}for p in sorted(out.rglob('*'))if p.is_file()];(out/'index.json').write_text(json.dumps({'schema_version':1,'status':status,'files':entries},indent=2)+'\n','utf-8');print(json.dumps({'status':status,'index_sha256':sha(out/'index.json'),'files':len(entries)}))
