from pathlib import Path
import json
b=Path('.artifacts/p05-advice-method11-review-round02')
(b/'fixture-attempt01.mjs').write_bytes((b/'probes.mjs').read_bytes())
(b/'fixture-attempt01.json').write_text(json.dumps({'exit_code':1,'observation':json.loads((b/'tsx-observation.json').read_text(encoding='utf-8')),'cause':'Own TSX fixture reused action offer_id across condition reset; actual beginAction uses new randomUUID. Same-id active-to-pending correctly rejected by phase floor. Correct fixture to new action id, no product change.','correction_shell_attempt_exit':1,'shell_attempt_reason':'PowerShell rejected inline Python quotation before execution; file-based correction used.'},indent=2)+'\n',encoding='utf-8')
p=b/'probes.mjs'
s=p.read_text(encoding='utf-8').replace("let state='pending',deadline=clock+30000;","let state='pending',deadline=clock+30000,actionId='action';").replace("offer_id:'action',consent_scope","offer_id:actionId,consent_scope").replace("state='pending';g.game_rev++;","state='pending';actionId='condition-new-action';g.game_rev++;")
p.write_text(s,encoding='utf-8')
