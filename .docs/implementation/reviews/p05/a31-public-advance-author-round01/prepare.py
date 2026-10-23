"""Narrow public advance preparation successor. No application or native execution."""
from pathlib import Path
import datetime,difflib,hashlib,json,shutil,subprocess,sys
R=Path('C:/.projects/venus');S=R/'.artifacts/p05-pilot-bundle-source28';OLD=S/'.artifacts/p05-v2-layout-producer-a31-01';P=S/'.artifacts/p05-v2-layout-producer-a31-02';A=R/'.docs/implementation/reviews/p05/a31-public-advance-author-round01'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
assessment=R/'.docs/implementation/reviews/p05/a31-public-advance-precondition-assessment-round01/REPORT.md';assert sha(assessment)=='17df36e792874b181688c32d1e18ac46f84299c4827c82213b53ad94b2eb1c7d'
assert sha(OLD/'scene-driver.mjs')=='8b5537f6c11ea45785c9304bb956c0c4bbd3cd0fe168d4fcc26210550864c7a5'
A.mkdir(exist_ok=False);shutil.copytree(OLD,P)
run=(OLD/'run.mjs').read_bytes();before=b'p05-v2-layout-producer-a31-01';after=b'p05-v2-layout-producer-a31-02';assert run.count(before)==1;(P/'run.mjs').write_bytes(run.replace(before,after));assert(P/'run.mjs').read_bytes().replace(after,before)==run
raw=(OLD/'scene-driver.mjs').read_bytes();text=raw.decode();changes=[]
def change(a,b):
 global text
 assert text.count(a)==1,(a,text.count(a));text=text.replace(a,b);changes.append((a,b))
