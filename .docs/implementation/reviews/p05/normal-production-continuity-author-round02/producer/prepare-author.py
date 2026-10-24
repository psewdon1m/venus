"""Filesystem-only assembly from accepted ordinary client helpers; never Docker."""
from pathlib import Path
import json,hashlib,datetime
root=Path(__file__).resolve().parents[2]; out=Path(__file__).resolve().parent
old=(root/'.artifacts/p05-ordinary-real470-probe02/probe.mjs').read_text(encoding='utf-8')
helpers=old[old.index(' let publicNext='):old.index(' async function localeCheck(')]
# Preserve native HTTP/rate/WS/admission helpers; remove matrix-only conveniences.
helpers=helpers[:helpers.index(' async function cleanupClients()')]+helpers[helpers.index(' async function ownAll()'):]
client='''/** One normal persistent-room continuity boundary. Client state is secret, never an authority fixture. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {setInterval,clearInterval} from 'node:timers';
import {setTimeout as delay} from 'node:timers/promises';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export function safeFailure(e){return {name:['AssertionError','Error','TypeError','SyntaxError','AbortError'].includes(e?.name)?e.name:'UNLISTED',code:['ERR_ASSERTION','ABORT_ERR'].includes(e?.code)?e.code:null,reason:['PROFILE_OR_TOTAL_DEADLINE','WS_FAILURE','REQUEST_CAP','UNEXPECTED_API_STATUS'].includes(e?.message)?e.message:'BOUNDARY_ASSERTION_FAILED'};}
export function receipt(b,id){assert.equal(b.schema_version,2);assert.equal(b.request_id,id);assert(Number.isSafeInteger(b.game_rev)&&b.game_rev>=1);return b;}
export function assertSafeOwn(v){assert.equal(v.schema_version,2);assert(Number.isSafeInteger(v.room_rev)&&v.room_rev>=0);assert(Number.isSafeInteger(v.game_rev)&&v.game_rev>=0);assert.equal(v.session_actions.neutral_reset,true);assert.equal(v.session_actions.resume,false);assert.equal(v.session_actions.advance,false);assert(Object.values(v.conversation_actions).every(x=>x===false));for(const k of ['finish','choose_truth','choose_dare','propose_condition','accept_invitation','accept_action'])assert.equal(v.round_actions[k],false);}
export function assertSamePersisted(a,b){for(const k of ['room_id','session_id','pack_digest','snapshot_sha256','pins_sha256','history_sha256','participants','game_count','room_count'])assert.deepEqual(b[k],a[k]);assert.equal(b.private_objects,0);assert.equal(b.private_refs,0);assert.equal(b.catalog.ledger_head,a.catalog.ledger_head);}
export async function main(){
 assert.equal(process.platform,'linux');assert.equal(process.cwd(),'/app');assert(!process.env.NODE_OPTIONS);
 const phase=process.argv[2];assert(['a-on','b-off','b-on'].includes(phase));
 const ack=JSON.parse(readFileSync('/run/pilot470-root-ack.json','utf8'));assert.equal(ack.status,'ROOT_RUN_ACK');assert.equal(ack.purpose,'NORMAL470_PERSISTENT_A6_B4_01');
 const binding=phase==='a-on'?ack.A:ack.B;for(const [p,h]of Object.entries(binding.runtime_files))assert.equal(sha(readFileSync('/app/'+p)),h);
 const {ownerProvisionalPilot,bundledPacks,bundledTopicSources}=await import('/app/packages/card-catalog/dist/index.js');const {pack,map}=ownerProvisionalPilot;
 assert.equal(pack.cards.length,470);assert.equal(pack.synthetic||map.synthetic,false);assert.equal(pack.approval_scope,'OWNER_PROVISIONAL_LOCAL_PILOT');assert.equal(pack.digest,ack.pack_digest);assert.deepEqual(map.pins,ack.map_pins);assert.equal(bundledPacks.length,0);assert.equal(bundledTopicSources.length,0);
 const descriptor=JSON.parse(readFileSync('/run/probe/DESCRIPTOR.json','utf8')),require=createRequire('/app/package.json'),{WebSocket}=require('ws');
 const origin='https://127.0.0.1',root='http://127.0.0.1:4300',start=performance.now(),deadline=start+descriptor.phase_deadline_ms;
 const report={schema_version:1,phase,status:'FAIL',API_only:true,actual_TLS:false,requests:0,WS_connections:0,rooms_created:0,consent_acceptances:0};
 const statePath='/run/continuity-private/client-state.json',reportPath='/run/continuity-private/report-'+phase+'.json';
 let state=null;if(phase!=='a-on'){const bytes=readFileSync(statePath);assert(bytes.length<65536,'CLIENT_STATE_CAP');try{state=JSON.parse(bytes.toString('utf8'));}catch{throw Error('CLIENT_STATE_INVALID');}}
 const save=()=>writeFileSync(reportPath,JSON.stringify(report,null,2)+'\\n',{mode:0o600});
'''+helpers+'''
 async function persisted(){
  const {database}=await import('/app/apps/api/dist/database.js'),db=database();let c;
  try{c=await db.pool.connect();await c.query('BEGIN READ ONLY');
   const g=(await c.query('SELECT g.id,g.room_id,g.pack_digest,g.snapshot_cipher,g.state,t.pins_cipher FROM game_sessions g JOIN topic_game_sessions t ON t.room_id=g.room_id AND t.session_id=g.id WHERE g.id=$1 AND g.room_id=$2',[state.session,state.actors[0].room])).rows;assert.equal(g.length,1);
   const h=(await c.query("SELECT object_id,chunk_index,cipher FROM topic_game_chunks WHERE room_id=$1 AND session_id=$2 AND kind='history' ORDER BY object_id,chunk_index",[g[0].room_id,g[0].id])).rows;assert(h.length>0&&h.length<=800);
   const counts=(await c.query("SELECT (SELECT count(*)::int FROM rooms) AS room_count,(SELECT count(*)::int FROM game_sessions) AS game_count,(SELECT count(*)::int FROM game_participants WHERE session_id=$1) AS participants,(SELECT count(*)::int FROM topic_game_objects WHERE kind<>'history') AS private_objects,(SELECT count(*)::int FROM topic_game_private_refs) AS private_refs",[state.session])).rows[0];
   const cat=(await c.query('SELECT active_digest,generation,ledger_head FROM venus_catalog_state WHERE singleton=true')).rows;assert.equal(cat.length,1);
   await c.query('COMMIT');return {...counts,room_id:g[0].room_id,session_id:g[0].id,pack_digest:g[0].pack_digest,game_state:g[0].state,snapshot_sha256:sha(JSON.stringify(g[0].snapshot_cipher)),pins_sha256:sha(JSON.stringify(g[0].pins_cipher)),history_sha256:sha(JSON.stringify(h)),catalog:cat[0]};
  }finally{c?.release();await db.close();}
 }
 async function refused(a,path,method='GET',body,code){const r=await request(a,path,method,body,{status:null});assert.equal(r.status,503);assert.equal(r.body.code,code);report.refusals??=[];report.refusals.push({method,code,status:r.status});}
 try{
  assert.equal((await get({},'/health/ready')).status,'ready');
  if(phase==='a-on'){
   const {host,prep}=await createProfile({N:2,context:'online',mode:'yes_but'});await mutation(host,gameBase(host)+'/start',{draft_rev:prep.game_rev});
   let g=await current(host);assert.equal(g.state,'active');assert.equal(g.current_round.round_index,1);assert.equal(g.current_round.actors.length,2);
   assert.equal(await consentRound(g,'invitation'),2);g=await current(host);const proposer=(await ownAll()).filter(x=>x.own.round_actions.propose_condition);assert.equal(proposer.length,1);await mutation(proposer[0].a,rpath(host,g)+'/condition',{expected_rev:g.game_rev,text:'Continuity test: only while both agree.'});assert.equal(await consentRound(g,'action'),2);g=await current(host);assert.equal(g.current_round.kind,'public');const card=pack.card(g.current_round.card_id);assert.equal(card.interaction,'pair_public');assert.equal(card.mode,'yes_but');
   const controls=await ownAll();assert(controls.some(x=>x.own.round_actions.finish));
   state={schema_version:1,actors:currentActors.map(({room,id,name,locale,cookie,csrf})=>({room,id,name,locale,cookie,csrf})),session:g.session_id,round:g.current_round.round_id,draft_rev:prep.game_rev};
   const before=await persisted();assert.equal(before.catalog.active_digest,pack.digest);assert.equal(before.game_count,1);assert.equal(before.room_count,1);assert.equal(before.participants,2);state.before=before;report.persisted=before;
   writeFileSync(statePath,JSON.stringify(state)+'\\n',{mode:0o600});
   report.released={card_id:card.id,revision:card.revision,round_index:1,bilateral_invitation:true};
  }else{
   currentActors=state.actors;for(const a of currentActors)await connect(a);const host=currentActors[0],oldRound=gameBase(host)+'/'+state.session+'/round/'+state.round;
   const before=await persisted();assertSamePersisted(state.before,before);assert.equal(before.catalog.active_digest,null);report.persisted_before=before;
   for(const a of currentActors){const room=await get(a,roomBase(a));assert.equal(room.members.length,2);assert.equal((await get(a,roomBase(a)+'/me/private-protocol')).private_protocol,2);assertSafeOwn(await own(a));}
   const unavailable=phase==='b-off'?'TOPIC_GAMES_DISABLED':'TOPIC_SOURCE_UNAVAILABLE';
   if(phase==='b-off'){
    await refused(host,gameBase(host)+'/'+state.session+'/round/advance','POST',{request_id:randomUUID(),expected_rev:(await own(host)).game_rev},unavailable);
    let ownView=await own(host);assert.equal(ownView.session_actions.pause,true);await mutation(host,gameBase(host)+'/'+state.session+'/pause',{});
    ownView=await own(host);assert.equal(ownView.session_actions.stop,true);await mutation(host,gameBase(host)+'/'+state.session+'/stop',{});
   }
   const view=await get(host,roomBase(host));await refused(host,gameBase(host)+'/prepare','POST',{request_id:randomUUID(),expected_rev:view.room_rev,mode:'yes_but',round_count:20,players:currentActors.map(a=>a.id)},unavailable);
   const denied=await request(host,gameBase(host)+'/start','POST',{request_id:randomUUID(),draft_rev:state.draft_rev},{status:null});assert.equal(denied.status,409);assert.equal(denied.body.code,'GAME_NOT_WAITING');report.stale_start={status:409,code:'GAME_NOT_WAITING'};
   // Legacy B4 has no bundle/view route. No generic200 is misclassified as denied content.
   const absent=await request(host,oldRound+'/view','GET',undefined,{status:404});assert.equal(absent.status,404);
   const after=await persisted();assertSamePersisted(state.before,after);assert.equal(after.game_state,'aborted');assert.equal(after.catalog.active_digest,null);report.persisted_after=after;
   if(phase==='b-on'){assert(BigInt(after.catalog.generation)>BigInt(state.before.catalog.generation));const room=await get(host,roomBase(host));await request(host,roomBase(host)+'/close','POST',{idempotency_key:randomUUID(),expected_rev:room.room_rev});report.room_closed=true;}
  }
  report.status='PASS';
 }catch(error){report.error={...safeFailure(error),elapsed_ms:Math.round(performance.now()-start),last_request:report.last_request??null};process.exitCode=1;
 }finally{for(const a of currentActors){a.closing=true;clearInterval(a.ping);a.ws?.terminate();}save();console.log(JSON.stringify({phase,status:report.status,requests:report.requests}));}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
'''
# First declaration inherited a mutable deadline; the phase has a fixed deadline instead.
client=client.replace('let publicNext=0,wsNext=0','let publicNext=0,wsNext=0')
(out/'probe.mjs').write_text(client,encoding='utf-8')
descriptor={'schema_version':1,'status':'AUTHOR_NOT_RUN','scope':'NORMAL_PRODUCTION_PROVIDER_PERSISTENCE_A6_TO_B4_OFF_ON_ONLY','phases':['a-on','b-off','b-on'],'normal_CMD':'node apps/api/dist/server.js','rooms':1,'actors':2,'context':'online','comfort':0,'mode':'yes_but','selected_rounds':1,'round_count':20,'phase_deadline_ms':180000,'whole_deadline_ms':900000,'hidden_retries':0,'private_grant_claim':False,'manual_cookies_HTTP_loopback_HTTPS_Origin':True,'actual_browser_TLS':False,'rate_schedule':{'member_ms':350,'public_ms':550,'WS_upgrade_ms':550,'ping_ms':10000,'HTTP_timeout_ms':10000},'caps':{'requests':160,'response_bytes':131072,'client_state_bytes':65536,'phase_report_bytes':131072,'outer_output_bytes':2097152},'readonly_SQL':'Explicit BEGIN READ ONLY SELECT exact persisted cipher hashes/catalog pointer/counts only. No actor/seed/history/clock/presence writes.','persistence':'Same existingcompose DB+state namedvolumes/keyring across app-only replacements; client secrets survive only in private temporary bind, erased finally.','excluded_scope':['synthetic14 private grant revocation','private browser lifecycle','production/DNS/TLS/devices','whole P05 PASS']}
(out/'DESCRIPTOR.json').write_text(json.dumps(descriptor,indent=2)+'\n',encoding='utf-8')
with (root/'.history/agents/2026-10-20-p05-normal-rollback-author.md').open('a',encoding='utf-8') as f:f.write('\n'+datetime.datetime.now(datetime.timezone.utc).isoformat()+' UTC â€” Parent narrowed scope explicitly: no private encounter/search/chat. Prepared bounded three-phase client using accepted ordinary02 rate/admission/WS helpers, actual first C0/N2 questions pair_public release, same persistent identity checks via READ ONLY SELECT, OFF safe exits/newstarts denial, ON used-null nonresurrection. NoRUN. Final A6/B4 exact normal pins now available. Harmless guessed SQL filenames failed reads; resolved actual migrations. Large one-line owner JSON read accidentally overproduced output, no secrets/user sessions involved.\n')
print('client/descriptor prepared; no RUN')
