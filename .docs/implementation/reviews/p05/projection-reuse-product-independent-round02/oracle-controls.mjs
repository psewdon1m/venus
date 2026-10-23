import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const folder=dirname(fileURLToPath(import.meta.url)),before=readFileSync('.docs/implementation/reviews/p05/projection-reuse-product-author-round02/temporal-cases.before.mjs.bytes','utf8'),after=readFileSync('tests/p05-topic-games/temporal-cases.mjs','utf8');
const a=before.split('\n'),b=after.split('\n');assert.equal(a.length,b.length);const changed=a.flatMap((v,i)=>v===b[i]?[]:[i]);assert.deepEqual(changed,[9]);assert(a[9].includes("check('P05-TG-14'"));assert(b[9].includes('assert.equal(ownAfter,ownBefore);await tick(f,3000);'));assert(b[9].includes('assert.equal(refreshed,ownBefore+1)'));
const {temporalCases}=await import(pathToFileURL(resolve('tests/p05-topic-games/temporal-cases.mjs')));
const controls=[];
for(const mode of ['correct','always_publish','never_refresh','recipient_leak','two_refs']){
 let now=1000,executed=0;const rev=new Map([['a',0],['b',0]]),expires=new Map();const f={room:'room',plan:{actors:['a','b']}};
 const ok=async(_f,member,_path,method='GET')=>{if(method==='GET'){if(!expires.has(member)||(mode!=='never_refresh'&&expires.get(member)<=now+2000)||mode==='always_publish'){rev.set(member,rev.get(member)+1);expires.set(member,now+5000);}if(member==='b'&&mode==='recipient_leak')rev.set('a',rev.get('a')+1);}return {offer:{offer_id:'offer',epoch:1,proposal_revision:1,token:'token'}};};
 const pool={query:async(sql,args)=>({rows:sql.startsWith('SELECT count')?[{n:mode==='two_refs'?2:1}]:[{rev:String(rev.get(args[1]))}]})};
 const run=()=>temporalCases({check:async(id,fn)=>{if(id==='P05-TG-14'){executed++;return fn();}},privateRound:async()=>f,ok,pool,roundPath:()=>'/round',tick:async(_f,ms)=>{assert.equal(ms,3000);now+=ms;}});
 if(mode==='correct')await run();else await assert.rejects(run(),{name:'AssertionError'});
 assert.equal(executed,1);controls.push({mode,status:'PASS',qualification:mode==='correct'?'oracle accepts synthetic intended behavior':'oracle rejects synthetic regression'});
}
const out={status:'PASS_ORACLE_SCOPE_AND_SENSITIVITY_ONLY',controls,changed_source_lines_one_based:[10],actual_Docker_DB_browser_RUN:false};writeFileSync(join(folder,'oracle-controls.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
