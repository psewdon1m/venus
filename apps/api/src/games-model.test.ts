import {it,expect} from 'vitest';
import {FrozenPack,digest,policyDigest,type RoundPlan} from '@venus/relationship-engine';
import {syntheticCards,syntheticManifest,playerId} from '../../../tests/p03/fixtures.mjs';
import {publicRound,localText,privateText,type RoundData} from './games-model.js';
const cards=syntheticCards();
const responder=cards.find(c=>c.id==='YB-0001')!;
for(const locale of ['ru','en','tr']) responder.text[locale].responder='Respond {P2} to {P1}.';
for(const locale of ['ru','en','tr']) cards.find(c=>c.id==='YB-0104')!.text[locale].responder='Respond {P2} to {P1}.';
const pack=FrozenPack.load(cards,syntheticManifest(cards,digest,policyDigest),true);
function data(id:string):RoundData {
  const card=pack.card(id);
  const plan:RoundPlan={round_id:'33333333-3333-4333-8333-333333333333',round_index:1,card_id:card.id,card_revision:card.revision,actors:[playerId(0),playerId(1)],primary_member_id:playerId(0),interaction:card.interaction,stage:3,mode:card.mode,requires_action_consent:true,pack_digest:pack.digest,policy_digest:policyDigest};
  return {plan,state:'pending',choice:null,invitation:null,action:null,condition:null};
}
const names=[{id:playerId(0),display_name:'Alice {P2}'},{id:playerId(1),display_name:'Bob'}];
it('renders both YesBut fields once; braces inside names cannot impersonate another actor',()=>{
  const round=publicRound(pack,data('YB-0001'),'en',names);
  expect(round.kind).toBe('public');
  if(round.kind==='public'&&round.mode==='yes_but') {
    expect(round.text.responder).toBe('Respond Bob to Alice {P2}.');
    expect(round.text.proposal).toContain('Alice {P2} and Bob');
  } else throw new Error('Expected public YesBut');
});
it('a private round exposes only generic state, without card identity or actor names',()=>{
  const round=publicRound(pack,data('Q-0104'),'en',names);
  expect(round).toEqual({round_id:'33333333-3333-4333-8333-333333333333',round_index:1,state:'pending',kind:'generic'});
});
it('private YesBut retains both reviewed fields and their literal display-name substitutions',()=>{
  const text=privateText(pack,data('YB-0104'),'en',names);
  expect(text).toContain('Alice {P2} and Bob');
  expect(text).toContain('\nRespond Bob to Alice {P2}.');
});
it('TruthOrDare discloses neither side before choice and only the chosen side afterward',()=>{
  const round=data('TD-0002');expect(localText(pack,round,'en',names)).toBe(null);
  expect(publicRound(pack,round,'en',names)).toMatchObject({text:null,choice:null});
  round.choice='truth';const text=localText(pack,round,'en',names);
  expect(text).toContain('Truth');expect(text).not.toContain('Dare');
});
