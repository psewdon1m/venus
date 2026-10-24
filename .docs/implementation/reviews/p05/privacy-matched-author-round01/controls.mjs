import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {caseAt,count,classifyPair,measureMatched,summarize} from './consumer.mjs';
import {bindEnvironment} from '../p05-pilot-corpus-ranges02/m3/adapter.mjs';
import * as engine from '../../packages/relationship-engine/dist/index.js';
import * as planner from '../../packages/relationship-engine/dist/topic-planner.js';
import * as renderer from '../../apps/api/dist/topic-game-model.js';
import {syntheticTopicFixtureCapability} from '../../packages/relationship-engine/dist/topic-map.js';
import {syntheticCards,syntheticManifest} from '../../tests/p03/fixtures.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),out=[];
const test=(name,fn)=>{fn();out.push({name,status:'PASS'});};

test('84fixedordinals42cellsR20R100',()=>{assert.equal(count,84);const cells=new Map();for(let i=0;i<count;i++){const d=caseAt(i);assert.equal(d.ordinal,i);const key=[d.size,d.mode,d.context].join('/');const values=cells.get(key)??[];values.push(d.rounds);cells.set(key,values);}assert.equal(cells.size,42);assert([...cells.values()].every(x=>x.join(',')==='20,100'));});
for(const i of [-1,84,NaN,Infinity,0.5,'0'])test('invalidordinal_'+String(i),()=>assert.throws(()=>caseAt(i)));
const fake=(overrides={})=>({status:'COMPLETE_DOMAIN_MODEL',counts:{private_playable:1,private_safe_empty:0},refusal:null,raw_rounds:[{round_id:'same',round_index:1,stage:3,interaction:'pair_private',card:{card_id:'HIDDEN'},actors:['privateA','privateB']}],public_frames:[{modeled_tick:0,payload:{game_rev:1,current_round:{round_id:'same',round_index:1,kind:'generic',state:'pending'}}}],...overrides});
test('positivecommonexactpublictrace',()=>assert.equal(classifyPair(fake(),fake(),{changed:true,effective:true}).status,'PASS_MATCHED_DOMAIN_ONLY'));
test('hiddencardactorsdonotenterpublicsequence',()=>{const v=fake();v.raw_rounds[0].card={card_id:'OTHER'};v.raw_rounds[0].actors=['secretC','secretD'];assert.equal(classifyPair(fake(),v,{changed:true,effective:true}).status,'PASS_MATCHED_DOMAIN_ONLY');});
test('publicrevisiondifferenceFAILnotignored',()=>{const v=fake();v.public_frames[0].payload.game_rev=2;assert.equal(classifyPair(fake(),v,{changed:true,effective:true}).status,'FAIL_COMMON_SUPPORT_PUBLIC_TRACE');});
test('publicsequencedifferenceFAILbeforelabel',()=>{const v=fake();v.raw_rounds[0].round_id='other';assert.equal(classifyPair(fake(),v,{changed:true,effective:true}).status,'FAIL_SELECTOR_PUBLIC_SEQUENCE');});
test('privateemptyretainedneverclaimedcommonPASS',()=>{const v=fake({counts:{private_playable:0,private_safe_empty:1}});const r=classifyPair(fake(),v,{changed:true,effective:true});assert.equal(r.status,'RETAINED_OUT_OF_SUPPORT_NOT_PRIVACY_PASS');assert.equal(r.variant_safe_empty,1);});
test('typedrefusalretainedNOTPASS',()=>{const v=fake({status:'SAFE_REFUSAL',refusal:{reason:'TOPIC_SAFE_POOL_EXHAUSTED'}});const r=classifyPair(fake(),v,{changed:true,effective:true});assert.equal(r.status,'RETAINED_OUT_OF_SUPPORT_NOT_PRIVACY_PASS');assert.equal(r.retained_refusals[1].reason,'TOPIC_SAFE_POOL_EXHAUSTED');});
test('unchangedhiddenfixtureNOTPASS',()=>assert.notEqual(classifyPair(fake(),fake(),{changed:false,effective:true}).status,'PASS_MATCHED_DOMAIN_ONLY'));
test('ineffectiveexclusionNOTPASS',()=>assert.notEqual(classifyPair(fake(),fake(),{changed:true,effective:false}).status,'PASS_MATCHED_DOMAIN_ONLY'));
test('narrowmodeldiffreversibleexactparent',()=>{let s=fs.readFileSync(new URL('./matched-model.mjs',import.meta.url),'utf8');s=s.replaceAll("from '../p05-pilot-corpus-ranges02/m3/","from './").replace('{onFrame=()=>{},onRound=()=>{},initialSafety=null,prior={public_history:[],private_history:[]}}={}','{onFrame=()=>{},onRound=()=>{}}={}').replace('const safety=initialSafety??{room_id:','const safety={room_id:').replace('p.createTopicHistory(snapshot,pack,map,prior),completed=','p.createTopicHistory(snapshot,pack,map),completed=').replace('allow:safety.members.find(m=>m.member_id===actor).allow_topic_ids,excluded:safety.members.find(m=>m.member_id===actor).excluded_topic_ids','allow:safety.members.find(m=>m.member_id===actor).allow_topic_ids,excluded:[]');assert.equal(s,fs.readFileSync(new URL('../p05-pilot-corpus-ranges02/m3/model.mjs',import.meta.url),'utf8'));});
// Own finite synthetic600card fixture, NOT a470pilot stratum/corpus outcome.
const cards=syntheticCards(),pack=engine.FrozenPack.load(cards,syntheticManifest(cards,engine.digest,engine.policyDigest),true),flags={classification_status:'SYNTHETIC_MACHINE_FIXTURE',approved:false,runtime_eligible:false,owner_review_status:'SYNTHETIC_ONLY'};
const taxonomy={schema:engine.TOPIC_MAP_VERSION,taxonomy_revision:'M3-FINITE-1',...flags,topics:[{topic_id:'creative_expression',labels:{ru:'creative',en:'creative',tr:'creative'}}]};
const semantic={schema:engine.TOPIC_MAP_VERSION,semantic_revision:'M3-FINITE-1',...flags,families:cards.map(c=>({semantic_family_id:'UNIT-'+c.id,classification:'IDENTITY_ONLY',mixed_visibility:false,repertoire:'eligible',members:[{card_id:c.id,card_revision:c.revision,card_sha256:engine.digest(c),interaction:c.interaction}]}))};
const doc={schema:engine.TOPIC_MAP_VERSION,map_revision:'M3-FINITE-1',...flags,pack_digest:pack.digest,taxonomy_digest:engine.digest(taxonomy),semantic_policy_digest:engine.digest(semantic),entries:cards.map(c=>({card_id:c.id,card_revision:c.revision,card_sha256:engine.digest(c),mode:c.mode,interaction:c.interaction,topic_ids:['creative_expression'],semantic_family_ids:['UNIT-'+c.id],locale_field_sha256:Object.fromEntries(['ru','en','tr'].map(locale=>[locale,Object.fromEntries(Object.entries(c.text[locale]).map(([k,v])=>[k,sha(v)]))]))}))};
const map=engine.FrozenTopicMap.syntheticFixture({map:Buffer.from(JSON.stringify(doc)),taxonomy:Buffer.from(JSON.stringify(taxonomy)),semantic:Buffer.from(JSON.stringify(semantic))},pack,syntheticTopicFixtureCapability());
const env=bindEnvironment({pack,map},engine,planner,renderer,JSON.parse(fs.readFileSync('.docs/contracts/relationship-policy.v1.json')));
test('nonDomainFailurepreservesfailedprefixandneverretries',()=>{let calls=0;const fault=Object.assign(new Error('FINITE_PRIVATE_CANARY_NOT_PROJECTED'),{domain_prefix:{status:'FAIL_DOMAIN_PREFIX_NOT_COMPLETE'}});assert.throws(()=>measureMatched(env,caseAt(0),{run:(_env,_d,{onFrame})=>{calls++;onFrame({payload:{current_round:{kind:'generic'}}});throw fault;}}),error=>error===fault&&error.matched_prefix.failed_arm_ordinal===0&&error.matched_prefix.completed_arms.length===0&&error.matched_prefix.public_frames.length===1&&error.matched_prefix.domain_prefix===fault.domain_prefix);assert.equal(calls,1);});
test('summaryrequiresboundnativefullreplaynotprojectedstatuses',()=>{assert.throws(()=>summarize([]),/Bound native environment/);assert.throws(()=>summarize([],env));});

