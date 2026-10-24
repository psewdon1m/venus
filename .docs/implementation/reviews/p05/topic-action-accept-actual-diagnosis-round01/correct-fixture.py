from pathlib import Path
import json
b=Path('.artifacts/p05-action-accept-actual-diagnosis-round01');p=b/'probes.mjs'
(b/'fixture-attempt01.mjs').write_bytes(p.read_bytes())
(b/'fixture-attempt01.json').write_text(json.dumps({'exit_code':1,'reason':'Own fixture advanced elapsed4425 and then harness tick added another1500; private cache had already expired before intended retained DOM capture. Subtract scheduler interval from explicit elapsed advance so desired own-start is4425 elapsed. No product changes.'},indent=2)+'\n',encoding='utf-8')
s=p.read_text(encoding='utf-8').replace('clock+=4425;monotonic+=4425;fresh=true;await tick();','clock+=4425;monotonic+=2925;fresh=true;await tick();')
p.write_text(s,encoding='utf-8')
