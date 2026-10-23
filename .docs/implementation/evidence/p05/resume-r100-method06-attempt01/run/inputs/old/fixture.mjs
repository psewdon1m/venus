/** P05-TOPIC-MEASUREMENT-FIXTURE-1. Synthetic mechanism corpus; no approval. */
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FrozenPack,FrozenTopicMap,digest,policyDigest,TOPIC_MAP_VERSION} from '../../packages/relationship-engine/dist/index.js';
import {syntheticTopicFixtureCapability} from '../../packages/relationship-engine/dist/topic-map.js';
export const modes=['questions','truth_or_dare','yes_but'],contexts=['online','in_person'];
export const unions=[['creative'],['music'],['romance'],['creative','music'],['creative','romance'],['music','romance'],['creative','music','romance']];
export const approval={classification_status:'SYNTHETIC_MACHINE_FIXTURE',approved:false,runtime_eligible:false,owner_review_status:'SYNTHETIC_ONLY'};
const packId='venus-p05-measurement-synthetic',revision='P05-MEASUREMENT-FIXTURE-1';
const prefixes={questions:'Q',truth_or_dare:'TD',yes_but:'YB'};
const hash=b=>createHash('sha256').update(b).digest('hex');
function card(mode,number,interaction,context,family,topic_ids){
 const privatePair=interaction==='pair_private',id=prefixes[mode]+'-'+String(number).padStart(4,'0'),text={};
 for(const locale of ['ru','en','tr']){
  const marker=`SYNTHETIC ${locale.toUpperCase()} ${id}. `,roles=interaction==='group'?'Neutral group test.':interaction==='solo'?'Neutral {P1} test.':'Neutral {P1} and {P2} test.';
  text[locale]=mode==='questions'?{question:marker+roles}:mode==='truth_or_dare'?{truth:marker+'Truth '+roles,dare:marker+'Dare '+roles}:{proposal:marker+roles,responder:marker+'Choose yes, condition, or decline.'};
 }
 return{family,topic_ids,card:{schema_version:1,id,revision:1,pack_id:packId,mode,status:'draft',category:'icebreaker',interaction,participants_required:interaction==='group'?0:interaction==='solo'?1:2,meeting_contexts:context?[context]:contexts,relationship_scope:privatePair?'friend_or_more':interaction==='pair_public'?'acquaintance':'none',min_comfort:privatePair?1:0,min_progression_stage:privatePair?3:1,consent:interaction.startsWith('pair_')?'bilateral':'individual',requires_physical_contact:false,requires_going_away:false,required_capabilities:privatePair&&context==='online'?['private_text_chat']:[],safety_tags:['neutral',...(privatePair?['private']:[])],expected_duration_seconds:60,text,authoring:{origin:'agent',batch_id:revision,created_at:'2026-10-19T00:00:00Z',reviewed_by:null,reviewed_at:null,rights_status:'needs_review',policy_revision:'RE-1',instruction_revision:1,source_notes:'Synthetic mechanism fixture; not human classified or production approved.'}}};
}
export function fixtureDocuments(){
 const rows=[];
 for(const mode of modes){
  for(const [interaction,offset] of mode==='yes_but'?[['pair_public',0]]:[['group',0],['solo',128],['pair_public',256]])for(let i=0;i<128;i++)rows.push(card(mode,offset+i,interaction,null,`M-PUBLIC-${interaction}-F${i}`,['creative']));
  for(let u=0;u<unions.length;u++)for(let f=0;f<96;f++)for(let c=0;c<2;c++)rows.push(card(mode,2000+2*(96*u+f)+c,'pair_private',contexts[c],`M-PRIVATE-U${u}-F${f}`,unions[u]));
 }
 rows.push(card('questions',9000,'pair_public',null,'M-MIXED-QUARANTINE',['creative']),card('questions',9001,'pair_private','in_person','M-MIXED-QUARANTINE',['creative']));
 const cards=rows.map(r=>r.card),manifestPayload={schema_version:1,pack_id:packId,pack_revision:1,content_contract_revision:'CARD-1',policy_revision:'RE-1',policy_sha256:policyDigest.slice(7),status:'illustrative_draft_candidate',locale_codes:['ru','en','tr'],total_cards:cards.length,reviewed_cards:0,mode_counts:Object.fromEntries(modes.map(m=>[m,cards.filter(c=>c.mode===m).length])),category_counts:{},eligibility_cell_counts:{},cards:cards.map(c=>({id:c.id,revision:c.revision,sha256:digest(c),status:c.status})).sort((a,b)=>a.id.localeCompare(b.id)),caveats:['SYNTHETIC_MACHINE_FIXTURE; never human reviewed or published']};
 const manifest={...manifestPayload,canonical_payload_sha256:digest(manifestPayload)},pack=FrozenPack.load(cards,manifest,true);
 const taxonomy={schema:TOPIC_MAP_VERSION,taxonomy_revision:revision,...approval,topics:['creative','music','romance'].map(topic_id=>({topic_id,labels:{ru:topic_id,en:topic_id,tr:topic_id}}))};
 const byFamily=new Map();for(const r of rows){const members=byFamily.get(r.family)??[];members.push({card_id:r.card.id,card_revision:1,card_sha256:digest(r.card),interaction:r.card.interaction});byFamily.set(r.family,members);}
 const semantic={schema:TOPIC_MAP_VERSION,semantic_revision:revision,...approval,families:[...byFamily].map(([semantic_family_id,members])=>({semantic_family_id,classification:'EXPLICIT_FAMILY',mixed_visibility:semantic_family_id==='M-MIXED-QUARANTINE',repertoire:semantic_family_id==='M-MIXED-QUARANTINE'?'exclude':'eligible',members}))};
 const mapDoc={schema:TOPIC_MAP_VERSION,map_revision:revision,...approval,pack_digest:pack.digest,taxonomy_digest:digest(taxonomy),semantic_policy_digest:digest(semantic),entries:rows.map(r=>({card_id:r.card.id,card_revision:1,card_sha256:digest(r.card),mode:r.card.mode,interaction:r.card.interaction,topic_ids:r.topic_ids,semantic_family_ids:[r.family],locale_field_sha256:Object.fromEntries(['ru','en','tr'].map(locale=>[locale,Object.fromEntries(Object.entries(r.card.text[locale]).map(([field,text])=>[field,hash(text)]))]))}))};
 const bytes={map:Buffer.from(JSON.stringify(mapDoc)),taxonomy:Buffer.from(JSON.stringify(taxonomy)),semantic:Buffer.from(JSON.stringify(semantic))};
 const map=FrozenTopicMap.syntheticFixture(bytes,pack,syntheticTopicFixtureCapability());
 assert.equal(cards.length,4930);assert.equal(map.families.length,1057);assert.deepEqual(map.excluded_card_ids,['Q-9000','Q-9001']);
 assert.equal(new Set(map.families.filter(f=>f.semantic_family_id.startsWith('M-PRIVATE')).map(f=>f.semantic_family_id)).size,672);
 return {cards,manifest,taxonomy,semantic,mapDoc,bytes,pack,map};
}
/** Reload the exact persisted map/taxonomy/semantic bytes; do not reconstruct raw pins. */
export function loadFixture(directory){const read=name=>readFileSync(directory+'/'+name+'.json'),cards=JSON.parse(read('cards')),manifest=JSON.parse(read('manifest')),pack=FrozenPack.load(cards,manifest,true),bytes={map:read('map'),taxonomy:read('taxonomy'),semantic:read('semantic')},map=FrozenTopicMap.syntheticFixture(bytes,pack,syntheticTopicFixtureCapability());return{cards,manifest,pack,map,bytes,taxonomy:JSON.parse(bytes.taxonomy),semantic:JSON.parse(bytes.semantic),mapDoc:JSON.parse(bytes.map)};}