change("import {URLSearchParams} from 'node:url';", "import {URLSearchParams} from 'node:url';\nimport {createHash} from 'node:crypto';")
anchor='async function preparePrivateClick(a,control,path=null){'
helper="""/** Necessary public advance preparation only; passive observations are not APP cache acceptance. */
function publicAdvanceReadiness(a,wanted,deadlineCeiling=Infinity){
 const at=performance.now(),own=a.lastSelfActions,current=a.lastGameView,minimum=250;
 const scope=wanted?{room:wanted.room,member:wanted.member,session:wanted.session,round:wanted.round,rev:wanted.rev}:null;
 const scopeHash=scope?createHash('sha256').update(JSON.stringify(scope)).digest('hex'):null;
 let reason='EXPECTED_SCOPE_MISSING',remaining=null,deadline=null;
 if(wanted){
  reason='PROJECTION_MISSING';
  if(own&&current){
   const times=[current.started_monotonic_ms,current.received_monotonic_ms,own.started_monotonic_ms,own.received_monotonic_ms];
   const ttl=Date.parse(own.expires_at)-Date.parse(own.server_time);
   reason='SCOPE_MISMATCH';
   if(a.room===wanted.room&&a.id===wanted.member&&new URLSearchParams(new URL(a.page.url()).hash.slice(1)).get('room')===wanted.room&&own.room_id===wanted.room&&own.member_id===wanted.member&&own.session_id===wanted.session&&own.round_id===wanted.round&&own.game_rev===wanted.rev&&current.session_id===wanted.session&&current.round_id===wanted.round&&current.game_rev===wanted.rev){
    reason='TIMES_INVALID';
    if(times.every(Number.isFinite)&&times.every(t=>t>=0&&t<=at)&&current.started_monotonic_ms<=current.received_monotonic_ms&&own.started_monotonic_ms<=own.received_monotonic_ms){
     reason='OWN_PREDATES_CURRENT';
     if(own.started_monotonic_ms>=current.started_monotonic_ms){
      reason='ADVANCE_NOT_GRANTED';
      if(own.session_actions?.advance===true){
       reason='LEASE_INVALID';
       if(Number.isFinite(ttl)&&ttl>0&&Number.isFinite(wanted.deadline)){
        deadline=Math.min(wanted.deadline,deadlineCeiling,own.started_monotonic_ms+Math.min(5000,ttl));remaining=deadline-at;reason=remaining>=minimum?'READY':'LEASE_INSUFFICIENT';
       }
      }
     }
    }
   }
  }
 }
 const value={preparation:'PUBLIC_ADVANCE_OWN_PROJECTION',ready:reason==='READY',reason,scope_sha256:scopeHash,lease_remaining_ms:Number.isFinite(remaining)?Math.max(-10000000,Math.min(10000000,remaining)):null,minimum_remaining_ms:minimum,deadline_monotonic_ms:deadline,checked_monotonic_ms:at,observer_model_only:true,cache_accept_observed:false,auth_generation_observed:false};
 Object.defineProperty(value,'expected',{value:wanted});return value;
}

"""
change(anchor,helper+anchor+"\n if(control==='game-next'){const ready=publicAdvanceReadiness(a,a.publicAdvanceWanted);if(!ready.ready){recordMutation({locale:a.locale,control,result:'PUBLIC_PREPARATION_NOT_READY',readiness:ready});save();}assert(ready.ready,'PUBLIC_ADVANCE_NOT_READY');return ready;}")
old=" report.last_control={phase,locale:a.locale,member_id:a.id,control:id,started_monotonic_ms:performance.now()};save();const l=a.page.getByTestId(id);if(!ticket){await expect(l).toBeVisible();await expect(l).toBeEnabled();}if(ticket)assertPrivateTicket(a,id,ticket);await l.click(ticket?{timeout:Math.max(1,Math.min(15000,ticket.deadline_monotonic_ms-performance.now()))}:{});"
new=" report.last_control={phase,locale:a.locale,member_id:a.id,control:id,started_monotonic_ms:performance.now()};save();const l=a.page.getByTestId(id);if(!ticket){await expect(l).toBeVisible();await expect(l).toBeEnabled();}if(ticket)assertPrivateTicket(a,id,ticket);if(id==='game-next'){assert(prepared?.preparation==='PUBLIC_ADVANCE_OWN_PROJECTION','PUBLIC_ADVANCE_NOT_PREPARED');const ready=publicAdvanceReadiness(a,prepared.expected,prepared.deadline_monotonic_ms);Object.assign(prepared,ready);assert(ready.ready,'PUBLIC_ADVANCE_NOT_READY');}await l.click(ticket?{timeout:Math.max(1,Math.min(15000,ticket.deadline_monotonic_ms-performance.now()))}:{});"
change(old,new)
old="async function ownUiRound(a,f,control){await expect.poll(()=>uiRoundMatches(a.lastGameView,f),{timeout:8000,intervals:[50,100,250]}).toBe(true);await expect(a.page.getByTestId('game-round')).toContainText(new RegExp('\\\\b'+f.plan.round_index+'\\\\s*/'));await expect(a.page.getByTestId(control)).toBeVisible();await expect(a.page.getByTestId(control)).toBeEnabled();}"
new="async function ownUiRound(a,f,control){const wanted=control==='game-next'?{room:a.room,member:a.id,session:f.session,round:f.plan.round_id,rev:f.game_rev,deadline:performance.now()+8000}:null;if(wanted)a.publicAdvanceWanted=wanted;try{await expect.poll(()=>uiRoundMatches(a.lastGameView,f)&&(!wanted||publicAdvanceReadiness(a,wanted).ready),{timeout:8000,intervals:[50,100,250]}).toBe(true);await expect(a.page.getByTestId('game-round')).toContainText(new RegExp('\\\\b'+f.plan.round_index+'\\\\s*/'));await expect(a.page.getByTestId(control)).toBeVisible();await expect(a.page.getByTestId(control)).toBeEnabled();}catch(error){if(wanted){recordMutation({locale:a.locale,control,result:'PUBLIC_PREPARATION_NOT_READY',readiness:publicAdvanceReadiness(a,wanted)});save();}throw error;}}"
change(old,new)
(P/'scene-driver.mjs').write_bytes(text.encode());inverse=text
for a,b in reversed(changes):assert inverse.count(b)==1;inverse=inverse.replace(b,a)
assert inverse.encode()==raw
assert len(list(P.glob('*.mjs')))==27 and all(sha(P/p.name)==sha(p)for p in OLD.glob('*.mjs')if p.name not in ['run.mjs','scene-driver.mjs'])
for name in ['run.mjs','scene-driver.mjs']:(A/(name+'.diff')).write_text(''.join(difflib.unified_diff((OLD/name).read_text().splitlines(True),(P/name).read_text().splitlines(True),fromfile='A31-01/'+name,tofile='A31-02/'+name)),encoding='utf-8')
with(P/'DESIGN.md').open('a',encoding='utf-8')as f:f.write('\n\nA31-02 narrow public game-next prerequisite only. Existingvalidated passive lastSelfActions/lastGameView and unchangedownUiRound8s poll/DOM text+visible+enabled checks; exactactor room/member/session/round/game_rev/currentUIroute, finiteordered request/receive times, ownstart>=currentstart, advance===true, min(5000,serverTTL)-(now-started)≥existing250ms. Recheck immediately beforeONEunchangedclick; deadline capped by original8s and preparedlease, neverextended by newerpassiveprojection. Boundedreason/remaining/scopeSHA256 appears in existingmutation_dispatches.readiness; expectedIDs nonenumerable. Passiveobservermodel only, noAPPcache/authgenerationproof. No APIinjection/privateReady/sessiongrant/retry/reseed/extra key/favorablelayoutpoll/changeddeadline/count/oracle/firstsample/newframework/tests. Other25MJS rawexactincludingaggregate/x11/privateobserver/request-emission; source28APP/images29/resource17/guard15 numericcaps/full06unchanged. Freshall9A31-02/UIaggregate mandatory, nocarryfromA31-01FFEN51. RootACKinactive/newindependentruntime required. NoOCI40/P06.\n')
ack=read(P/'ROOT_RUN_ACK.json');ack.update(root_run_ack=False,independent_producer_review='PENDING',independent_review_path='.docs/implementation/reviews/p05/PENDING/INDEX.json',independent_review_index_sha256='0'*64,producer_runtime_digest='0'*64,issued_at=None,scope='ORIGINAL_NINE_FRESH_SAME_A31_02_PUBLIC_ADVANCE_PREP_RUNTIME_NOT_STAGE');shared=ack.get('shared_resource_authority',{})
for key in ['review_path','review_sha256','prelaunch_path','prelaunch_sha256']:shared[key]=None
ack['shared_resource_authority']=shared;write(P/'ROOT_RUN_ACK.json',ack)
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';checks=[]
for name in ['run.mjs','scene-driver.mjs']:
 x=subprocess.run([node,'--check',str(P/name)],capture_output=True,timeout=15);assert x.returncode==0,x.stderr;checks.append({'syntax':name,'exit':x.returncode})
