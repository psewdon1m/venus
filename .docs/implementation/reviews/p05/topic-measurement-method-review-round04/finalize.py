"""Freeze only this review's derived report packet; no source/manifest edits."""
import json,hashlib,re,datetime
from pathlib import Path
OUT=Path(__file__).parent;ROOT=Path.cwd().resolve();sha=lambda b:hashlib.sha256(b).hexdigest()
audit=json.loads((OUT/'pin-audit-result.json').read_bytes());helper=json.loads((OUT/'helper-probes-result.json').read_bytes());replay=json.loads((OUT/'watchdog-inert-replay-result.json').read_bytes())
assert audit['source_identity']=='1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad'
assert len(helper['all_commands'])==39 and (OUT/'helper-probes-result.json').stat().st_size==139779
assert helper['actual_helpers']==6 and helper['cleanup']=='PASS_EXACT_OWNED_RESOURCES_ONLY'
assert not helper['remaining_owned_containers'] and not helper['remaining_owned_volumes']
assert replay['inert_statfs_calls_after_stop']==0 and replay['actual_Docker_calls']==0
assert not (ROOT/'.artifacts/p05/author-v3-filesystem-voaxd55_').exists()
report={'schema_version':1,'status':'CHANGES_REQUESTED_PREPARATION_ONLY','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'independent /root/p04_gate_preflight','scope':'P05 method04 producer preexecution review; helper-only actual controls, not R100/runtime/statistical acceptance','source_identity':audit['source_identity'],'included_files':1813,'packet_index_sha256':audit['packet_index_sha256'],'reference_image':audit['reference_image'],'reference_build_receipt_sha256':audit['reference_receipt_sha256'],'findings':[{'id':'P05-METHOD04-001','priority':'P2','title':'Post-stop export/archive loses actual host free-space guard','files':[{'snapshot':'r100-v3-watchdog.mjs','sha256':'c96f120c7569b2eb6da08172b48c0ea4a27638ef11c2d0ffa9521510d5a5a87e','lines':[59,70]},{'snapshot':'r100-v3-package.py','sha256':'a5978137635be92b4c789f4f1c5725397002c932054b7328511a4ed8925f6317','lines':[53,60,80,81]}],'reproducer':'watchdog-inert-replay.mjs/result.json: timeout then simulated free=0; EXPORT/ARCHIVE/CLEANUP/DONE accepted by post-stop monitor with0 further statfs calls and stale12GiB guard','observed_result':'STOPPED_NOT_ACCEPTED remains honest; continued host writes lack promised reserve supervision','required_fix':'Continue independent actual host-space guard through all failure phases; check fresh owner/counter and prospective allocation/free reserve before host staging/extraction/archive writes; low/unknown/stale retains owned prefix without further allocation and cannot claim execution PASS','actual_disk_full_test':False}],'prior_disposition':{'P05-METHOD03-001':'CLOSED_BOUNDED_HELPER_PREPARATION_SCOPE','P05-METHOD03-002':'PARTIAL_BLOCKED_BY_METHOD04_001','P05-METHOD03-003':'PARTIAL_BLOCKED_BY_METHOD04_001'},'actual_controls':{'inert_exact_watchdog_replay':'REPRODUCED','Windows_author_filesystem_independent_repeat':12,'Docker_CLI_commands':39,'actual_helper_containers':6,'raw_helper_log_bytes':139779,'native_available_bytes_observed':'972999106560','remaining_owned_containers':0,'remaining_owned_volumes':0,'full_image73_map':'FROZEN_REFERENCE_RECEIPT_ONLY_NOT_FRESH_PROBE'},'NOT_RUN':['prepare','run','selector','R100v3 attempt','actual blocked-worker orchestration','actual low-C-space export','statistical consumers','actual runtime matrix'],'statistical_counts_seeds_thresholds':'UNCHANGED_NOT_REDUCED','human450':'HOLD_UNCHANGED','full_P05_PASS':False,'report_sha256':sha((OUT/'REPORT.md').read_bytes())}
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
for name in ['REPORT.md']:
    text=(OUT/name).read_text(encoding='utf8')
    for target in re.findall(r'\]\(([^)]+)\)',text):
        assert not target.startswith(('.artifacts','http:','https:'))
        assert (OUT/target).is_file(),target
files=[]
for p in sorted(OUT.rglob('*')):
    if p.is_file() and p.name!='INDEX.json':
        assert not p.is_symlink();b=p.read_bytes();files.append({'path':p.relative_to(OUT).as_posix(),'bytes':len(b),'sha256':sha(b)})
(OUT/'INDEX.json').write_text(json.dumps({'scope':'Immutable independent method04 preparation review only','files':files},indent=2)+'\n',encoding='utf8')
for row in files:assert sha((OUT/row['path']).read_bytes())==row['sha256']
print(json.dumps({'report_sha256':report['report_sha256'],'index_sha256':sha((OUT/'INDEX.json').read_bytes()),'children':len(files),'status':report['status']}))
