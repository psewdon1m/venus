// Independent round02: adapt round01 positive calls to the corrected exact-intent contract; preserve all round01 files.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {
  createPrivateConversation as create, applyPrivateConversation as apply,
  projectPrivateConversation as project, projectOwnTopicPreferences as own,
} from '../../../../packages/relationship-engine/src/private-conversation.ts';

const sourcePath = fileURLToPath(new URL('../../../../packages/relationship-engine/src/private-conversation.ts', import.meta.url));
const testPath = fileURLToPath(new URL('../../../../packages/relationship-engine/src/private-conversation.test.ts', import.meta.url));
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const before = {module: sha(sourcePath), author_tests: sha(testPath)};
assert.equal(before.module, '57d33ce1af14b4a3a69979a004a7c7122e529f2420ce99cb678089361120ccfd');
assert.equal(before.author_tests, 'cb77d6b23143e75f5df10bdb10f303f80e2871f40c9c7097b5be64104e9dc1db');
const scope = {room_id: 'review-room', session_id: 'review-game', round_id: 'review-round', actors: ['actor-z', 'actor-a']};
const topics = ['music', 'food', 'place'].map(topic_id => ({topic_id, labels: {ru: `Тема ${topic_id}`, en: `Subject ${topic_id}`, tr: `Konu ${topic_id}`}}));
const candidates = ['music', 'food', 'place', 'music-food'].map((name, i) => ({
  candidate_ref: `PRIVATE-REF-${name}`, card_id: `PRIVATE-CARD-${i}`, card_revision: i + 2,
  card_sha256: String(i + 4).repeat(64), topic_ids: name.split('-'),
  prompt: {ru: `СКРЫТЫЙ вопрос ${i}`, en: `UNREVEALED content ${i}`, tr: `GİZLİ soru ${i}`},
}));
const fixture = () => ({scope: structuredClone(scope), topics: structuredClone(topics), candidates: structuredClone(candidates),
  pins: {pack_digest: '1'.repeat(64), map_digest: '2'.repeat(64), taxonomy_digest: '3'.repeat(64)},
  now: 10_000, parent_expires_at: 190_000});
const ctx = (actor = 'actor-z', now = 10_000, scoped = scope) => ({actor, now, scope: scoped});
const command = (s, c, actor = 'actor-z', now = s.clock_floor) => {
  const r = apply(s, c, ctx(actor, now)); assert.equal(r.error, null); return r.state;
};
const configured = () => {
  let s = create(fixture());
  for (const actor of scope.actors) s = command(s, {kind: 'set_topics', expected_preference_revision: 1, allow: ['music', 'food', 'place'], exclude: []}, actor);
  return s;
};
const offerCommand = (s, i = 0) => ({kind: 'offer_topic', expected_revision: s.revision, expected_epoch: s.epoch,
  offer_id: `opaque-${i}`, token: (i + 8).toString(16).repeat(64), candidate: {candidate_ref: candidates[i].candidate_ref, card_sha256: candidates[i].card_sha256}});
