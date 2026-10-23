import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {exactUiMutation,safeErrorMetadata,safeOfferMetadata} from 'file:///C:/.projects/venus/.artifacts/p05-private-batch-browser-producer14/request-emission.mjs';
const root='.docs/implementation/reviews/p05/topic-browser-method14-independent-review-round01',rows=[],findings=[];
async function test(name,fn){await fn();rows.push({name,status:'PASS'});}
async function probe(options={}){
 let clicks=0,event,bodyReads=0;const id='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002',path='/api/v2/rooms/r/game/s/round/q/conversation/commands';
 const body={request_id:id,kind:options.advice?'offer_advice':'offer_topic',expected_epoch:1,topic_ids:['creative'],text:'PRIVATE_TEXT_CANARY'};
 const request={url:()=> 'https://fixture.invalid'+path,method:()=> 'POST',postDataJSON:()=>body};
 const response={request:()=>({...request,postDataJSON:()=>({...body,request_id:options.mismatched?other:id})}),status:()=>options.status??409,json:async()=>{bodyReads++;if(options.timeout)return new Promise(()=>{});if(options.malformed)throw Error('PRIVATE_ERROR_CANARY');return options.payload??{code:'RATE_LIMIT',message:'PRIVATE_MESSAGE_CANARY',token:'PRIVATE_TOKEN_CANARY',nested:{cookie:'PRIVATE_COOKIE_CANARY'}};}};
 const started=performance.now();let value,error;
 try{value=await exactUiMutation({page:{waitForRequest:async()=>request,waitForResponse:async()=>response},path,kind:body.kind,control:options.advice?'advice-offer':'topic-new',prepare:async()=>({deadline_monotonic_ms:5000}),click:async()=>{clicks++;},record:r=>{event=r;},now:()=>0});}catch(e){error=e;}
 return {value,error,event,clicks,bodyReads,elapsed:performance.now()-started};
}
await test('allowlisted_non200_code_status_copied_without_other_payload',async()=>{const p=await probe();assert(p.error);assert.equal(p.event.domain_error_code,'RATE_LIMIT');assert.equal(p.event.response_status,409);assert.equal(p.clicks,1);assert(!JSON.stringify(p.event).includes('CANARY'));assert.deepEqual(p.event.offer_fixture_topic_ids,['creative']);});
await test('unknown_code_private_canary_never_persisted',async()=>{const p=await probe({payload:{code:'PRIVATE_CODE_CANARY',message:'PRIVATE_MESSAGE_CANARY'}});assert(p.error);assert.equal(p.event.domain_error_code,null);assert.equal(p.event.domain_error_code_unlisted,true);assert(!JSON.stringify(p.event).includes('CANARY'));});
await test('malformed_json_preserves_original409_and_no_retry',async()=>{const p=await probe({malformed:true});assert(p.error);assert.equal(p.event.error_metadata_unavailable,true);assert.equal(p.event.response_status,409);assert.equal(p.clicks,1);assert(!JSON.stringify(p.event).includes('CANARY'));});
await test('one_second_metadata_timeout_preserves_original409_and_no_retry',async()=>{const p=await probe({timeout:true});assert(p.error);assert.equal(p.event.error_metadata_unavailable,true);assert.equal(p.event.response_status,409);assert.equal(p.clicks,1);assert(p.elapsed>=900&&p.elapsed<2500);});
await test('advice_command_never_projects_outbound_text_or_topic_fields',async()=>{const p=await probe({advice:true});assert(p.error);assert(!('offer_fixture_topic_ids'in p.event));assert(!JSON.stringify(p.event).includes('CANARY'));});
await test('error_payload_null_array_object_type_are_never_raw_output',()=>{for(const payload of [null,[],{code:{private:'PRIVATE_CANARY'}},{code:12}]){const r=safeErrorMetadata(payload,409);assert.equal(r.domain_error_code,null);assert(!JSON.stringify(r).includes('CANARY'));}});
await test('oversize_unknown_malformed_topic_array_not_copied',()=>{for(const ids of [Array(65).fill('creative'),['PRIVATE_CANARY'],[null],null]){const r=safeOfferMetadata({expected_epoch:-1,topic_ids:ids,secret:'PRIVATE_CANARY'});assert.equal(r.offer_fixture_topic_ids,null);assert.equal(r.offer_expected_epoch,null);assert(!JSON.stringify(r).includes('CANARY'));}});
await test('copied_fixture_topic_array_is_detached_from_input',()=>{const ids=['creative'];const r=safeOfferMetadata({expected_epoch:1,topic_ids:ids});ids.push('PRIVATE_CANARY');assert.deepEqual(r.offer_fixture_topic_ids,['creative']);});
const contrary=await probe({mismatched:true,payload:{code:'NOT_AVAILABLE',secret:'PRIVATE_CANARY'}});
assert(contrary.error);assert.equal(contrary.clicks,1);assert.equal(contrary.event.domain_error_code,'NOT_AVAILABLE');
findings.push({id:'METHOD14-R01-001',priority:'P2',actual:'Exact helper records allowlisted domain code from a same-path/kind response whose response.request.request_id differs from the one observed request UUID. All HTTP409 assertions still fail, but diagnostic cause can be attributed to another request.',expected:'Validate UUID correlation before projecting any response domain diagnostic; mismatch must not record domain code as the observed request cause.',fake_events_only:true,actual_functional_run:false,event:contrary.event});
writeFileSync(root+'/controls.json',JSON.stringify({status:'EIGHT_POSITIVE_CONTROLS_PASS_ONE_CONFIRMED_P2_COUNTEREXAMPLE',count:rows.length,rows,findings,helper_sha256:createHash('sha256').update(readFileSync('.artifacts/p05-private-batch-browser-producer14/request-emission.mjs')).digest('hex')},null,2)+'\n');console.log(JSON.stringify({controls_pass:rows.length,confirmed_P2:findings.length}));
