import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {DatabaseSync} from 'node:sqlite';

const root=process.cwd(), review='.docs/implementation/evidence/p04/review470-r3/reviews/independent-round01';
const out=path.resolve(review,process.env.P04_REVIEW_RUN||'.'), evidence='.docs/implementation/evidence/p04/review470-r3';
fs.mkdirSync(out,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const canonical=x=>typeof x==='string'?JSON.stringify(x.normalize('NFC')):x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const pins=read(evidence+'/input-pins.json'), actions=read(evidence+'/actions139.json').actions;
const actionIds=new Set(actions.map(a=>a.id));
const checks=[], failures=[];
const check=(name,ok,details)=>{checks.push({name,pass:!!ok,...(details?{details}:{})});if(!ok)failures.push(name);};
const inputHashes=[];
const originalPackageRequire=createRequire(path.resolve('packages/relationship-engine/package.json'));
check('generated card schema equals contract bytes',sha(fs.readFileSync('.docs/contracts/card.schema.json'))===sha(fs.readFileSync('packages/relationship-engine/src/card-schema.json')));
for(const name of ['pack','engine','types','policy-identity']) {
  const source='packages/relationship-engine/src/'+name+'.ts', bytes=fs.readFileSync(source);
  inputHashes.push({path:source,sha256:sha(bytes)});
  let compiled=ts.transpileModule(bytes.toString(),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  if(name==='pack')for(const dependency of ['ajv/dist/2020.js','ajv-formats']) compiled=compiled.replace("'"+dependency+"'",JSON.stringify(pathToFileURL(originalPackageRequire.resolve(dependency)).href));
  fs.writeFileSync(path.join(out,name+'.js'),compiled);
}
for(const name of ['card-schema.json','policy.json']) {
  const source='packages/relationship-engine/src/'+name, bytes=fs.readFileSync(source);
  inputHashes.push({path:source,sha256:sha(bytes)});fs.writeFileSync(path.join(out,name),bytes);
}
const {FrozenPack,digest}=await import(pathToFileURL(path.join(out,'pack.js')));
const {eligible}=await import(pathToFileURL(path.join(out,'engine.js')));
const {policyDigest}=await import(pathToFileURL(path.join(out,'policy-identity.js')));
const cards=pins.cards.map(p=>read('.docs/content/p04-r3/cards/'+p.id+'.json'));
const baseline=pins.cards.map(p=>read(p.source_path));
const candidatePins=cards.map(c=>({id:c.id,revision:c.revision,path:'.docs/content/p04-r3/cards/'+c.id+'.json',raw_sha256:sha(fs.readFileSync('.docs/content/p04-r3/cards/'+c.id+'.json')),canonical_sha256:digest(c)}));
fs.writeFileSync(path.join(out,'candidate-pins470.json'),JSON.stringify(candidatePins,null,2)+'\n');
const frozenIndexPath=process.env.P04_CANDIDATE_INDEX||evidence+'/candidate-round01/card-index.json';
const frozenIndex=read(frozenIndexPath);
const frozenFiles=frozenIndex.files||frozenIndex.card_files;
check('frozen470 index count',frozenFiles.length===470);
check('frozen470 index exact bytes',frozenFiles.every(p=>sha(fs.readFileSync(p.path))===p.sha256));
const differences=[];
check('470 input pins',pins.cards.length===470&&new Set(pins.cards.map(p=>p.id)).size===470);
for(const p of pins.cards) {
  check('source raw '+p.id,sha(fs.readFileSync(p.source_path))===p.raw_sha256);
  check('source canonical '+p.id,digest(read(p.source_path))===p.canonical_sha256);
  const file='.docs/content/p04-r3/cards/'+p.id+'.json', card=read(file), raw=sha(fs.readFileSync(file)), changed=raw!==p.raw_sha256;
  if(changed)differences.push(p.id);
  check('scope '+p.id,changed===actionIds.has(p.id));
  check('revision '+p.id,card.revision===p.revision+(changed?1:0));
  check('draft '+p.id,card.status==='draft'&&card.authoring.reviewed_by===null&&card.authoring.reviewed_at===null&&card.authoring.rights_status==='needs_review');
}
const catalogDigest=rows=>digest(rows.map(c=>({id:c.id,revision:c.revision,sha256:digest(c)})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0));
const sourceDigest=catalogDigest(baseline);
check('source digest',sourceDigest===pins.source_catalog_digest,{actual:sourceDigest,expected:pins.source_catalog_digest});
check('exact changed139',differences.length===139&&actions.length===139);
check('exact raw331',cards.length-differences.length===331);
for(const p of pins.inputs)check('document '+p.path,sha(fs.readFileSync(p.path))===p.sha256);
const delta=fs.readFileSync(pins.inputs[1].path,'utf8').split('\n').map(l=>l.trim().split('\t')).filter(r=>/^(Q|TD|YB)-\d{4}$/.test(r[0]));
check('appendix365',delta.length===365);
check('appendix139 equals actions',delta.filter(r=>r[4]==='ИСПРАВИТЬ').length===139&&delta.filter(r=>r[4]==='ИСПРАВИТЬ').every(r=>actionIds.has(r[0])));
check('appendix pins',delta.every(r=>pins.cards.some(p=>p.id===r[0]&&p.revision===+r[1].slice(1)&&p.canonical_sha256===r[3])));
const manifest={schema_version:1,pack_id:'venus-cards-core',pack_revision:3,content_contract_revision:'CARD-1',policy_revision:'RE-1',policy_sha256:policyDigest.slice(7),status:'illustrative_draft_candidate',locale_codes:['ru','en','tr'],total_cards:470,reviewed_cards:0,mode_counts:{},category_counts:{},eligibility_cell_counts:{},cards:cards.map(c=>({id:c.id,revision:c.revision,sha256:digest(c),status:c.status})),caveats:['Independent draft validation; no human approval']};
manifest.canonical_payload_sha256=digest(manifest);
try {FrozenPack.load(cards,manifest,true);check('actual FrozenPack schema and semantics',true);} catch(e){check('actual FrozenPack schema and semantics',false,e.stack);}
const neutral=new Set(['Q-1105','Q-1110','Q-1112','YB-1102','YB-1104','YB-1107','YB-1130']);
const privacy=actions.filter(a=>a.notes.some(n=>n.startsWith('Для оффлайн-')));
check('privacy54',privacy.length===54);
for(const id of neutral) {
 const c=cards.find(c=>c.id===id);
 check('public neutral '+id,c.interaction==='pair_public'&&c.consent==='bilateral'&&c.relationship_scope==='acquaintance'&&c.min_comfort===0&&c.min_progression_stage===1&&c.meeting_contexts.length===2&&c.meeting_contexts.includes('online')&&c.meeting_contexts.includes('in_person')&&!c.safety_tags.includes('private')&&!c.required_capabilities.includes('private_text_chat'));
}
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
const players=[{id:a,comfort:1,edges:{[b]:{relation:'friendship',explicit:true}}},{id:b,comfort:1,edges:{[a]:{relation:'friendship',explicit:true}}}];
for(const c of cards.filter(c=>privacy.some(a=>a.id===c.id)&&!neutral.has(c.id))) {
 check('retained private '+c.id,c.interaction==='pair_private'&&c.min_comfort>=1&&c.min_progression_stage>=3&&c.consent==='bilateral'&&c.required_capabilities.includes('private_text_chat')&&!c.requires_going_away&&!c.requires_physical_contact);
 check('actual no capability rejects '+c.id,!eligible(c,{mode:c.mode,context:'in_person',players,capabilities:[]},[a,b],3));
 check('actual present capability permits '+c.id,eligible(c,{mode:c.mode,context:'in_person',players,capabilities:['private_text_chat']},[a,b],3));
 check('actual stage2 rejects '+c.id,!eligible(c,{mode:c.mode,context:'in_person',players,capabilities:['private_text_chat']},[a,b],2));
}
for(const id of neutral)for(const context of ['online','in_person']) {
 const c=cards.find(c=>c.id===id),early=players.map(p=>({...p,comfort:0,edges:Object.fromEntries(Object.keys(p.edges).map(k=>[k,{relation:'just_met',explicit:true}]))}));
 check('actual public stage1 '+context+' '+id,eligible(c,{mode:c.mode,context,players:early,capabilities:[]},[a,b],1));
}
const ledgerPath=process.argv[2];
let ledger=null;
if(ledgerPath) {
 const db=new DatabaseSync(ledgerPath,{readOnly:true});
 const source=new DatabaseSync(pins.source_ledger.path,{readOnly:true});
 const events=db.prepare('SELECT * FROM events ORDER BY seq').all(),sourceEvents=source.prepare('SELECT * FROM events ORDER BY seq').all();
 const revisions=db.prepare('SELECT * FROM revisions ORDER BY card_id,revision').all(),sourceRevisions=source.prepare('SELECT * FROM revisions ORDER BY card_id,revision').all();
 check('source ledger unchanged pinned bytes',sha(fs.readFileSync(pins.source_ledger.path))===pins.source_ledger.sha256);
 check('ledger integrity',db.prepare('PRAGMA integrity_check').get().integrity_check==='ok');
 check('ledger foreign keys',db.prepare('PRAGMA foreign_key_check').all().length===0);
 check('ledger source event prefix exact',canonical(events.slice(0,sourceEvents.length))===canonical(sourceEvents));
 check('ledger source revisions exact',sourceRevisions.every(s=>revisions.some(r=>r.card_id===s.card_id&&r.revision===s.revision&&canonical(r)===canonical(s))));
 check('ledger added139 revisions',revisions.length===sourceRevisions.length+139);
 let previous='0'.repeat(64);
 for(const event of events) {
   check('ledger chain event '+event.seq,event.previous===previous&&event.hash===digest({kind:event.kind,body:JSON.parse(event.body),previous}));previous=event.hash;
 }
 for(const c of cards) {
   const latest=revisions.filter(r=>r.card_id===c.id).at(-1);
   check('ledger active '+c.id,latest?.revision===c.revision&&latest.hash===digest(c)&&latest.body===canonical(c));
 }
 ledger={path:ledgerPath,sha256:sha(fs.readFileSync(ledgerPath)),head:previous,source_events:sourceEvents.length,events:events.length,source_revisions:sourceRevisions.length,revisions:revisions.length};
 source.close();db.close();
 fs.writeFileSync(path.join(out,'ledger-verification.json'),JSON.stringify(ledger,null,2)+'\n');
}
const result={created_at:new Date().toISOString(),scope:'SCOPED_CORRECTION_GATE_NOT_HUMAN_APPROVAL_OR_STAGE_PASS',status:failures.length?'FAIL':'PASS',checks:checks.length,failures,source_digest:sourceDigest,candidate_digest:catalogDigest(cards),changed: differences,input_hashes:inputHashes,detail:checks};
fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,checks:checks.length,failures,source_digest:sourceDigest,candidate_digest:result.candidate_digest},null,2));
process.exitCode=failures.length?1:0;