const offer = (s = configured(), i = 0, now = s.clock_floor) => command(s, offerCommand(s, i), 'actor-z', now);
const response = s => ({kind: 'respond_topic', offer_id: s.offer.offer_id, epoch: s.epoch, proposal_revision: s.offer.proposal_revision, token: s.offer.token, decision: 'accept'});
const other = (s, exclude_current_topics = false) => ({kind:'other_question',exclude_current_topics,offer_id:s.offer.offer_id,epoch:s.offer.epoch,proposal_revision:s.offer.proposal_revision,token:s.offer.token});
const activate = s => command(command(s, response(s)), response(s), 'actor-a');
const active = () => activate(offer());
const adviceCommand = (s, extra = {}) => ({kind: 'offer_advice', epoch: s.epoch, topic_offer_id: s.offer.offer_id, advice_id: 'opaque-advice-A', text: 'Unseen advice private sentinel 🙂', ...extra});
const advice = () => {const s = active(); return command(s, adviceCommand(s));};
const replyAdvice = (s, extra = {}) => ({kind: 'respond_advice', advice_id: 'opaque-advice-A', revision: 1, epoch: s.epoch, decision: 'accept', ...extra});
const view = (s, actor = 'actor-a', now = s.clock_floor) => {const p = project(s, ctx(actor, now)); assert.equal(p.error, null); return p;};
const hidden = s => {
  for (const actor of scope.actors) {
    const v = view(s, actor).view; const json = JSON.stringify(v);
    assert.ok(!Object.hasOwn(v, 'prompt'));
    for (const c of candidates) for (const marker of [c.candidate_ref, c.card_id, c.card_sha256, ...Object.values(c.prompt)]) assert.ok(!json.includes(marker), marker);
    for (const key of ['candidate_ref', 'card_id', 'binding_hash', 'card_sha256', 'preview', 'length']) assert.ok(!json.includes(`"${key}"`), key);
  }
};
const checks = [];
const probe = (id, f) => {try {f(); checks.push({id, status: 'PASS'});} catch (e) {checks.push({id, status: 'FAIL', error: String(e.stack)});}};

