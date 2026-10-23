/** One owned OCI09 forensic read. No app/harness/registry construction. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {types} from 'node:util';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const OWNER='c5353a5a98da094796b0a0695abc6984';
const STATES=['pending','active','declined','expired','stopped','completed','open','closed','aborted','online','reconnecting','inactive'];
const plain=v=>v!==null&&typeof v==='object'&&!types.isProxy(v);
const own=(v,k)=>{if(!plain(v))return undefined;const d=Object.getOwnPropertyDescriptor(v,k);return d&&'value'in d?d.value:undefined;};
const count=v=>Array.isArray(v)&&!types.isProxy(v)?v.length<=1024?v.length:'OUT_OF_BOUND':null;
const state=v=>STATES.includes(v)?v:'UNKNOWN';
const present=v=>plain(v);
const bool=v=>v===true;
export function consentShape(v){return {present:present(v),state:state(own(v,'state')),acks_count:count(own(v,'acks')),active_until_safe:Number.isSafeInteger(own(v,'active_until'))};}
function memberType(v,k){let row=v;for(let depth=0;plain(row)&&depth<8;depth++,row=Object.getPrototypeOf(row)){const d=Object.getOwnPropertyDescriptor(row,k);if(d)return 'value'in d?typeof d.value:'ACCESSOR';}return 'undefined';}
export function dateShape(v){return {native_date:types.isDate(v),getTime_type:memberType(v,'getTime')};}
export function projectionShape(p,{data,game,conversation}){const view=own(p,'view'),offer=own(view,'offer');return {
 present:present(p),schema2:own(p,'schema_version')===2,boot_matches:own(p,'boot_id')===own(data,'boot_id'),
 round_matches:own(p,'round_id')===own(own(data,'plan'),'round_id'),game_revision_matches:own(p,'game_rev')===Number(game.rev),
 conversation_revision_matches:own(p,'conversation_revision')===own(conversation,'revision'),epoch_matches:own(p,'epoch')===own(conversation,'epoch'),
 view_present:present(view),prompt_present:present(own(view,'prompt')),offer_present:present(offer),own_accepted:bool(own(offer,'own_accepted'))};}
export async function main(){
 let pool,client,transaction=false,beganReadOnly=false,phase='preflight',ordinal=0;const results=[];let failure=false;
 try{
  assert.equal(process.platform,'linux');assert.equal(process.getuid(),1000);assert.equal(process.cwd(),'/app');
  assert.deepEqual(process.argv.slice(2),['--read-only-oci09']);assert.equal(process.env.VENUS_OCI09_OWNER,OWNER);
  assert(['db','venus-p05-oci-efaf2adc9a54-db'].includes(process.env.DB_HOST));assert(!process.env.NODE_OPTIONS);
  const [{default:pg},{Keyring},{topicAad,loadTopicObject}]=await Promise.all([
   import('/app/node_modules/pg/lib/index.js'),import('/app/apps/api/dist/security.js'),import('/app/apps/api/dist/topic-game-model.js')]);
  const keys=Keyring.fromFile('/private/keyring.json');pool=new pg.Pool({host:process.env.DB_HOST,user:'venus',database:'venus',password:readFileSync('/private/db-password','utf8').trim(),max:1,connectionTimeoutMillis:2000,query_timeout:5000,idleTimeoutMillis:1000});pool.on('error',()=>{});
  client=await pool.connect();await client.query('BEGIN READ ONLY');transaction=true;beganReadOnly=true;phase='select_games';
  const games=(await client.query('SELECT id,room_id,state,rev,current_round,snapshot_cipher FROM game_sessions ORDER BY seq LIMIT 3')).rows;assert.equal(games.length,2);
  for(const game of games){
   ordinal++;phase='round_read';const rounds=(await client.query('SELECT id,state,cipher FROM game_rounds WHERE room_id=$1 AND session_id=$2 AND round_index=$3 LIMIT 2',[game.room_id,game.id,game.current_round])).rows;assert.equal(rounds.length,1);
   phase='round_decrypt';const data=keys.decrypt(rounds[0].cipher,topicAad.round(game.room_id,game.id,rounds[0].id)),plan=own(data,'plan'),actors=own(plan,'actors');
   const result={ordinal,game_state:state(game.state),round_state:state(own(data,'state')),plan_present:present(plan),actors_count:count(actors),invitation:consentShape(own(data,'invitation')),action:consentShape(own(data,'action')),conversation_id_present:typeof own(data,'conversation_id')==='string'};results.push(result);
   if(!Array.isArray(actors)||actors.length!==2||!result.conversation_id_present)continue;
   const scope={room:game.room_id,session:game.id,id:data.conversation_id};phase='conversation_read';
   const conversation=await loadTopicObject(client,keys,{...scope,kind:'conversation'}),conv=own(conversation,'state'),offer=own(conv,'offer'),advice=own(conv,'advice');
   result.conversation={present:present(conversation),state_present:present(conv),state:state(own(conv,'state')),offer:consentShape(offer),advice_count:count(advice),accepted_advice_count:Array.isArray(advice)?advice.filter(v=>own(v,'state')==='accepted'&&own(v,'text')!==null).length:null};
   phase='chat_read';const chat=await loadTopicObject(client,keys,{...scope,kind:'chat'});result.chat={present:present(chat),messages_count:count(own(chat,'messages')),epoch_matches:own(chat,'epoch')===own(conv,'epoch')};
   phase='session_shapes';const sessions=(await client.query('SELECT s.member_id,s.expires_at,s.revoked_at,m.removed_at,m.presence,m.slot,m.heartbeat_at,m.reserved_until FROM room_sessions s JOIN room_members m ON m.room_id=s.room_id AND m.id=s.member_id WHERE s.room_id=$1 LIMIT 17',[game.room_id])).rows;assert(sessions.length<=16);
   result.sessions=sessions.filter(v=>actors.includes(v.member_id)).map((v,i)=>({ordinal:i+1,not_revoked:v.revoked_at===null,not_removed:v.removed_at===null,presence:state(v.presence),slot_present:v.slot!==null,expires_at:dateShape(v.expires_at),heartbeat_at:dateShape(v.heartbeat_at),reserved_until:dateShape(v.reserved_until)}));
   result.projections=[];phase='projection_read';for(const id of actors){const projection=await loadTopicObject(client,keys,{room:game.room_id,session:game.id,id,kind:'projection'});result.projections.push(projectionShape(projection,{data,game,conversation:conv}));}
  }
  phase='commit_readonly';await client.query('COMMIT');transaction=false;phase='complete';
 }catch{failure=true;}
 finally{if(transaction)try{await client.query('ROLLBACK');}catch{failure=true;}client?.release();if(pool)try{await pool.end();}catch{failure=true;}}
 const report={status:failure?'FORENSIC_READ_FAILED':'READONLY_SHAPES_COMPLETE_NOT_ROLLBACK_PASS',phase,ordinal,readonly_transaction:beganReadOnly,application_writes:false,results};
 const raw=JSON.stringify(report);if(Buffer.byteLength(raw)>16384){console.log(JSON.stringify({status:'FORENSIC_OUTPUT_CAP',phase:'output',application_writes:false}));process.exitCode=1;return;}console.log(raw);if(failure)process.exitCode=1;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
