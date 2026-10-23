/** Method12 finite dispatch/receipt observer; no app authorization or click retries. */
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';

export async function exactUiMutation({page,path,kind,scope,control,prepare,click,afterClick,record,now=()=>performance.now()}){
 const readiness=prepare?await prepare():null;
 const matches=request=>{
  if(new URL(request.url()).pathname!==path||request.method()!=='POST')return false;
  let body;try{body=request.postDataJSON();}catch{return false;}
  return Boolean(body&&(!kind||body.kind===kind)&&(!scope||body.scope===scope));
 };
 const dispatchBudget=readiness?Math.min(15000,readiness.deadline_monotonic_ms-now()):15000;
 assert(Number.isFinite(dispatchBudget)&&dispatchBudget>0,'P05_PRIVATE_PREPARATION_EXPIRED_BEFORE_WATCHERS');
 const responsePromise=page.waitForResponse(response=>matches(response.request()),{timeout:15000});responsePromise.catch(()=>{});
 let emittedAt=null;
 const requestPromise=page.waitForRequest(matches,{timeout:dispatchBudget}).then(request=>{emittedAt=now();return request;});requestPromise.catch(()=>{});
 const event={control,path:path.replace(/[a-f0-9]{8}-[a-f0-9-]{27,}/g,':id'),kind:kind??null,scope:scope??null,readiness:readiness??null,dispatch_budget_ms:dispatchBudget,click_started_monotonic_ms:now(),click_finished_monotonic_ms:null,request_observed_monotonic_ms:null,result:'NOT_DISPATCHED'};
 try{
  await click(readiness);event.click_finished_monotonic_ms=now();
  let request;
  try{request=await requestPromise;}catch{throw Error('P05_UI_MUTATION_NOT_DISPATCHED:'+control);}
  event.request_observed_monotonic_ms=emittedAt;event.result='DISPATCHED_AWAITING_RECEIPT';
  assert(!readiness||emittedAt<readiness.deadline_monotonic_ms,'P05_REQUEST_EMISSION_OUTSIDE_OBSERVED_PRIVATE_DEADLINE');
  if(afterClick)await afterClick();
  const response=await responsePromise;
  assert.equal(response.status(),200,'Exact UI mutation must commit');
  const body=request.postDataJSON(),responseBody=response.request().postDataJSON(),receipt=await response.json();
  assert.equal(typeof body.request_id,'string');assert(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.request_id));
  assert.equal(responseBody.request_id,body.request_id,'Response must belong to the one observed request');
  assert.equal(receipt.request_id,body.request_id);assert.equal(receipt.schema_version,2);assert(Number.isSafeInteger(receipt.game_rev));
  event.result='EXACT_RECEIPT_VERIFIED';return {body,receipt};
 }catch(error){if(event.result==='NOT_DISPATCHED'&&emittedAt!==null)event.result='DISPATCHED_CLICK_FAILURE';event.failure=emittedAt===null?'NO_MATCHING_REQUEST_OBSERVED_BEFORE_DEADLINE_OR_CLICK_PRECONDITION':'DISPATCHED_RESPONSE_OR_RECEIPT_FAILURE';throw error;}
 finally{event.request_observed_monotonic_ms=emittedAt;if(record)record(event);}
}
