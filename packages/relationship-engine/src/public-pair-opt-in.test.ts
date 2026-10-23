import {describe,it,expect} from 'vitest';
import {proposeConsent,consentResponse,consentTimers,type ConsentOffer} from './consent.js';
import {publicPairMayBeExposed} from './public-pair-opt-in.js';
const actors=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'];
const id='00000000-0000-4000-8000-000000000003',start=1000000;
function accept(offer:ConsentOffer,actor:string,now:number) {return consentResponse(offer,actor,'accept',now,{offer_id:offer.offer_id,scope:offer.scope,proposal_revision:offer.proposal_revision});}
function active() {return accept(accept(proposeConsent(id,actors,'invitation',start),actors[0]!,start+1),actors[1]!,start+2);}
describe('P05 quiet public pair exposure boundary',()=>{
  it('withholds the pair before either or both independent opt-ins',()=>{
    const offer=proposeConsent(id,actors,'invitation',start);
    expect(publicPairMayBeExposed(actors,offer,start)).toBe(false);
    expect(publicPairMayBeExposed(actors,accept(offer,actors[0]!,start+1),start+1)).toBe(false);
    expect(publicPairMayBeExposed(actors,active(),start+2)).toBe(true);
  });
  it('requires a real offer and the same two participants',()=>{
    expect(publicPairMayBeExposed(actors,null,start+2)).toBe(false);
    expect(publicPairMayBeExposed([actors[0]!,'stranger'],active(),start+2)).toBe(false);
    expect(publicPairMayBeExposed([actors[0]!,actors[0]!],active(),start+2)).toBe(false);
    expect(publicPairMayBeExposed([],active(),start+2)).toBe(false);
    expect(publicPairMayBeExposed([...actors].reverse(),active(),start+2)).toBe(true);
  });
  it('an action consent does not authorize public presentation',()=>{
    let action=proposeConsent(id,actors,'action',start,start+1000);
    action=accept(accept(action,actors[0]!,start+1),actors[1]!,start+2);
    expect(publicPairMayBeExposed(actors,action,start+2)).toBe(false);
  });
  it('withdrawal and expiration immediately close exposure',()=>{
    const offer=active();
    for(const kind of ['decline','stop','skip','finish'] as const) expect(publicPairMayBeExposed(actors,consentResponse(offer,actors[1]!,kind,start+3),start+3)).toBe(false);
    expect(publicPairMayBeExposed(actors,offer,start+2+consentTimers.active-1)).toBe(true);
    expect(publicPairMayBeExposed(actors,offer,start+2+consentTimers.active)).toBe(false);
  });
  it('does not revive exposure if the clock moves backwards',()=>{
    expect(publicPairMayBeExposed(actors,active(),start+1)).toBe(false);
    expect(publicPairMayBeExposed(actors,active(),NaN)).toBe(false);
  });
  it('fails closed on malformed duplicate or foreign acknowledgements',()=>{
    const offer=active();
    for(const acks of [[actors[0]!,actors[0]!],[actors[0]!,'stranger'],[]]) expect(publicPairMayBeExposed(actors,{...offer,acks},start+2)).toBe(false);
    expect(publicPairMayBeExposed(actors,{...offer,actors:[actors[0]!,actors[0]!] },start+2)).toBe(false);
  });
});