for(const ordinal of [0,1])test('nativefinite_synthetic_'+ordinal,()=>{const r=measureMatched(env,caseAt(ordinal));assert.equal(r.actual_transport,false);assert.equal(r.full_P05_PASS,false);assert.equal(r.comparisons.exclusion.sequence_equal,true);assert.equal(r.comparisons.semantic.sequence_equal,true);assert.equal(r.comparisons.exclusion.status,'RETAINED_OUT_OF_SUPPORT_NOT_PRIVACY_PASS');assert.equal(r.raw.exclusion.counts.private_playable,0);assert.equal(r.raw.prior.history.provenance,'RUNTIME');assert.equal(r.raw.prior.history.session_id,'33333333-3333-4333-8333-333333333333');assert(r.raw.base.history.public_history.some(x=>x.session_id===r.raw.prior.history.session_id));assert.equal(r.public_snapshot_sha256,engine.digest(env.makeSnapshot(r.descriptor)));});
test('nativefinite_synthetic_supported_exclusion_exact_trace',()=>{
 const t={...taxonomy,topics:[...taxonomy.topics,{topic_id:'music_sound',labels:{ru:'music',en:'music',tr:'music'}}]};
 const native=env.makeSnapshot(caseAt(0)).baseline;
 const eligibleIds=cards.filter(card=>card.interaction==='pair_private'&&engine.eligible(card,native,native.players.map(p=>p.id),4)).map(card=>card.id).sort();assert(eligibleIds.length>=2);
 const musicIds=new Set(eligibleIds.slice(Math.ceil(eligibleIds.length/2)));
 const d={...doc,taxonomy_digest:engine.digest(t),entries:doc.entries.map(row=>({...row,topic_ids:musicIds.has(row.card_id)?['music_sound']:['creative_expression']}))};
 const two=engine.FrozenTopicMap.syntheticFixture({map:Buffer.from(JSON.stringify(d)),taxonomy:Buffer.from(JSON.stringify(t)),semantic:Buffer.from(JSON.stringify(semantic))},pack,syntheticTopicFixtureCapability());
 const environment=bindEnvironment({pack,map:two},engine,planner,renderer,env.relationshipPolicy),r=measureMatched(environment,caseAt(0));
 assert.equal(r.comparisons.exclusion.classification,'COMMON_SUPPORT_FULL_CONTROLLED_LIFECYCLE');assert.equal(r.comparisons.exclusion.public_trace_equal,true);assert.equal(r.comparisons.exclusion.sequence_equal,true);assert(r.affected_eligible_private_card_ids.length>0);assert(r.raw.base.counts.private_playable>0);assert(r.raw.exclusion.counts.private_playable>0);
});
console.log(JSON.stringify({status:'PASS_FINITE_SYNTHETIC_AND_PROJECTION_ONLY_NO_REAL470_RUN',checks:out.length,checks_detail:out}));
