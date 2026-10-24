from pathlib import Path
import json,ast,copy,hashlib
p=Path(__file__).parent;ev=Path('.docs/implementation/evidence/p05')
old=Path('.docs/implementation/reviews/p05/topic-chat-policy-actual-round01/audit.py');tree=ast.parse(old.read_text(encoding='utf-8'));f=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='validate_report');ns={};exec(compile(ast.Module(body=[f],type_ignores=[]),'PURE_VALIDATOR','exec'),ns)
report=json.loads((ev/'engine2-topic-chat-policy-preflight-01/run/chat-policy-report.json').read_text());cases=[]
mutations=[('missing_case',lambda r:r['checks'].pop()),('duplicate_case',lambda r:r['checks'].__setitem__(11,copy.deepcopy(r['checks'][10]))),('deadline_extension',lambda r:r['checks'][9]['detail']['clock_window'][1].__setitem__('action_active_until_ms',1)),('one_actor_accept',lambda r:r['checks'][8]['detail']['action_accepted_before_clock_window'].__setitem__('actor_accept_posts',1)),('no_get_wait',lambda r:r['checks'][11]['detail']['get'].__setitem__('actual_final_chat_pg_wait',False)),('post_receipt_written',lambda r:r['checks'][11]['detail']['post'].__setitem__('exact_new_request_receipts',1))]
for name,mutate in mutations:
 r=copy.deepcopy(report);mutate(r)
 try:ns['validate_report'](r)
 except AssertionError:cases.append({'name':name,'status':'EXPECTED_REJECTION'})
 else:raise AssertionError(name)
(p/'sensitivity-result.json').write_text(json.dumps({'status':'PASS','checks':cases},indent=2)+'\n',encoding='utf-8');print(json.dumps({'sensitivity_controls':len(cases),'status':'PASS'}))