code="import{captureProducer,runtimeDigest}from'"+(P/'runner-policy.mjs').as_uri()+"';console.log(runtimeDigest(captureProducer('"+P.as_posix()+"')));";x=subprocess.run([node,'--input-type=module','-e',code],capture_output=True,timeout=15);assert x.returncode==0,x.stderr;runtime=x.stdout.decode().strip();ack['producer_runtime_digest']=runtime;write(P/'ROOT_RUN_ACK.json',ack)
ix=read(OLD/'INDEX.json');ix.update(status='AUTHOR_A31_02_PUBLIC_ADVANCE_PREPARATION_PENDING_INDEPENDENT_NO_NATIVE',writes='COMPLETE_STOP',producer_runtime_digest=runtime,new_gate_actuals=0,false_root_ACK=True);ix['files']={p.name:{'sha256':sha(p),'bytes':p.stat().st_size}for p in sorted(P.iterdir())if p.is_file()and p.name!='INDEX.json'};write(P/'INDEX.json',ix)
write(A/'INPUTS.json',{'assessment':{'path':str(assessment),'sha256':sha(assessment)},'parent_INDEX_sha256':sha(OLD/'INDEX.json'),'parent_runtime':read(OLD/'INDEX.json')['producer_runtime_digest'],'parent_scene_driver_sha256':sha(OLD/'scene-driver.mjs'),'run_path_whole_inverse':True,'scene_driver_whole_inverse_replacements':len(changes),'other25MJS_rawexact':True,'resource17_sha256':sha(R/'.artifacts/p05-a31-existing-gates-resource-authority17.json'),'guard15_sha256':sha(R/'.artifacts/p05-a31-manual-preflight15.py'),'source_APP_images29_unchanged':True,'syntaxchecks':checks,'native_Docker_Git_activeACK':False})
write(A/'HANDOFF.json',{'producer':str(P),'producer_INDEX_sha256':sha(P/'INDEX.json'),'runtime':runtime,'source_identity':ix['source_identity'],'included_files':ix['included_files'],'image':ix['image'],'native_runs':0,'root_ACK':False,'all9_fresh_required':True,'same_resource17_guard15':True})
shutil.copyfile(Path(__file__),A/'prepare.py');(A/'REPORT.md').write_text('A31-02 narrowhelperonly, source28APP/image29unchanged. Assessment17df36 establishes publicadvancepreconditiongap, no actualhandlercause proved. ExistingownUiRound8s callback now also requires passiveownprojection exactroom/member/session/round/game_rev/currentUIroute, advance===true, finiteordered started/received, ownstart>=matchingcurrentstart, existing250ms minimum remaining min5000/serverTTL. ExistingDOMtext/visible/enabled checks retained. Sameexpectedscope rechecked immediately beforeONEunchangedclick, originalpreparedlease/deadline ceiling prevents extension. Boundedreason/lease/scopehash feeds existingmutation_dispatches.readiness. No extraAPI/private requireReady/observermodule/grant/request/clickretry/reseed/layoutsampling/oracle/count/deadline widening/newframework/tests. Other25MJS rawexactincludingrequest-emission/privateobserver/x11/aggregate; originals51/459/324/135 intact. Freshall9 newruntimeactuals mandatory; previousFFEN51 notcombined withnewversion. Resource17/guard15 scalarcaps/exactfull06 unchanged. Onlynode syntaxrun/scene0; independentreview androotnewruntimeACKpending, no native/Docker/APP/Git/sourcefreeze/probe/rootACKwrites/OCI40/P06. COMPLETE_STOP.\n',encoding='utf-8')
sys.path.insert(0,str(R/'tools'));from stage_inventory import inventory,identity
assert identity(inventory(S))=='57c55e5a88206ef5693e3d3ba037bab88ba55fc54fff9951b51ead2add0558fd'and sha(R/'.git/index')=='a4bb6d5150e4fc2e8beb8bb14bd4aa13aba7e4b419b8c4e40c85e6708ac89093'
for name,pin in read(R/'.artifacts/p05-pilot-bundle-source-freeze28.json')['files'].items():
 if name.startswith(('apps/','packages/')):assert sha(R/name)==pin,name
