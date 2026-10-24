/** Existing loader/eligibility only. No planner/C2 simulation, registry activation or source/card writes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {manifestFor,coverageSnapshot} from '../../../../../packages/card-catalog/dist/index.js';
import {FrozenPack,digest,eligible} from '../../../../../packages/relationship-engine/dist/index.js';
import {FrozenTopicMap,syntheticTopicFixtureCapability} from '../../../../../packages/relationship-engine/dist/topic-map.js';
const dir=fileURLToPath(new URL('.',import.meta.url));
const read=p=>JSON.parse(fs.readFileSync(p));
const index=read('.docs/implementation/evidence/p04/review470-r4/source-index470.json');
const cards=index.cards.map(r=>read(r.path)),manifest=manifestFor(cards,1,false),pack=FrozenPack.load(cards,manifest,true);
assert.deepEqual(manifest,read(dir+'projection/pack-manifest.json'));
const docs={map:read(dir+'projection/map.json'),taxonomy:read(dir+'projection/taxonomy.json'),semantic:read(dir+'projection/semantic.json')};
const bytes=d=>Object.fromEntries(Object.entries(d).map(([k,v])=>[k,Buffer.from(JSON.stringify(v))]));
const rawBytes=Object.fromEntries(['map','taxonomy','semantic'].map(k=>[k,fs.readFileSync(dir+'projection/'+k+'.json')]));
const cap=syntheticTopicFixtureCapability(),map=FrozenTopicMap.syntheticFixture(rawBytes,pack,cap);
assert.equal(pack.digest,'sha256:d1a7cb38be173c673665c30ae8e91792940438b675f8830d72503eebed9985d4');
assert.equal(map.entries.length,470);assert.equal(map.families.length,393);assert.equal(map.excluded_card_ids.length,59);
const semantic=read(dir+'semantic-families.candidate.v1.json'),audit=read(dir+'semantic-operation-audit470.json');
const exportPrecondition=(sem,a)=>{
 assert.deepEqual(sem.author_technical_unresolved_ids,[]);
 assert.equal(a.cards.length,470);assert.equal(new Set(a.cards.map(c=>c.card_id)).size,470);
 assert(a.cards.every(c=>c.technical_semantic_unresolved===false&&c.semantic_family_ids.length>0));
};
exportPrecondition(semantic,audit);
const authorSingles=map.families.filter(f=>f.members.length===1);
assert.equal(authorSingles.length,345);
assert(semantic.families.every(f=>f.classification==='EXPLICIT_FAMILY'));
assert(semantic.families.filter(f=>f.author_kind==='EXPLICIT_REVIEWED_SINGLE_OPERATION').every(f=>f.compared_neighbor_ids.length>=2&&f.contrast_rationale.trim().length>20));
const tests=[];
const expectedCodes={unresolved_source_refuses_export:'ERR_ASSERTION',unresolved_card_refuses_export:'ERR_ASSERTION',missing_operation_refuses_export:'ERR_ASSERTION',unbranded_capability_refused:'TOPIC_FIXTURE_ONLY',production_admission_refused:'TOPIC_NOT_APPROVED',forged_approval_refused:'TOPIC_NOT_APPROVED',wrong_revision_refused:'TOPIC_CARD_BINDING_INVALID',wrong_canonical_card_hash_refused:'TOPIC_CARD_BINDING_INVALID',wrong_locale_field_hash_refused:'TOPIC_LOCALE_BINDING_INVALID',missing_locale_refused:'TOPIC_FIELDS_INVALID',unknown_topic_refused:'TOPIC_UNKNOWN',unknown_family_refused:'TOPIC_FAMILY_BINDING_INVALID',missing_family_membership_refused:'TOPIC_FAMILY_BINDING_INVALID',partial_mixed_exclusion_refused:'TOPIC_MIXED_FAMILY_INVALID',incorrect_mixed_flag_refused:'TOPIC_MIXED_FAMILY_INVALID',duplicate_card_refused:'TOPIC_COVERAGE_INVALID',ID_identity_multi_family_refused:'TOPIC_MIXED_FAMILY_INVALID'};
const negative=(name,fn)=>{let observed;try{fn();}catch(error){observed=error;}assert(observed,name+' must reject');assert.equal(observed.code,expectedCodes[name],name+' exact typed rejection');tests.push({name,error_code:observed.code});};
negative('unresolved_source_refuses_export',()=>exportPrecondition({...semantic,author_technical_unresolved_ids:['Q-1001']},audit));
negative('unresolved_card_refuses_export',()=>{const a=globalThis.structuredClone(audit);a.cards[0].technical_semantic_unresolved=true;exportPrecondition(semantic,a);});
negative('missing_operation_refuses_export',()=>{const a=globalThis.structuredClone(audit);a.cards[0].semantic_family_ids=[];exportPrecondition(semantic,a);});
negative('unbranded_capability_refused',()=>FrozenTopicMap.syntheticFixture(bytes(docs),pack,{scope:'SYNTHETIC_TOPIC_FIXTURE_ONLY'}));
negative('production_admission_refused',()=>FrozenTopicMap.load(rawBytes,pack,{approval_id:'NOT-AN-APPROVAL',approval_status:'APPROVED',pack_digest:pack.digest,map_sha256:'0'.repeat(64),taxonomy_sha256:'0'.repeat(64),semantic_sha256:'0'.repeat(64)}));
const mutated=(name,mut)=>negative(name,()=>{const d=globalThis.structuredClone(docs);mut(d);d.map.taxonomy_digest=digest(d.taxonomy);d.map.semantic_policy_digest=digest(d.semantic);FrozenTopicMap.syntheticFixture(bytes(d),pack,cap);});
mutated('forged_approval_refused',d=>{d.map.classification_status='APPROVED';d.map.approved=true;d.map.runtime_eligible=true;d.map.owner_review_status='APPROVED';});
mutated('wrong_revision_refused',d=>{d.map.entries[0].card_revision++;});
mutated('wrong_canonical_card_hash_refused',d=>{d.map.entries[0].card_sha256='0'.repeat(64);});
mutated('wrong_locale_field_hash_refused',d=>{d.map.entries[0].locale_field_sha256.ru.question='0'.repeat(64);});
mutated('missing_locale_refused',d=>{delete d.map.entries[0].locale_field_sha256.tr;});
mutated('unknown_topic_refused',d=>{d.map.entries[0].topic_ids=['not-known'];});
mutated('unknown_family_refused',d=>{d.map.entries[0].semantic_family_ids=['NOT-KNOWN'];});
mutated('missing_family_membership_refused',d=>{d.semantic.families[0].members.pop();});
mutated('partial_mixed_exclusion_refused',d=>{const f=d.semantic.families.find(f=>f.mixed_visibility);f.repertoire='eligible';});
mutated('incorrect_mixed_flag_refused',d=>{d.semantic.families.find(f=>f.mixed_visibility).mixed_visibility=false;});
mutated('duplicate_card_refused',d=>{d.map.entries.push(globalThis.structuredClone(d.map.entries[0]));});
mutated('ID_identity_multi_family_refused',d=>{d.semantic.families[0].classification='IDENTITY_ONLY';});
const correctedGroups=[['Q-1127','YB-1127'],['TD-1014','YB-1014','YB-1055'],['TD-1044','YB-1049','YB-1039']];
const regroupingCheck=d=>{for(const ids of correctedGroups){const refs=ids.map(id=>d.map.entries.find(e=>e.card_id===id));assert(refs[0].semantic_family_ids.some(f=>refs.every(e=>e.semantic_family_ids.includes(f))),'formal03 group must share family');}};
regroupingCheck(docs);
for(const [index,splitId] of ['YB-1127','YB-1055','YB-1039'].entries()){
 const d=globalThis.structuredClone(docs),e=d.map.entries.find(e=>e.card_id===splitId),oldId=e.semantic_family_ids[0],f=d.semantic.families.find(f=>f.semantic_family_id===oldId),member=f.members.find(m=>m.card_id===splitId);
 f.members=f.members.filter(m=>m.card_id!==splitId);const id='CONTROL-FALSE-SPLIT-'+index;e.semantic_family_ids=[id];d.semantic.families.push({semantic_family_id:id,classification:'EXPLICIT_FAMILY',mixed_visibility:false,repertoire:'eligible',members:[member]});d.map.semantic_policy_digest=digest(d.semantic);
 FrozenTopicMap.syntheticFixture(bytes(d),pack,cap); // Structurally valid but semantically wrong: review-specific control must reject.
 const name='formal03_false_distinct_'+splitId;expectedCodes[name]='ERR_ASSERTION';negative(name,()=>regroupingCheck(d));
}
const correction=map.entry('YB-1175');assert(correction.topic_ids.includes('personal_boundaries'));
const topicPrior=read('.docs/implementation/evidence/p05/topic-map-r4-candidate-01/private-topic-map.candidate.v1.json');
for(const e of map.entries){const prior=topicPrior.entries.find(p=>p.card_id===e.card_id);assert.deepEqual(e.topic_ids,e.card_id==='YB-1175'?[...new Set([...prior.topic_ids,'personal_boundaries'])].sort():prior.topic_ids);}
// Necessary static counts only: no RNG, history, 20round planning or C2 session runs.
const actorSets=(c,s)=>c.interaction==='group'?[[]]:c.interaction==='solo'?s.players.map(p=>[p.id]):s.players.flatMap(a=>s.players.filter(b=>a.id!==b.id).map(b=>[a.id,b.id]));
const staticCells=[];
for(const context of ['online','in_person'])for(const mode of ['questions','truth_or_dare','yes_but']){
 const neutral=coverageSnapshot(pack,2,mode,context,0,'F',20,['private_text_chat']);
 const p=coverageSnapshot(pack,2,mode,context,1,'F',100,['private_text_chat']);
 const filter=(s,stage)=>pack.cards.filter(c=>c.mode===mode&&map.allowed(c)&&actorSets(c,s).some(a=>eligible(c,s,a,stage)));
 const n=filter(neutral,1),privateCards=filter(p,3).filter(c=>c.interaction==='pair_private'&&c.relationship_scope==='friend_or_more'&&c.min_comfort===1&&!c.requires_physical_contact&&!c.requires_going_away);
 const neutralFamilySlots=new Set(n.map(c=>{assert.equal(map.entry(c.id).semantic_family_ids.length,1);return map.entry(c.id).semantic_family_ids[0];})).size;
 const off=coverageSnapshot(pack,2,mode,context,1,'F',100,[]);
 assert.equal(filter(off,3).filter(c=>c.interaction==='pair_private').length,0);
 staticCells.push({mode,context,size:2,profile:'NECESSARY_STATIC_COUNTS_ONLY_NO_HISTORY_NO_PERSONAL_TOPIC_EXCLUSIONS',private_baseline_C1_F_S3:privateCards.length,required_private_baseline:25,private_necessary_count:privateCards.length>=25?'SATISFIED_NOT_C2_PROOF':'CONTENT_GAP',neutral_C0_F_S1_card_ids:n.length,neutral_distinct_operation_slots:neutralFamilySlots,required_neutral_rounds:20,neutral_necessary_count:neutralFamilySlots>=20?'SATISFIED_NOT_20ROUND_PROOF':'CONTENT_GAP',capability_off_private_ids:0});
}
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const k of ['map','taxonomy','semantic'])assert.equal(map.pins[k+'_sha256'],sha(dir+'projection/'+k+'.json'));
console.log(JSON.stringify({status:'DRAFT_SYNTHETIC_SCHEMA_AND_BOUNDED_CONTROLS_PASS_NOT_C2_OR_APPROVAL',pack_digest:pack.digest,synthetic_pack:true,synthetic_map:map.synthetic,entries:470,topics:13,families:393,explicit_manual_single_operation_families:345,multi_families:48,mixed_families:map.families.filter(f=>f.mixed_visibility).length,static_excluded_ids:map.excluded_card_ids,negative_controls_rejected:tests,topic_correction:'YB-1175+personal_boundaries',loader_pins:map.pins,compiled_inputs:Object.fromEntries(['packages/card-catalog/dist/catalog.js','packages/card-catalog/dist/coverage.js','packages/relationship-engine/dist/pack.js','packages/relationship-engine/dist/topic-map.js','packages/relationship-engine/dist/engine.js'].map(p=>[p,sha(p)])),static_cells:staticCells,actual_C2:'NOT_RUN',actual_current_app_transport:'NOT_PROVEN_HERE',human_review:'HOLD',registry_changed:false},null,2));
