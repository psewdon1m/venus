from pathlib import Path
import hashlib,json,datetime
p=Path(__file__).parent
sha=lambda b:hashlib.sha256(b).hexdigest()
j=lambda f:json.loads(f.read_text(encoding='utf-8'))
pins=j(p/'source-pins.json')
for r in pins:
 assert sha(Path(r['path']).read_bytes())==sha((p/r['snapshot']).read_bytes())==r['sha256']
runner=j(p/'runner-probe-result.json');producer=j(p/'producer-probe-result.json')
assert runner['status']==producer['status']=='PASS' and runner['checks']==14 and producer['checks']==17
source=Path('.docs/implementation/reviews/p05/topic-engine2-integrated-round01/frozen-tree/apps/api/src/topic-games.ts').read_text(encoding='utf-8')
assert "if(error instanceof EngineError)throw new DomainError(error.code,/INVALID|VERSION|HISTORY|SNAPSHOT|PACK|UNVERIFIED/.test(error.code)?503:409)" in source
assert "e instanceof DomainError?e.statusCode:409" in source
assert sha(source.encode())=='0f3f0f28f44a960f88c752a50f338781dfd7099ac73bb83316922fddc275959a'
(p/'topic-games.ts.bytes').write_text(source,encoding='utf-8',newline='')
result={'schema_version':1,'status':'STATIC_PRODUCER_PREFLIGHT_PASS','reviewer':'/root/p05_topic_games_review','producer_author':'/root','source_identity':'ef009b7c3cf262028bc9dc20c6f06798d125d864ac19bb530e9b038a3701c571','producer_pins':pins,'independent_runner_controls':14,'independent_AST_controls':17,'syntax_exit_codes':[0,0,0],'closed':['COMPAT-PR-001','COMPAT-PR-002','COMPAT-PR-003'],'status_contract':{'unsupported_availability':503,'unsupported_start':409,'missing_prior_availability':503,'missing_prior_start':503},'actual_run':False,'full_p05_pass':False}
(p/'report.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
(p/'REPORT.md').write_text('''# Compatibility6 producer independent static round02

STATIC_PRODUCER_PREFLIGHT_PASS, before actual RUN. Reviewer /root/p05_topic_games_review; producer author /root. Exact source ef009b7c /1811; four producer pins are in source-pins.json.

COMPAT-PR-001 closed: exact cases04/05 now execute protected POST/start, assert exact error code/status, waiting state/revision/snapshot/pack/current_round equality and zero receipt for the new request. Independent extracted-helper controls reject successful start, wrong status/code, each changed row field and receipt publication. Exact handler controls require the start call in both cases. This is inert AST execution, not HTTP/PostgreSQL evidence.

The old reviewer recommendation of POST503 for unsupported snapshot was overbroad. Frozen product mutation catches EngineError into deferred409, whereas read mapped() uses503. ADR024 requires denial, and prescribes503 for missing prior. Corrected case04 is GET503/POST409 TOPIC_SNAPSHOT_VERSION_UNSUPPORTED; case05 is503 TOPIC_HISTORY_UNAVAILABLE. No product defect or relaxed contract is claimed.

COMPAT-PR-002 closed: exact case01 requires nonzero projection and private-reference baselines before case03 purge. Independent exact case01 handler accepts positive baseline and rejects either zero baseline. COMPAT-PR-003 closed: DESIGN accurately discloses temporary host DB-password file; cleanup remains checked.

14 independent inert full-runner controls PASS: exact six IDs/schema/runtime cleanup, before/after/finally source and producer drift, ownership, remaining resources and secret cleanup. Producer AST controls17 PASS; syntax three exit0. Resource limits, readonly integration-only mount, included harness, finally drift checks and no reset/skip remain unchanged. Case06 proves20 planned rounds and start, not20 completed rounds. Boot is a source-unavailable method call, not process restart/ordinary production bootstrap; partial SQL row fixture is not full restore.

No Docker or product/producer writes by reviewer. Historical round01 remains immutable. This review authorizes no statistical RUN, human content approval or full P05 PASS. Actual compatibility6 execution is a separate gate.
''',encoding='utf-8')
index={'schema_version':1,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':[{'path':str(f.relative_to(p)).replace('\\','/'),'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())} for f in sorted(p.rglob('*')) if f.is_file() and f.name!='INDEX.json']}
(p/'INDEX.json').write_text(json.dumps(index,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':result['status'],'index_sha256':sha((p/'INDEX.json').read_bytes()),'files':len(index['files'])}))
