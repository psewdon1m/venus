from pathlib import Path
import json,hashlib,difflib
r=Path.cwd();p=r/'.artifacts/p05-fixedrange-host03.mjs';old=p.read_text();new=old
new=new.replace("import {gunzipSync} from 'node:zlib';","import {producerPins,verifyRangeExport} from './p05-fixedrange-host03.mjs';")
start=new.index('export function producerPins(');end=new.index('export function main(')
new=new[:start]+'''export function validateMatchedAuthority(ack,bindingRaw,preregRaw,reviewRaw,pins,parentPins,runnerHash){
 assert.equal(ack.status,'ROOT_RUN_ACK');assert.equal(ack.purpose,'PILOT_PRIVACY_MATCHED_01');assert.match(ack.owner,/^[a-f0-9]{32}$/);assert.equal(ack.no_actual_approval,false);
 assert.equal(ack.host_runner_sha256,runnerHash);assert.equal(ack.method_review_sha256,sha(reviewRaw));assert.match(JSON.parse(reviewRaw).verdict,/^PASS_PROSPECTIVE_MATCHED_DOMAIN_METHOD_ONLY/);
 assert.equal(ack.binding_sha256,sha(bindingRaw));assert.equal(ack.prereg_sha256,sha(preregRaw));assert.deepEqual(ack.producer_pins,pins);assert.deepEqual(ack.range_producer_pins,parentPins);
 const binding=JSON.parse(bindingRaw),prereg=JSON.parse(preregRaw);assert.equal(binding.image,ack.image_id);assert.equal(binding.source_identity,ack.source_identity);assert.deepEqual(binding.range02_producer_pins,parentPins);assert.equal(binding.shared_host_sha256,ack.shared_host_sha256);assert.equal(binding.range02_binding_sha256,parentPins['binding.json']);
 assert.equal(sha(fs.readFileSync(fileURLToPath(new URL('./p05-fixedrange-host03.mjs',import.meta.url)))),ack.shared_host_sha256);
 assert.equal(pins['binding.json'],ack.binding_sha256);assert.equal(pins['PREREG.json'],ack.prereg_sha256);assert.equal(prereg.cases,84);assert.equal(prereg.worker_ms,3600000);assert.deepEqual(ack.range,{section:'privacy-matched',start:0,count:84,end:84});assert.match(ack.source_identity,/^[a-f0-9]{64}$/);assert.match(ack.image_id,/^sha256:[a-f0-9]{64}$/);return ack.range;
}
'''+new[end:]
def once(a,b):
 global new
 assert new.count(a)==1,(a,new.count(a));new=new.replace(a,b)
once("const producer=path.resolve(ack.producer_root),pinsBefore=producerPins(producer),bindingRaw", "const producer=path.resolve(ack.producer_root),parentProducer=path.resolve(ack.range_producer_root),parentBefore=producerPins(parentProducer),pinsBefore=producerPins(producer),bindingRaw")
once("path.join(producer,'RANGE-PREREG.json')","path.join(producer,'PREREG.json')")
once("validateAuthority(ack,bindingRaw,preregRaw,fs.readFileSync(reviewPath),pinsBefore,sha", "validateMatchedAuthority(ack,bindingRaw,preregRaw,fs.readFileSync(reviewPath),pinsBefore,parentBefore,sha")
once("const name='venus-fixedrange-'", "const name='venus-matched-'")
once("volume='venus-fixedrange-raw-'", "volume='venus-matched-raw-'")
once("C:/.projects/venus/.artifacts/p05-fixedranges/", "C:/.projects/venus/.artifacts/p05-privacy-matched-runs01/")
once("JSON.stringify(pinsBefore,null,2)+'\\n');", "JSON.stringify(pinsBefore,null,2)+'\\n');fs.writeFileSync(path.join(output,'range-producer-before.json'),JSON.stringify(parentBefore,null,2)+'\\n');")
once("'--mount','type=bind,source='+ackPath", "'--mount','type=bind,source='+parentProducer+',target=/run/p05-pilot-corpus-ranges02,readonly','--mount','type=bind,source='+ackPath")
new=new.replace('/run/pilot-range-root-ack.json','/run/pilot-matched-root-ack.json').replace('/run/pilot-range-review-index.json','/run/pilot-matched-review-index.json')
once("'/run/consumer/range-worker.mjs','range',range.section,String(range.start),String(range.count)","'/run/consumer/matched-worker.mjs'")
once("filter(m=>m.Type==='bind').length,3", "filter(m=>m.Type==='bind').length,4")
once("],1205000)","],3605000)")
once("assert.deepEqual(producerPins(producer),pinsBefore,'PRODUCER_CHANGED_DURING_RUN');","assert.deepEqual(producerPins(producer),pinsBefore,'PRODUCER_CHANGED_DURING_RUN');assert.deepEqual(producerPins(parentProducer),parentBefore,'PARENT_PRODUCER_CHANGED_DURING_RUN');")
new=new.replace('RANGE_EXECUTION_COMPLETE_NOT_STATISTICAL_ACCEPTANCE','MATCHED_EXECUTION_COMPLETE_NOT_PRIVACY_ACCEPTANCE')
once("report.status='MATCHED_EXECUTION_COMPLETE_NOT_PRIVACY_ACCEPTANCE';", "assert.equal(summary.native_replay_completed,true);assert(['NOT_COVERED','PASS_MATCHED_DOMAIN_ONLY_PENDING_STRUCTURAL_AND_WIRE_ACCEPTANCE'].includes(summary.matched.status));report.matched_status=summary.matched.status;report.privacy_gate_accepted=false;report.status='MATCHED_EXECUTION_COMPLETE_NOT_PRIVACY_ACCEPTANCE';")
once("const pinsAfter=producerPins(producer);", "const pinsAfter=producerPins(producer),parentAfter=producerPins(parentProducer);fs.writeFileSync(path.join(output,'range-producer-after.json'),JSON.stringify(parentAfter,null,2)+'\\n');assert.deepEqual(parentAfter,parentBefore);")
out=r/'.artifacts/p05-privacy-matched-host01.mjs';assert not out.exists();out.write_text(new,encoding='utf8')
w=r/'.artifacts/p05-privacy-matched-operational01';(w/'host-vs-accepted03.diff').write_text(''.join(difflib.unified_diff(old.splitlines(True),new.splitlines(True),fromfile='accepted-host03',tofile='matched-host01')),encoding='utf8');print(hashlib.sha256(out.read_bytes()).hexdigest())
