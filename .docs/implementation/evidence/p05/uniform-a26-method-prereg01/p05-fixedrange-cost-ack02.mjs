import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {producerPins,validateAuthority} from './p05-fixedrange-host03.mjs';
const root='C:/.projects/venus',sha=x=>createHash('sha256').update(x).digest('hex'),producer=root+'/.artifacts/p05-pilot-corpus-ranges03',host=root+'/.artifacts/p05-fixedrange-host03.mjs',review=root+'/.docs/implementation/reviews/p05/pilot-corpus-ranges-independent-round03/INDEX.json',hostReview=root+'/.docs/implementation/reviews/p05/fixedrange-host03-independent-round01/INDEX.json';
const [methodReviewSha,...extra]=process.argv.slice(2);assert.equal(extra.length,0);assert.match(methodReviewSha,/^[a-f0-9]{64}$/);assert.equal(sha(fs.readFileSync(review)),methodReviewSha);assert.equal(sha(fs.readFileSync(hostReview)),'12b49de8895c5c715ab8578d647242be510300bafc6e1faa39df09e97baedb11');
const bindingRaw=fs.readFileSync(path.join(producer,'binding.json')),preregRaw=fs.readFileSync(path.join(producer,'RANGE-PREREG.json')),binding=JSON.parse(bindingRaw),prereg=JSON.parse(preregRaw),pins=producerPins(producer),out=root+'/.artifacts/p05-fixedrange-cost-acks02';assert(!fs.existsSync(out));fs.mkdirSync(out);const rows=[];
for(const section of Object.keys(prereg.counts)){
 const count=section==='m3-gf'?1000:100,ack={schema:1,status:'ROOT_RUN_ACK',purpose:'PILOT_FIXED_RANGE_02',no_actual_approval:false,owner:randomBytes(16).toString('hex'),range:{section,start:0,count,end:count},producer_root:producer,producer_pins:pins,host_runner_sha256:sha(fs.readFileSync(host)),binding_sha256:sha(bindingRaw),prereg_sha256:sha(preregRaw),method_review_sha256:sha(fs.readFileSync(review)),source_identity:binding.source_identity,image_id:binding.image,host_review_sha256:sha(fs.readFileSync(hostReview)),issued_at:new Date().toISOString(),scope:'DECLARED_FIRST_COST_PREFIX_ONLY_NOT_FULL_SECTION_OR_STAGE_NO_RETRY'};
 validateAuthority(ack,bindingRaw,preregRaw,fs.readFileSync(review),pins,sha(fs.readFileSync(host)));const file=path.join(out,section+'.json');fs.writeFileSync(file,JSON.stringify(ack,null,2)+'\n');rows.push({section,range:ack.range,owner:ack.owner,ack_path:file,ack_sha256:sha(fs.readFileSync(file))});
}
fs.writeFileSync(path.join(out,'MANIFEST.json'),JSON.stringify({status:'ROOT_ACK_COST_PREFIXES_ONLY_NOT_RUN',created_at:new Date().toISOString(),source:binding.source_identity,image:binding.image,rows},null,2)+'\n');console.log(JSON.stringify(rows));
