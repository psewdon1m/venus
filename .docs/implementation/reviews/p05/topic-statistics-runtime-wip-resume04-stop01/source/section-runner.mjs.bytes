/** Additive executable dispatch. No CLI sample/probe or implicit full RUN. */
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {validateRunAuthorization} from '../p05-topic-measurements/runner.mjs';
import {descriptors,expectedCounts,cell,group,stratum,classIndex,dense,featureHash,orderedCoverage} from './protocol.mjs';
import {sessionConsumer,eligibilityConsumer,gfConsumer} from './consumers.mjs';
import {evaluateCell,evaluatePooled} from './inference.mjs';
export function authorize(ack,authority){validateRunAuthorization(ack,authority);assert.equal(ack.dispatch_revision,'P05-STATS-RESUME03');assert.equal(ack.feature_dictionary_sha256,featureHash);assert(ack.owned_resource_wrapper==='SOURCE_PINNED_INDEPENDENT_REVIEWED_EXTERNAL_SUPERVISOR','EXTERNAL_RESOURCE_WRAPPER_REQUIRED');return true;}
/** sink contract: append immutable hash-chain row, replay only persisted exact rows,
 * finish receipt; physical budgets/deadlines remain external reviewed supervisor.
 */
export async function runPreparedSection(section,{ack,authority,guard,checkPins,loadFixture,sink}){
 authorize(ack,authority);assert(Object.hasOwn(expectedCounts,section));if(section==='gf')assert.equal(ack.gf_stage1_structural_equivalence,'PASS','GF_PROFILE_REUSE_REQUIRES_STRUCTURAL_PROOF');if(section==='exclusion')assert.equal(ack.compatible_exclusion_support_precheck,'PASS','EXCLUSION_SUPPORT_PRECHECK_REQUIRED');assert.equal(typeof guard,'function');assert.equal(typeof checkPins,'function');assert.equal(typeof loadFixture,'function');for(const method of ['append','replay','finish'])assert.equal(typeof sink[method],'function');
 guard();await checkPins();const f=await loadFixture();const {sessionRecord,eligibilityRecord}=await import('./session-adapter.mjs');
 const started=performance.now(),wallName=section.startsWith('C2_')?'C2':section,coverage=orderedCoverage(section);let rows=0;
 const stop=()=>{guard();assert(performance.now()-started<ack.section_wall_ms[wallName],'SECTION_WALL_LIMIT');};
 const append=(...args)=>{stop();const value=sink.append(...args);assert(!value?.then,'RAW_CAPTURE_REQUIRES_SYNCHRONOUS_DURABLE_APPEND');assert.equal(value?.durable,true,'RAW_APPEND_NOT_DURABLE');return value;};
 const aggregate=section==='C2_eligibility'?eligibilityConsumer():section==='gf'?gfConsumer():['social','exclusion'].includes(section)?null:sessionConsumer(section);
 let result;
 try{
  for(const d of descriptors(section)){
   stop();coverage.add(d);let row;
   if(section==='C2_eligibility')row=eligibilityRecord(f,d);
   else if(section==='gf'){
    const {makeSnapshot,makeHistory,makeSafety,playerId}=await import('../p05-topic-measurements/profiles.mjs');const{selectNextTopicRound}=await import('../../packages/relationship-engine/dist/index.js');
    const hit=cl=>{const snapshot=makeSnapshot(f,{...d,class_profile:cl}),history=makeHistory(f,snapshot,d.regime),safety=makeSafety(snapshot,d.regime),p=selectNextTopicRound(snapshot,history,f.pack,f.map,safety).round;assert.equal(p.stage,1);return p.interaction==='pair_public'&&p.actors.slice().sort().join(':')===[playerId(0),playerId(1)].sort().join(':');};row={descriptor:d,g:hit('G'),f:hit('F')};
   }else{
    row=await sessionRecord(f,d,{shouldStop:()=>{stop();return false;},onRaw:r=>append('public-raw',r)});
   }
   const isInference=section==='social'||section==='exclusion';if(isInference){const feature=row.feature_record;assert.equal(classIndex(d)>=0,true);dense(feature);append('features',feature,{group:group(d),stratum:stratum(d)});}
   else aggregate.add(row);
   append('session-results',row,{cell:cell(d)});rows++;
  }
  const counted=coverage.finish();assert.equal(counted.status,'COMPLETE');assert.equal(rows,expectedCounts[section]);
  if(aggregate)result=aggregate.finish();else{
   const dictionary=(await import('../p05-topic-measurements-method06/public-transcript.mjs')).dictionary.names,groups=new Map();
   // Descriptor enumeration only for expected fixed cells/groups, not extra simulated samples.
   for(const d of descriptors(section)){const g=group(d),set=groups.get(g)??new Set();set.add(stratum(d));groups.set(g,set);}
   const reports=[];for(const[g,strata]of groups){const cells=[];for(const key of strata){stop();const raw=[];for await(const row of sink.replay('features',{stratum:key})){stop();assert.equal(stratum(row.descriptor),key,'MISROUTED_INFERENCE_CELL');raw.push(row);}const value=evaluateCell(raw,dictionary);append('inference-cell',{key,...value});cells.push({key,status:value.status});}
    const replay=async function*(){for await(const row of sink.replay('features',{group:g})){assert.equal(group(row.descriptor),g,'MISROUTED_POOLED_GROUP');yield row;}};
    const pooled=await evaluatePooled(replay,dictionary,{expectedCells:strata.size,guard:stop});append('inference-pooled',{group:g,...pooled});reports.push({group:g,cells,pooled_status:pooled.status,status:cells.every(c=>c.status==='PASS')&&pooled.status==='PASS'?'PASS':'FAIL'});
   }result={section,status:reports.every(r=>r.status==='PASS')?'PASS_PURE_STATISTICAL_SECTION_ONLY':'NOT_ACCEPTED',coverage:counted,reports};
  }
 }catch(error){const sectionError={name:error.name,code:error.code??null,message:error.message};result={section,status:'NOT_ACCEPTED',completed_descriptor_rows:rows,expected:expectedCounts[section],error:sectionError};}
 finally{await checkPins();}
 const receipt={...result,source_identity:authority.source,elapsed_ms:performance.now()-started,dispatch_revision:'P05-STATS-RESUME03',full_P05_PASS:false,human470:'HOLD_UNCHANGED'};guard();receipt.raw_capture=await sink.finish(receipt);return receipt;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert(process.argv.length===2||process.argv.slice(2).every(x=>x==='--describe'),'NO_CLI_RUN_WITHOUT_REVIEWED_EXTERNAL_SUPERVISOR_BINDING');
 console.log(JSON.stringify({status:'NOT_RUN',dispatch_revision:'P05-STATS-RESUME03',expectedCounts,requires:['clean preregistered exact source/tag/rootACK','independently accepted fixture/producer/runtime/parity','reviewed external resource supervisor and immutable replay sink'],feature_dictionary_sha256:featureHash,statistics_RUN:false}));
}
