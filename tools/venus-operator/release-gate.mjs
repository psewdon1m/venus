/** A fixture report or a missing per-ID decision must never unlock real signing. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {json,read,sha256,requireValue} from './files.mjs';
const file=process.argv[2],report=json(file),root=process.cwd();
const identity=execFileSync(process.env.PYTHON??'python',['-B','tools/stage_inventory.py'],{encoding:'utf8',timeout:30000}).trim();
requireValue(report.status==='PASS_PRE_SIGN_STANDALONE_LOCAL_PILOT'&&report.source_identity===identity,'PRE_SIGN_SOURCE_REVIEW_REQUIRED');
const applicability=json(path.join(root,'.docs/implementation/p06-part12-applicability.v1.json'));
requireValue(report.part12?.length===118&&new Set(report.part12.map(r=>r.id)).size===118&&applicability.checks.every(row=>report.part12.some(r=>r.id===row.id&&r.check_id===row.check_id&&['PASS','N_A','PENDING_FINAL_SIGNED_ARTIFACT_ONLY','DEFERRED_PRODUCTION_NOT_LOCAL_PASS'].includes(r.status)&&r.reason&&r.evidence?.length)),'PART12_COMPLETE_DECISIONS_REQUIRED');
requireValue(report.independent_reviews?.length===2&&report.independent_reviews.every(r=>r.independent_nonauthor===true&&fs.existsSync(r.path)&&sha256(read(r.path))===r.sha256),'TWO_BOUND_INDEPENDENT_PRE_SIGN_REVIEWS_REQUIRED');
requireValue(report.actual_local_tests?.length>0&&report.actual_local_tests.every(r=>r.status==='PASS'&&fs.existsSync(r.path)&&sha256(read(r.path))===r.sha256),'ACTUAL_LOCAL_TESTS_REQUIRED');
process.stdout.write(JSON.stringify({status:'PRE_SIGN_GATE_PASS',source_identity:identity,part12:118,production_approval:false,final_signed_artifact_checks_still_required:true})+'\n');
