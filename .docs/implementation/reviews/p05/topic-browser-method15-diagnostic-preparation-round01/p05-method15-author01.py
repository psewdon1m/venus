from pathlib import Path
import shutil,json,hashlib,datetime,subprocess,sys
root=Path.cwd(); work=root/'.artifacts/p05-private-batch-browser-producer15'
assert not work.exists(); shutil.copytree(root/'.artifacts/p05-private-batch-browser-producer14',work)
p=work/'request-emission.mjs'; text=p.read_text(encoding='utf-8')
old="""  event.response_status=response.status();
  if(kind==='offer_topic')Object.assign(event,safeOfferMetadata(request.postDataJSON()));"""
new="""  event.response_status=response.status();
  let body,responseBody;
  try{
   body=request.postDataJSON();responseBody=response.request().postDataJSON();
   assert.equal(typeof body?.request_id,'string');assert(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.request_id));
   assert.equal(responseBody?.request_id,body.request_id,'Response must belong to the one observed request');
  }catch(error){event.response_request_correlation='UNAVAILABLE_OR_MISMATCH';event.error_metadata_unavailable=true;throw error;}
  if(kind==='offer_topic')Object.assign(event,safeOfferMetadata(body));"""
assert text.count(old)==1; text=text.replace(old,new)
old="""  const body=request.postDataJSON(),responseBody=response.request().postDataJSON(),receipt=await response.json();
  assert.equal(typeof body.request_id,'string');assert(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.request_id));
  assert.equal(responseBody.request_id,body.request_id,'Response must belong to the one observed request');"""
assert text.count(old)==1; text=text.replace(old,"  const receipt=await response.json();")
p.write_text(text,encoding='utf-8',newline='\n')
tests=(root/'.artifacts/p05-method14-request-controls01.mjs').read_text(encoding='utf-8').replace('producer14/','producer15/').replace('p05-method14-request-controls01.json','p05-method15-request-controls01.json')
marker='const report={status:'
extra="""for(const [id,options] of [
 ['different_uuid',{responseBody:{request_id:'55555555-5555-4555-8555-555555555555'}}],
 ['missing_response_uuid',{responseBody:{request_id:undefined}}],
 ['invalid_response_uuid',{responseBody:{request_id:'PRIVATE_CANARY'}}],
 ['missing_observed_uuid',{body:{request_id:undefined}}],
 ['invalid_observed_uuid',{body:{request_id:'PRIVATE_CANARY'}}],
])await check('non200_unattributable_'+id,async()=>{const v=await probe({...options,status:409,receipt:{code:'NOT_AVAILABLE',message:'PRIVATE_CANARY'}});assert(v.error);assert.equal(v.clicks,1);assert.equal(v.event.response_status,409);assert.equal(v.event.response_request_correlation,'UNAVAILABLE_OR_MISMATCH');assert.equal(v.event.error_metadata_unavailable,true);assert.equal(v.event.domain_error_code,undefined);assert(!JSON.stringify(v.event).includes('PRIVATE_CANARY'));});
"""
assert marker in tests; tests=tests.replace(marker,extra+marker)
(root/'.artifacts/p05-method15-request-controls01.mjs').write_text(tests,encoding='utf-8',newline='\n')
assert (work/'browser.mjs').read_bytes()==(root/'.artifacts/p05-private-batch-browser-producer13/browser.mjs').read_bytes()
print(json.dumps({'status':'AUTHORED_NOT_TESTED','helper_sha256':hashlib.sha256(p.read_bytes()).hexdigest()}))
