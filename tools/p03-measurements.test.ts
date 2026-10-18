import {describe,it,expect} from 'vitest';
import {aucCI,pairedRatioCI,trainLDA,profile,measurementDesign,main} from './p03-measurements.mjs';
import {transcriptAccumulator} from '../tests/p03/public-transcript.mjs';
import {FrozenPack,digest,policyDigest,selectNextRound,progressionStage} from '../packages/relationship-engine/dist/index.js';
import {syntheticCards,syntheticManifest} from '../tests/p03/fixtures.mjs';
import {createPlannerDiagnostics} from '../tests/p03/planner-diagnostics.mjs';
const cards=syntheticCards(),pack=FrozenPack.load(cards,syntheticManifest(cards,digest,policyDigest),true);
function diagnosticPlan(snapshot:ReturnType<typeof profile>,round:number,cardId:string,actors=snapshot.players.slice(0,2).map(p=>p.id)) {
  const card=pack.card(cardId),chosen=card.interaction==='group'?[]:card.interaction==='solo'?[actors[0]!]:actors;
  return {round_id:'33333333-3333-4333-8333-333333333333',round_index:round,card_id:card.id,card_revision:card.revision,actors:chosen,primary_member_id:chosen[0]??snapshot.players[0].id,interaction:card.interaction,stage:progressionStage(round,snapshot.total_rounds),mode:snapshot.mode,requires_action_consent:card.consent==='bilateral',pack_digest:pack.digest,policy_digest:policyDigest};
}
function firstTenPublic(snapshot:ReturnType<typeof profile>,session:ReturnType<ReturnType<typeof createPlannerDiagnostics>['session']>) {for(let round=1;round<=10;round++) session.record(diagnosticPlan(snapshot,round,'Q-'+String(round).padStart(4,'0')));}
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
  it('independently accounts for all production stages and raw session private caps',()=>{
    const snapshot=profile('diagnostic-correct',4,'questions','in_person',20),diagnostics=createPlannerDiagnostics(pack),session=diagnostics.session(snapshot,'diagnostic-correct'),history=[];
    for(let i=0;i<20;i++) {const plan=selectNextRound(snapshot,history,pack);session.record(plan);history.push(plan);}session.finish(true);
    const report=diagnostics.report();expect(report.status).toBe('PASS');expect(report.strata).toHaveLength(168);expect(report.sessions).toEqual([{seed:'diagnostic-correct',total_rounds:20,selected_rounds:20,private_count:history.filter(p=>p.interaction==='pair_private').length,private_cap:5,completed:true}]);
    const rows=report.strata.filter(row=>row.size===4&&row.mode==='questions'&&row.context==='in_person');expect(rows.every(row=>row.rounds===5)).toBe(true);expect(rows.slice(0,2).every(row=>row.private_selected===0&&row.private_eligible_before_cap===0)).toBe(true);expect(rows.reduce((sum,row)=>sum+Object.values(row.min_comfort_histogram).reduce((a,b)=>a+b,0),0)).toBe(20);
  });
  it('rejects a sixth private proposal past the cap and reports justified N2 repeats',()=>{
    const snapshot=profile('diagnostic-cap',2,'questions','in_person',20),diagnostics=createPlannerDiagnostics(pack),session=diagnostics.session(snapshot,'diagnostic-cap');firstTenPublic(snapshot,session);
    for(let round=11;round<=16;round++) session.record(diagnosticPlan(snapshot,round,'Q-'+String(104+(round-11)*4).padStart(4,'0')));session.finish(false);
    const report=diagnostics.report();expect(report.status).toBe('FAIL');expect(report.violations.some(v=>v.code==='PRIVATE_CAP_EXCEEDED')).toBe(true);expect(report.sessions[0].private_count).toBe(6);expect(report.strata.reduce((sum,row)=>sum+row.anti_repeat.same_pair_no_alternative_exceptions,0)).toBe(4);expect(report.strata.reduce((sum,row)=>sum+row.anti_repeat.violations,0)).toBe(0);
  });
  it('checks last private history across public rounds and requires an unused eligible alternative',()=>{
    const snapshot=profile('diagnostic-alternative',3,'questions','in_person',20),diagnostics=createPlannerDiagnostics(pack),session=diagnostics.session(snapshot,'diagnostic-alternative');firstTenPublic(snapshot,session);session.record(diagnosticPlan(snapshot,11,'Q-0104'));session.record(diagnosticPlan(snapshot,12,'Q-0011'));session.record(diagnosticPlan(snapshot,13,'Q-0108'));session.finish(false);
    const report=diagnostics.report(),row=report.strata.find(r=>r.size===3&&r.mode==='questions'&&r.context==='in_person'&&r.stage===3)!;
    expect(row.anti_repeat.decisions_with_unused_alternative).toBe(2);expect(row.anti_repeat.private_choices_with_alternative).toBe(1);expect(row.anti_repeat.violations).toBe(1);expect(row.anti_repeat.same_pair_no_alternative_exceptions).toBe(0);expect(report.violations.some(v=>v.code==='PRIVATE_PAIR_REPEATED_WITH_UNUSED_ALTERNATIVE')).toBe(true);
  });
  it('rejects private selections in the first two stages even when card metadata is otherwise safe',()=>{
    const snapshot=profile('diagnostic-too-early',2,'questions','in_person',20),diagnostics=createPlannerDiagnostics(pack),session=diagnostics.session(snapshot,'diagnostic-too-early');session.record(diagnosticPlan(snapshot,1,'Q-0104'));session.finish(false);expect(diagnostics.report().violations.some(v=>v.code==='PRIVATE_BEFORE_STAGE3')).toBe(true);
  });
});
