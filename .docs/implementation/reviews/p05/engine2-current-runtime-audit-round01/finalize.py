from pathlib import Path
import json,hashlib,datetime
p=Path(__file__).parent;r=json.loads((p/'audit-result.json').read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
assert r['status']=='BOUNDED_FRESH_RUNTIME_EVIDENCE_AUDIT_PASS' and r['indexed_artifacts_verified']==163 and r['actual_checks']==72
rows='\n'.join('| '+x['packet']+' | '+str(x['checks_pass'])+' | '+str(x['indexed_files'])+' | '+str(x['root_handle'])+' |' for x in r['packets'])
(p/'REPORT.md').write_text('''# Engine2 current runtime independent evidence audit

BOUNDED_FRESH_RUNTIME_EVIDENCE_AUDIT_PASS. Source ef009b7c /1811; full ZIP5a622f20 and every full before/after map independently match current included bytes. Six fresh archives163 indexed files verified byte length and SHA256,72 unique expected PASS controls. Six images archived/current inspect identities and config match. Fresh read-only Docker label queries find zero owned containers/networks/volumes for all six projects; temporary secret directories absent. No functional rerun or image filesystem rehash performed.

| Packet | Checks | Indexed files | Root same handle |
|---|---:|---:|---:|
'''+rows+'''

Games20 preserves explicit lifecycle/source/safety fixture seams;100 actual PostgreSQL/HTTP rounds with14 history chunks, three modes, exact-scope replay negatives, process-distinct boot. Its WS transport is an explicit adapter. Lifecycle16 instead exercises real external authority providers and SQL/HTTP but Rooms.connect presence; selected rows/encrypted preferences restored and named SQL rollback/clock controls are not full pg_dump restore. Neither suite's scope is promoted by the other.

Ordinary runtime8 uses actual production image CMD with no app command override or script mount. Default P1 admission requires18+ and offer acceptance; migrations1..3 and eight private tables match image. Approved pack/topic registries remain zero. V2 enabled/HOLD, invalid flag and restored SQL metadata cases terminate1; live observer spans startup through exit, counters advance by at least5 and gaps are reported. This proves sampled no connection/state change, not absolute never-listen or full database equality. Restored metadata is not real admitted V2 or full restore. Missing/mis-moded external roots remain unchanged on P1 reads.

Ordinary WS10 preserves ordinary registerRooms transport, real protected HTTP/PG, manual Cookie and synthetic source. Windows05/06/09 start before boundary; positive old-frame baselines, exact ACL/payload hashes, distinct callbacks, no unknown/forbidden post-boundary frame counts checked.05/06 have zero new callbacks;09 permits fresh pending frames with zero old refs.10 observes final PG wait and transport suppression during outage, without attributing aggregate fault counters to a particular child assertion. Retirement and session expiry close4401. This is not browser-cookie or production server CMD evidence.

Chat12 fresh report passed the full historical independent semantic validator against NEW bytes: online/inperson and flag matrix, actual20-round capless behavior, quota12/min, real34 messages/last32, explicit encrypted126→HTTP127/128→denied129, preserved budget across epochs, separate final GET/POST PG waits with rollback/receipt0. Bilateral action acceptance occurs via two HTTP posts before clocks09/10; three deadlines remain identical. Six intentionally corrupted report variants rejected. Producer pins before/after/finally match archived bytes. This suite remains component CMD/manual Cookie/synthetic content.

Compatibility6 producer pins match independent static02. Actual private projection/ref baselines positive, boot source-off abort purges them to zero while exact snapshot/history remain; authenticated engine1 header is an explicit metadata fixture. Unsupported prior GET503/POST409 and missing snapshot GET/POST503 exact codes, unchanged waiting row and receipt0 verified. Clean never-started draft abort permits new start20 planned rounds; not20 completed rounds, process restart or full restore.

Root terminal exit provenance: parent observed same exec handles terminal0; immutable receipts/terminals/raw reports independently agree. Games/lifecycle archived excluded runner hashes are bound separately; included integration/harness/engine bytes bind through the full source ZIP. No silent transfer of old895 PASS. Product semantic statistical/canary/fairness/inference, actual450 human HOLD, real restore and browser gates remain separate; full P05 PASS is false.

Reviewer audit attempts01/02 failed on its own guessed runner path and mixed naive/aware datetime parsing; raw failures preserved, corrected verifier attempts03(five packets) and04(six packets) exit0. No archived evidence edited.
''',encoding='utf-8')
index={'schema_version':1,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':[{'path':str(f.relative_to(p)).replace('\\','/'),'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())} for f in sorted(p.rglob('*')) if f.is_file() and f.name!='INDEX.json']}
(p/'INDEX.json').write_text(json.dumps(index,indent=2)+'\n',encoding='utf-8')
journal=Path('.history/agents/2026-10-19-p05-topic-compatibility-round02-review.md')
with journal.open('a',encoding='utf-8') as f:f.write('\n'+datetime.datetime.now(datetime.timezone.utc).isoformat()+' — Static compatibility02 finalized INDEX41c3995d:31 independent inert controls PASS, syntax3exit0; exact status mapping409/503 clarified. Six current actual packets verified163 indexed bytes/1811 ZIP entries/72 expected cases; fresh image inspect and label-only cleanup queries, no functional Docker. Audit own attempts01/02 FAIL retained (guessed excluded runner location, datetime timezone parsing); corrected attempt03 then added sixth packet attempt04 exit0. Current source before/after equal. No fullP05/HOLD/stat/restore/browser promotion. Final actual audit INDEX '+sha((p/'INDEX.json').read_bytes())+'.\n')
print(json.dumps({'index':sha((p/'INDEX.json').read_bytes()),'files':len(index['files']),'report':sha((p/'REPORT.md').read_bytes())}))
