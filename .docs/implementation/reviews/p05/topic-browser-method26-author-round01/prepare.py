from pathlib import Path
import json,hashlib,difflib
r=Path('C:/.projects/venus');o=Path(__file__).parent;p=r/'.artifacts/p05-private-batch-browser-producer25';c=r/'.artifacts/p05-private-batch-browser-producer26';assert not c.exists();c.mkdir();sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for x in p.glob('*.mjs'):(c/x.name).write_bytes(x.read_bytes())
b=(p/'browser.mjs').read_bytes();s=b.decode();ending='\r\n' if b'\r\n' in b else '\n'
oldmap='const observedOwnStarts=new WeakMap();';newmap=oldmap+'\nconst normalCurrentStarts=new WeakMap(),normalCurrentViews=new WeakMap();'
observer="""function normalCurrentRequest(a,request){
 try{const url=new URL(request.url()),frame=request.frame();return typeof a.room==='string'&&request.method()==='GET'&&url.origin===service.origin&&url.pathname===`/api/v2/rooms/${a.room}/game/current`&&!url.search&&!url.hash&&frame===a.page.mainFrame()&&frame.page()===a.page&&a.page.context()===a.context;}catch{return false;}
}
function rememberNormalCurrent(a,response,view){
 const request=response.request(),started=normalCurrentStarts.get(request);if(response.status()!==200||!started||started.actor!==a||started.room!==a.room||!normalCurrentRequest(a,request)||response.url()!==request.url())return;
 const prior=normalCurrentViews.get(a);if(!prior||started.at>prior.started_at)normalCurrentViews.set(a,{room:started.room,started_at:started.at,view});
}
"""
listener=" page.on('request',request=>{if(normalCurrentRequest(a,request))normalCurrentStarts.set(request,{actor:a,room:a.room,at:performance.now()});});"
start=s.index('async function coherentGame(');end=s.index('async function ownUiRound(',start);oldhelper=s[start:end]
newhelper="""async function coherentGame(expected={}){const started=performance.now();let result=null;await expect.poll(async()=>{
 const host=actors[0],f=await service.plan(host.room);
 for(const a of actors){const observed=normalCurrentViews.get(a);if(a.room===host.room&&observed?.room===host.room&&observed.started_at>started&&coherentRound(f,observed.view,expected)){result={fixture:f,view:observed.view};return true;}}
 return false;
},{timeout:8000,intervals:[50,100,250]}).toBe(true);return result;}
"""
def replace_once(text,old,new):assert text.count(old)==1;return text.replace(old,new)
s=replace_once(s,oldmap,newmap.replace('\n',ending));s=replace_once(s,'async function actor(locale){',observer.replace('\n',ending)+'async function actor(locale){');s=replace_once(s," page.on('pageerror',",listener+ending+" page.on('pageerror',");s=replace_once(s,'const v=await response.json();a.lastGameView=', 'const v=await response.json();rememberNormalCurrent(a,response,v);a.lastGameView=');s=replace_once(s,oldhelper,newhelper.replace('\n',ending));(c/'browser.mjs').write_bytes(s.encode())
write=lambda n,x:(o/n).write_text(json.dumps(x,indent=2)+'\n',encoding='utf8')
(o/'PARENT_HELPER.txt').write_bytes(oldhelper.encode());(o/'CANDIDATE_HELPER.txt').write_bytes(newhelper.replace('\n',ending).encode());(o/'OBSERVER_INSERT.txt').write_bytes(observer.replace('\n',ending).encode());(o/'REQUEST_LISTENER.txt').write_bytes((listener+ending).encode())
(o/'browser.diff').write_text(''.join(difflib.unified_diff(b.decode().splitlines(True),s.splitlines(True),fromfile='producer25/browser.mjs',tofile='producer26/browser.mjs')),encoding='utf8')
wrapper=r/'.artifacts/p05-browser26-a18-run01.mjs';assert not wrapper.exists();wrapper.write_bytes((r/'.artifacts/p05-browser25-a18-run01.mjs').read_bytes().replace(b'p05-private-batch-browser-producer25',b'p05-private-batch-browser-producer26').replace(b'p05-browser25-a18-root-ack01.json',b'p05-browser26-a18-root-ack01.json'))
pins={x.name:sha(x) for x in sorted(c.glob('*.mjs'))};digest=hashlib.sha256(('\n'.join(n+' '+h for n,h in sorted(pins.items()))+'\n').encode()).hexdigest();ack=json.loads((r/'.artifacts/p05-browser25-a18-root-ack01.pending.json').read_text());ack.update(status='NOT_AUTHORIZED',issued_at=None,runner_sha256=sha(wrapper),runtime_pins=pins,independent_review_index='PENDING_METHOD26_INDEPENDENT_REVIEW',independent_review_index_sha256=None,scope='ONE_CHROMIUM16_CURRENT_A18_METHOD26_FRESH_ACTUAL_REQUIRED_NOT_STAGE',method_author_index_sha256=None)
pending=r/'.artifacts/p05-browser26-a18-root-ack01.pending.json';assert not pending.exists();pending.write_text(json.dumps(ack,indent=2)+'\n',encoding='utf8');write('RUNTIME.json',{'runtime_count':9,'runtime_digest':digest,'runtime_pins':pins,'wrapper_sha256':sha(wrapper),'pending_ACK_sha256':sha(pending)});print(json.dumps({'status':'PREPARED_NOT_RUN','runtime_digest':digest,'wrapper_sha256':sha(wrapper),'pending_ACK_sha256':sha(pending)}))
