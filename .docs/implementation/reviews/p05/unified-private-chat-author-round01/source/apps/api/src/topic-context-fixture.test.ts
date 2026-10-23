import {describe,it,expect} from 'vitest';
import {FrozenPack,algorithmRevision,immutableSnapshot,eligible,policyDigest,type Snapshot} from '@venus/relationship-engine';
import {sourceFixture} from '../../../tests/p05-topic-games/fixtures.mjs';
import {syntheticCards,playerId} from '../../../tests/p03/fixtures.mjs';
// Vitest resolves API/engine to src; the HTTP fixture imports dist. Reload the
// same verified bytes through this engine instance rather than mixing brands.
const fixture=sourceFixture(),map=fixture.map,pack=FrozenPack.load(fixture.pack.cards,fixture.pack.manifest,true);
function snapshot(mode:Snapshot['mode'],context:Snapshot['context'],chat:boolean){const ids=[playerId(0),playerId(1)];return immutableSnapshot({schema:1,engine_revision:algorithmRevision,policy_revision:'RE-1',policy_digest:policyDigest,pack_digest:pack.digest,room_id:'11111111-1111-4111-8111-111111111111',session_id:'22222222-2222-4222-8222-222222222222',seed:'a'.repeat(64),mode,context,total_rounds:20,players:ids.map(id=>({id,comfort:4,edges:Object.fromEntries(ids.filter(v=>v!==id).map(peer=>[peer,{relation:'friendship',explicit:true}]))})),capabilities:chat?['private_text_chat']:[]},pack);}
describe('legacy eligibility and unchanged P05 context-specific machine data',()=>{
 for(const mode of ['questions','truth_or_dare','yes_but'] as const){
  it(mode+' retains legacy card eligibility in person without a chat capability (not V2 transport permission)',()=>{const s=snapshot(mode,'in_person',false),ids=s.players.map(p=>p.id),cards=pack.cards.filter(c=>c.interaction==='pair_private'&&eligible(c,s,ids,3));expect(cards.length).toBeGreaterThanOrEqual(5);expect(cards.every(c=>c.required_capabilities.length===0)).toBe(true);});
  it(mode+' needs enabled chat for any online private opportunity',()=>{const on=snapshot(mode,'online',true),off=snapshot(mode,'online',false);expect(pack.cards.filter(c=>c.interaction==='pair_private'&&eligible(c,on,on.players.map(p=>p.id),3)).length).toBeGreaterThanOrEqual(5);expect(pack.cards.filter(c=>c.interaction==='pair_private'&&eligible(c,off,off.players.map(p=>p.id),3))).toEqual([]);});
 }
 it('keeps context variants in one semantic family instead of counting new distinct content',()=>{const original=pack.card('Q-0104'),variant=pack.card('Q-1104');expect(original.meeting_contexts).toEqual(['online']);expect(variant.meeting_contexts).toEqual(['in_person']);expect(original.text).toEqual(variant.text);expect(map.entry(original.id).semantic_family_ids).toEqual(map.entry(variant.id).semantic_family_ids);expect(new Set(pack.cards.map(c=>c.id)).size).toBe(pack.cards.length);});
 it('preserves the historical P03 mixed-context machine data',()=>{const old=syntheticCards().find(c=>c.id==='Q-0104')!;expect(old.pack_id).toBe('venus-p03-synthetic');expect(old.meeting_contexts).toEqual(['online','in_person']);expect(old.required_capabilities).toEqual(['private_text_chat']);expect(pack.card('Q-0104').pack_id).toBe('venus-p05-context-synthetic');expect(pack.synthetic).toBe(true);expect(map.synthetic).toBe(true);});
});
