"""Author derivative; only new resume producer is mutated. Prior inputs stay immutable."""
from pathlib import Path
import hashlib
import json

ROOT=Path('.artifacts/p05-v2-layout-producer-resume01')
OLD=Path('.artifacts/p05-v2-layout-producer')
baseline=[]
for path in sorted(OLD.glob('*')):
    if path.is_file():
        baseline.append({'path':path.as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size})
(ROOT/'baseline-inputs.json').write_text(json.dumps({'scope':'READ_ONLY_CURRENT_PRIOR_AUTHOR_WORKTREE_NOT_ACCEPTANCE','files':baseline},indent=2)+'\n',encoding='utf-8')
for name in ['run.mjs','author-controls.mjs','keyboard-replay.mjs','runner-replay.mjs']:
    path=ROOT/name
    text=path.read_text(encoding='utf-8')
    text=text.replace('.artifacts/p05-v2-layout-producer',ROOT.as_posix())
    path.write_text(text,encoding='utf-8')
tail=(ROOT/'driver-tail.txt').read_text(encoding='utf-8')
start=tail.index('async function newActor(locale){')
end=tail.index('async function seekPublic()',start)
tail='''async function newActor(locale){
 const context=await browser.newContext({ignoreHTTPSErrors:true,locale,reducedMotion:'reduce',viewport}),page=await context.newPage();page.setDefaultTimeout(5000);
 const a={context,page,locale,csrf:'',room:null,id:null,lastGameView:null,lastSelfActions:null,closed:false};
 privateBatches.attach(a);
 page.on('pageerror',e=>{if(report.page_errors.length>=64){report.page_errors_overflow=true;return;}report.page_errors.push({name:e.name,phase});});
 page.on('response',response=>{if(a.closed)return;const path=new URL(response.url()).pathname;if(path.startsWith('/api/')){if(report.request_metadata.length<32768)report.request_metadata.push({phase,method:response.request().method(),route:path.replace(/[a-f0-9]{8}-[a-f0-9-]{27,}/g,':id'),status:response.status()});else report.request_metadata_overflow=true;}});
 try{await page.goto(service.origin);await page.getByTestId('adult18').waitFor();await page.locator(`nav button[lang="${locale}"]`).click();return a;}
 catch(error){a.closed=true;try{await context.close();}finally{await privateBatches.close(a);}throw error;}
}
'''+tail[end:]
before="if(scene==='private_active'){await acceptTopics(f);if(f.plan.requires_action_consent)await acceptActionsUi(f);await primary.page.getByTestId('advice-input').fill('SYNTHETIC LAYOUT ADVICE');await mutationClick(primary,'advice-offer',`/api/v2/rooms/${primary.room}/game/${f.session}/round/${f.plan.round_id}/conversation/commands`,'offer_advice');await expect(secondary.page.getByTestId('advice-accept')).toBeVisible();await mutationClick(secondary,'advice-accept',`/api/v2/rooms/${secondary.room}/game/${f.session}/round/${f.plan.round_id}/conversation/commands`,'respond_advice');await expect(secondary.page.getByTestId('advice-text')).toContainText('SYNTHETIC LAYOUT ADVICE');}"
after="""if(scene==='private_active'){
  await acceptTopics(f);if(f.plan.requires_action_consent)await acceptActionsUi(f);
  await fillPrivate(primary,'advice-input','SYNTHETIC LAYOUT ADVICE','advice-offer');let receipt=await adviceMutation(primary,'advice-offer',f,'offer_advice');
  await adviceUiReady([secondary],f,receipt.game_rev,'advice-accept','layout_pending');const pending=await receivedPendingAdvice(secondary,f);
  receipt=await adviceMutation(secondary,'advice-accept',f,'respond_advice',{advice_id:pending.advice_id,proposal_revision:pending.revision,epoch:pending.epoch,decision:'accept'});
  await adviceUiReady(pair,f,receipt.game_rev,'advice-text','layout_accepted');
  await fillPrivate(primary,'pair-chat-input','SYNTHETIC LAYOUT CHAT','pair-chat-send');const chatReceipt=await mutationClick(primary,'pair-chat-send',`/api/v2/rooms/${primary.room}/game/${f.session}/round/${f.plan.round_id}/conversation/chat`);
  await adviceUiReady(pair,f,chatReceipt.game_rev,'pair-chat-messages','layout_chat',performance.now());
  for(const a of pair){await expect(a.page.getByTestId('advice-text')).toContainText('SYNTHETIC LAYOUT ADVICE');await expect(a.page.getByTestId('pair-chat-messages')).toContainText('SYNTHETIC LAYOUT CHAT');}
 }"""
assert tail.count(before)==1
tail=tail.replace(before,after)
before="await secondary.page.getByTestId('game-condition-input').fill('SYNTHETIC LAYOUT CONDITION');"
assert tail.count(before)==1
tail=tail.replace(before,"await fillPrivate(secondary,'game-condition-input','SYNTHETIC LAYOUT CONDITION','game-condition-submit');")
start=tail.index('async function closeScene()')
end=tail.index('return {prepareScene',start)
tail=tail[:start]+'''async function closeScene(){const errors=[];for(const a of actors){a.closed=true;try{await a.context.close();}catch(e){errors.push(e);}try{await privateBatches.close(a);}catch(e){errors.push(e);}}actors=[];if(errors.length)throw new AggregateError(errors,'Scene cleanup failed');}
'''+tail[end:]
(ROOT/'driver-tail.txt').write_text(tail,encoding='utf-8')
design=(ROOT/'DESIGN.md').read_text(encoding='utf-8')
design=design.replace('Method10 unchanged. Its helper preparation phases may be extracted verbatim for real topic admission;', 'Historical method10 remains untouched. Resume01 uses exact accepted METHOD12 helper AST texts and observer03 for real topic admission;')
design+='''\n## Resume01 executable author derivative\n\nNew producer directory only; source1274/1813 and imageff371 binding unchanged. Actual code implements all459 IDs, per-role measurements/Tab access/focus/contrast checks, physical X11 native200/reset/capture, exact safety receipts, nine shard union, owned host cleanup and before/after source/producer inventory. No Docker/browser RUN has occurred. Independent review and separate root ACK remain mandatory. METHOD12/observer03 source-bound helpers replace old plain-click preparation; supplied histories and prior frozen checkpoints remain unchanged. Strict unresolvedcontrast or expired scenes fail without relaxed thresholds.\n'''
(ROOT/'DESIGN.md').write_text(design,encoding='utf-8')
print(json.dumps({'status':'AUTHOR_RESUME_ADAPTATION_ONLY_NOT_RUN','prior_top_files_pinned':len(baseline)}))
