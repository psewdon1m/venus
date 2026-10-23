/** Measurement-only RE-016 diagnostics; never feeds a decision back to the engine.
 * Eligibility is sampled before anti-repeat, recovery and stochastic branch gates.
 * Counters describe successfully selected proposals, not delivered/accepted actions.
 */
import {eligible,progressionStage} from '../../packages/relationship-engine/dist/index.js';
const modes=['questions','truth_or_dare','yes_but'],contexts=['online','in_person'];
const pairKey=actors=>[...actors].sort().join(':');
export const plannerDiagnosticDesign={
  rows:'All168 Cartesian N2..8 x mode3 x context2 x stage1..4 rows exist, including zeros. rounds counts successfully selected plans; refused final selection attempts are excluded and retained separately by the invariant runner.',
  eligibility:'For each immutable snapshot/stage cache each unordered pair option with all eligible private cards. Admit an option only if its initial eligible common friend_or_more/min_comfort1/nonphysical/non-going-away pool has >=ceil(.25*total_rounds) cards. At each committed plan remove already-used card IDs, count remaining options before private cap, then suppress all private options when preceding private_count>=ceil(.25*total_rounds). These denominators precede anti-repeat/recovery/branch gates.',
  anti_repeat:'Previous pair means the last pair_private proposal anywhere in private history, even with public rounds between. An alternative is a different unordered pair with an unused admissible private card after the cap guard. Count decisions with such an alternative, selected private choices on those decisions, forbidden same-pair choices and justified same-pair selections when no alternative exists.',
  session_counters:'One raw {seed,total_rounds,selected_rounds,private_count,private_cap,completed} per attempted session. Private proposal counts must never exceed ceil(.25*total_rounds), including safely refused prefixes. Stage1/2 private selections are forbidden.',
  interpretation:'private_selected is a proposed private round whose public projection remains generic; no inference of invitation acceptance, action performance or successful private delivery. Distributions may plateau/fall at stage4 because the session cap/exhaustion applies. Recovery probability .35 is not empirically estimated here.'
};
export function createPlannerDiagnostics(pack) {
  const rows=new Map(),sessions=[],violations=[],cache=new WeakMap();
  for(let size=2;size<=8;size++) for(const mode of modes) for(const context of contexts) for(let stage=1;stage<=4;stage++) rows.set([size,mode,context,stage].join(':'),{size,mode,context,stage,rounds:0,private_eligible_before_cap:0,private_eligible_after_cap:0,private_options_before_cap_sum:0,private_options_after_cap_sum:0,private_selected:0,min_comfort_histogram:{0:0,1:0,2:0,3:0,4:0},interactions:{group:0,solo:0,pair_public:0,pair_private:0},anti_repeat:{decisions_with_unused_alternative:0,private_choices_with_alternative:0,violations:0,same_pair_no_alternative_exceptions:0}});
  function options(snapshot,stage) {
    let stages=cache.get(snapshot);if(!stages) {stages=new Map();cache.set(snapshot,stages);}if(stages.has(stage)) return stages.get(stage);
    const found=[],privateCards=stage<3?[]:pack.cards.filter(card=>card.mode===snapshot.mode&&card.interaction==='pair_private'),minimum=Math.ceil(.25*snapshot.total_rounds);
    if(privateCards.length) for(let a=0;a<snapshot.players.length;a++) for(let b=a+1;b<snapshot.players.length;b++) {
      const actors=[snapshot.players[a].id,snapshot.players[b].id],cards=privateCards.filter(card=>eligible(card,snapshot,actors,stage));
      if(cards.filter(card=>card.relationship_scope==='friend_or_more'&&card.min_comfort===1&&!card.requires_physical_contact&&!card.requires_going_away).length>=minimum) found.push({pair:pairKey(actors),cardIds:cards.map(card=>card.id)});
    }
    stages.set(stage,found);return found;
  }
  return {
    session(snapshot,seed) {
      const used=new Set(),cap=Math.ceil(.25*snapshot.total_rounds);let privateCount=0,selected=0,lastPrivate=null,ended=false;
      const fail=(code,plan)=>{violations.push({seed,round_index:plan.round_index,code});};
      return {
        record(plan) {
          if(ended) throw new Error('DIAGNOSTIC_SESSION_ALREADY_FINISHED');
          const stage=progressionStage(selected+1,snapshot.total_rounds),row=rows.get([snapshot.players.length,snapshot.mode,snapshot.context,stage].join(':')),card=pack.card(plan.card_id),before=options(snapshot,stage).filter(option=>option.cardIds.some(id=>!used.has(id))),after=privateCount<cap?before:[],alternative=lastPrivate!==null&&after.some(option=>option.pair!==lastPrivate);
          row.rounds++;row.private_eligible_before_cap+=before.length?1:0;row.private_eligible_after_cap+=after.length?1:0;row.private_options_before_cap_sum+=before.length;row.private_options_after_cap_sum+=after.length;
          row.min_comfort_histogram[card.min_comfort]++;row.interactions[plan.interaction]++;
          if(plan.round_index!==selected+1||plan.stage!==stage) fail('ROUND_SEQUENCE_OR_STAGE',plan);
          if(alternative) row.anti_repeat.decisions_with_unused_alternative++;
          if(plan.interaction==='pair_private') {
            row.private_selected++;const chosen=pairKey(plan.actors);privateCount++;
            if(alternative) {row.anti_repeat.private_choices_with_alternative++;if(chosen===lastPrivate) {row.anti_repeat.violations++;fail('PRIVATE_PAIR_REPEATED_WITH_UNUSED_ALTERNATIVE',plan);}}
            else if(lastPrivate!==null&&chosen===lastPrivate&&after.some(option=>option.pair===chosen)) row.anti_repeat.same_pair_no_alternative_exceptions++;
            if(stage<3) fail('PRIVATE_BEFORE_STAGE3',plan);
            if(privateCount>cap) fail('PRIVATE_CAP_EXCEEDED',plan);
            if(!after.some(option=>option.pair===chosen&&option.cardIds.includes(plan.card_id))) fail('PRIVATE_OPTION_NOT_ADMISSIBLE_AFTER_CAP',plan);
            lastPrivate=chosen;
          }
          used.add(plan.card_id);selected++;
        },
        finish(completed) {if(ended) throw new Error('DIAGNOSTIC_SESSION_ALREADY_FINISHED');ended=true;sessions.push({seed,total_rounds:snapshot.total_rounds,selected_rounds:selected,private_count:privateCount,private_cap:cap,completed});}
      };
    },
    report() {
      const strata=[...rows.values()],consistency=[];
      const fail=details=>consistency.push({seed:'diagnostic-aggregate',round_index:0,code:'COUNTER_RECONCILIATION',details});
      for(const row of strata) {
        const counters=[row.rounds,row.private_eligible_before_cap,row.private_eligible_after_cap,row.private_options_before_cap_sum,row.private_options_after_cap_sum,row.private_selected,...Object.values(row.min_comfort_histogram),...Object.values(row.interactions),...Object.values(row.anti_repeat)],sum=values=>Object.values(values).reduce((a,b)=>a+b,0);
        if(!counters.every(n=>Number.isSafeInteger(n)&&n>=0)||sum(row.min_comfort_histogram)!==row.rounds||sum(row.interactions)!==row.rounds||row.private_selected!==row.interactions.pair_private||row.private_eligible_before_cap>row.rounds||row.private_eligible_after_cap>row.private_eligible_before_cap||row.private_options_after_cap_sum>row.private_options_before_cap_sum||row.private_options_before_cap_sum<row.private_eligible_before_cap||row.private_options_after_cap_sum<row.private_eligible_after_cap||row.anti_repeat.decisions_with_unused_alternative>row.rounds||row.anti_repeat.private_choices_with_alternative>row.private_selected||row.anti_repeat.private_choices_with_alternative>row.anti_repeat.decisions_with_unused_alternative||row.anti_repeat.violations>row.anti_repeat.private_choices_with_alternative||row.anti_repeat.same_pair_no_alternative_exceptions>row.private_selected) fail([row.size,row.mode,row.context,row.stage].join(':'));
      }
      if(strata.reduce((n,row)=>n+row.rounds,0)!==sessions.reduce((n,session)=>n+session.selected_rounds,0)||strata.reduce((n,row)=>n+row.private_selected,0)!==sessions.reduce((n,session)=>n+session.private_count,0)||sessions.some(session=>session.completed&&session.selected_rounds!==session.total_rounds)) fail('raw session totals');
      const findings=[...violations,...consistency];return {status:findings.length?'FAIL':'PASS',design:plannerDiagnosticDesign,strata,sessions,violations:findings};
    }
  };
}
