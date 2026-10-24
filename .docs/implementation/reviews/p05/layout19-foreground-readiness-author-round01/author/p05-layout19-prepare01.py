from pathlib import Path
import shutil,json
r=Path('C:/.projects/venus');p=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-v2-layout-producer-resume18';c=p.with_name('p05-v2-layout-producer-resume19');assert not c.exists();shutil.copytree(p,c,ignore=shutil.ignore_patterns('ROOT_RUN_ACK.json','INDEX.json'))
f=c/'measure.mjs';s=f.read_bytes().decode();nl='\r\n'if'\r\n'in s else'\n'
helper="""/** Positive preparation only; forbidden projections fail every native RAF sample. */
/* global document,getComputedStyle */
export async function prepareSceneProjection(page,scene,role,required,budget){
 let positive=[],forbidden=[];
 if(scene==='entry')positive=['adult18','accept-offer','create-name','join-name'];
 else if(scene==='setup')positive=['room-shell','comfort','topics-save'];
 else if(scene==='public_questions'){positive=['game-prompt'];forbidden=['private-prompt'];}
 else if(role==='observer')forbidden=['pair-invitation','topic-conversation','private-prompt','structured-advice','pair-chat','game-condition-input','game-dare'];
 else{
  if(scene==='private_active')positive=['private-prompt','structured-advice','pair-chat','advice-text'];else forbidden.push('private-prompt');
  if(scene==='private_offer')positive.push('topic-conversation','topic-accept');
  if(scene==='truth_dare_choice'){if(role==='primary')positive.push('game-dare','game-truth');else forbidden.push('game-dare','game-truth');}
  if(scene==='yes_but_condition'){if(role==='secondary')positive.push('game-condition-input','game-condition-submit');else forbidden.push('game-condition-input');}
 }
 positive=[...new Set([...positive,...required])];
 await bounded(budget,'positive-scene-preparation',async()=>{
  const handle=await page.waitForFunction(({positive,forbidden})=>{
   for(const id of forbidden)if(document.querySelectorAll('[data-testid="'+id+'"]').length)throw Error('SCENE_FORBIDDEN_PROJECTION:'+id);
   return document.visibilityState==='visible'&&positive.every(id=>{const element=document.querySelector('[data-testid="'+id+'"]');if(!element)return false;const style=getComputedStyle(element),rect=element.getBoundingClientRect();return style.visibility!=='hidden'&&style.visibility!=='collapse'&&rect.width>0&&rect.height>0;});
  },{positive,forbidden},{polling:'raf',timeout:budget.remaining()});
  await handle.dispose();
 });
}
""".replace('\n',nl)
assert s.count('export async function keyboard(')==1;s=s.replace('export async function keyboard(',helper+'export async function keyboard(')
s=s.replace('keyboard(page,targets,xserver,budget){','keyboard(page,targets,xserver,budget,alreadyForeground=false){').replace("assert(targets.length>0,'NO_EXPECTED_KEYBOARD_CONTROLS');await windowFor(page,xserver,budget);","assert(targets.length>0,'NO_EXPECTED_KEYBOARD_CONTROLS');if(!alreadyForeground)await windowFor(page,xserver,budget);")
s=s.replace('nativeMeasurement,onObservation=()=>{}}){','nativeMeasurement,onObservation=()=>{},onCheckpoint=()=>{}}){')
a=' const started=performance.now();budget.check();if(fixture)assertFreshScope(actor.lastGameView,fixture,started);';b=" const started=performance.now();budget.check();onCheckpoint('FOREGROUND');await windowFor(actor.page,xserver,budget);onCheckpoint('FRESH_SCOPE');";assert s.count(a)==1;s=s.replace(a,b)
a=" for(const control of required)assert(await bounded(budget,'required-own-control'";b=" onCheckpoint('POSITIVE_DOM_PREPARATION');await prepareSceneProjection(actor.page,scene,role,required,budget);"+nl+" onCheckpoint('INITIAL_PROJECTION');if(fixture){assertFreshScope(actor.lastGameView,fixture,performance.now());required=ownControlRequirements(actor.lastSelfActions,fixture,actor,performance.now());}"+nl+a;assert s.count(a)==1;s=s.replace(a,b)
a=" const clockBefore=await bounded(budget,'native-clock-before'";b=" onCheckpoint('MEASUREMENT');"+nl+a;assert s.count(a)==1;s=s.replace(a,b)
assert s.count('keys=await keyboard(actor.page,targets,xserver,budget)')==1;s=s.replace('keys=await keyboard(actor.page,targets,xserver,budget)','keys=await keyboard(actor.page,targets,xserver,budget,true)')
a=' // Evidence is saved before any strict assertion so legitimate failures remain inspectable.';b=" onCheckpoint('FINAL_PROJECTION');"+nl+a;assert s.count(a)==1;s=s.replace(a,b);f.write_bytes(s.encode())
f=c/'browser.mjs';s=f.read_bytes().decode();a='onObservation:value=>{row.roles.push(value);save();}});';b="onObservation:value=>{row.roles.push(value);save();},onCheckpoint:checkpoint=>{assert(['FOREGROUND','FRESH_SCOPE','POSITIVE_DOM_PREPARATION','INITIAL_PROJECTION','MEASUREMENT','FINAL_PROJECTION'].includes(checkpoint));assert(['entry','host','guest','primary','secondary','observer','other'].includes(role.role));Object.assign(report.phase,{role:role.role,checkpoint});}});";assert s.count(a)==1;f.write_bytes(s.replace(a,b).encode())
f=c/'run.mjs';s=f.read_bytes();assert s.count(b'p05-v2-layout-producer-resume18')==1;f.write_bytes(s.replace(b'p05-v2-layout-producer-resume18',b'p05-v2-layout-producer-resume19'))
(c/'ROOT_RUN_ACK.json').write_text(json.dumps({'schema_version':1,'root_run_ack':False,'independent_producer_review':'PENDING','independent_review_path':None,'independent_review_index_sha256':None,'producer_runtime_digest':None,'source_identity':'93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d','image':'sha256:f9e93cf5aa8cadbe5ee69d72e2af760c0f3c5a81772c45d41d47427740ce75c2','status':'NOT_AUTHORIZED_PENDING_METHOD19_INDEPENDENT_REVIEW'},indent=2)+'\n')
print(json.dumps({'producer':str(c),'behavior':'measure foreground/readonlypositiveprep and staticphasecheckpoint','APP':False,'native':False,'root_run_ack':False}))
