/** Reproducible P03-M2 diagnostics. Full execution requires the preregistration tag.
 * --probe is explicitly non-gating; no results from it are promoted to final evidence.
 */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {syntheticCards,syntheticManifest,playerId} from '../tests/p03/fixtures.mjs';
const invokedAsMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
let buildWasActuallyForced=false;
// Build before dynamically loading any ignored runtime JavaScript. A failed
// compiler invocation aborts final measurement before a corpus is evaluated.
if(invokedAsMain&&!process.argv.includes('--probe')) {execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-b','--force'],{stdio:'inherit'});buildWasActuallyForced=true;}
const {FrozenPack,digest,policyDigest,algorithmRevision,immutableSnapshot,selectNextRound,proposeConsent,consentResponse,consentAllows,reconcileConsent}=await import('../packages/relationship-engine/dist/index.js');
const {transcriptAccumulator,transcriptPolicy,localeMetadataInvariant,publicFeatureNames}=await import('../tests/p03/public-transcript.mjs');
const hash=value=>createHash('sha256').update(value).digest('hex'),modes=['questions','truth_or_dare','yes_but'],contexts=['online','in_person'],labels=['just_met','friendship','crush','situationship','in_relationships','not_a_friend'];
const cards=syntheticCards(),manifest=syntheticManifest(cards,digest,policyDigest),pack=FrozenPack.load(cards,manifest,true);
const rawPolicy=JSON.parse(readFileSync('.docs/contracts/relationship-policy.v1.json','utf8'));
const matrix=rawPolicy.pair_class_matrix,order=['X','J','F','G','M','S','R'];
export const measurementDesign={
  revision:'P03-M2',
  seed_to_engine:'SHA256(UTF8 declared seed string), 64 lowercase hex chars; no salt or reseeding',
  random_profile:'SHA256(UTF8(seed+":player:"+zero_based_player_index)) first8hex uint32 modulo5 -> comfort; SHA256(UTF8(seed+":edge:"+a+":"+b)) first8hex uint32 modulo6 -> [just_met,friendship,crush,situationship,in_relationships,not_a_friend]. Every generated directed edge explicit=true.',
  participants:'playerId(i), canonical lower UUID, i=0..N-1; snapshot canonical sorting; first unordered pair indices0,1',
  index_assignment:'invariants mode=[questions,truth_or_dare,yes_but][index%3], context=[online,in_person][floor(index/3)%2], rounds=1+index%100; other sections have Cartesian explicit strata',
  invariant_seed:'venus:P03-M1:test:<size>:<index>',fairness_seed:'venus:P03-M2:fairness:<size>:<mode>:<context>:<index>',gf_seed:'venus:P03-M1:gf:<index>',
  inference_seed:'venus:P03-M2:<train|holdout>:<FG|FM|GM>:<class>:<size>:<mode>:<context>:<index>',
  inference_sample:'100 train and400 holdout per class per42strata N2..8 x3modes x2contexts; pooled4200 train /16800 holdout per class. First100 indices exactly one each round count1..100; holdout four each; capabilities=[private_text_chat] in BOTH contexts, because this synthetic mixed-context fixture explicitly requires it; production capability availability is not asserted',
  observer_scope:'Public-channel-only observation: at selectedN2..7 an unselected authenticated room member can observe when a room slot is available; at selectedN8 room capacity8 precludes a ninth spectator, so this is the public component of a participating member view. Observer-owned edges and targeted private invitations/prompts are excluded from this diagnostic and require separate structural secret-field/ACL checks.',
  transcript_policy:transcriptPolicy,
  lifecycle:'Each round starts with public snapshot. Private invitation yields two further snapshots (acks). Truth-or-dare always chooses truth in one mutation. Bilateral action yields two snapshots (acks, second activates); terminal finish one snapshot. No condition/refusal injected. Nonbilateral no-choice starts active. Private condition/offer/card/actor details never included.',
  metadata:'Global per-session revisions start1 and increase1 per modeled mutation; public game_rev and stream_rev equal. at_tick starts0, increases1 per modeled mutation; fixed common clock offset irrelevant. Count frame UTF8 JSON bytes with actual fixed-length deterministic round UUID and decimal revisions/ticks, not private frame sizes. Observe every mutation, a conservative maximum versus ticker coalescing.',
  feature_serialization:'publicFeatureNames exact order: interactions4, visible_role8, ordered_first8, ordered_second8, ordered_pair64 row-major, private_stage4, round_state5, response_state5, choice3, metadata7, then public card IDs in FrozenPack canonical card order. All counts/sums divided by total committed rounds. Visible role includes actors plus literal synthetic display-name token rendered in public text. Private card ID/actors never enter features.',
  classifier:'Per-stratum and pooled diagonal LDA trained independently. Difference of class1 and class0 means divided by average unbiased within-class variance +1e-9; midpoint intercept. No holdout coefficient/orientation choice. Exact held-out scores stored in report; pooling does not combine differently scaled stratum scores.',
  structural_decoder:'Each exact single-feature value -> class dictionary learned only on train; overlap rejects decoder. Block when disjoint train dictionaries classify every held-out observation of both classes. This finite check is not a universal nonlinear privacy proof.',
  output:'Report contains raw section counters, deterministic seed formulas/ranges, source SHA and source inventory SHA, raw protocol/runner/adapter/fixture hashes, pack canonical digest; no seed selection after outcomes.'
};
export function measurementInputs() {
  const sources=['tools/p03-measurements.mjs','tests/p03/public-transcript.mjs','tests/p03/fixtures.mjs','packages/relationship-engine/src/engine.ts','packages/relationship-engine/src/pack.ts','packages/relationship-engine/src/consent.ts','packages/relationship-engine/src/types.ts','packages/relationship-engine/src/index.ts','packages/relationship-engine/src/policy.json','packages/relationship-engine/src/card-schema.json','packages/relationship-engine/src/policy-identity.ts','apps/api/src/games-model.ts','.docs/contracts/relationship-policy.v1.json','.docs/implementation/p03-measurement-protocol-v2.json'];
  return {schema:1,protocol_revision:'P03-M2',raw_input_sha256:Object.fromEntries(sources.map(path=>[path,hash(readFileSync(path))])),pack_digest:pack.digest,fixture_manifest_sha256:digest(manifest),feature_names_sha256:digest(publicFeatureNames(pack.cards.filter(card=>card.interaction!=='pair_private'))),measurement_design:measurementDesign};
}
function assert(ok,code) {if(!ok) throw new Error(code);}
function measuredChanges() {return [...execFileSync('git',['diff','--name-only','HEAD'],{encoding:'utf8'}).trim().split('\n'),...execFileSync('git',['ls-files','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n')].filter(Boolean).filter(name=>!name.startsWith('.history/')&&!name.startsWith('.docs/implementation/reviews/')&&!name.startsWith('.docs/implementation/evidence/')&&!/^\.docs\/implementation\/p\d{2}-registry\.json$/.test(name)&&!['FILE_MANIFEST.sha256','.docs/implementation/status.md'].includes(name));}
export function profile(seed,size,mode,context,total,kind='exchangeable',pairClass='F') {
  const players=Array.from({length:size},(_,i)=>({id:playerId(i),comfort:kind==='random'?parseInt(hash(seed+':player:'+i).slice(0,8),16)%5:kind==='gf'?1:4,edges:{}}));
  for(let a=0;a<size;a++) for(let b=0;b<size;b++) if(a!==b) players[a].edges[players[b].id]={relation:kind==='random'?labels[parseInt(hash(seed+':edge:'+a+':'+b).slice(0,8),16)%6]:'friendship',explicit:true};
  if(kind!=='random'&&pairClass!=='F') {players[0].edges[players[1].id].relation='crush';if(pairClass==='M') players[1].edges[players[0].id].relation='crush';}
  return immutableSnapshot({schema:1,session_id:'22222222-2222-4222-8222-222222222222',room_id:'11111111-1111-4111-8111-111111111111',engine_revision:algorithmRevision,policy_revision:'RE-1',policy_digest:policyDigest,pack_digest:pack.digest,seed:hash(seed),mode,context,total_rounds:total,players,capabilities:['private_text_chat']},pack);
}
export function pairedRatioCI(counts) {
  assert(Object.keys(counts).sort().join(',')==='both,f_only,g_only,neither'&&Object.values(counts).every(n=>Number.isSafeInteger(n)&&n>=0),'INVALID_PAIRED_COUNTS');
  const {both,g_only,f_only,neither}=counts,n=both+g_only+f_only+neither,pG=(both+g_only)/n,pF=(both+f_only)/n;
  if(n<2||pG===0||pF===0) return {status:'FAIL',reason:'ZERO_COUNT_OR_DENOMINATOR',n,counts};
  const varianceG=n/(n-1)*pG*(1-pG),varianceF=n/(n-1)*pF*(1-pF),covariance=n/(n-1)*(both/n-pG*pF);
  const variance=(varianceG/pG**2+varianceF/pF**2-2*covariance/(pG*pF))/n;
  if(!Number.isFinite(variance)||variance< -1e-14) return {status:'FAIL',reason:'NONFINITE_VARIANCE',n,counts};
  const se=Math.sqrt(Math.max(0,variance)),ratio=pG/pF,ci=[Math.exp(Math.log(ratio)-1.96*se),Math.exp(Math.log(ratio)+1.96*se)];
  return {status:ci[0]>1?'PASS':'FAIL',n,counts,pG,pF,sG2:varianceG,sF2:varianceF,sGF:covariance,variance_log_ratio:variance,ratio,log_ratio_se:se,ci95:ci};
}
export function aucCI(negative,positive) {
  assert(negative.length>1&&positive.length>1&&negative.every(Number.isFinite)&&positive.every(Number.isFinite),'INVALID_AUC_INPUT');
  const ordered=[...negative.map(score=>({score,label:0})),...positive.map(score=>({score,label:1}))].sort((a,b)=>a.score-b.score);let rankSum=0;
  for(let a=0;a<ordered.length;) {let b=a+1;while(b<ordered.length&&ordered[b].score===ordered[a].score) b++;const rank=(a+1+b)/2;for(let i=a;i<b;i++) if(ordered[i].label) rankSum+=rank;a=b;}
  const n0=negative.length,n1=positive.length,auc=(rankSum-n1*(n1+1)/2)/(n0*n1),q1=auc/(2-auc),q2=2*auc*auc/(1+auc),variance=(auc*(1-auc)+(n1-1)*(q1-auc*auc)+(n0-1)*(q2-auc*auc))/(n0*n1),se=Math.sqrt(Math.max(0,variance)),ci=[Math.max(0,auc-1.96*se),Math.min(1,auc+1.96*se)];
  return {n_negative:n0,n_positive:n1,auc,se,ci95:ci,status:Number.isFinite(auc)&&ci[1]<=.65?'PASS':'FAIL'};
}
export function trainLDA(negative,positive) {
  assert(negative.length>1&&positive.length>1&&negative[0]?.length>0&&[...negative,...positive].every(row=>row.length===negative[0].length&&row.every(Number.isFinite)),'INVALID_LDA_INPUT');
  const dimension=negative[0].length,moments=rows=>{const mean=new Float64Array(dimension),sq=new Float64Array(dimension);for(const row of rows) for(let i=0;i<dimension;i++) {mean[i]+=row[i];sq[i]+=row[i]**2;}for(let i=0;i<dimension;i++) {mean[i]/=rows.length;sq[i]=Math.max(0,(sq[i]-rows.length*mean[i]**2)/(rows.length-1));}return {mean,variance:sq};},a=moments(negative),b=moments(positive),weights=Float64Array.from(a.mean,(_,i)=>(b.mean[i]-a.mean[i])/((a.variance[i]+b.variance[i])/2+1e-9));
  const intercept=-weights.reduce((sum,w,i)=>sum+w*(a.mean[i]+b.mean[i])/2,0);
  return {weights,intercept,score:row=>row.reduce((sum,x,i)=>sum+x*weights[i],intercept)};
}
function runPlans(snapshot,visit) {const history=[];for(let round=0;round<snapshot.total_rounds;round++) {const plan=selectNextRound(snapshot,history,pack);visit?.(plan,history);history.push(plan);}return history;}
function invariantDefinitions() {return [
  ['I01','X veto','selected plans'],['I02','all affected comfort','selected plans'],['I03','stage ceiling','selected plans'],['I04','online physical/going-away exclusion','selected plans'],['I05','physical scope and bilateral action','planner + pure consent; DB integration required'],['I06','private scope, actor approval, targeted projection','planner + pure consent + production public renderer; HTTP/WS DB integration required'],['I07','scope and confirmed couple','selected plans'],['I08','immutable snapshot, refusal remains possible','immutable snapshot + pure consent; runtime integration required'],['I09','locale changes text only','production public renderer; no locale accepted by snapshot'],['I10','host cannot accept/read edges','pure consent negative; HTTP/DB ACL integration required'],['I11','timer never implies performed','pure consent expiry; physical-world completion cannot be measured'],['I12','production reviewed cards only','production pack loader rejects this draft; human approval remains P04'],['I13','generic invitation has no edge/reason','recursive production public projection assertion; actual transport integration required'],['I14','close revokes/wipes','NOT_TESTABLE_IN_PURE_PLANNER: required DB/WS close integration'],['I15','safe fallback same guards','all selected plans checked independently; safe refusal recorded']
  ].map(([id,requirement,scope])=>({id,requirement,scope,checks:0,violations:0,runtime_evidence_required:['I05','I06','I08','I10','I12','I13','I14'].includes(id)}));}
function consentChecks(plan,rows) {
  if(plan.actors.length!==2) return;const actors=plan.actors,reference=o=>({offer_id:o.offer_id,scope:o.scope,proposal_revision:o.proposal_revision});
  let action=proposeConsent('synthetic-action',actors,'action',100,180000);assert(!consentAllows(action,actors[0],100),'I05_PRECONSENT');action=consentResponse(action,actors[0],'accept',101,reference(action));assert(!consentAllows(action,actors[0],101),'I05_ONE_ACK');action=consentResponse(action,actors[1],'accept',102,reference(action));assert(consentAllows(action,actors[0],102),'I05_BILATERAL');rows[4].checks++;
  assert(reconcileConsent(action,180000).state==='expired','I11_EXPIRY');rows[10].checks++;
  const stopped=consentResponse(action,actors[0],'stop',103);assert(!consentAllows(stopped,actors[1],104),'I08_REFUSAL');rows[7].checks++;
  let rejected=false;try {consentResponse(action,'non-actor-host','accept',103,reference(action));}catch {rejected=true;}assert(rejected,'I10_HOST_ACK');rows[9].checks++;
  if(plan.interaction==='pair_private') {const invite=proposeConsent('synthetic-invitation',actors,'invitation',100);assert(!consentAllows(invite,actors[0],100),'I06_PENDING');rows[5].checks++;}
}
async function invariants(probe,progress) {
  const rows=invariantDefinitions(),sizeReports=[],violations=[],refusals=[];const perSize=probe?4:10000;
  let draftRejected=false;try {FrozenPack.load(cards,manifest);}catch {draftRejected=true;}assert(draftRejected,'I12_DRAFT_PRODUCTION');rows[11].checks++;
  for(let size=2;size<=8;size++) {let completed=0,refused=0,rounds=0;const counts={};for(let index=0;index<perSize;index++) {
    const seed=`venus:P03-M1:test:${size}:${index}`,mode=modes[index%3],context=contexts[Math.floor(index/3)%2],snapshot=profile(seed,size,mode,context,1+index%100,'random'),snapshotHash=digest(snapshot);counts[mode+':'+context]=(counts[mode+':'+context]??0)+1;
    const projection=transcriptAccumulator(pack,snapshot.players);let completedPrefix=0;
    try {runPlans(snapshot,(plan,history)=>{
      const card=pack.card(plan.card_id),actors=snapshot.players.filter(p=>plan.actors.includes(p.id)),affected=card.interaction==='group'?snapshot.players:actors;
      const check=(i,ok)=>{rows[i-1].checks++;if(!ok) {rows[i-1].violations++;throw new Error('I'+String(i).padStart(2,'0'));}};
      const cl=actors.length===2?matrix[actors[0].edges[actors[1].id]?.relation??'friendship'][actors[1].edges[actors[0].id]?.relation??'friendship']:null;
      check(1,actors.length!==2||cl!=='X');check(2,affected.every(p=>p.comfort>=card.min_comfort));check(3,card.min_progression_stage<=plan.stage&&plan.stage===Math.min(4,1+Math.floor(4*(plan.round_index-1)/Math.max(1,snapshot.total_rounds-1))));check(4,context!=='online'||!card.requires_physical_contact&&!card.requires_going_away);check(5,!card.requires_physical_contact||context==='in_person'&&card.consent==='bilateral'&&card.min_comfort===4&&plan.requires_action_consent);check(6,card.interaction!=='pair_private'||plan.stage>=3&&actors.every(p=>p.comfort>=1)&&plan.requires_action_consent);check(7,cl===null?card.relationship_scope==='none':order.indexOf(cl)>=order.indexOf(rawPolicy.relationship_scope_min_class[card.relationship_scope])&&cl!=='X');check(8,digest(snapshot)===snapshotHash);
      const frames=projection.add(plan);check(9,localeMetadataInvariant(pack,plan,snapshot.players));check(13,card.interaction!=='pair_private'||frames.every(frame=>!('card_id' in frame.current_round)&&!('actors' in frame.current_round)));check(15,!history.some(p=>p.card_id===plan.card_id));
      // Consent state-machine probes once per actual pair proposal; no assumed runtime ACL PASS.
      consentChecks(plan,rows);rounds++;completedPrefix++;
    });completed++;} catch(error) {if(error.message==='SAFE_POOL_EXHAUSTED') {refused++;refusals.push({seed,reason:error.message,completed_prefix:completedPrefix});}else {violations.push({seed,size,index,error:error.message});if(violations.length>=20) throw error;}}
  }sizeReports.push({size,sessions:perSize,completed,safe_refusals:refused,rounds,cells:counts});progress('invariants N'+size);}
  return {status:violations.length?'FAIL':'PASS',scope:'PLANNER_AND_PURE_CONSENT_DIAGNOSTIC_ONLY',runtime_gate:'PENDING_SEPARATE_AUTHENTICATED_DB_HTTP_WS_EVIDENCE',sessions:sizeReports.reduce((s,r)=>s+r.sessions,0),sizes:sizeReports,invariants:rows,violations,safe_refusals:refusals};
}
async function fairness(probe,progress) {
  const strata=[];for(let size=2;size<=8;size++) for(const mode of modes) for(const context of contexts) {
    const counts=Array(size).fill(0),sessions=probe?2:2000;let K=0,maxShare=0,zero=0;
    for(let index=0;index<sessions;index++) {const seed=`venus:P03-M2:fairness:${size}:${mode}:${context}:${index}`,snapshot=profile(seed,size,mode,context,20),own=Array(size).fill(0);let pairs=0;
      runPlans(snapshot,plan=>{if(plan.interaction.startsWith('pair_')) {pairs++;K++;for(const id of plan.actors) {const i=snapshot.players.findIndex(p=>p.id===id);counts[i]++;own[i]++;}}});
      if(pairs===0) zero++;else maxShare=Math.max(maxShare,...own.map(n=>n/(2*pairs)));
    }
    const D=2*K,shares=counts.map(n=>D?n/D:null),gap=D?Math.max(...shares)-Math.min(...shares):null;strata.push({size,mode,context,sessions,K,D,invitation_counts:counts,individual_shares:shares,aggregate_player_share_gap:gap,max_individual_session_share:maxShare,zero_pair_sessions:zero,status:D&&maxShare<=.5&&gap<=.02?'PASS':'FAIL',limitation:size===2?'N2 necessarily .5 each; no partner variety promise':null});progress(`fairness ${size}/${mode}/${context}`);
  }return {status:strata.every(s=>s.status==='PASS')?'PASS':'FAIL',strata};
}
async function gf(probe,progress) {
  const counts={both:0,g_only:0,f_only:0,neither:0},opportunities=probe?50:1000000,target=[playerId(0),playerId(1)].sort().join(':');
  for(let index=0;index<opportunities;index++) {const seed=`venus:P03-M1:gf:${index}`,hit=kind=>{const s=profile(seed,4,'questions','in_person',20,'gf',kind),p=selectNextRound(s,[],pack);return p.interaction==='pair_public'&&[...p.actors].sort().join(':')===target;},g=hit('G'),f=hit('F');counts[g?(f?'both':'g_only'):(f?'f_only':'neither')]++;if(index>0&&index%100000===0) progress('GF '+index);}
  return pairedRatioCI(counts);
}
function observed(seed,size,mode,context,index,cl) {const snapshot=profile(seed,size,mode,context,1+index%100,'exchangeable',cl),transcript=transcriptAccumulator(pack,snapshot.players);runPlans(snapshot,plan=>transcript.add(plan));return transcript.finish(snapshot.total_rounds);}
function deterministicDecoders(training,holdout,featureNames) {
  const hits=[];for(let feature=0;feature<featureNames.length;feature++) {
    // Fixed exact-value decoder learned on training; report only if it classifies
    // every held-out sample of both classes. No holdout orientation selection.
    const a=new Set(training[0].map(row=>row[feature])),b=new Set(training[1].map(row=>row[feature]));if([...a].some(v=>b.has(v))) continue;
    if(holdout[0].every(row=>a.has(row[feature]))&&holdout[1].every(row=>b.has(row[feature]))) hits.push(featureNames[feature]);
  }return hits;
}
async function inference(probe,progress) {
  const comparisons=[];for(const [negative,positive] of [['F','G'],['F','M'],['G','M']]) {
    const comparison=negative+positive,strata=[],pooledTraining=[[],[]],pooledHoldout=[[],[]];
    for(let size=2;size<=8;size++) for(const mode of modes) for(const context of contexts) {
      const training=[[],[]],holdout=[[],[]],trainCount=probe?2:100,holdoutCount=probe?4:400;
      for(const [classIndex,cl] of [negative,positive].entries()) for(const [split,count,target] of [['train',trainCount,training],['holdout',holdoutCount,holdout]]) for(let index=0;index<count;index++) {
        const seed=`venus:P03-M2:${split}:${comparison}:${cl}:${size}:${mode}:${context}:${index}`;target[classIndex].push(observed(seed,size,mode,context,index,cl));
      }
      const classifier=trainLDA(...training),scores=holdout.map(rows=>rows.map(classifier.score)),metric=aucCI(...scores),featureNames=transcriptAccumulator(pack,profile('names',size,mode,context,1).players).names,decoders=deterministicDecoders(training,holdout,featureNames);
      for(let i=0;i<2;i++) {pooledTraining[i].push(...training[i]);pooledHoldout[i].push(...holdout[i]);}
      strata.push({size,mode,context,negative_class:negative,positive_class:positive,train_per_class:trainCount,holdout_per_class:holdoutCount,...metric,heldout_scores:scores,structural_deterministic_decoders:decoders,coefficient_sha256:hash(Buffer.from(classifier.weights.buffer)),intercept:classifier.intercept,status:metric.status==='PASS'&&decoders.length===0?'PASS':'FAIL'});progress(`inference ${comparison}/${size}/${mode}/${context}`);
    }
    const pooledClassifier=trainLDA(...pooledTraining),pooledScores=pooledHoldout.map(rows=>rows.map(pooledClassifier.score)),pooledMetric=aucCI(...pooledScores);
    comparisons.push({comparison,negative_class:negative,positive_class:positive,strata,pooled:{...pooledMetric,heldout_scores:pooledScores,coefficient_sha256:hash(Buffer.from(pooledClassifier.weights.buffer)),intercept:pooledClassifier.intercept,pooling:'independently trained pooled classifier; no holdout calibration'},status:strata.every(s=>s.status==='PASS')&&pooledMetric.status==='PASS'?'PASS':'FAIL'});
  }return {status:comparisons.every(c=>c.status==='PASS')?'PASS':'FAIL',transcript_policy:transcriptPolicy,comparisons,limitations:['Fixed diagonal LDA and finite exact single-feature decoders are diagnostics, not universal privacy proof.','Equal all-accept synthetic timing; human behavior, network scheduling and refusal channels require runtime/UX assessment.','Hard X/J/comfort exclusions intentionally reveal compatibility boundaries; measured profiles are common-support F/G/M only.']};
}
export async function main(args=process.argv.slice(2)) {
  const probe=args.includes('--probe'),section=args.find(a=>a.startsWith('--section='))?.split('=')[1]??'all',protocolPath='.docs/implementation/p03-measurement-protocol-v2.json';assert(['all','invariants','fairness','gf','inference'].includes(section),'UNKNOWN_SECTION');
  if(!probe) assert(invokedAsMain&&buildWasActuallyForced,'FINAL_REQUIRES_FRESH_CLI_BUILD');
  const protocol=readFileSync(protocolPath),protocolHash=hash(protocol),source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceIdentity=execFileSync('python',['-B','tools/stage_inventory.py'],{encoding:'utf8'}).trim();
  const inputDescriptor=measurementInputs();
  if(!probe) {
    const tag='p03-m2-preregistered-20261018',preregistered=execFileSync('git',['show',tag+':'+protocolPath]);assert(hash(preregistered)===protocolHash,'PROTOCOL_NOT_PREREGISTERED');assert(JSON.parse(protocol).protocol_revision==='P03-M2','PROTOCOL_REVISION');
    const descriptorPath='.docs/implementation/p03-measurement-inputs-v2.json',descriptorRaw=readFileSync(descriptorPath);assert(digest(JSON.parse(descriptorRaw))===digest(inputDescriptor),'INPUT_DESCRIPTOR_MISMATCH');assert(hash(execFileSync('git',['show',tag+':'+descriptorPath]))===hash(descriptorRaw),'INPUT_DESCRIPTOR_NOT_PREREGISTERED');
    for(const [path,expected] of Object.entries(inputDescriptor.raw_input_sha256)) assert(hash(execFileSync('git',['show',tag+':'+path]))===expected,'MEASUREMENT_INPUT_CHANGED_SINCE_PREREGISTRATION:'+path);
    const changed=measuredChanges();assert(changed.length===0,'DIRTY_MEASURED_SOURCE:'+changed.join(','));
  }
  const directory=resolve(args.find(a=>a.startsWith('--output='))?.slice(9)??`.artifacts/p03-measurements/${probe?'probe':'final'}-${Date.now()}-${section}`);assert(!existsSync(directory),'OUTPUT_ALREADY_EXISTS');mkdirSync(directory,{recursive:true});
  const report={schema:1,status:'RUNNING',gating:!probe,probe,section,source_sha:source,source_identity_sha256:sourceIdentity,source_dirty:probe?null:false,protocol_sha256:protocolHash,protocol_path:protocolPath,preregistered_input_descriptor:inputDescriptor,input_sha256:Object.fromEntries(['tools/p03-measurements.mjs','tests/p03/public-transcript.mjs','tests/p03/fixtures.mjs','packages/relationship-engine/src/engine.ts','apps/api/src/games-model.ts','packages/relationship-engine/dist/index.js','packages/relationship-engine/dist/engine.js','packages/relationship-engine/dist/consent.js','packages/relationship-engine/dist/pack.js','apps/api/dist/games-model.js','apps/api/dist/rooms.js'].map(path=>[path,hash(readFileSync(path))])),fresh_build:probe?'NOT_REQUIRED_NON_GATING':'tsc -b --force BEFORE dynamic runtime imports',measurement_design:measurementDesign,algorithm_revision:algorithmRevision,policy_digest:policyDigest,pack_digest:pack.digest,fixture_manifest_sha256:digest(manifest),started_at:new Date().toISOString(),results:{}};
  const persist=()=>writeFileSync(resolve(directory,'report.json'),JSON.stringify(report,null,2));persist();const progress=message=>{console.log(new Date().toISOString()+' '+message);persist();};
  try {for(const [name,run] of Object.entries({invariants,fairness,gf,inference})) if(section==='all'||section===name) {const start=Date.now();report.results[name]=await run(probe,progress);report.results[name].elapsed_seconds=(Date.now()-start)/1000;persist();}report.status=probe?'NON_GATING_PROBE':Object.values(report.results).every(result=>result.status==='PASS')?'PASS':'FAIL';}
  catch(error) {report.status='FAIL';report.error={name:error.name,message:error.message,stack:error.stack};throw error;}finally {
    try {
      report.source_after_sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();report.source_identity_after_sha256=execFileSync('python',['-B','tools/stage_inventory.py'],{encoding:'utf8'}).trim();report.source_dirty_after=measuredChanges().length>0;
      report.input_sha256_after=Object.fromEntries(Object.keys(report.input_sha256).map(path=>[path,hash(readFileSync(path))]));report.preregistered_raw_inputs_after=Object.fromEntries(Object.keys(inputDescriptor.raw_input_sha256).map(path=>[path,hash(readFileSync(path))]));
      if(!probe&&(report.source_after_sha!==source||report.source_identity_after_sha256!==sourceIdentity||report.source_dirty_after||digest(report.input_sha256_after)!==digest(report.input_sha256)||digest(report.preregistered_raw_inputs_after)!==digest(inputDescriptor.raw_input_sha256))) {report.status='FAIL';report.identity_error='SOURCE_OR_INPUT_CHANGED_DURING_MEASUREMENT';}
    }catch(error) {report.status='FAIL';report.identity_error=error.message;}
    report.finished_at=new Date().toISOString();persist();console.log(JSON.stringify({status:report.status,report:resolve(directory,'report.json')}));
  }
  if(!probe&&report.status!=='PASS') process.exitCode=1;return report;
}
if(invokedAsMain) await main();
