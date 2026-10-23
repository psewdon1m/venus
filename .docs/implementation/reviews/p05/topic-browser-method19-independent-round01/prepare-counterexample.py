from pathlib import Path
r=Path(__file__).parent
a=Path('.docs/implementation/reviews/p05/topic-browser-method19-author-round01/p05-method19-controls01.mjs').read_text(encoding='utf-8')
prefix=a[:a.index("await test('refresh-own")]
prefix=prefix.replace("await import(process.env.OBSERVER_SOURCE??'./p05-private-batch-browser-producer19/private-batch-observer.mjs')","await import('../../../../../.artifacts/p05-private-batch-browser-producer19/private-batch-observer.mjs')")
tail="""const snapshots=[];
for(const kind of ['malformedJSON','bodyReadFailure']){
 const {a}=actor();await cycle(a,values());
 const req=request(a,'own');
 if(kind==='malformedJSON')await response(a,req,null,200,Promise.resolve(Buffer.from('{')));
 else await response(a,req,null,200,Promise.reject(Error('synthetic body read failure')));
 const snapshot=observer.snapshot(a,{control:'advice-offer'});snapshots.push({kind,snapshot});
 await observer.close(a);
}
{
 const {a}=actor();await cycle(a,values());
 const deny=values();deny.own.conversation_actions.offer_advice=false;
 await part(a,'own',deny);const afterDenial=observer.snapshot(a,{control:'advice-offer'});
 assert.equal(afterDenial.ready,false);
 request(a,'own');const afterNextRefresh=observer.snapshot(a,{control:'advice-offer'});
 snapshots.push({kind:'ownDenialThenAnotherOwnRequest',afterDenial,snapshot:afterNextRefresh});await observer.close(a);
}
console.log(JSON.stringify({scope:'INDEPENDENT_OWN_BODY_AND_DENIAL_COUNTEREXAMPLES',snapshots},null,2));
assert(snapshots.every(x=>!x.snapshot.ready),'NEW_OWN_BODY_FAULT_MUST_NOT_REUSE_OLD_READY_GRANT');
"""
(r/'own-body-fault-counterexamples.mjs').write_text(prefix+tail,encoding='utf-8')
