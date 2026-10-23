from pathlib import Path
import hashlib,json,shutil,difflib,datetime
r=Path('C:/.projects/venus');s=r/'.artifacts/p05-pilot-bundle-source22';parent=s/'.artifacts/p05-v2-layout-producer-a25-01';dest=s/'.artifacts/p05-v2-layout-producer-a25-focus-trace01';a=r/'.docs/implementation/reviews/p05/a25-realapp-focus-trace-author-round01'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
a.mkdir(exist_ok=False);shutil.copytree(parent,dest)
run=(parent/'run.mjs').read_bytes();old=b'p05-v2-layout-producer-a25-01';new=b'p05-v2-layout-producer-a25-focus-trace01';assert run.count(old)==1;(dest/'run.mjs').write_bytes(run.replace(old,new))
original=(parent/'measure.mjs').read_bytes();nl=b'\r\n' if b'\r\n' in original else b'\n'
def lines(t):return t.strip('\n').replace('\n',nl.decode()).encode()+nl
start=b"onCheckpoint('FOREGROUND');"
assert original.count(start)==1
prologue=lines(''' const traceEnabled=scene==='public_questions'&&cell.geometry==='smallheight'&&['primary','other'].includes(role);let traceHandle=null,traceKeys=null,traceInstallFailed=false;
 if(traceEnabled)try{traceHandle=await bounded(budget,'diagnostic-install-readonly-events',()=>actor.page.evaluateHandle(()=>{
  const rows=[],listeners=[],allowed=new Set(['adult18','accept-offer','create-name','join-name','join-invite','comfort','submit-preferences','topics-save','topic-allow-creative','game-neutral-reset','game-stop','game-pause','game-skip','topic-other','topic-other-exclude','topic-decline','pair-accept','pair-decline','conversation-stop','action-accept','action-withdraw','game-finish','game-dare','game-truth','game-condition-input','game-condition-submit','advice-input','pair-chat-input','offer-topic-creative']);let overflow=false;
  const label=target=>({testID:target instanceof HTMLElement&&allowed.has(target.getAttribute('data-testid'))?target.getAttribute('data-testid'):'OTHER',tag:target instanceof HTMLElement&&['BUTTON','INPUT','SELECT','TEXTAREA','MAIN','H1','A','BODY','DIV','SECTION','SPAN','LABEL'].includes(target.tagName)?target.tagName:target===window?'WINDOW':target===document?'DOCUMENT':'OTHER'});
  const record=(phase,event)=>{if(rows.length===512){overflow=true;return;}try{const target=event.target,main=document.querySelector('main'),propKey=main?Object.getOwnPropertyNames(main).find(k=>k.startsWith('__reactProps$')):null,props=propKey?Object.getOwnPropertyDescriptor(main,propKey)?.value:null;rows.push({sequence:rows.length,phase,type:['keydown','keyup','focusin','focus','blur'].includes(event.type)?event.type:'OTHER',key:event.key==='Tab'?'Tab':event.type==='keydown'||event.type==='keyup'?'OTHER':null,isTrusted:event.isTrusted,defaultPrevented:event.defaultPrevented,target:label(target),active:label(document.activeElement),documentHasFocus:document.hasFocus(),visibility:document.visibilityState,targetHTMLElement:target instanceof HTMLElement,targetEqualsActive:target===document.activeElement,targetOwnDocument:target?.ownerDocument===document,mainContainsTarget:Boolean(main&&target instanceof Node&&main.contains(target)),mainReactPropsPresent:Boolean(props),mainOnFocusType:typeof(props?Object.getOwnPropertyDescriptor(props,'onFocus')?.value:undefined),mainOnKeyUpType:typeof(props?Object.getOwnPropertyDescriptor(props,'onKeyUp')?.value:undefined)});}catch{rows.push({sequence:rows.length,phase,type:'READONLY_RECORD_FAILED'});}};
  for(const type of ['keydown','keyup','focusin'])for(const capture of [true,false]){const fn=e=>record(capture?'DOCUMENT_CAPTURE':'DOCUMENT_BUBBLE',e);document.addEventListener(type,fn,capture);listeners.push([document,type,fn,capture]);}
  for(const type of ['focus','blur']){const fn=e=>record('WINDOW',e);window.addEventListener(type,fn);listeners.push([window,type,fn,false]);}
  return {rows,get overflow(){return overflow;},detach(){for(const[target,type,fn,capture]of listeners)target.removeEventListener(type,fn,capture);}};
 }));}catch{traceInstallFailed=true;}
 try{
''')
keyline=b" onCheckpoint('TARGETS');const targets=await bounded(budget,'own-visible-targets',()=>actor.page.evaluate(visibleTargets)),keys=await keyboard(actor.page,targets,xserver,budget,true,onCheckpoint);"+nl
assert original.count(keyline)==1
assignment=lines(' if(traceEnabled)traceKeys=keys;')
end=b"budget.check();return outcome;"+nl+b'}'+nl+b'export function assertSafeMetadata'
assert original.count(end)==1
finallycode=lines(''' }finally{
  if(traceEnabled)try{
   const trace=traceHandle?await bounded(budget,'diagnostic-dump-readonly-events',()=>traceHandle.evaluate(value=>{const result={rows:value.rows,overflow:value.overflow};value.detach();return result;})):{rows:[],overflow:false};
   const safe={scope:'ONE_REAL_APP_READONLY_FOCUS_TRACE_DIAGNOSTIC_NOT_GATE',role,scene:'public_questions',geometry:'smallheight',cap:512,installFailed:traceInstallFailed,...trace,original_first_samples:traceKeys?.controls??null};
   const bytes=Buffer.from(JSON.stringify(safe)+'\\n');assert(bytes.length<=512*1024,'DIAGNOSTIC_METADATA_CAP');writeFileSync(join(output,'public-'+role+'-focus-events.json'),bytes,{flag:'wx'});
   try{const raw=readFileSync(join(output,'keyboard-first-failure.json'));if(raw.length<=4096)writeFileSync(join(output,'public-'+role+'-original-first-failure.json'),raw,{flag:'wx'});}catch{/* Preserve original failure and sample writer. */}
  }catch{/* Diagnostic collection never replaces the original outcome/failure. */}finally{try{if(traceHandle)await traceHandle.dispose();}catch{/* Original outcome preserved. */}}
 }
''')
changed=original.replace(start,prologue+start).replace(keyline,keyline+assignment).replace(end,b'budget.check();return outcome;'+nl+finallycode+b'}'+nl+b'export function assertSafeMetadata')
assert changed.replace(prologue,b'').replace(assignment,b'').replace(finallycode,b'')==original
(dest/'measure.mjs').write_bytes(changed)
for name in ['run.mjs','measure.mjs']:
 (a/(name+'.diff')).write_text(''.join(difflib.unified_diff((parent/name).read_text().splitlines(True),(dest/name).read_text().splitlines(True),fromfile='acceptedA25/'+name,tofile='DIAGNOSTIC_ONLY/'+name)),encoding='utf-8')
