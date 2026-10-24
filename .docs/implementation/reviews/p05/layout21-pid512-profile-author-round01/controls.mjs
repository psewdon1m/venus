import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
const dir='C:/.projects/venus/.artifacts/p05-pilot-bundle-source14/.artifacts/p05-v2-layout-producer-resume21',source=readFileSync(dir+'/run.mjs','utf8');
const ackGate=source.match(/assert\.equal\(ack\.operational_resource_profile[^\n]+?EXACT_BROWSER_PID_LIMIT_REQUIRED'\);/)[0],reviewGate=source.match(/assert\.equal\(independentReview\.operational_resource_profile[^\n]+?REVIEW_BROWSER_PID_LIMIT_REQUIRED'\);/)[0];
const check=new Function('assert','ack','independentReview',ackGate+reviewGate),profile={operational_resource_profile:'LAYOUT21_BROWSER_PID512',browser_pids_limit:512};check(assert,profile,profile);
for(const bad of [{},{...profile,browser_pids_limit:256},{...profile,operational_resource_profile:'LAYOUT20_BROWSER_PID256'}]){assert.throws(()=>check(assert,bad,profile));assert.throws(()=>check(assert,profile,bad));}
const from=source.indexOf('const compose=')+'const compose='.length,to=source.indexOf(';\nconst composePath=',from),expression=source.slice(from,to);
const compose=new Function('binding','project','output','secret','producer','engine','locale','join','return ('+expression+');')({image:'sha256:SYNTHETIC'},'SYNTHETIC','SYNTHETIC','SYNTHETIC','SYNTHETIC','chromium','ru',join),browser=compose.services.browser;
assert.equal(browser.pids_limit,512);assert.equal(browser.mem_limit,'3g');assert.equal(browser.cpus,2);assert.equal(browser.shm_size,'1gb');assert.deepEqual(browser.tmpfs,['/tmp:size=1g,mode=1777,exec','/home/node:size=64m,uid=1000,gid=1000']);
assert(source.indexOf(ackGate)<source.indexOf('mkdtempSync(join(tmpdir()'));assert(source.indexOf(reviewGate)<source.indexOf('mkdtempSync(join(tmpdir()'));
assert(source.includes('operational_resource_profile:ack.operational_resource_profile,browser_pids_limit:compose.services.browser.pids_limit'));
console.log(JSON.stringify({status:'PASS_REQUIRED_COLD_PROFILE_AUTHORITY_AND_COMPOSE',profile:profile.operational_resource_profile,browser_pids_limit:512,old256_or_missing_profile_denied:true,fixed_memory_CPU_shm_tmpfs:true,native_runs:0,Docker_allocations:0}));
