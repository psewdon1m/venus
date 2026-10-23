from pathlib import Path
import json,hashlib,difflib
r=Path('C:/.projects/venus');o=Path(__file__).parent
p=r/'.artifacts/p05-private-batch-browser-producer24';c=r/'.artifacts/p05-private-batch-browser-producer25'
assert not c.exists();c.mkdir()
for x in p.glob('*.mjs'):(c/x.name).write_bytes(x.read_bytes())
old="async function coherentGame(expected={}){let result=null;await expect.poll(async()=>{const f=await service.plan(actors[0].room),g=await current(actors[0]);if(!coherentRound(f,g,expected))return false;result={fixture:f,view:g};return true;},{timeout:8000,intervals:[50,100,250]}).toBe(true);return result;}"
new="""async function coherentGame(expected={}){let result=null;await expect.poll(async()=>{
 const host=actors[0],f=await service.plan(host.room);
 // A normal-page 200 observation is an emission prerequisite, never the acceptance oracle.
 const ready=actors.some(a=>{const v=a.lastGameView;return a.room===host.room&&coherentRound(f,v&&{session_id:v.session_id,game_rev:v.game_rev,state:v.state,current_round:{round_id:v.round_id,round_index:v.round_index,state:v.round_state}},expected);});
 if(!ready)return false;
 const g=await current(host);if(!coherentRound(f,g,expected))return false;result={fixture:f,view:g};return true;
},{timeout:8000,intervals:[50,100,250]}).toBe(true);return result;}"""
b=(p/'browser.mjs').read_bytes();assert b.count(old.encode())==1
# Keep the parent's CRLF bytes outside the one helper; replacement follows its line ending.
ending=b'\r\n' if b'\r\n' in b else b'\n'
(c/'browser.mjs').write_bytes(b.replace(old.encode(),new.replace('\n',ending.decode()).encode()))
(o/'browser.diff').write_text(''.join(difflib.unified_diff(b.decode().splitlines(True),(c/'browser.mjs').read_text().splitlines(True),fromfile='producer24/browser.mjs',tofile='producer25/browser.mjs')),encoding='utf8')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
pins={x.name:sha(x) for x in sorted(c.glob('*.mjs'))}
digest=hashlib.sha256(('\n'.join(n+' '+h for n,h in sorted(pins.items()))+'\n').encode()).hexdigest()
prior=r/'.artifacts/p05-browser24-a18-run01.mjs';wrapper=r/'.artifacts/p05-browser25-a18-run01.mjs'
assert not wrapper.exists()
wrapper.write_bytes(prior.read_bytes().replace(b'p05-private-batch-browser-producer24',b'p05-private-batch-browser-producer25').replace(b'p05-browser24-a18-root-ack01.json',b'p05-browser25-a18-root-ack01.json'))
ack=json.loads((r/'.artifacts/p05-browser24-a18-root-ack01.pending.json').read_text())
ack.update(status='NOT_AUTHORIZED',runner_sha256=sha(wrapper),runtime_pins=pins,independent_review_index='PENDING_METHOD25_INDEPENDENT_REVIEW',independent_review_index_sha256=None,issued_at=None,scope='ONE_CHROMIUM16_CURRENT_A18_METHOD25_FRESH_ACTUAL_REQUIRED_NOT_STAGE',method_author_index_sha256=None)
pending=r/'.artifacts/p05-browser25-a18-root-ack01.pending.json';assert not pending.exists();pending.write_text(json.dumps(ack,indent=2)+'\n',encoding='utf8')
(o/'RUNTIME.json').write_text(json.dumps({'runtime_count':len(pins),'runtime_digest':digest,'runtime_digest_algorithm':'SHA256(sorted name + space + sha256 + newline records; same convention as method24)','runtime_pins':pins,'wrapper_sha256':sha(wrapper),'pending_ACK_sha256':sha(pending)},indent=2)+'\n',encoding='utf8')
(o/'PARENT_HELPER.txt').write_bytes(old.encode()+ending);(o/'CANDIDATE_HELPER.txt').write_bytes(new.replace('\n',ending.decode()).encode()+ending)
print(json.dumps({'producer':str(c),'runtime_count':len(pins),'runtime_digest':digest,'wrapper_sha256':sha(wrapper),'pending_ACK_sha256':sha(pending)}))
