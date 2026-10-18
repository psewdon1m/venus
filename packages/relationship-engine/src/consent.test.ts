import {describe,it,expect} from 'vitest';
import {proposeConsent,consentResponse,consentAllows,reconcileConsent,replacePendingAction} from './index.js';
const actors=['a','b'];const ref={offer_id:'offer',scope:'invitation' as const,proposal_revision:1};
describe('production consent coordinator',()=>{
  it('needs two independent acknowledgements and does not equate consent with performed action',()=>{
    const offer=proposeConsent('offer',actors,'invitation',1000);
    expect(consentAllows(offer,'a',1001)).toBe(false);
    expect(()=>consentResponse(offer,'host','accept',1001,ref)).toThrow('ACTOR');
    const first=consentResponse(offer,'a','accept',1001,ref);expect(first.state).toBe('pending');expect(consentResponse(first,'a','accept',1002,ref).state).toBe('pending');
    const active=consentResponse(first,'b','accept',1003,ref);expect(active.active_until).toBe(181003);expect(consentAllows(active,'a',181002)).toBe(true);expect(consentAllows(active,'a',181003)).toBe(false);expect(reconcileConsent(active,181003).state).toBe('expired');
    const action=proposeConsent('action',actors,'action',1004,active.active_until);expect(action.acks).toEqual([]);expect(action.state).toBe('pending');expect(consentAllows(action,'a',1004)).toBe(false);
  });
  it('checks exact pending deadline and gives refusal priority in both serialized race orders',()=>{
    const offer=proposeConsent('offer',actors,'invitation',1000),first=consentResponse(offer,'a','accept',1001,ref);
    expect(consentResponse(first,'b','accept',30999,ref).state).toBe('active');expect(()=>consentResponse(first,'b','accept',31000,ref)).toThrow('TERMINAL');
    const accepted=consentResponse(first,'b','accept',1002,ref),refused=consentResponse(accepted,'b','decline',1003);expect(refused.state).toBe('stopped');expect(refused.acks).toEqual([]);expect(()=>consentResponse(refused,'a','accept',1004,ref)).toThrow('TERMINAL');
    const declinedFirst=consentResponse(first,'b','decline',1002);expect(()=>consentResponse(declinedFirst,'a','accept',1003,ref)).toThrow('TERMINAL');expect(consentAllows(declinedFirst,'b',1003)).toBe(false);
  });
  it('bounds action lifetime to the parent and invalidates old acknowledgements on a new condition',()=>{
    const action=proposeConsent('action',actors,'action',180000,181000),reference={offer_id:'action',scope:'action' as const,proposal_revision:1};
    expect(action.deadline).toBe(181000);const first=consentResponse(action,'a','accept',180001,reference);
    const changed=replacePendingAction(first,180500);expect(changed.acks).toEqual([]);expect(changed.proposal_revision).toBe(2);expect(changed.deadline).toBe(181000);
    expect(()=>consentResponse(changed,'b','accept',180501,reference)).toThrow('STALE');expect(consentResponse(changed,'b','decline',180501).state).toBe('declined');
    expect(()=>proposeConsent('bad',actors,'action',181000,181000)).toThrow('SCOPE');
  });
});