probe('K01-empty-by-default', () => {const s = create(fixture()); assert.deepEqual(s.preferences['actor-z'].allow, []); hidden(s); assert.equal(apply(s, offerCommand(s), ctx()).error, 'NOT_AVAILABLE');});
probe('K02-one-profile-does-not-grant', () => {let s = create(fixture()); s = command(s, {kind:'set_topics', expected_preference_revision:1, allow:['music'], exclude:[]}); assert.equal(apply(s, offerCommand(s), ctx()).error,'NOT_AVAILABLE');});
probe('K03-pending-one-ack-hides-card-and-hash', () => {const s = offer(); hidden(s); hidden(command(s, response(s))); assert.equal(view(s).view.offer.own_accepted, false);});
probe('K04-bilateral-ordered-pair-unlocks-exact-candidate', () => {const s = active(); assert.deepEqual(s.scope.actors, ['actor-z','actor-a']); assert.deepEqual(view(s).view.prompt, candidates[0]);});
for (const [field,value] of Object.entries({offer_id:'other', epoch:999, proposal_revision:999, token:'e'.repeat(64)})) probe(`K05-binding-${field}`, () => {const s=offer(); const r=apply(s,{...response(s),[field]:value},ctx()); assert.equal(r.error,'STALE'); hidden(r.state);});
for (const [name,scoped] of Object.entries({room:{...scope,room_id:'other'},session:{...scope,session_id:'other'},round:{...scope,round_id:'other'},reversed:{...scope,actors:['actor-a','actor-z']},substituted:{...scope,actors:['actor-z','third']}})) probe(`K06-scope-${name}`, () => {const s=advice(); const p=project(s,ctx('actor-z',999999,scoped)); assert.equal(p.error,'SCOPE_DENIED'); assert.equal(p.view,null); assert.equal(p.state,s); assert.equal(apply(s,{kind:'stop'},ctx('actor-z',999999,scoped)).error,'SCOPE_DENIED');});
probe('K07-outsider-denied-all-projectors',()=>{const s=advice(); assert.equal(project(s,ctx('third')).view,null); assert.equal(own(s,ctx('third')).preference,null); assert.equal(apply(s,{kind:'other_question',exclude_current_topics:true},ctx('third')).error,'SCOPE_DENIED');});
probe('K08-decline-terminal-and-topic-unavailable',()=>{let s=offer(); const old=response(s); s=command(s,{...old,decision:'decline'},'actor-a'); hidden(s); assert.equal(apply(s,old,ctx()).error,'STALE'); assert.equal(apply(s,{...offerCommand(s,3),token:'e'.repeat(64)},ctx('actor-z',15000)).error,'NOT_AVAILABLE'); assert.ok(offer(s,1,15000).offer);});
probe('K09-other-question-revokes-advice-and-acks',()=>{const s=advice(); const cleared=command(s,other(s,false)); hidden(cleared); assert.equal(cleared.advice[0].text,null); assert.equal(apply(cleared,response(s),ctx()).error,'STALE'); assert.equal(apply(cleared,replyAdvice(s),ctx('actor-a')).error,'STALE');});
probe('K10-monotonic-multitag-exclusion',()=>{const s=activate(offer(configured(),3)); const narrowed=command(s,other(s,true),'actor-a'); assert.deepEqual(narrowed.preferences['actor-a'].excluded,['food','music']); assert.deepEqual(own(narrowed,ctx()).preference.excluded,[]); assert.equal(apply(narrowed,{kind:'set_topics',expected_preference_revision:3,allow:['music','place'],exclude:[]},ctx('actor-a')).error,'NOT_AVAILABLE'); hidden(narrowed);});
probe('K11-pref-change-removes-even-accepted-advice',()=>{let s=advice(); s=command(s,replyAdvice(s),'actor-a'); const n=command(s,{kind:'set_topics',expected_preference_revision:2,allow:['food','place'],exclude:['music']}); hidden(n); assert.equal(n.advice[0].text,null);});
probe('K12-three-attempts-and-five-second-rate',()=>{let s=offer(); for(let i=1;i<3;i++){s=command(s,other(s,false)); assert.equal(apply(s,offerCommand(s,i),ctx('actor-z',s.last_offer_at+4999)).error,'RATE_LIMIT'); s=offer(s,i,10000+i*5000);} s=command(s,other(s,false)); assert.equal(apply(s,{...offerCommand(s,3),token:'e'.repeat(64)},ctx('actor-z',25000)).error,'LIMIT');});
probe('K13-id-token-and-candidate-reuse-denied',()=>{const p=offer(); const s=command(p,other(p,false)); assert.equal(apply(s,{...offerCommand(s,1),offer_id:p.offer.offer_id},ctx('actor-z',15000)).error,'REPLAY'); assert.equal(apply(s,{...offerCommand(s,1),token:p.offer.token},ctx('actor-z',15000)).error,'REPLAY'); assert.equal(apply(s,{...offerCommand(s),offer_id:'fresh',token:'e'.repeat(64)},ctx('actor-z',15000)).error,'NOT_AVAILABLE');});
probe('K14-pending-advice-recipient-exact-opaque-fields',()=>{const s=advice(); const a=view(s).view.advice[0]; assert.deepEqual(Object.keys(a).sort(),['advice_id','direction','epoch','expires_at','revision','state']); assert.ok(!JSON.stringify(a).includes('sentinel')); assert.equal(view(s,'actor-z').view.advice[0].text,s.advice[0].text);});
probe('K15-advice-sender-cannot-accept',()=>{const s=advice(); assert.equal(apply(s,replyAdvice(s),ctx()).error,'ROLE_DENIED'); assert.equal(apply(s,replyAdvice(s,{revision:2}),ctx('actor-a')).error,'STALE'); assert.equal(view(command(s,replyAdvice(s),'actor-a')).view.advice[0].text,s.advice[0].text);});
probe('K16-delayed-advice-send-cannot-cross-new-topic',()=>{const before=active(); const delayed=adviceCommand(before); const after=activate(offer(command(before,other(before,false)),1,15000)); assert.equal(apply(after,delayed,ctx('actor-z',15000)).error,'STALE'); assert.equal(apply(after,{...delayed,epoch:after.epoch},ctx('actor-z',15000)).error,'STALE'); assert.deepEqual(view(after).view.advice,[]);});
probe('K17-edit-revokes-old-and-requires-new-revision',()=>{let s=advice(); s=command(s,replyAdvice(s),'actor-a'); const old=s; s=command(s,adviceCommand(s,{advice_id:'opaque-advice-B',replaces_id:'opaque-advice-A',text:'Replacement sentinel'})); assert.equal(s.advice[0].text,null); assert.equal(s.advice[1].revision,2); assert.ok(!Object.hasOwn(view(s).view.advice[0],'text')); assert.equal(apply(s,replyAdvice(old),ctx('actor-a')).error,'REPLAY'); assert.equal(apply(s,replyAdvice(s,{advice_id:'opaque-advice-B'}),ctx('actor-a')).error,'STALE'); assert.equal(view(command(s,replyAdvice(s,{advice_id:'opaque-advice-B',revision:2}),'actor-a')).view.advice[0].text,'Replacement sentinel');});
probe('K18-advice-decline-and-bilateral-revoke-erase',()=>{for(const decision of ['decline','sender-revoke','recipient-revoke']){let s=advice(); if(decision==='decline')s=command(s,replyAdvice(s,{decision}),'actor-a');else{s=command(s,replyAdvice(s),'actor-a');s=command(s,{kind:'revoke_advice',advice_id:'opaque-advice-A',revision:1,epoch:s.epoch},decision==='sender-revoke'?'actor-z':'actor-a');} assert.equal(s.advice[0].text,null);assert.deepEqual(view(s).view.advice,[]);}});
probe('K19-pending-and-direction-budgets',()=>{let s=advice(); assert.equal(apply(s,adviceCommand(s,{advice_id:'B'}),ctx()).error,'NOT_AVAILABLE'); s=command(s,adviceCommand(s,{advice_id:'reverse'}),'actor-a'); s=command(s,adviceCommand(s,{advice_id:'B',replaces_id:'opaque-advice-A'})); assert.equal(apply(s,adviceCommand(s,{advice_id:'C',replaces_id:'B'}),ctx()).error,'LIMIT'); assert.equal(s.advice_attempts['actor-a'],1);});
for(const [name,text] of Object.entries({surrogate:'\ud800',control:'x\u0000y',bidi:'x\u2066y',paragraph:'x\u2029y',scalarOverflow:'🙂'.repeat(1001)}))probe(`K20-invalid-text-${name}`,()=>{const s=active();assert.equal(apply(s,adviceCommand(s,{text}),ctx()).error,'INVALID_INPUT');assert.deepEqual(s.advice,[]);});
probe('K21-valid-unicode-boundary',()=>{const s=active(); const n=command(s,adviceCommand(s,{text:'🙂'.repeat(1000)}));assert.equal(Buffer.byteLength(n.advice[0].text),4000);assert.ok(!Object.hasOwn(view(n).view.advice[0],'text'));});
probe('K22-exact-pending-topic-expiry',()=>{const s=offer();assert.equal(view(s,'actor-a',39999).view.state,'pending');const n=view(s,'actor-a',40000);assert.equal(n.view.state,'empty');assert.equal(apply(n.state,response(s),ctx('actor-z',40000)).error,'STALE');});
probe('K23-exact-advice-expiry-and-parent-ceiling',()=>{const s=advice();assert.equal(view(s,'actor-a',39999).view.advice.length,1);const n=view(s,'actor-a',40000);assert.deepEqual(n.view.advice,[]);assert.equal(n.state.advice[0].text,null);const accepted=command(s,replyAdvice(s),'actor-a',39999);assert.equal(accepted.advice[0].expires_at,190000);assert.equal(view(accepted,'actor-a',190000).view.state,'closed');});
probe('K24-clock-invalid-rewind-future-cannot-revive',()=>{for(const now of [NaN,Infinity,-1,10000.1,Number.MAX_SAFE_INTEGER+1]){const p=project(advice(),ctx('actor-a',now));assert.equal(p.error,'INVALID_CLOCK');assert.equal(p.view,null);assert.equal(view(p.state).view.state,'closed');}const future=view(advice(),'actor-a',999999);assert.equal(future.view.state,'closed');const rewind=project(future.state,ctx('actor-a',15000));assert.equal(rewind.error,'CLOCK_REWIND');assert.equal(rewind.view,null);});
probe('K25-failed-action-still-carries-clock-floor',()=>{const s=offer();const r=apply(s,{...response(s),token:'bad'},ctx('actor-z',12000));assert.equal(r.error,'STALE');assert.equal(r.state.clock_floor,12000);assert.equal(project(r.state,ctx('actor-a',11999)).error,'CLOCK_REWIND');});
probe('K26-internal-content-and-pin-drift-invalidates',()=>{const s=active();for(const changed of [{...s,pins:{...s.pins,map_digest:'f'.repeat(64)}},{...s,candidates:s.candidates.map((c,i)=>i?c:{...c,prompt:{...c.prompt,tr:'Changed unaccepted prompt'}})}]){const p=view(changed);assert.equal(p.view.state,'empty');hidden(p.state);}assert.equal(s.offer.state,'active');});
probe('K27-defensive-copy-deep-immutability',()=>{const f=fixture();const s=create(f);f.candidates[0].prompt.en='Changed externally';f.scope.actors.reverse();assert.equal(s.candidates[0].prompt.en,candidates[0].prompt.en);assert.deepEqual(s.scope.actors,scope.actors);for(const obj of [s,s.candidates,s.candidates[0],s.candidates[0].prompt,s.preferences,s.preferences['actor-z'].allow,view(active()).view.prompt.prompt])assert.ok(Object.isFrozen(obj));const start=JSON.stringify(s);apply(s,offerCommand(s),ctx());assert.equal(JSON.stringify(s),start);});
probe('K28-unknown-tags-pins-malformed-locales-denied',()=>{for(const mutation of [f=>f.candidates[0].topic_ids=['unknown'],f=>f.pins.map_digest='bad',f=>f.topics[0].labels.tr='\udfff',f=>f.candidates.push(f.candidates[0]),f=>f.parent_expires_at=190001]){const f=fixture();mutation(f);assert.throws(()=>create(f));}});
probe('K29-safety-seed-monotonic-and-private',()=>{const f=fixture();f.preferences={'actor-z':{revision:17,allow:['food'],excluded:['music']},'actor-a':{revision:8,allow:[],excluded:[]}};const s=create(f);assert.deepEqual(own(s,ctx()).preference,{revision:17,allow:['food'],excluded:['music']});assert.equal(apply(s,{kind:'set_topics',expected_preference_revision:17,allow:['food','music'],exclude:[]},ctx()).error,'NOT_AVAILABLE');assert.ok(!JSON.stringify(view(s,'actor-a').view).includes('excluded'));});
probe('K30-stale-other-question-must-not-exclude-new-topic',()=>{const old=active();const delayed=other(old,true);const next=activate(offer(command(old,other(old,false)),1,15000));const applied=apply(next,delayed,ctx('actor-z',15000));assert.equal(applied.error,'STALE');assert.deepEqual(applied.state.preferences['actor-z'].excluded,[]);assert.equal(JSON.stringify(applied.state),JSON.stringify(next));});

