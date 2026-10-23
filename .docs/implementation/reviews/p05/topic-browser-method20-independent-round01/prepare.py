from pathlib import Path
r=Path(__file__).parent
base=Path('.docs/implementation/reviews/p05/topic-browser-method19-independent-round01/own-body-fault-counterexamples.mjs').read_text(encoding='utf-8').replace('p05-private-batch-browser-producer19','p05-private-batch-browser-producer20')
base=base.replace("console.log(JSON.stringify({scope:","""{
 const {a}=actor();await cycle(a,values());const stale=request(a,'own');
 await cycle(a,values());const fresh=observer.snapshot(a,{control:'advice-offer'});assert(fresh.ready);
 const denial=values();denial.own.conversation_actions.offer_advice=false;
 await response(a,stale,denial.own);const after=observer.snapshot(a,{control:'advice-offer'});
 assert(after.ready);assert.equal(after.cycle_id,fresh.cycle_id);await observer.close(a);
}
{
 const {a}=actor();await cycle(a,values());const stale=request(a,'own');
 const denial=values();denial.own.conversation_actions.offer_advice=false;
 await cycle(a,denial);assert.equal(observer.snapshot(a,{control:'advice-offer'}).reason,'CONTROL_FORBIDDEN');
 await response(a,stale,values().own);assert.equal(observer.snapshot(a,{control:'advice-offer'}).reason,'CONTROL_FORBIDDEN');await observer.close(a);
}
console.log(JSON.stringify({scope:""")
(r/'independent-five-controls.mjs').write_text(base,encoding='utf-8')
author=Path('.docs/implementation/reviews/p05/topic-browser-method20-author-round02/p05-method20-controls02.mjs').read_text(encoding='utf-8').replace("await import(process.env.OBSERVER_SOURCE??'./p05-private-batch-browser-producer20/private-batch-observer.mjs')","await import('../../../../../.artifacts/p05-private-batch-browser-producer20/private-batch-observer.mjs')")
(r/'author13-rerun.mjs').write_text(author,encoding='utf-8')
