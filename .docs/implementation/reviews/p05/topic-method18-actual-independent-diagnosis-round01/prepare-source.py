from pathlib import Path
import hashlib,json
r=Path(__file__).parent
freeze=json.loads(Path('.artifacts/p05-unified-source-freeze01.json').read_text())
file='apps/api/src/room-routes.ts'
b=Path(file).read_bytes()
# Exact inverse of root's concurrent coalescing-only change. Pin acceptance,
# not the inverse recipe, determines whether these are actual18 source bytes.
b=b.replace(b'let lastPing=-Infinity,pollPending=false;',b'let lastPing=-Infinity;')
block=b'''      // Keep at most one scheduled/in-flight poll. Slow storage must not build
      // a poll backlog ahead of the heartbeat on the same serialized chain.
      if(!grant||socket.readyState!==1||pollPending)return;
      pollPending=true;
'''
if block not in b:block=block.replace(b'\n',b'\r\n')
b=b.replace(block,b'').replace(b".catch(()=>socket.close(4401,'Connection unavailable')).finally(()=>{pollPending=false;});",b".catch(()=>socket.close(4401,'Connection unavailable'));")
assert hashlib.sha256(b).hexdigest()==freeze['files'][file], 'inverse did not restore exact b244 source'
(r/'room-routes.actual18.ts.bytes').write_bytes(b)
print(json.dumps({'status':'EXACT_PIN_RECONSTRUCTION','path':file,'sha256':hashlib.sha256(b).hexdigest(),'qualification':'Exact inverse of concurrent root coalescing patch; acceptance requires immutable b244 full-file SHA.'},indent=2))
