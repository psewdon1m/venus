from pathlib import Path
import json
b=Path('.artifacts/p05-private-batch-observer-review-round01');p=b/'probes.mjs'
(b/'probe-attempt01.mjs').write_bytes(p.read_bytes())
(b/'probe-attempt01.json').write_text(json.dumps({'exit_code':1,'reason':'Reviewer expected complete flag despite finish returning early at scope mismatch; all four parts exist but complete remains false under finding. Assertion changed to exact part presence.','correction_shell_attempt':1,'shell_reason':'Inline Python quoting failed before modification; use saved Python file.'},indent=2)+'\n',encoding='utf-8')
s=p.read_text(encoding='utf-8').replace("!s.ready&&s.complete&&s.reason==='SCOPE_MISMATCH'","!s.ready&&s.parts.own&&s.parts.target&&s.parts.conversation&&s.parts.chat&&s.reason==='SCOPE_MISMATCH'")
p.write_text(s,encoding='utf-8')
