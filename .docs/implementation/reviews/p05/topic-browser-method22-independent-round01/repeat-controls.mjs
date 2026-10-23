import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {exactUiMutation} from 'file:///C:/.projects/venus/.docs/implementation/reviews/p05/topic-browser-method22-author-round01/runtime/request-emission.mjs';
const source=readFileSync(new URL('file:///C:/.projects/venus/.docs/implementation/reviews/p05/topic-browser-method22-author-round01/runtime/browser.mjs'),'utf8');
const text=source.split('\n').find(line=>line.startsWith('function safetyMutationSuffix('));
assert(text);const suffix=vm.runInNewContext('('+text+')',{assert});
const own=(abort,stop)=>({schema_version:2,session_id:'session',session_actions:{abort,stop}});
let count=0;function check(name,fn){fn();count++;console.log('PASS '+name);}
check('host selects abort before click',()=>assert.equal(suffix(own(true,true),'session'),'abort'));
check('member selects authorized stop',()=>assert.equal(suffix(own(false,true),'session'),'stop'));
check('neither permission fails closed',()=>assert.throws(()=>suffix(own(false,false),'session')));
check('wrong session fails closed',()=>assert.throws(()=>suffix(own(true,true),'other')));
check('string permission fails closed',()=>assert.throws(()=>suffix(own('true',true),'session')));
async function dispatch(expected,actual,{status=200,receiptId}={}){
 const body={request_id:'12345678-1234-4234-8234-123456789012'};
 const request={url:()=>`https://fixture.test/game/session/${actual}`,method:()=> 'POST',postDataJSON:()=>body};
 const response={request:()=>request,status:()=>status,json:async()=>({schema_version:2,request_id:receiptId??body.request_id,game_rev:36,code:'ROLE_DENIED'})};
 const waits=[];let clicks=0,event;
 const page={waitForRequest:predicate=>new Promise((resolve,reject)=>waits.push(()=>predicate(request)?resolve(request):reject(Error('No matching request')))),waitForResponse:predicate=>new Promise((resolve,reject)=>waits.push(()=>predicate(response)?resolve(response):reject(Error('No matching response'))))};
 const result=exactUiMutation({page,path:`/game/session/${expected}`,control:'game-stop',click:async()=>{clicks++;for(const done of waits)done();},record:v=>{event=v;}});
 return {result,clicks:()=>clicks,event:()=>event};
}
for(const [name,expected,actual,options,pass] of [
 ['host exact abort receipt','abort','abort',{},true],
 ['member exact stop receipt','stop','stop',{},true],
 ['old hardcoded stop rejects actual abort','stop','abort',{},false],
 ['chosen abort rejects unexpected stop','abort','stop',{},false],
 ['exact route denied receipt rejects','abort','abort',{status:403},false],
 ['wrong request receipt rejects','stop','stop',{receiptId:'other'},false],
]){const d=await dispatch(expected,actual,options);if(pass)assert.equal((await d.result).receipt.game_rev,36);else await assert.rejects(d.result);assert.equal(d.clicks(),1);assert.equal(d.event().result,pass?'EXACT_RECEIPT_VERIFIED':expected!==actual?'NOT_DISPATCHED':'DISPATCHED_AWAITING_RECEIPT');count++;console.log('PASS '+name);}
const old=readFileSync(new URL('file:///C:/.projects/venus/.artifacts/p05-private-batch-browser-producer21/browser.mjs'),'utf8');
const cases=s=>s.split('\n').filter(line=>line.startsWith(' await check('));const a=cases(old),b=cases(source);assert.equal(a.length,16);assert.equal(b.length,16);for(let i=0;i<16;i++)if(i!==12)assert.equal(b[i],a[i]);
count++;console.log('PASS other15 case bodies byte exact');
console.log(JSON.stringify({status:'PASS_FINITE_ONLY',controls:count,browser_RUN:false,production_authority:false}));

for(const own of [null,{schema_version:2,session_id:'session',session_actions:{abort:false,stop:'true'}},{schema_version:1,session_id:'session',session_actions:{abort:true,stop:true}},{schema_version:2,session_id:'session',session_actions:{abort:null,stop:true}}])assert.throws(()=>suffix(own,'session'));console.log(JSON.stringify({status:'PASS_EXTRA_MALFORMED_AUTHORITY_CONTROLS',controls:4}));
