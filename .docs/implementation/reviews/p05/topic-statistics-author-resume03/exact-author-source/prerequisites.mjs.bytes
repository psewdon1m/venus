import assert from 'node:assert/strict';
import {sizes,modes,contexts,caps,sha} from './protocol.mjs';
export const mutationClasses=['start','invitation_accept','choice_truth','choice_dare','condition','topic_one_ack','topic_two_acks','other_question','targeted_topic','exclude_current_full_union','advice_offer','advice_accept','advice_edit','advice_accept_edit','advice_revoke','stale_advice_response','chat_send','chat_denied','safe_empty_skip','finish','advance','session_complete'];
export const semanticAssertions=['same_pair_cross_session_cross_mode_family_block','different_pair_private_family_allowed','public_history_blocks_roomwide','mixed_visibility_whole_family_quarantined','full_union_targeted_attempt_actor_stage_budget_fence','fresh_authority_serializers_and_private_boundaries'];
export function runtimeCells(){return sizes.flatMap(size=>modes.flatMap(mode=>contexts.flatMap(context=>caps.map(capability=>({size,mode,context,capability,private_positive:context==='in_person'||capability==='CHAT_ON',different_pair: size>=3&&(context==='in_person'||capability==='CHAT_ON'),maximum_predeclared_sessions:3,rounds:100})))));}
export function runtimeReceipt(receipt,{source,image,pins}){
 assert.equal(receipt.kind,'ACTUAL_PG_HTTP_WS_TOPIC_CANARIES');assert.equal(receipt.source_identity,source);assert.equal(receipt.image,image);assert.deepEqual(receipt.input_pins,pins);assert.equal(receipt.synthetic_machine_only,true);assert.equal(receipt.human_content_approval,false);assert.equal(receipt.cleanup,'completed');
 const cells=runtimeCells();assert.equal(receipt.cells.length,84);const seen=new Set();
 for(const actual of receipt.cells){const key=[actual.size,actual.mode,actual.context,actual.capability].join('/');assert(!seen.has(key));seen.add(key);const expected=cells.find(c=>[c.size,c.mode,c.context,c.capability].join('/')===key);assert(expected);assert(actual.predeclared_sessions.length<=3&&actual.predeclared_sessions.length>0);assert(actual.predeclared_sessions.every(s=>typeof s.seed_literal==='string'&&s.rounds===100&&s.prefix_retained===true));assert.equal(actual.actual_PG,true);assert.equal(actual.actual_HTTP,true);assert.equal(actual.actual_WS,true);
  for(const name of semanticAssertions){const value=actual.assertions[name];if(name==='different_pair_private_family_allowed'&&!expected.different_pair)assert.equal(value,expected.private_positive?'NA_SINGLE_UNORDERED_PAIR':'NA_PRIVATE_CAPABILITY');else if(!expected.private_positive&&name==='same_pair_cross_session_cross_mode_family_block')assert.equal(value,'NA_PRIVATE_CAPABILITY');else assert.equal(value,'PASS',name);}
  if(!expected.private_positive)assert.deepEqual(actual.capability_denial,{get:'PASS',post:'PASS',self_actions:'PASS',public_flows:'PASS'});
 }
 return{status:'RUNTIME_RECEIPT_SCHEMA_COMPLETE_REQUIRES_INDEPENDENT_RAW_AUDIT',cells:84,raw_index_sha256:receipt.raw_index_sha256};
}
function normalized(value,maps,base){
 if(Array.isArray(value))return value.map(x=>normalized(x,maps,base));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,k==='server_time'&&typeof v==='string'?Date.parse(v)-base:normalized(v,maps,base)]));
 if(typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)){if(!maps.has(value))maps.set(value,'UUID_'+maps.size);return maps.get(value);}return value;
}
/** Exact per-script bytes except bijective UUID identities and clock origin;
 * no revision/sequence/field/frame filtering. Real WS coalescing mismatch fails.
 */
export function serializerParity(actual,modeled,{requiredLabels=mutationClasses,actualActorRoles={},modeledActorRoles={}}={}){
 assert.deepEqual(Object.values(actualActorRoles).sort(),Object.values(modeledActorRoles).sort(),'PARITY_ACTOR_ROLE_BINDINGS');assert.equal(new Set(Object.values(actualActorRoles)).size,Object.keys(actualActorRoles).length,'DUPLICATE_ACTOR_ROLE');
 assert(actual.length>0&&actual.length===modeled.length,'PARITY_OBSERVATION_COUNT');const seen=new Set(),aIds=new Map(Object.entries(actualActorRoles)),mIds=new Map(Object.entries(modeledActorRoles)),firstTime=rows=>{for(const r of rows){const v=JSON.parse(r.raw_serialized_UTF8);if(typeof v.server_time==='string')return Date.parse(v.server_time);}return 0;},aTime=firstTime(actual),mTime=firstTime(modeled);
 for(let i=0;i<actual.length;i++){
  const a=actual[i],m=modeled[i];assert(['HTTP','WS'].includes(a.transport));assert(['MODELED_HTTP','MODELED_PUBLIC'].includes(m.transport));assert.equal(a.channel,m.channel);assert.equal(a.operation_kind_diagnostic_only,m.operation_kind_diagnostic_only);assert.equal(a.http_status,m.http_status);assert.equal(Boolean(a.emitted_frame),Boolean(m.modeled_frame));assert.equal(sha(a.raw_serialized_UTF8),a.raw_sha256);assert.equal(sha(m.raw_serialized_UTF8),m.raw_sha256);
  assert.deepEqual(normalized(JSON.parse(a.raw_serialized_UTF8),aIds,aTime),normalized(JSON.parse(m.raw_serialized_UTF8),mIds,mTime),'PRODUCTION_SERIALIZER_OR_MUTATION_PARITY');seen.add(a.operation_kind_diagnostic_only);
 }
 for(const label of requiredLabels)assert(seen.has(label),'MISSING_PARITY_MUTATION:'+label);
 return{status:'EXACT_SUPPLIED_TRANSCRIPTS_PARITY_ONLY',observations:actual.length,labels:[...seen],normalization:'bijective UUID identifiers and one clock origin only; all public fields/revisions/frame counts retained',actual_origin_proof:'REQUIRES_SEPARATE_SOURCE_BOUND_PG_HTTP_WS_RAW_AUDIT'};
}
