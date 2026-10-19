/** Reconstruct the packaged human-reviewed candidate; called by the full gate.
 * Registry identity/competence is established externally, not inferred here. */
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-b','--force'],{stdio:['ignore','ignore','inherit']});
const {strictJson,loadReviewedBundles,analyze,coverageReport}=await import('../packages/card-catalog/dist/index.js');
const path=process.argv[2],digest=process.argv[3];
if(!path||!/^sha256:[a-f0-9]{64}$/.test(digest??'')) throw new Error('Registry path and exact pack digest required');
const registry=strictJson(readFileSync(path,'utf8'),32*1024*1024),packs=loadReviewedBundles(registry),pack=packs.find(p=>p.digest===digest);
if(!pack||pack.synthetic) throw new Error('Actual reviewed application bundle is missing');
const entry=registry.approved.find(e=>'sha256:'+e.manifest.canonical_payload_sha256===digest);
const coverage=coverageReport(pack);
const conditional=coverageReport(pack,['private_text_chat']);
if(coverage.neutral20!=='PASS'||coverage.private_coverage!=='PASS'||conditional.private_coverage!=='PASS'||coverage.sessions.filter(s=>s.profile==='neutral_C0_F').some(s=>s.status!=='PASS')||[...coverage.private_sessions,...conditional.private_sessions].some(s=>!['PASS','CAPABILITY_UNAVAILABLE'].includes(s.status))) throw new Error('Actual reviewed pack has a supported neutral/private coverage gap');
console.log(JSON.stringify({status:'PASS',pack_digest:pack.digest,input_catalog_digest:analyze(entry.draft_cards).catalog_digest,reviewed_cards:pack.cards.length,modes:pack.manifest.mode_counts,reviewed_coverage:{cells:coverage.cells.length,sessions:coverage.sessions.length,neutral20:coverage.neutral20}}));
