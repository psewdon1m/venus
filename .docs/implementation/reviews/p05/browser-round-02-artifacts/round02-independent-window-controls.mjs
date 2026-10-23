import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {windowInventory} from '../../tests/p05/window-inventory.mjs';
const results=[];
async function check(label,action){await action();results.push({label,status:'PASS'});}
const failure=(stderr='',stdout='',status=1)=>Object.assign(new Error('INDEPENDENT SYNTHETIC X11 FAILURE'),{stderr,stdout,status});
await check('BadWindow partial stdout discarded; complete new inventory obtained',async()=>{const calls=[],observations=[],waits=[];const ids=await windowInventory(()=>{calls.push(1);if(calls.length===1)throw failure('BadWindow X_QueryTree','100\n200');return '100\n200\n300\n';},r=>observations.push(r),{wait:async n=>waits.push(n)});assert.deepEqual(ids,['100','200','300']);assert.deepEqual(ids.filter(x=>!['100','200'].includes(x)),['300']);assert.equal(observations.length,1);assert.equal(observations[0].transient_bad_window,true);assert.deepEqual(waits,[50]);});
await check('Default retries exactly five; exhausted partial outputs never become empty',async()=>{let calls=0;const waits=[];await assert.rejects(windowInventory(()=>{calls++;throw failure('BadWindow X_QueryTree','100\n200');},()=>{},{wait:async n=>waits.push(n)}));assert.equal(calls,5);assert.deepEqual(waits,[50,50,50,50]);});
await check('True status1 empty query remains empty without retry',async()=>{let calls=0;assert.deepEqual(await windowInventory(()=>{calls++;throw failure();},()=>{},{wait:async()=>assert.fail('Should not retry genuine empty result')}),[]);assert.equal(calls,1);});
await check('BadWindow followed by genuinely empty query remains classified honestly',async()=>{let calls=0;assert.deepEqual(await windowInventory(()=>{if(++calls===1)throw failure('BadWindow X_QueryTree');throw failure();},()=>{},{wait:async()=>{}}),[]);assert.equal(calls,2);});
for(const [label,stderr,stdout,status] of [
 ['Unknown status1 error propagates immediately','Cannot open display','',1],
 ['Partial output without recognized race propagates','','100',1],
 ['BadWindow without X_QueryTree propagates','BadWindow other opcode','',1],
 ['X_QueryTree without BadWindow propagates','BadMatch X_QueryTree','',1],
 ['Different exit status never treated as empty','','',2],
 ['Timeout signal with partial output propagates','BadWindow X_QueryTree','100',null]
])await check(label,async()=>{let calls=0;await assert.rejects(windowInventory(()=>{calls++;throw failure(stderr,stdout,status);},()=>{},{wait:async()=>assert.fail('Unexpected retry')}));assert.equal(calls,1);});
for(const text of ['100\n100','not-an-id','100\n\n200'])await check('Malformed successful output rejected '+JSON.stringify(text),async()=>{await assert.rejects(windowInventory(()=>text));});
await check('Normal successful inventory trimmed without weakening one-new-window check',async()=>{const ids=await windowInventory(()=>' 100\n 200\n300 \n');assert.deepEqual(ids,['100','200','300']);assert.equal(ids.filter(x=>!['100','200'].includes(x)).length,1);});
const result={schema_version:1,isolated_control_only:true,no_x11_or_docker_executed:true,source_sha256:createHash('sha256').update(fs.readFileSync('tests/p05/window-inventory.mjs')).digest('hex'),controls:results};fs.writeFileSync('.artifacts/p05-browser-review/round02-independent-window-controls.json',JSON.stringify(result,null,2));console.log(JSON.stringify({controls:results.length,pass:results.length,fail:0,source_sha256:result.source_sha256}));
