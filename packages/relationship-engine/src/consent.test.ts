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
  it('denies invitation and action access before the final acknowledgement after a clock rollback',()=>{
    let invitation=proposeConsent('offer',actors,'invitation',1000);
    invitation=consentResponse(invitation,'a','accept',2000,ref);
    expect(()=>consentResponse(invitation,'b','accept',1999,ref)).toThrow('TIME');
    invitation=consentResponse(invitation,'b','accept',3000,ref);
    expect(invitation.last_ack_at).toBe(3000);expect(invitation.activated_at).toBe(3000);
    for(const now of [0,999,1500,2999,NaN,Infinity]) expect(consentAllows(invitation,'a',now)).toBe(false);
    expect(consentAllows(invitation,'a',3000)).toBe(true);
    expect(consentAllows(invitation,'a',invitation.active_until!-1)).toBe(true);
    expect(consentAllows(invitation,'a',invitation.active_until!)).toBe(false);
    expect(()=>consentResponse(invitation,'a','accept',2999,ref)).toThrow('TIME');
    expect(()=>consentResponse(invitation,'a','finish',2999)).toThrow('NOT_ACTIVE');
    const replay=consentResponse(invitation,'a','accept',3100,ref);
    expect(replay).toBe(invitation);expect(replay.active_until).toBe(183000);
    const reference={offer_id:'action',scope:'action' as const,proposal_revision:1};
    let action=proposeConsent('action',actors,'action',4000,invitation.active_until);
    expect(()=>consentResponse(action,'a','accept',3999,reference)).toThrow('TIME');
    action=consentResponse(action,'a','accept',5000,reference);
    expect(()=>consentResponse(action,'b','accept',4999,reference)).toThrow('TIME');
    action=consentResponse(action,'b','accept',6000,reference);
    expect(action.last_ack_at).toBe(6000);expect(action.activated_at).toBe(6000);
    expect(consentAllows(action,'a',4500)).toBe(false);expect(consentAllows(action,'a',5999)).toBe(false);
    expect(consentAllows(action,'a',6000)).toBe(true);expect(consentAllows(action,'a',182999)).toBe(true);
    expect(consentAllows(action,'a',183000)).toBe(false);
    expect(consentResponse(action,'b','accept',7000,reference)).toBe(action);
    expect(action.active_until).toBe(invitation.active_until);
    // Safety refusal remains available while the local clock is behind the accepted time.
    expect(consentResponse(action,'a','decline',4500).state).toBe('stopped');
  });
  it('fences the replacement condition revision in time and denies legacy activation without timestamps',()=>{
    const reference={offer_id:'action',scope:'action' as const,proposal_revision:1};
    const first=consentResponse(proposeConsent('action',actors,'action',1000,181000),'a','accept',2000,reference);
    expect(()=>replacePendingAction(first,1999)).toThrow('TIME');
    const changed=replacePendingAction(first,3000),updated={...reference,proposal_revision:2};
    expect(changed.created_at).toBe(3000);expect(changed.last_ack_at).toBeNull();expect(changed.activated_at).toBeNull();
    expect(()=>consentResponse(changed,'a','accept',2999,updated)).toThrow('TIME');
    const active=consentResponse(consentResponse(changed,'a','accept',3000,updated),'b','accept',4000,updated);
    expect(consentAllows(active,'a',3999)).toBe(false);expect(consentAllows(active,'a',4000)).toBe(true);
    const legacy={...active,activated_at:undefined,last_ack_at:undefined} as unknown as typeof active;
    expect(consentAllows(legacy,'a',5000)).toBe(false);
  });
});
