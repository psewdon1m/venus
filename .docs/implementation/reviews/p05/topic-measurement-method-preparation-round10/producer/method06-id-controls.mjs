/** Eight finite realistic Docker-ID contract controls. Injected adapter only, no Docker. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {cleanupOwned} from './owned-cleanup.mjs';
const owner='a'.repeat(32),image='sha256:'+'b'.repeat(64),container='venus-r100-v3-123456789abc',volume=container+'-output',id='123456789abc'+'d'.repeat(52),second='0987654321ab'+'e'.repeat(52),collision='123456789abc'+'f'.repeat(52),rows=[];
const check=async(name,fn)=>{try{const details=await fn();rows.push({name,status:'PASS',details});}catch(e){rows.push({name,status:'FAIL',error:e.message});}};
function adapter({count=1,ownerOverride=owner,imageOverride=image,nameOverride,malformed,listFailure=false}={}){
 let ids=count===2?[id,second]:[id],volumes=[volume],running=true;const calls=[];
 return{calls,docker:async(args,options)=>{
  calls.push({args,timeout:options.timeout});assert(options.timeout>0&&options.timeout<=30000);
  if(args[0]==='ps'){
   if(listFailure)return{code:1,stdout:'',stderr:'INERT_LIST_FAILURE'};
   let listed=args.includes('--no-trunc')?ids:ids.map(x=>x.slice(0,12));
   if(ids.length){if(malformed==='short')listed=[id.slice(0,12)];if(malformed==='duplicate-list')listed=[id,id];if(malformed==='invalid-list')listed=['NOT-CANONICAL'];}
   return{code:0,stdout:listed.join('\n')};
  }
  if(args[0]==='volume'&&args[1]==='ls')return{code:0,stdout:volumes.join('\n')};
  if(args[0]==='inspect'){
   let details=ids.map((Id,index)=>({Id,Name:nameOverride??('/'+container+(index?'-probe':'')),Config:{Labels:{'com.venus.measurement.owner':ownerOverride}},Image:imageOverride,State:{Running:running}}));
   if(malformed==='collision')details[0].Id=collision;
   if(malformed==='duplicate-inspect')details=[details[0],details[0]];
   if(malformed==='missing-inspect')details=[];
   if(malformed==='reordered-inspect')details.reverse();
   return{code:0,stdout:JSON.stringify(details)};
  }
  if(args[0]==='kill'){assert(args.slice(1).every(x=>ids.includes(x)));running=false;return{code:0,stdout:''};}
  if(args[0]==='rm'){assert.equal(args[1],'-f');assert.deepEqual(args.slice(2),ids);ids=[];return{code:0,stdout:''};}
  if(args[0]==='volume'&&args[1]==='inspect')return{code:0,stdout:JSON.stringify([{Name:volume,Labels:{'com.venus.measurement.owner':owner}}])};
  if(args[0]==='volume'&&args[1]==='rm'){assert.equal(args[2],volume);volumes=[];return{code:0,stdout:''};}
  throw Error('UNEXPECTED_MOCK_DOCKER_OPERATION');
 }};
}
async function execute(options={},exportVerified=true){const a=adapter(options),result=await cleanupOwned({docker:a.docker,owner,image,container,volume,exportVerified});return{a,result};}
function noRemoval(a){assert(!a.calls.some(x=>['kill','rm'].includes(x.args[0])||(x.args[0]==='volume'&&x.args[1]==='rm')));}
await check('ordinary Docker defaults12char but no-trunc list matches inspect64char',async()=>{const{a,result}=await execute();assert.equal(result.cleanup,'completed');assert.equal(result.workerStopped,true);assert(a.calls.filter(x=>x.args[0]==='ps').every(x=>x.args.includes('--no-trunc')));assert.deepEqual(a.calls.find(x=>x.args[0]==='kill').args,['kill',id]);assert.deepEqual(a.calls.find(x=>x.args[0]==='rm').args,['rm','-f',id]);return{listed_and_inspected_ID_length:64,default_without_no_trunc_ID_length:12,artifact_write_calls:result.artifact_write_calls};});
await check('two canonical full IDs preserve inspect input ordering and exact roles',async()=>{const{a,result}=await execute({count:2});assert.equal(result.cleanup,'completed');assert.deepEqual(a.calls.find(x=>x.args[0]==='kill').args,['kill',id,second]);});
await check('foreign owner full-ID resource retained before kill or rm',async()=>{const{a,result}=await execute({ownerOverride:'c'.repeat(32)});assert.equal(result.cleanup,'retained');assert.equal(result.workerStopped,false);noRemoval(a);});
await check('bad generated name full-ID resource retained before kill or rm',async()=>{const{a,result}=await execute({nameOverride:'/unrelated'});assert.equal(result.cleanup,'retained');assert.equal(result.workerStopped,false);noRemoval(a);});
await check('wrong image full-ID resource retained before kill or rm',async()=>{const{a,result}=await execute({imageOverride:'sha256:'+'c'.repeat(64)});assert.equal(result.cleanup,'retained');assert.equal(result.workerStopped,false);noRemoval(a);});
await check('unverified export kills/removes canonical worker but retains owned volume',async()=>{const{a,result}=await execute({},false);assert.equal(result.workerStopped,true);assert.equal(result.cleanup,'retained');assert.deepEqual(result.remaining,{containers:[],volumes:[volume]});assert(a.calls.some(x=>x.args[0]==='kill'));assert(a.calls.some(x=>x.args[0]==='rm'));assert(!a.calls.some(x=>x.args[0]==='volume'&&x.args[1]==='rm'));});
await check('ps list failure retains resources and never infers stopped worker',async()=>{const{a,result}=await execute({listFailure:true});assert.equal(result.cleanup,'retained');assert.equal(result.workerStopped,false);assert(result.error);noRemoval(a);});
await check('malformed duplicate missing reordered and short-prefix collision mappings fail closed',async()=>{const results=[];for(const malformed of ['short','duplicate-list','invalid-list','collision','duplicate-inspect','missing-inspect','reordered-inspect']){const{a,result}=await execute({malformed,count:2});assert.equal(result.cleanup,'retained',malformed);assert.equal(result.workerStopped,false,malformed);assert(result.error,malformed);noRemoval(a);results.push({case:malformed,status:'PASS',no_kill_or_rm:true});}return results;});
console.log(JSON.stringify({status:rows.every(x=>x.status==='PASS')?'PASS_AUTHOR_FINITE_ONLY':'FAIL',cases:rows,top_level_cases:8,malformed_mapping_branches:7,source:Object.fromEntries(['owned-cleanup.mjs','method06-id-controls.mjs'].map(n=>[n,createHash('sha256').update(readFileSync(new URL(n,import.meta.url))).digest('hex')])),Docker_calls:0,artifact_write_interface_calls:0,selector_invocations:0,statistics_RUN:false},null,2));if(rows.some(x=>x.status!=='PASS'))process.exitCode=1;