// Additional independent correction controls. Each stale action compares complete state bytes at the same current time.
const replacementStage = (old, stage) => {
  let s=offer(command(old,other(old)),1,15000);
  if(stage==='pending')return s;
  s=command(s,response(s)); if(stage==='one-ack')return s;
  s=command(s,response(s),'actor-a');
  s=command(s,adviceCommand(s,{advice_id:'new-food-advice',text:'Current new food advice sentinel'}));
  return stage==='accepted-advice'?command(s,replyAdvice(s,{advice_id:'new-food-advice'}),'actor-a'):s;
};
for(const exclude of [true,false])for(const stage of ['pending','one-ack','pending-advice','accepted-advice'])probe(`K31-stale-exact-intent-${exclude}-${stage}`,()=>{
  const old=advice(); const delayed=other(old,exclude); const next=replacementStage(old,stage);
  const r=apply(next,delayed,ctx('actor-z',15000));assert.equal(r.error,'STALE');assert.equal(JSON.stringify(r.state),JSON.stringify(next));
});
for(const exclude of [true,false])for(const stage of ['pending','pending-advice'])for(const field of ['offer_id','epoch','proposal_revision','token'])probe(`K32-field-mismatch-${exclude}-${stage}-${field}`,()=>{
  const s=replacementStage(advice(),stage); const c=other(s,exclude); c[field]=typeof c[field]==='number'?999:'invalid';
  const r=apply(s,c,ctx('actor-z',15000));assert.equal(r.error,'STALE');assert.equal(JSON.stringify(r.state),JSON.stringify(s));
});
for(const exclude of [true,false])for(const missing of ['all','offer_id','epoch','proposal_revision','token'])probe(`K33-missing-intent-${exclude}-${missing}`,()=>{
  const s=advice(); let c=other(s,exclude); if(missing==='all')c={kind:'other_question',exclude_current_topics:exclude};else delete c[missing];
  const r=apply(s,c,ctx());assert.equal(r.error,'STALE');assert.equal(JSON.stringify(r.state),JSON.stringify(s));
});
for(const exclude of [true,false])probe(`K34-expired-intent-and-new-active-${exclude}`,()=>{
  const old=offer();const delayed=other(old,exclude);const expired=view(old,'actor-a',40000).state;
  const r=apply(expired,delayed,ctx('actor-z',40000));assert.equal(r.error,'STALE');assert.equal(JSON.stringify(r.state),JSON.stringify(expired));
  const next=activate(offer(expired,1,40000));const r2=apply(next,delayed,ctx('actor-z',40000));assert.equal(r2.error,'STALE');assert.equal(JSON.stringify(r2.state),JSON.stringify(next));
});
for(const exclude of [true,false])for(const stage of ['pending','active'])probe(`K35-valid-exact-intent-${exclude}-${stage}`,()=>{
  const s=stage==='pending'?offer():advice();const r=apply(s,other(s,exclude),ctx('actor-a'));assert.equal(r.error,null);hidden(r.state);assert.equal(r.state.offer,null);
  assert.deepEqual(r.state.preferences['actor-a'].excluded,exclude?['music']:[]);assert.deepEqual(r.state.preferences['actor-z'].excluded,[]);
  assert.ok(r.state.advice.every(a=>a.text===null));assert.equal(r.state.epoch,s.epoch+1);
  assert.equal(apply(r.state,other(s,exclude),ctx('actor-a')).error,'STALE');
});
for(const stage of ['pending','one-ack','pending-advice','accepted-advice'])probe(`K36-unconditional-current-stop-${stage}`,()=>{
  const s=replacementStage(advice(),stage);const r=apply(s,{kind:'stop'},ctx('actor-a',15000));assert.equal(r.error,null);assert.equal(r.state.state,'stopped');hidden(r.state);
  assert.deepEqual(r.state.preferences,s.preferences);assert.ok(r.state.advice.every(a=>a.text===null));
});
probe('K37-stale-action-time-advance-does-not-mutate-intent-state',()=>{
  const old=advice();const next=replacementStage(old,'accepted-advice');const r=apply(next,other(old,true),ctx('actor-z',16000));
  assert.equal(r.error,'STALE');assert.equal(r.state.clock_floor,16000);assert.equal(JSON.stringify({...r.state,clock_floor:next.clock_floor}),JSON.stringify(next));
});

const after={module:sha(sourcePath),author_tests:sha(testPath)};
assert.deepEqual(after,before,'Reviewed bytes changed during probes');
const report={schema_version:1,suite:'P05_PRIVATE_CONVERSATION_INDEPENDENT_KERNEL',scope:'PURE_UNEXPORTED_MODULE_PREFLIGHT_ONLY',created_at:new Date().toISOString(),node:process.version,source_before:before,source_after:after,checks,passed:checks.filter(c=>c.status==='PASS').length,failed:checks.filter(c=>c.status==='FAIL').length};
const output=fileURLToPath(new URL('./kernel-round-02.probes.json',import.meta.url));
writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report,null,2));
process.exitCode=report.failed?1:0;
