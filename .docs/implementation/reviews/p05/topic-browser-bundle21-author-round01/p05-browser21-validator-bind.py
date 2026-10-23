from pathlib import Path
import hashlib
p=Path('.artifacts/p05-private-batch-browser-producer21/private-batch-observer.mjs');s=p.read_text(encoding='utf-8')
pin=hashlib.sha256(Path('apps/web/src/topic-round-view.ts').read_bytes()).hexdigest()
s=s.replace("const sourcePins={", "const sourcePins={'apps/web/src/topic-round-view.ts':'"+pin+"',",1)
old="return {state,controls,game,proof};";assert old in s;s=s.replace(old,"const bundle=load('apps/web/src/topic-round-view.ts',{'./game-controls.js':controls,'./topic-state.js':state});return {state,controls,game,bundle,proof};",1)
s=s.replace("controls,game,proof}=loadProduction", "controls,game,bundle,proof}=loadProduction",1)
old="if(response.status()!==200||!body||Object.keys(body).sort().join(',')!=='chat,conversation,own,schema_version,target'||body.schema_version!==2){b.reason='BUNDLE_INVALID';return;}"
assert old in s;s=s.replace(old,"if(response.status()!==200||!bundle.validTopicRoundView(body,{room:record.route.room,member:actor.id,identity:0,transport:0,session:record.route.session,round:record.route.round,rev:body?.own?.game_rev})){b.reason='BUNDLE_INVALID';return;}")
p.write_text(s,encoding='utf-8',newline='\n');print(pin)
