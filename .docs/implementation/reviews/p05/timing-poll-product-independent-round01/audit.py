from pathlib import Path
import json,hashlib,difflib
r=Path(__file__).parent;a=Path('.docs/implementation/reviews/p05/timing-poll-product-author-round01')
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha((a/'INDEX.json').read_bytes())=='8cd666a25eea8ebfb355ff8561ffa2bedcd48b0b7820ae05b268bebfcfa9b48e'
idx=read(a/'INDEX.json');assert len(idx['files'])==28
for f in idx['files']:
 b=(a/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256'],f
before=read(Path('.artifacts/p05-unified-source-freeze01.json'));original=read(a/'source-freeze.json')
changed=[k for k in original['files'] if original['files'][k]!=before['files'].get(k)]
expected=['apps/api/src/room-routes.ts','apps/api/src/topic-games.ts','tests/p05-topic-games/cases.mjs','.docs/implementation/p05-source-revision-action-consent-01.json','.docs/implementation/p05-source-revision-socket-poll-01.json','apps/api/src/room-socket-poll.test.ts','apps/api/src/topic-action-consent.test.ts']
assert set(changed)==set(expected) and set(before['files'])<=set(original['files'])
assert len(original['files'])==1823
for f in expected:
 b=(a/'source'/f).read_bytes();assert sha(b)==original['files'][f]
 for_base=a/'baseline'/f
 if for_base.exists():assert sha(for_base.read_bytes())==before['files'][f]
assert (a/'source/apps/api/src/room-routes.ts').read_bytes()==Path('apps/api/src/room-routes.ts').read_bytes()
assert (a/'source/apps/api/src/topic-games.ts').read_bytes()==Path('apps/api/src/topic-games.ts').read_bytes()
# Verify the exact narrow route adaptation mechanically against old bytes.
old=(a/'baseline/apps/api/src/room-routes.ts').read_text(encoding='utf-8');new=(a/'source/apps/api/src/room-routes.ts').read_text(encoding='utf-8')
expected_route=old.replace('let lastPing=-Infinity;','let lastPing=-Infinity,pollPending=false;').replace('const ticker=setInterval(()=>{\n', '''const ticker=setInterval(()=>{
      // Keep at most one scheduled/in-flight poll. Slow storage must not build
      // a poll backlog ahead of the heartbeat on the same serialized chain.
      if(!grant||socket.readyState!==1||pollPending)return;
      pollPending=true;
''').replace("}).catch(()=>socket.close(4401,'Connection unavailable'));\n    },1000)","}).catch(()=>socket.close(4401,'Connection unavailable')).finally(()=>{pollPending=false;});\n    },1000)")
assert expected_route==new
out={'status':'PASS_ORIGINAL_AUTHOR_SCOPE_BYTES','author_children_verified':28,'source_before':before['identity'],'source_author01':original['identity'],'included_files':1823,'exact_changed_source_paths':changed,'route_diff':'ONLY_PER_SOCKET_PENDING_LATCH_SKIP_FINALLY','topic_and_route_live_exact_frozen':True,'final_addendum_pending':True}
(r/'audit-author01.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,indent=2))
