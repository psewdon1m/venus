from pathlib import Path
import json,hashlib,subprocess,datetime
R=Path(__file__).resolve().parents[5];O=Path(__file__).resolve().parent
P=R/'.artifacts/p05-public-wire-adjunct06';B=R/'.artifacts/p05-public-wire-adjunct05'
A=R/'.docs/implementation/reviews/p05/public-wire-adjunct-author-round06'
D=R/'.docs/implementation/reviews/p05/wire05-native-failure-diagnosis-independent-round01'
def data(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def need(x,label):
 if not x:raise AssertionError(label)
def index(p,want):
 need(sha(p)==want,'index pin '+str(p));d=data(p);files=d['files']
 if isinstance(files,dict):files=[{'path':n,**v}for n,v in files.items()]
 for v in files:
  q=p.parent/v['path'];need(sha(q)==v['sha256'],'child pin '+str(q));need(q.stat().st_size==v['bytes'],'child size')
 return len(files)
checks={'author_children':index(A/'INDEX.json','1cde05f505b0a9a13aa55e8dcd94a393e41877c61bd5913690c9a88694fc4dcf'),
 'diagnosis_children':index(D/'INDEX.json','49518d617b46edb68280a22d4adc725429325fac46cee136e0a97042ec0b7168')}
wp=data(A/'WORKING-PINS.json')
for n,v in wp['files'].items():need(sha(P/n)==v['sha256']and(P/n).stat().st_size==v['bytes'],'working pin '+n)
checks['working_files_pinned']=len(wp['files'])
old=(B/'integration.mjs').read_bytes();new=(P/'integration.mjs').read_bytes()
prior=b"await Promise.race([entered,new Promise((_,reject)=>setTimeout(()=>reject(Error('Ordinary private parent final SQL not selected')),15000))])"
next=b"await Promise.race([Promise.all([entered,ordinary(f,actor)]),new Promise((_,reject)=>setTimeout(()=>reject(Error('Ordinary private parent final SQL not selected')),15000))])"
need(new.count(next)==1 and new.replace(next,prior)==old,'exact integration inverse')
checks['one_expression_inverse_exact05']=True
for n in ['runner.mjs','positive.mjs','public-wire-observer.mjs','ordinary-observation.mjs','DESCRIPTOR.json']:
 need((P/n).read_bytes()==(B/n).read_bytes(),'unchanged '+n)
checks['other_four_runtime_MJS_and_descriptor_exact05']=True
f=data(R/'.artifacts/p05-pilot-bundle-source-freeze12.json');need(len(f['files'])==f['included_files']==1869,'source count')
for n,h in f['files'].items():need(sha(R/n)==sha(R/'.artifacts/p05-pilot-bundle-source12'/n)==h,'source '+n)
ack=data(P/'ROOT-ACK.template.json');receipt=data(R/'.artifacts/p05-pilot-bundle-image-binding12/receipt.json')
need(ack['status']=='NOT_AUTHORIZED','pending ACK');need(ack['method_review_path']=='PENDING_FRESH_WIRE06_INDEPENDENT_REVIEW','pending review')
need(ack['source_identity']==f['identity']=='658b710bdca35b678421a51c1c276028305f28362901b2c065a3867aa754f4de','source identity')
need(ack['image_id']==receipt['image']=='sha256:021a57ecd11d8e5df300a5030c78312f66c5595ebb5d97f156ab71cf7de3b689','image')
need(ack['runtime_files']==receipt['image_files_sha256']and len(ack['runtime_files'])==299,'299 runtime pins')
for key in ['producer_files','method_files']:
 for n,h in ack[key].items():need(sha(P/n)==h,'ACK pin '+n)
checks.update({'source_files_exact':1869,'runtime_pins_exact_receipt':299,'pending_ACK_not_activated':True})
text=new.decode();ordinary=text[text.index('async function ordinary('):text.index('async function createThree(')]
need("'/ws-ticket','POST'"in ordinary and "new WebSocket("in ordinary and "type:'auth',ticket:ticket.ticket"in ordinary,'real helper ticket/WS/auth')
need('actor.wire=wire;return wire;'in ordinary and '.close('not in ordinary and '.terminate('not in ordinary,'replace current wire no explicit close')
ow=text[text.index("await check('P05-OWS-10'"):text.index("await extras.run('questions'")]
need(ow.index('await released(await freshPrivate())')<ow.index('h.setQueryHook')<ow.index('Promise.all([entered,ordinary(f,actor)])')<ow.index('pg_stat_activity')<ow.index('fault=sourceFault()')<ow.index('starts=f.members.map(a=>[a,a.wire.frames.length])')<ow.index("SELECT pg_advisory_unlock")<ow.index('privateFrames(a.wire,start)'),'native order')
need('await ping(a.wire)'in ow and 'fault.assertions()>0'in ow and "status,503"in ow,'original assertions retained')
rooms=(R/'apps/api/src/rooms.ts').read_text();routes=(R/'apps/api/src/room-routes.ts').read_text()
need('socket_generation=socket_generation+1'in rooms and 'm.socket_generation=$3'in rooms,'native generations')
need('WHERE room_id=$1 AND id=$2 AND socket_generation=$3 AND removed_at IS NULL'in rooms,'old disconnect generation fence')
need('lastRevision=-1,lastPrivate=0'in routes and "old.socket.close(4409,'Connection replaced')"in routes and 'this.games?.privateDelivery'in rooms and "this.finalAccessFence(c,{room,member,sessionHash:grant.sessionHash},false,grant.generation)"in rooms,'native zero cursor/private/final fence')
checks['real_helper_and_current_wire_downstream_order_qualified_from_source']=True
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
v=subprocess.run([node,str(A/'controls.mjs')],cwd=R,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=30)
(O/'cold-controls.txt').write_bytes(v.stdout);need(v.returncode==0,'cold controls exit');need(v.stdout.count(b'PASS ')==10,'ten cold controls')
checks['existing_finite_controls']=10;checks['cold_exit']=v.returncode
result={'status':'PASS_METHOD_ONLY_NATIVE_REQUIRED','at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'source_identity':f['identity'],'image':ack['image_id'],'integration_sha256':sha(P/'integration.mjs'),'checks':checks,
 'no_APP_edits':True,'no_native_run':True,'no_active_ACK':True,'APP_defect_proven_by_wire05_failure':False}
(O/'CHECKS.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result))
