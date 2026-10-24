/** Materialize the explicitly authored, bounded pilot batch. No stochastic generation,
 * approvals, network, publication or existing-ID overwrite. Reservations are separate. */
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {strictJson,analyze} from '../packages/card-catalog/dist/index.js';
const sourcePath='.docs/content/p04/neutral-batch-001-source.json',source=strictJson(readFileSync(sourcePath,'utf8'));
const out=process.argv[2];if(!out) throw new Error('Usage: node tools/p04-draft-batch.mjs NEW_OUTPUT_DIRECTORY');
const cards=[];
for(const mode of ['questions','truth_or_dare','yes_but']) {
  if(source[mode].length!==20||source.status!=='draft') throw new Error('Bounded draft pilot input mismatch');
  for(const [index,row] of source[mode].entries()) {
    const pair=mode==='yes_but',solo=mode==='truth_or_dare',text={};
    for(const [offset,locale] of ['ru','en','tr'].entries()) text[locale]=mode==='truth_or_dare'?{truth:row[1+2*offset],dare:row[2+2*offset]}:mode==='questions'?{question:row[1+offset]}:
      {proposal:row[1+offset],responder:{ru:'Игрок {P2} может согласиться, предложить своё условие или отказаться без объяснений.',en:'{P2} may agree, set their own condition, or decline without giving a reason.',tr:'{P2} kabul edebilir, kendi koşulunu belirtebilir veya açıklama yapmadan reddedebilir.'}[locale]};
    cards.push({schema_version:1,id:`${{questions:'Q',truth_or_dare:'TD',yes_but:'YB'}[mode]}-${1001+index}`,revision:1,pack_id:'venus-cards-core',mode,status:'draft',category:row[0],
      interaction:pair?'pair_public':solo?'solo':'group',participants_required:pair?2:solo?1:0,meeting_contexts:['online','in_person'],relationship_scope:pair?'acquaintance':'none',
      min_comfort:0,min_progression_stage:1,consent:pair?'bilateral':'individual',requires_physical_contact:false,requires_going_away:false,required_capabilities:[],safety_tags:['neutral'],expected_duration_seconds:60,text,
      authoring:{origin:'agent',batch_id:`P04-NEUTRAL-001-${{questions:'Q',truth_or_dare:'TD',yes_but:'YB'}[mode]}`,created_at:source.created_at,reviewed_by:null,reviewed_at:null,rights_status:'needs_review',policy_revision:'RE-1',instruction_revision:1,source_notes:source.source_notes}});
  }
}
analyze(cards);mkdirSync(out);for(const card of cards) writeFileSync(`${out}/${card.id}.json`,JSON.stringify(card,null,2)+'\n',{flag:'wx'});
console.log('Created60 draft cards,20/mode; no review, rights clearance or release claimed.');
