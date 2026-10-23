/** Independent finite/parity/metadata controls; no sampled selector session. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,symlinkSync,rmSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),out=dirname(fileURLToPath(import.meta.url)),base=join(root,'.artifacts/p05-topic-measurements'),sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(p));
const {loadFixture}=await import(pathToFileURL(join(base,'fixture.mjs'))),{makeSnapshot}=await import(pathToFileURL(join(base,'profiles.mjs'))),{eligible}=await import(pathToFileURL(join(root,'packages/relationship-engine/dist/index.js'))),{descriptors,counts}=await import(pathToFileURL(join(base,'workload.mjs'))),{artifactBudget,validateRunAuthorization}=await import(pathToFileURL(join(base,'runner.mjs')));
const f=loadFixture(join(base,'fixture-checkpoint02'));assert.equal(f.cards.length,4930);assert.equal(f.map.families.length,1057);assert.deepEqual(f.map.excluded_card_ids,['Q-9000','Q-9001']);
const mixed=new Set(f.map.excluded_card_ids),modes=['questions','truth_or_dare','yes_but'];let parity=0,signatures=0;
for(const mode of modes)for(const context of ['online','in_person'])for(const capability of ['DEFAULT_OFF','CHAT_ON'])for(const class_profile of ['X','J','F','G','M','S','R'])for(let comfort=0;comfort<5;comfort++)for(let stage=1;stage<=4;stage++){
 const s=makeSnapshot(f,{size:2,seed_literal:'INDEPENDENT-FINITE-PREDICATE-PARITY-NOT-A-SAMPLED-SESSION',mode,context,capability,class_profile,comfort,stage,rounds:100});
 for(const card of f.pack.cards.filter(c=>c.mode===mode&&c.interaction==='pair_private'&&!mixed.has(c.id))){
  const expected=stage>=3&&comfort>=1&&!['X','J'].includes(class_profile)&&card.meeting_contexts.includes(context)&&(context!=='online'||capability==='CHAT_ON');
  assert.equal(eligible(card,s.baseline,s.baseline.players.map(p=>p.id),stage),expected);parity++;
 }signatures++;
}
assert.equal(signatures,1680);assert.equal(parity,2257920);
const sections={C2_eligibility:7*3*2*14*5*7*4*100,C2_neutral:7*3*2*14*100,C2_private:7*3*2*14*2*5*100,C2_negative:7*2*14,invariants:7*14*10000,fairness:7*3*2*14*2000,gf:1000000,social:7*3*2*14*3*2*500,exclusion:7*3*2*2*2*3*2*500};
const descriptorProof=[];
for(const [section,expected] of Object.entries(sections)){
 let count=0,first,last;
 for(const d of descriptors(section)){
  let seed;if(section.startsWith('C2_'))seed=`venus:P04:C1:${d.size}:${d.mode}:${d.context}:${d.comfort}:${d.class_profile}:${d.rounds}`;
  else if(section==='invariants')seed=`venus:P03-M1:test:${d.size}:${d.index}`;
  else if(section==='fairness')seed=`venus:P03-M2:fairness:${d.size}:${d.mode}:${d.context}:${d.index}`;
  else if(section==='gf')seed=`venus:P03-M1:gf:${d.index}`;
  else if(section==='social')seed=`venus:P03-M2:${d.split}:${d.comparison}:${d.class_profile}:${d.size}:${d.mode}:${d.context}:${d.index}`;
  else seed=`venus:P05-TOPIC-M1:${d.split}:${d.comparison}:${d.exclusionClass}:${d.size}:${d.mode}:${d.context}:${d.prior}:${d.index}`;
  assert.equal(d.seed_literal,seed);assert.equal(d.section,section);first??=d;last=d;count++;
 }assert.equal(count,expected);descriptorProof.push({section,count,first,last,all_literal_seeds_checked:true,statistical_samples_executed:0});
}
const controls=[],record=(id,pass,detail={})=>controls.push({id,status:pass?'PASS':'FAIL',...detail});
const temp=mkdtempSync(join(tmpdir(),'venus-measure-review-'));assert.equal(dirname(resolve(temp)),resolve(tmpdir()));
try{
 const dir=join(temp,'fixture');mkdirSync(dir);for(const n of ['cards','manifest','map','taxonomy','semantic'])writeFileSync(join(dir,n+'.json'),readFileSync(join(base,'fixture-checkpoint02',n+'.json')));
 for(const [id,name,mutate] of [
  ['CARD_TEXT_TAMPER','cards',d=>{d[0].text.ru.question+=' changed';}],
  ['MAP_UNKNOWN_TOPIC','map',d=>{d.entries[0].topic_ids=['unknown-topic'];}],
  ['SEMANTIC_MEMBER_REMOVAL','semantic',d=>{d.families[0].members.pop();}],
  ['MIXED_FAMILY_ACTIVATION','semantic',d=>{d.families.find(x=>x.mixed_visibility).repertoire='eligible';}],
  ['SYNTHETIC_APPROVAL_PROMOTION','taxonomy',d=>{d.approved=true;}],
 ]){
  const path=join(dir,name+'.json'),raw=readFileSync(path),data=JSON.parse(raw);mutate(data);writeFileSync(path,JSON.stringify(data));let refused=false;try{loadFixture(dir);}catch{refused=true;}record(id,refused);writeFileSync(path,raw);
 }
 const dictionary=read(join(base,'contracts/public-features.json'));const reordered=dictionary.names.slice();[reordered[0],reordered[1]]=[reordered[1],reordered[0]];record('FEATURE_ORDER_HASH_CORRUPTION',sha(JSON.stringify(reordered))!==dictionary.name_sha256&&sha(JSON.stringify(reordered))!=='2eba539a5104c8102606b8880f5d0113448a8d8fba11f1838cca16d50ad88bdd');
 const directory=join(temp,'regular-artifacts');mkdirSync(directory);const budget=artifactBudget(directory,10);let denied=0;for(const [name,value] of [['../escape','x'],['too-large','x'.repeat(11)]])try{budget.write(name,value);}catch{denied++;}budget.write('ok','x');try{budget.write('ok','again');}catch{denied++;}record('ARTIFACT_ESCAPE_OVERWRITE_LIMIT',denied===3);
 const target=join(temp,'outside-target'),link=join(temp,'linked-root');mkdirSync(target);symlinkSync(target,link,'junction');let rootAccepted=false;try{artifactBudget(link,100).write('outside.txt','INERT OWNED FIXTURE');rootAccepted=true;}catch{}record('ARTIFACT_LINKED_ROOT_REJECTION',!rootAccepted,{actual_windows_junction:true,unexpected_write_to_owned_sibling:rootAccepted});rmSync(link);
 const real=join(temp,'second-root');mkdirSync(real);const opened=artifactBudget(real,100),nested=join(real,'nested');symlinkSync(target,nested,'junction');let nestedAccepted=false;try{opened.write('nested/late.txt','INERT OWNED FIXTURE');nestedAccepted=true;}catch{}record('ARTIFACT_LINK_INSERTED_AFTER_INIT_REJECTION',!nestedAccepted,{actual_windows_junction:true,unexpected_write_to_owned_sibling:nestedAccepted});rmSync(nested);
 const bytes=Buffer.from('inert-preregistered-input'),digest=sha(bytes),context={source:'source',commit:'commit',dirty:false,inputs:{'input':digest},gitBlob:()=>bytes},ack={schema_version:1,kind:'ROOT_STATISTICAL_RUN_ACK',status:'AUTHORIZED',source_identity:'source',commit:'commit',preregistered_tag:'fixed-tag',max_artifact_bytes:32*1024**3,total_wall_ms:1,section_wall_ms:Object.fromEntries(['C2','invariants','fairness','gf','social','exclusion','runtime_canary'].map(k=>[k,1])),independent_fixture_support_review:'PASS',independent_producer_review:'PASS',actual_serializer_parity:'PASS',actual_runtime_canary:'PASS',inputs:{input:digest}};
 assert(validateRunAuthorization(ack,context));
 for(const [id,alter,ctx] of [['NO_ACK',()=>null,context],['DIRTY',a=>a,{...context,dirty:true}],['SOURCE_CHANGED',a=>({...a,source_identity:'wrong'}),context],['MISSING_WALL',a=>({...a,section_wall_ms:{}}),context],['BAD_BUDGET',a=>({...a,max_artifact_bytes:1}),context],['PARITY_PENDING',a=>({...a,actual_serializer_parity:'PENDING'}),context],['RUNTIME_PENDING',a=>({...a,actual_runtime_canary:'PENDING'}),context],['INPUT_CHANGED',a=>({...a,inputs:{input:'f'.repeat(64)}}),context],['TAG_BYTES_CHANGED',a=>a,{...context,gitBlob:()=>Buffer.from('wrong')}]] ){
  let denied=false;try{validateRunAuthorization(alter(structuredClone(ack)),ctx);}catch{denied=true;}record('LAUNCH_'+id,denied);
 }
 for(const args of [['--describe'],['--final']]){
  const child=spawnSync(process.execPath,[join(base,'runner.mjs'),...args],{cwd:root,encoding:'utf8',timeout:5000});record('CLI_'+args[0],args[0]==='--describe'?child.status===0&&JSON.parse(child.stdout).statistics_authorized===false:child.status!==0&&child.stderr.includes('MISSING_EXPLICIT_ROOT_STATS_RUN_ACK'));
 }
}finally{assert.equal(dirname(resolve(temp)),resolve(tmpdir()));rmSync(temp,{recursive:true});}
const ts=(await import(pathToFileURL(join(root,'node_modules/typescript/lib/typescript.js')))).default,mathRaw=readFileSync(join(root,'tools/p03-measurements.mjs')),tree=ts.createSourceFile('historical.mjs',mathRaw.toString(),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),names=['pairedRatioCI','aucCI','trainLDA'],func=tree.statements.filter(ts.isFunctionDeclaration).filter(f=>names.includes(f.name?.text));
assert.equal(func.length,3);const expected='/** Generated exact historical pure mathematics; source SHA256 '+sha(mathRaw)+'. */\nimport assert from \'node:assert/strict\';\n'+func.map(f=>f.getText(tree)).join('\n')+'\n';assert.equal(readFileSync(join(base,'statistics.mjs'),'utf8'),expected);
const result={scope:'INDEPENDENT_FINITE_PREPARATION_ONLY_NO_STATISTICAL_SAMPLES',loader_cards:f.cards.length,loader_families:f.map.families.length,hard_parity_signatures:signatures,hard_predicate_actual_eligible_comparisons:parity,descriptor_enumeration:descriptorProof,total_descriptors_fully_enumerated:descriptorProof.reduce((s,r)=>s+r.count,0),historical_math_exact_AST_fragments:3,controls,passed:controls.filter(x=>x.status==='PASS').length,failed:controls.filter(x=>x.status==='FAIL').length,statistical_samples_executed:0,human_approval:false,full_stage_acceptance:false};writeFileSync(join(out,'probes.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({parity,descriptors:result.total_descriptors_fully_enumerated,controls_pass:result.passed,controls_fail:result.failed,statistical_samples_executed:0}));
