from pathlib import Path
s=Path('.docs/implementation/reviews/p05/topic-browser-method20-independent-round01/author13-rerun.mjs').read_text(encoding='utf-8')
s=s[:s.index("await test('refresh-own-start")]
s=s.replace('../../../../../.artifacts/p05-private-batch-browser-producer20/','./p05-private-batch-browser-producer21/')
s+='''
const envelope=v=>({schema_version:2,own:v.own,target:v.target,conversation:v.conversation,chat:v.chat});
async function bundle(a,v,status=200){await part(a,'current',v);await response(a,request(a,'view',v.round),envelope(v),status);}
await test('one-envelope-positive-same-production-cache',async()=>{const{a}=actor();await bundle(a,values());const x=observer.snapshot(a,{control:'advice-offer'});assert(x.ready);assert(x.parts.own&&x.parts.target&&x.parts.conversation&&x.parts.chat);assert.equal(x.cycle_id,1);await observer.close(a);});
await test('envelope-request-start-retains-valid-prior-only-before-response',async()=>{const{a}=actor();await bundle(a,values());request(a,'view');clock+=100;assert(observer.snapshot(a).ready);await observer.close(a);});
await test('bundle-delay-consumes-same-five-second-lease',async()=>{const{a}=actor();const v=values();await part(a,'current',v);const r=request(a,'view');clock+=4800;await response(a,r,envelope(v));assert.equal(observer.snapshot(a).reason,'LEASE_TOO_SHORT');await observer.close(a);});
for(const[k,change]of Object.entries({foreignMember:v=>{v.own.member_id='OTHER'},crossRevision:v=>{v.target.game_rev=999},crossEpoch:v=>{v.chat.epoch=999},missingTarget:v=>{v.target=null}}))await test('reject-'+k,async()=>{const{a}=actor(),v=values();change(v);await bundle(a,v);assert(!observer.snapshot(a).ready);await observer.close(a);});
await test('malformed-envelope-retires-old-grant-before-decode',async()=>{const{a}=actor();await bundle(a,values());await response(a,request(a,'view'),null,200,Promise.resolve(Buffer.from('{')));request(a,'view');assert(!observer.snapshot(a).ready);await observer.close(a);});
await test('extra-field-envelope-never-accepted',async()=>{const{a}=actor();await bundle(a,values());await response(a,request(a,'view'),{...envelope(values()),extra:true});assert(!observer.snapshot(a).ready);await observer.close(a);});
await test('denied-own-in-valid-envelope-retained-as-denial',async()=>{const{a}=actor(),v=values();await bundle(a,v);v.own.conversation_actions.offer_advice=false;await bundle(a,v);assert.equal(observer.snapshot(a,{control:'advice-offer'}).reason,'CONTROL_FORBIDDEN');request(a,'view');assert.equal(observer.snapshot(a,{control:'advice-offer'}).reason,'CONTROL_FORBIDDEN');await observer.close(a);});
await test('late-stale-envelope-cannot-replace-new-accepted',async()=>{const{a}=actor();await bundle(a,values());const old=request(a,'view');await bundle(a,values());const n=observer.snapshot(a).cycle_id;await response(a,old,null,401);assert(observer.snapshot(a).ready);assert.equal(observer.snapshot(a).cycle_id,n);await observer.close(a);});
await test('ws-private-clear-retires-bundle',async()=>{const{a,ws}=actor();await bundle(a,values());ws.emit('framereceived',{payload:JSON.stringify({schema:1,type:'game.private_cleared',room_id:'ROOM',stream:'private',audience:'member',target_member_id:'MEMBER'})});assert(!observer.snapshot(a).ready);await observer.close(a);});
console.log(JSON.stringify({scope:'FINITE_BUNDLED_TRANSPORT_NOT_BROWSER_PASS',count:results.length,results},null,2));
'''
Path('.artifacts/p05-browser21-controls.mjs').write_text(s,encoding='utf-8',newline='\n')
legacy=Path('.docs/implementation/reviews/p05/topic-browser-method20-independent-round01/author13-rerun.mjs').read_text(encoding='utf-8').replace('../../../../../.artifacts/p05-private-batch-browser-producer20/','./p05-private-batch-browser-producer21/')
Path('.artifacts/p05-browser21-legacy13.mjs').write_text(legacy,encoding='utf-8',newline='\n')
