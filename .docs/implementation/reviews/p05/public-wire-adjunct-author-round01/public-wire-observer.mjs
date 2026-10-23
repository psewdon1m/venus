/** Test-only observation of delegated native reads and final public enqueue. */
import assert from 'node:assert/strict';
import {AsyncLocalStorage} from 'node:async_hooks';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
const sha=s=>createHash('sha256').update(s).digest('hex');
const keys=(v,list)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...list].sort().join(',');
export function publicDTO(value){
 assert(keys(value,['session_id','game_rev','state','mode','total_rounds','current_round','pause_reason']));
 assert(Number.isSafeInteger(value.game_rev)&&value.game_rev>=1);
 const r=value.current_round;if(r===null)return value;
 assert(r&&['generic','public'].includes(r.kind));
 if(r.kind==='generic')assert(keys(r,['kind','round_id','round_index','state']));
 else{assert(keys(r,['kind','round_id','round_index','state','card_id','card_revision','actors','response_state','proposal_revision','mode','text','choice']));assert(['questions','truth_or_dare','yes_but'].includes(r.mode));assert(r.text===null||keys(r.text,r.mode==='questions'?['question']:r.mode==='truth_or_dare'?['prompt']:['proposal','responder']));}
 return value;
}
export function createPublicObserver({render,now,byteCap=32*1024*1024,rowCap=8192}){
 const scope=new AsyncLocalStorage(),records=[],faults=[],proofs=new WeakMap(),restores=[],polls=new Map(),actors=new Map(),consumed=new Set();
 let bytes=0,checkpoint='startup',sequence=0,stopped=false;
 const fault=code=>{if(!stopped&&!faults.includes(code))faults.push(code);};
 function keep(row){if(stopped)return null;const result={sequence:sequence+1,checkpoint,...row},encoded=JSON.stringify(result);if(records.length>=rowCap||bytes+Buffer.byteLength(encoded)>byteCap){fault('PUBLIC_CAPTURE_CAP');return null;}bytes+=Buffer.byteLength(encoded);sequence++;records.push(result);return result;}
 const nativeProof=(value,room)=>{const proof=proofs.get(value);if(!proof||proof.room_id!==room)return null;return proof;};
 function wrap(target,name,fn){assert.equal(typeof target[name],'function');const original=target[name];target[name]=fn(original);restores.push(()=>{target[name]=original;});}
 function install(h){
  for(const name of ['snapshot','history','current','names'])wrap(h.topics,name,original=>async function(...args){const value=await Reflect.apply(original,this,args),held=scope.getStore();if(held&&held.client===args[0])held[name]={value,args};return value;});
  wrap(h.topics,'view',original=>function(...args){const held={client:args[0],game:args[1],locale:args[2],started:now()};return scope.run(held,async()=>{const value=await Reflect.apply(original,this,args);if(stopped)return value;try{
   publicDTO(value);const end=now();if(end!==held.started){keep({kind:'native_unmatched',reason:'NATIVE_CLOCK_DRIFT',room_id:held.game.room_id,game_rev:value.game_rev});return value;}
   const active=held.game.current_round&&held.game.state!=='aborted';if(active)assert(held.snapshot&&held.history&&held.current&&held.names);
   const pack=active?held.snapshot.args[2]:null,history=active?held.history.value:null,data=active?held.current.value?.data??null:null,names=active?held.names.value:[];
   const expected=render(held.game,data,pack,history,held.locale,names,end);assert(isDeepStrictEqual(value,expected));publicDTO(expected);
   const proof=keep({kind:'native_public_replay',room_id:held.game.room_id,game_rev:value.game_rev,payload_sha256:sha(JSON.stringify(value)),held_native_inputs:true,extra_queries:0,clock:end,parity:'PASS'});if(proof)proofs.set(value,proof);
  }catch{fault('NATIVE_PUBLIC_REPLAY_FAILED');}return value;});});
  wrap(h.rooms,'socketState',original=>async function(grant,...args){const key=grant.roomId+':'+grant.memberId,ordinal=(polls.get(key)?.ordinal??0)+1;try{const result=await Reflect.apply(original,this,[grant,...args]);const row=keep({kind:'actual_socket_state',room_id:grant.roomId,actor_ordinal:actors.get(key)??null,poll_ordinal:ordinal,heartbeat:args[0]??false,room_rev:result.room.room_rev});polls.set(key,{ordinal,sequence:row?.sequence??null});return result;}catch(error){keep({kind:'socket_state_refused',room_id:grant.roomId,actor_ordinal:actors.get(key)??null,poll_ordinal:ordinal});polls.set(key,{ordinal,sequence:null});throw error;}});
  wrap(h.rooms,'dispatchGame',original=>function(grant,enqueue){return Reflect.apply(original,this,[grant,function(value,roomRev){try{publicDTO(value);const proof=nativeProof(value,grant.roomId),poll=polls.get(grant.roomId+':'+grant.memberId);keep({kind:'actual_public_enqueue',room_id:grant.roomId,actor_ordinal:actors.get(grant.roomId+':'+grant.memberId)??null,room_rev:roomRev,game_rev:value.game_rev,...(proof?{payload_sha256:sha(JSON.stringify(value))}:{}),native_proof_sequence:proof?.sequence??null,poll_ordinal:poll?.ordinal??null,poll_sequence:poll?.sequence??null});}catch{fault('PUBLIC_ENQUEUE_CAPTURE_FAILED');}return Reflect.apply(enqueue,this,[value,roomRev]);}]);});
  wrap(h.topics,'dispatchHttpView',original=>function(room,credential,enqueue){return Reflect.apply(original,this,[room,credential,function(value){try{publicDTO(value);const proof=nativeProof(value,room);keep({kind:'actual_http_enqueue',room_id:room,game_rev:value.game_rev,...(proof?{payload_sha256:sha(JSON.stringify(value))}:{}),native_proof_sequence:proof?.sequence??null});}catch{fault('HTTP_ENQUEUE_CAPTURE_FAILED');}return Reflect.apply(enqueue,this,[value]);}]);});
  return api;
 }
 function wire(input,room,actorOrdinal){
  if(stopped)return;
  try{const original=Buffer.isBuffer(input)?input:Buffer.from(input),raw=original.toString('utf8');assert(original.length<=65536&&Buffer.from(raw).equals(original));const frame=JSON.parse(raw);if(frame.type==='pong'){keep({kind:'received_existing_pong',room_id:room,actor_ordinal:actorOrdinal,barrier:'EXISTING_SERIALIZED_WS_PING_REPLY_NOT_FUTURE_POLL_BARRIER'});return;}if(frame.stream!=='game')return;assert.equal(frame.type,'game.snapshot');assert.equal(JSON.stringify(frame),raw,'Native compact JSON roundtrip, no duplicate overwritten fields');
   assert(keys(frame,['schema','room_id','room_rev','server_time','event_id','stream','stream_rev','type','audience','payload']));assert.equal(frame.schema,1);assert.equal(frame.audience,'room');assert.equal(frame.room_id,room);assert.equal(frame.stream_rev,frame.room_rev);assert(Number.isSafeInteger(frame.room_rev));assert.match(frame.event_id,/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);assert.equal(new Date(frame.server_time).toISOString(),frame.server_time);publicDTO(frame.payload);
   const payloadHash=sha(JSON.stringify(frame.payload)),enqueue=records.find(r=>r.kind==='actual_public_enqueue'&&!consumed.has(r.sequence)&&r.room_id===room&&r.actor_ordinal===actorOrdinal&&r.room_rev===frame.room_rev&&r.payload_sha256===payloadHash);
   if(enqueue)consumed.add(enqueue.sequence);
   const verified=Boolean(enqueue?.native_proof_sequence);keep({kind:'received_shared_public',room_id:room,actor_ordinal:actorOrdinal,room_rev:frame.room_rev,stream_rev:frame.stream_rev,game_rev:frame.payload.game_rev,event_id:frame.event_id,server_time:frame.server_time,enqueue_sequence:enqueue?.sequence??null,native_proof_sequence:enqueue?.native_proof_sequence??null,poll_ordinal:enqueue?.poll_ordinal??null,parity:verified?'PASS':'NOT_COVERED_UNMATCHED',raw_retained:verified,...(verified?{payload_sha256:payloadHash,raw_sha256:sha(raw),raw_bytes:Buffer.byteLength(raw),literal_utf8:raw}:{unknown_payload_omitted:true})});
  }catch{fault('INVALID_SHARED_PUBLIC_FRAME');}
 }
 async function http(h,f,label,actor=f.host){
  checkpoint=label;const result=await h.call(actor,h.base(f)+'/current');assert.equal(result.status,200);
  try{publicDTO(result.body);assert(Buffer.byteLength(result.raw)<=65536);assert(isDeepStrictEqual(JSON.parse(result.raw),result.body));assert.equal(JSON.stringify(result.body),result.raw,'Native compact JSON roundtrip, no duplicate overwritten fields');const hash=sha(JSON.stringify(result.body)),enqueue=records.find(r=>r.kind==='actual_http_enqueue'&&!consumed.has(r.sequence)&&r.room_id===f.room&&r.payload_sha256===hash);if(enqueue)consumed.add(enqueue.sequence);
   const verified=Boolean(enqueue?.native_proof_sequence);return keep({kind:'received_http_current',room_id:f.room,game_rev:result.body.game_rev,native_proof_sequence:enqueue?.native_proof_sequence??null,enqueue_sequence:enqueue?.sequence??null,parity:verified?'PASS':'NOT_COVERED_UNMATCHED',raw_retained:verified,...(verified?{payload_sha256:hash,raw_sha256:sha(result.raw),raw_bytes:Buffer.byteLength(result.raw),literal_utf8:result.raw}:{unknown_payload_omitted:true})});
  }catch{fault('INVALID_PUBLIC_HTTP_CURRENT');return null;}
 }
 function coverage(checkpoints){
  const shared=new Map();for(const row of records)if(row.kind==='received_shared_public'&&row.parity==='PASS'){const key=[row.room_id,row.payload_sha256,row.game_rev].join(':');if(!shared.has(key))shared.set(key,row);}
  const rows=checkpoints.map(label=>{const http=records.filter(r=>r.checkpoint===label&&r.kind==='received_http_current'),pairs=http.flatMap(a=>{const b=shared.get([a.room_id,a.payload_sha256,a.game_rev].join(':'));return a.parity==='PASS'&&b?[{http_sequence:a.sequence,WS_sequence:b.sequence,room_rev:b.room_rev,game_rev:b.game_rev,poll_ordinal:b.poll_ordinal}]:[];});return {checkpoint:label,status:pairs.length?'PASS':'NOT_COVERED',http:http.length,same_revision_pairs:pairs,barrier:'EXACT_NATIVE_PUBLIC_REVISION_MATCH_NOT_CAUSAL_OR_FUTURE_POLL_BARRIER'};});
  return {status:faults.length?'FAIL':rows.length>0&&rows.every(r=>r.status==='PASS')&&!records.some(r=>r.parity==='NOT_COVERED_UNMATCHED')?'PASS_FINITE_PUBLIC_DTO_PARITY_NOT_CADENCE_INFERENCE':'NOT_COVERED',faults:[...faults],checkpoints:rows,unmatched:records.filter(r=>r.parity==='NOT_COVERED_UNMATCHED').map(r=>r.sequence),literal_public_only:true,private_raw_archived:false,records,bytes,model_stream_revision_substitution_accepted:false,full_P05_PASS:false};
 }
 const api={install,wire,http,coverage,records,faults,label:label=>{checkpoint=label;},bind:(room,member,ordinal)=>actors.set(room+':'+member,ordinal),restore(){if(stopped)return;stopped=true;for(const fn of restores.reverse())fn();scope.disable();}};return api;
}
