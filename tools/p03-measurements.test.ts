import {describe,it,expect} from 'vitest';
import {aucCI,pairedRatioCI,trainLDA,profile,measurementDesign,main} from './p03-measurements.mjs';
import {transcriptAccumulator} from '../tests/p03/public-transcript.mjs';
import {FrozenPack,digest,policyDigest,selectNextRound} from '../packages/relationship-engine/dist/index.js';
import {syntheticCards,syntheticManifest} from '../tests/p03/fixtures.mjs';
const cards=syntheticCards(),pack=FrozenPack.load(cards,syntheticManifest(cards,digest,policyDigest),true);
describe('P03 measurement diagnostics, without final statistical corpus',()=>{
  it('rejects imported final execution before loading or evaluating a final corpus',async()=>{
    await expect(main(['--section=invariants'])).rejects.toThrow('FINAL_REQUIRES_FRESH_CLI_BUILD');
  });
  it('computes fixed-orientation tie-aware AUC and rejects nonfinite scores',()=>{
    expect(aucCI([0,1],[2,3]).auc).toBe(1);expect(aucCI([2,3],[0,1]).auc).toBe(0);expect(aucCI([1,1],[1,1]).auc).toBe(.5);
    expect(()=>aucCI([0,NaN],[1,2])).toThrow('INVALID_AUC');expect(()=>aucCI([0,Infinity],[1,2])).toThrow('INVALID_AUC');
    const model=trainLDA([[0,2],[1,2]],[[3,2],[4,2]]);expect(model.score([4,2])).toBeGreaterThan(model.score([0,2]));expect(model.intercept).not.toBe(0);
  });
  it('uses paired covariance and never silently substitutes zero denominators',()=>{
    expect(pairedRatioCI({both:10000,g_only:1000,f_only:0,neither:89000}).status).toBe('PASS');
    const equal=pairedRatioCI({both:10000,g_only:0,f_only:0,neither:90000});expect(equal.ci95[0]).toBeCloseTo(1,8);expect(equal.ci95[1]).toBeCloseTo(1,8);expect(equal.status).toBe('FAIL');
    expect(pairedRatioCI({both:0,g_only:5,f_only:0,neither:95}).status).toBe('FAIL');
  });
  it('pins random profiles, exact seed role, and public solo name inference',()=>{
    const s=profile('diagnostic-only',4,'questions','in_person',20,'random');expect(profile('diagnostic-only',4,'questions','in_person',20,'random')).toEqual(s);expect(measurementDesign.inference_seed).toContain('<class>:<size>');
    const base=profile('roles',4,'questions','in_person',20),plan={...selectNextRound(base,[],pack),card_id:'Q-0001',interaction:'solo',actors:[base.players[0].id],primary_member_id:base.players[0].id};
    const transcript=transcriptAccumulator(pack,base.players),frames=transcript.add(plan);expect(frames[0].current_round.text.question).toContain('OBSERVER_ROLE_0_END');const features=transcript.finish(1);expect(features[transcript.names.indexOf('visible_role:0')]).toBeGreaterThan(0);
    // Real questions-solo projection may have actors=[], so the renderer's text
    // must independently remain sufficient for recovery of the designated P1.
    const hiddenActors=transcriptAccumulator(pack,base.players);hiddenActors.add({...plan,actors:[]});expect(hiddenActors.finish(1)[hiddenActors.names.indexOf('visible_role:0')]).toBeGreaterThan(0);
  });
  it('renders a private round only through generic lifecycle metadata',()=>{
    const s=profile('private',4,'questions','in_person',20),plan={...selectNextRound(s,[],pack),card_id:'Q-0104',interaction:'pair_private',actors:s.players.slice(0,2).map(p=>p.id),primary_member_id:s.players[0].id,requires_action_consent:true,stage:3};
    const transcript=transcriptAccumulator(pack,s.players),frames=transcript.add(plan);for(const frame of frames) expect(Object.keys(frame.current_round).sort()).toEqual(['kind','round_id','round_index','state']);expect(JSON.stringify(frames)).not.toContain('Q-0104');expect(transcript.finish(1).every(Number.isFinite)).toBe(true);
  });
});
