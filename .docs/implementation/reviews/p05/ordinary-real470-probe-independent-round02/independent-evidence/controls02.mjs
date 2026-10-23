/** Exact changed post-finish block replay; ordinary API/consent not simulated as actual evidence. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const file='.artifacts/p05-ordinary-real470-probe02/probe.mjs',text=readFileSync(file,'utf8'),sha=b=>createHash('sha256').update(b).digest('hex'),a=text.indexOf('const done=await current(host);'),b=text.indexOf('row.rounds.push(',a);assert(a>0&&b>a);const block=text.slice(a,b).trim(),checks=[];
async function replay({interaction='pair_public',done={current_round:{state:'completed',kind:'generic',round_id:'round',round_index:1}}}={}){const fn=vm.runInNewContext('(async()=>{'+block+'})',{assert,current:async()=>done,host:{},g:{current_round:{round_id:'round'}},i:0,card:{id:'Q-1105',interaction}},{timeout:1000});return fn();}
await replay();checks.push('completed pair_public generic accepted');
for(const[field,value]of [['state','skipped'],['round_id','other'],['round_index',2],['kind','public']]){const done={current_round:{state:'completed',kind:'generic',round_id:'round',round_index:1,[field]:value}};await assert.rejects(replay({done}));checks.push('reject pair '+field+' mismatch');}
await replay({interaction:'solo',done:{current_round:{state:'completed',kind:'public',round_id:'round',round_index:1,card_id:'Q-1105'}}});checks.push('nonpair exact samecard accepted');
await assert.rejects(replay({interaction:'solo',done:{current_round:{state:'completed',kind:'public',round_id:'round',round_index:1,card_id:'OTHER'}}}));checks.push('nonpair wrongcard rejected');
const original=readFileSync('.artifacts/p05-ordinary-real470-probe01/probe.mjs','utf8');assert.equal(text.match(/await consentRound\(g,'invitation'\)/g).length,1);for(const statement of ["const card=publicIdentity(g.current_round,pack,seen);assertText(g.current_round,card,'en',names);","if(i===0)row.locale_identity=await localeCheck(host,g,card,names);","assert.equal(report.completed_rounds,840);assert.equal(report.finishes,840);assert.equal(report.skips,0);"]){assert(original.includes(statement));assert(text.includes(statement));}checks.push('prefinish840 ID/text/locale/seen/noSkip checks remain exact');
writeFileSync(new URL('./controls02-result.json',import.meta.url),JSON.stringify({status:'PASS_TARGETED_POSTFINISH_METHOD_CONTROL_ONLY',source_sha256:sha(text),exact_block_sha256:sha(block),checks,actual_Docker_API_runs:0},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,source_sha256:sha(text)}));