assert all((dest/p.name).read_bytes()==p.read_bytes() for p in parent.glob('*.mjs') if p.name not in ['run.mjs','measure.mjs'])
ack=read(dest/'ROOT_RUN_ACK.json');ack.update(root_run_ack=False,independent_producer_review='PENDING',independent_review_path='.docs/implementation/reviews/p05/PENDING/INDEX.json',independent_review_index_sha256='0'*64,producer_runtime_digest='0'*64,issued_at=None,scope='ONE_FIREFOX_RU_ORIGINAL51_A25_READONLY_FOCUS_TRACE_DIAGNOSTIC_ONLY_NOT_GATE')
ack['shared_resource_authority']={'path':str(r/'.artifacts/p05-a25-existing-gates-resource-authority11.json'),'sha256':'01fe84029ea2cef6b30b553702ef0ae7c76af9580a19475b4529ac90d4e3e66b','qualification':'PROSPECTIVE root one-off diagnostic addendum + independent review + fresh manual guard required; no real ACK yet.'}
write(dest/'ROOT_RUN_ACK.json',ack)
with (dest/'DESIGN.md').open('a',encoding='utf-8') as f:f.write('\nONE REAL-APP DIAGNOSTIC CLONE ONLY: original A25 APP/image/source and full51 runner unchanged except run selfpath and measure read-only event trace on public_questions/smallheight primary+other. Max512 events per role/1024total; no geometry reads/listeners controlling input/APP edits/oracle waits/budget changes. Original keyboard loop/focusAudit/firstsample assertions exact. Even successful diagnostic yields no stage acceptance. Root new one-off review/ACK/freshguard required; accepted A25 producer immutable.\n')
write(a/'INPUT-PINS.json',{'scope':ack['scope'],'source_identity':read(dest/'binding.json')['source_identity'],'included_files':1879,'image':read(dest/'binding.json')['image'],'parent_producer_INDEX':sha(parent/'INDEX.json'),'parent_MJS':{p.name:sha(p) for p in sorted(parent.glob('*.mjs'))},'diagnostic_two_MJS':[ 'run.mjs','measure.mjs'],'inverse_measure_three_insertions':True,'inverse_run_literal':True,'other25_MJS_raw_exact':True,'original_full51_oracles_budgets_caps':'UNCHANGED','max_events_per_role':512,'max_events_total':1024,'no_stage_credit_even_exit0':True,'native_runs':0})
shutil.copyfile(Path(__file__),a/'prepare.py')
print(json.dumps({'status':'PREPARED_PENDING_EXISTING_COLD_CHECKS_FREEZE_NO_NATIVE','producer':str(dest),'author':str(a)}))
