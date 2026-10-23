from pathlib import Path
import json,hashlib,subprocess,shutil,datetime
root=Path('C:/.projects/venus');work=root/'.artifacts/p05-layout12-author01'
producer=root/'.artifacts/p05-pilot-bundle-source12/.artifacts/p05-v2-layout-producer-resume12'
parent=producer.with_name('p05-v2-layout-producer-resume11')
packet=root/'.docs/implementation/reviews/p05/layout12-diagnostic-author-round01'
assert not packet.exists();packet.mkdir(parents=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
def save(path,value):path.write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
expression="import {captureProducer,runtimeDigest} from './.artifacts/p05-pilot-bundle-source12/.artifacts/p05-v2-layout-producer-resume12/runner-policy.mjs';const p='C:/.projects/venus/.artifacts/p05-pilot-bundle-source12/.artifacts/p05-v2-layout-producer-resume12';const files=captureProducer(p);console.log(JSON.stringify({producer_runtime_digest:runtimeDigest(files),files}));"
pins=json.loads(subprocess.check_output([node,'--input-type=module','-e',expression],cwd=root))
pins.update({'status':'AUTHOR_DIAGNOSTIC12_PENDING_NONAUTHOR_REVIEW_NOT_RUN','source_identity':'658b710bdca35b678421a51c1c276028305f28362901b2c065a3867aa754f4de','image':'sha256:021a57ecd11d8e5df300a5030c78312f66c5595ebb5d97f156ab71cf7de3b689','root_run_ack':False})
pins['files'].pop('INDEX.json',None)
save(producer/'INDEX.json',pins)
save(packet/'PRODUCER-PINS.json',pins)
changes=[]
for name in sorted(f.name for f in parent.glob('*.mjs')):
 a=(parent/name).read_bytes();b=(producer/name).read_bytes();changes.append({'name':name,'parent_sha256':sha(a),'child_sha256':sha(b),'same':a==b})
save(packet/'SOURCE-INVERSE.json',{'mjs_files':27,'changed':['probe-policy.mjs','run.mjs'],'unchanged_mjs':25,'all_policy_before_safeFailure_exact_after_removing_two_imports':True,'all_fixtures_design_binding_exact':True,'files':changes})
save(packet/'ATTEMPT01.json',{'status':'AUTHOR_CHECKER_FAIL_RETAINED','command':'.venv/Scripts/python.exe .artifacts/p05-layout12-author01/checks.py','exit_code':1,'tool_observed_error':'TypeError: string indices must be integers, not str','site':'freeze file hashes are string values; checker incorrectly indexed sha256/bytes','correction':'Read each exact freeze hash string directly; no runtime change','result':'checks02 exit0'})
for name in ['controls.mjs','checks.py','checks-attempt01.py','STATIC-CODE-SOURCES.json','CHECKS.json','controls02.stdout.txt','controls02.stderr.txt','lint02.stdout.txt','lint02.stderr.txt','pending-ack.stdout.txt','pending-ack.stderr.txt','checks02.stdout.txt','checks02.stderr.txt']:
 shutil.copyfile(work/name,packet/name)
for name in ['probe-policy.mjs','run.mjs','binding.json','ROOT_RUN_ACK.json']:
 shutil.copyfile(producer/name,packet/name)
for name in ['p05-layout12-prepare01.py','p05-layout12-collect.mjs','p05-layout12-safe-failure.txt','p05-layout12-freeze01.py']:
 shutil.copyfile(root/'.artifacts'/name,packet/name)
handoff={'status':'AUTHOR_COMPLETE_PENDING_NONAUTHOR_REVIEW_NO_NATIVE','writes':'COMPLETE','working_producer':str(producer),'producer_runtime_digest':pins['producer_runtime_digest'],'source_identity':pins['source_identity'],'included_files':1869,'image':pins['image'],'source_freeze_sha256':'983cbbf7795102ba5b40a4f2e7007feb519dd58e6679750280ae6f39883741a0','image_receipt_sha256':'53b227006b685cc87bf47fe9b34ccafd05eabe9968d4976afc7707aba334bfff','input_diagnosis':{'path':'.docs/implementation/reviews/p05/layout11-a15-firstcell-diagnosis-independent-round01/INDEX.json','sha256':'1a82fa26701389d96934443f26869e61e7c5b50507b872ff913071e556e972ed'},'finite_controls':16,'syntax_modules':27,'lint_exit':0,'pending_ack_exit':1,'actual_run':False,'root_ack':False,'cause_of_prior_native_failure':'UNKNOWN','scope':'SAFE_DIAGNOSTIC_PROJECTION_ONLY_NOT_LAYOUT_REMEDY_OR_STAGE_ACCEPTANCE'}
save(packet/'HANDOFF.json',handoff)
(packet/'REPORT.md').write_text('''# Layout12: diagnostic-only author handoff

AUTHOR COMPLETE, pending independent review. No native run or active ROOT ACK.

Layout11 A15 first Chromium/RU cell failed with generic AssertionError: 0 PASS, 1 FAIL, 50 NOT_RUN; cleanup PASS. Its exact assertion site remains unknown. Role observations happen after keyboard and screenshot work, so this report does not infer contrast, CSS or X11 as the cause. The immutable independent diagnosis is bound in HANDOFF.json.

Only probe-policy.safeFailure and its two standard-library imports change. Node24 assert.equal adds multiline comparison details after the literal label; first-line then colon-prefix extraction now accepts only 74 explicitly listed static codes. The incomplete dynamic prefix OBSERVER_ was deliberately excluded from the author-once source collector output. Unknown labels use ASSERTION_OR_OPERATION_FAILED. Error kind uses native class labels, never arbitrary error.name. Neither raw message nor actual/expected values are returned.

Optional location contains only an exact same-directory module label from 15 literal modules plus bounded numeric line and column. It skips the complete validated native error header, including all comparison-message lines, before considering at most 16 frames. The full paths, function names and raw stack are never returned. Unknown paths, invalid/oversize numbers and oversized text are omitted. Native lazy stack formatting is allowed only with the pinned Node24 default formatter and native stack getter, data-only bounded name/message, and no Proxy in a bounded prototype chain. Custom accessors/formatters and proxy traps are not invoked. Missing safe location leaves the original failure unchanged.

The remaining 25 MJS files are exact layout11 bytes. run.mjs changes only the resume11 to resume12 directory literal. All prior policy functions, binding, expected cells, real-text fixture and DESIGN are exact. Thus all 459 cells, nine 51-cell shards, three engines, RU/EN/TR, keyboard/contrast/native 200%/reduced-motion oracles, quotas, clocks and 20s/60s limits remain unchanged. Historical copied extraction/proof files retain historical scope; the new producer INDEX and this packet describe the current diagnostic revision.

Sixteen cold controls PASS on Node v24.22.0, including reproducing parent multiline label loss, named and unnamed assertion handling, exact-own-module frame projection, comparison-text fake frames, static-label allowlist, hostile getters/proxies, custom formatters, private canaries and bounds. All 27 MJS syntax checks and explicit-root-config ESLint exit 0. Pending ROOT ACK correctly exits 1 with ROOT_RUN_ACK_REQUIRED before output allocation. Source12's 1869 included files and image receipt hashes remain exact. One author checker initially misread the freeze hash map and raised TypeError; its code and observed failure are preserved, then the corrected checker exited 0. No runtime correction was needed for that checker error.

The new ROOT_RUN_ACK.json is false/PENDING with no copied active layout11 review or authority. A nonauthor must review this new runtime digest, then root may issue a fresh exact ACK. A future source/image revision requires a literal rebind. Native first-cell diagnosis, successful layout, full 459-cell coverage and stage acceptance remain unproved by this packet.
''',encoding='utf-8')
index={'status':'AUTHOR_DIAGNOSTIC_COMPLETE_PENDING_NONAUTHOR_REVIEW','writes':'COMPLETE','source_identity':pins['source_identity'],'image':pins['image'],'producer_runtime_digest':pins['producer_runtime_digest'],'files':{str(p.relative_to(packet)).replace('\\','/'):{'bytes':len(p.read_bytes()),'sha256':sha(p.read_bytes())} for p in sorted(packet.rglob('*')) if p.is_file()}}
save(packet/'INDEX.json',index)
print(json.dumps({'index':str(packet/'INDEX.json'),'sha256':sha((packet/'INDEX.json').read_bytes()),'children':len(index['files']),'producer_runtime_digest':pins['producer_runtime_digest']}))