out={'status':'AUTHOR_A31_02_PUBLIC_ADVANCE_PREPARATION_PENDING_INDEPENDENT_NO_NATIVE','writes':'COMPLETE_STOP','created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_identity':ix['source_identity'],'included_files':ix['included_files'],'image':ix['image'],'producer_runtime_digest':runtime,'producer_INDEX_sha256':sha(P/'INDEX.json'),'files':{p.name:{'sha256':sha(p),'bytes':p.stat().st_size}for p in A.iterdir()if p.is_file()}};write(A/'INDEX.json',out)
with(R/'.history/agents/2026-10-23-p05_a26_gates_rebind.md').open('a',encoding='utf-8')as j:j.write('\n'+datetime.datetime.now(datetime.timezone.utc).isoformat()+' A31-02 smallpublicadvancehelper prepared0/syntaxrun+scene0. ExistingownUiRound8s/passiveowncurrent checks, exactscope/revisions/times/250mslease+oneclickimmediaterecheck/cappedprepareddeadline, boundreason/lease/scopehash inexistingmutation_dispatches. No newAPI/privateReadypath/observer/grant/retry/framework/tests; originaloracles/counts/budgets/25otherMJS/source28APP/images29/resource17scalarcaps exact. AuthorINDEX '+sha(A/'INDEX.json')+' runtime '+runtime+'. RootdocsQ08context differs intentionally, no wholecurrentrootcoreclaim. No native/Docker/Git/activeACK/APP/sourcefreeze/probe writes. COMPLETE_STOP.\n')
print(json.dumps({'author':str(A/'INDEX.json'),'sha256':sha(A/'INDEX.json'),'children':len(out['files']),**read(A/'HANDOFF.json')}))
