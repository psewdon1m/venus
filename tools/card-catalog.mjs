/** Offline authoring/review CLI. Never changes runtime pointers or publishes a release.
 * All output files use exclusive creation; choose a new revision directory to retry. */
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {TextDecoder} from 'node:util';
import {strictJson,analyze,coverageReport,AuthoringLedger,reviewedCandidate} from '../packages/card-catalog/dist/index.js';
import {FrozenPack,canonical,digest} from '../packages/relationship-engine/dist/index.js';
import {validateBatchSnapshot} from './catalog-request-snapshot.mjs';
const hash=raw=>createHash('sha256').update(raw).digest('hex');
const readJson=path=>{const raw=readFileSync(path);if(raw.length>16*1024*1024) throw new Error('CATALOG_INPUT_TOO_LARGE');return {raw,value:strictJson(new TextDecoder('utf-8',{fatal:true}).decode(raw),16*1024*1024)};};
const load=path=>readJson(path).value;
const snapshotAt=path=>{
  const cards=[],files={};
  for(const name of readdirSync(path).filter(name=>name.endsWith('.json')).sort()) {
    if(!/^(Q|TD|YB)-\d{4}\.json$/.test(name)) throw new Error('CATALOG_CARD_FILENAME_INVALID');
    const file=join(path,name),raw=readFileSync(file);if(raw.length>128*1024) throw new Error('CATALOG_CARD_SIZE_LIMIT');
    const card=strictJson(new TextDecoder('utf-8',{fatal:true}).decode(raw),128*1024);if(card.id+'.json'!==name) throw new Error('CATALOG_CARD_FILENAME_ID_MISMATCH');
    cards.push(card);files[file.replaceAll('\\','/')]=hash(raw);
  }
  return {cards,files};
};
const cardsAt=path=>snapshotAt(path).cards;
const [command,...args]=process.argv.slice(2);
const write=(path,value)=>writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
try {
  if(command==='draft-check') {
    const [directory,out]=args;if(!directory||!out) throw new Error('Usage: draft-check CARDS OUT_DIRECTORY');
    const snapshot=snapshotAt(directory),cards=snapshot.cards,analysis=analyze(cards),pack=FrozenPack.load(cards,analysis.manifest,true);
    mkdirSync(dirname(out),{recursive:true});mkdirSync(out);write(join(out,'analysis.json'),analysis);
    write(join(out,'manifest.json'),analysis.manifest);write(join(out,'coverage.json'),coverageReport(pack));write(join(out,'coverage-private-chat.json'),coverageReport(pack,['private_text_chat']));
    const rows=['# P04 · Human review package','',`DRAFT ONLY. Catalog digest: ${analysis.catalog_digest}. No approval, rights clearance or publication asserted.`,
      '',`Cards: ${cards.length}. Each card must receive editorial, safety, rights, RU/EN/TR, similarity and diversity review; sensitive cards also qualified safety.`,
      '',`Similarity: ${analysis.similarity_queue.length} pairs awaiting disposition. Token threshold .78 is uncalibrated; reviewers must also find semantic paraphrases below it.`,
      '',...cards.flatMap(card=>[`## ${card.id} r${card.revision}`,`SHA256: ${digest(card)}`,`Mode: ${card.mode}; category: ${card.category}; interaction: ${card.interaction}; comfort: ${card.min_comfort}; stage: ${card.min_progression_stage}.`,
        ...['ru','en','tr'].flatMap(locale=>Object.entries(card.text[locale]).map(([field,text])=>`${locale}/${field}: ${text}`)),''])];
    writeFileSync(join(out,'REVIEW.md'),rows.join('\n'),{flag:'wx'});
    write(join(out,'input-index.json'),{schema_version:1,command,source_sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),source_dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim().length>0,
      files:snapshot.files,catalog_digest:analysis.catalog_digest,snapshot_directory_unchanged:canonical(snapshotAt(directory).files)===canonical(snapshot.files)});
    if(canonical(snapshotAt(directory).files)!==canonical(snapshot.files)) throw new Error('CATALOG_DIRECTORY_CHANGED_DURING_CHECK');
    console.log(`DRAFT CHECK COMPLETE: ${cards.length} cards; human review remains REQUIRED. Output ${resolve(out)}`);
  } else if(command==='reserve'||command==='revise') {
    const [requestPath,baseCardsPath,baseManifestPath,ledgerPath,author,expectedHash]=args;
    if(!requestPath||!baseCardsPath||!baseManifestPath||!ledgerPath||!author) throw new Error('Usage: reserve REQUEST BASE_CARDS BASE_MANIFEST LEDGER AUTHOR');
    const requestSnapshot=readJson(requestPath),manifestSnapshot=readJson(baseManifestPath),request=requestSnapshot.value,manifest=manifestSnapshot.value,cards=cardsAt(baseCardsPath);
    validateBatchSnapshot(requestSnapshot.raw,manifestSnapshot.raw,command==='reserve'?cards:undefined);
    const pack=FrozenPack.load(cards,manifest,manifest.status==='illustrative_draft_candidate');
    if(pack.digest!==request.source_catalog_digest) throw new Error('BATCH_BASE_DIGEST_MISMATCH');
    const ledger=new AuthoringLedger(ledgerPath);
    try {
      const reservation={batch_id:request.batch_id,mode:request.mode,first:request.id_range[0],count:request.count,source_catalog_digest:pack.digest,request_sha256:hash(requestSnapshot.raw),author_id:author,
        constraints:Object.fromEntries(['pack_id','meeting_contexts','allowed_interactions','relationship_scope_distribution','comfort_distribution','progression_distribution'].map(key=>[key,request[key]]))};
      if(command==='revise'&&!/^[a-f0-9]{64}$/.test(expectedHash??'')) throw new Error('Explicit previous request SHA256 required');
      console.log(JSON.stringify(command==='reserve'?ledger.reserve(reservation):ledger.revise(reservation,expectedHash)));
    }finally {ledger.close();}
  } else if(command==='record') {
    const [ledgerPath,batchId,directory,out]=args;if(!ledgerPath||!batchId||!directory||!out) throw new Error('Usage: record LEDGER BATCH CARDS EXPORT_JSON');
    const ledger=new AuthoringLedger(ledgerPath);try {ledger.record(batchId,cardsAt(directory).filter(c=>c.authoring.batch_id===batchId));write(out,ledger.export());}finally {ledger.close();}
  } else if(command==='build-reviewed') {
    const [directory,reviewsPath,registryPath,authorsPath,out]=args;
    if(!directory||!reviewsPath||!registryPath||!authorsPath||!out) throw new Error('Usage: build-reviewed CARDS SIGNED_REVIEWS TRUSTED_HUMAN_REGISTRY AUTHOR_IDS OUT_DIRECTORY');
    const drafts=cardsAt(directory),reviews=load(reviewsPath),reviewers=load(registryPath),authors=load(authorsPath),candidate=reviewedCandidate(drafts,reviews,reviewers,authors);
    const coverage=coverageReport(candidate.pack),conditional=coverageReport(candidate.pack,['private_text_chat']);if(coverage.neutral20!=='PASS'||coverage.private_coverage!=='PASS'||conditional.private_coverage!=='PASS') throw new Error('CATALOG_SUPPORTED_COVERAGE_INCOMPLETE');
    mkdirSync(out);write(join(out,'cards.json'),candidate.cards);write(join(out,'manifest.json'),candidate.manifest);write(join(out,'coverage.json'),coverage);write(join(out,'coverage-private-chat.json'),conditional);
    write(join(out,'application-bundle-entry.json'),{draft_cards:drafts,cards:candidate.cards,manifest:candidate.manifest,reviews,reviewers,author_ids:authors,pack_revision:1});
    write(join(out,'review-binding.json'),{catalog_digest:candidate.analysis.catalog_digest,review_records_sha256:candidate.review_records_sha256,reviewer_registry_sha256:candidate.reviewer_registry_sha256,manifest_sha256:digest(candidate.manifest),pack_digest:candidate.pack.digest,
      human_identity_is_external:true,publication_authorized:false,reviewed_input_sha256:hash(Buffer.from(canonical(candidate.cards)))});
    console.log('REVIEWED CANDIDATE ONLY; immutable signed application release remains required.');
  } else throw new Error('Commands: draft-check, reserve, revise, record, build-reviewed');
} catch(error) {console.error('BLOCK: '+error.message);process.exitCode=1;}
