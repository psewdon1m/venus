/** Pure measurement adapter: actual TopicGames mutators/crypto/DTO, explicit
 * memory SQL and all-present/auth seams. Never runtime authority evidence. */
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {Rooms} from '../../apps/api/dist/rooms.js';
import {TopicGames} from '../../apps/api/dist/topic-games.js';
import {Keyring,DomainError,requireThat} from '../../apps/api/dist/security.js';
import {topicAad,topicGameView} from '../../apps/api/dist/topic-game-model.js';
import {selectNextTopicRound,createTopicHistory,canonical,digest} from '../../packages/relationship-engine/dist/index.js';
import {makeSnapshot,makeHistory,makeSafety} from '../p05-topic-measurements/profiles.mjs';
const clone=v=>structuredClone(v),result=rows=>({rows,rowCount:rows.length});
export class MemorySession {
 constructor(f,descriptor,{snapshot,history,safety,names,roomRevision=1}={}){
  this.f=f;this.descriptor=descriptor;this.snapshot=snapshot??makeSnapshot(f,descriptor);this.history=history??makeHistory(f,this.snapshot,descriptor.regime);this.safety=safety??makeSafety(this.snapshot,descriptor.regime,descriptor.exclusionClass);this.now=1000000;
  this.keys=new Keyring('simulation',{simulation:randomBytes(32).toString('base64')});this.objects=new Map();this.chunks=new Map();this.rounds=new Map();this.actors=new Map();this.requests=new Map();this.roomEvents=[];this.queryCounts={};
  const s=this.snapshot.baseline;this.members=names??s.players.map((p,i)=>({id:p.id,display_name:'OBSERVER_ROLE_'+i+'_END',locale:'en',role:i===0?'host':'member',presence:'online',slot:i+1,removed_at:null,ready:true}));
  if(this.members.length<8&&!names)this.members.push({id:'99999999-9999-4999-8999-999999999999',display_name:'PUBLIC_OBSERVER',locale:'en',role:'member',presence:'online',slot:this.members.length+1,removed_at:null,ready:true});
  this.room={id:s.room_id,host_member_id:s.players[0].id,meeting_context:s.context,state:'open',private_protocol:2,rev:String(roomRevision)};
  this.g={id:s.session_id,room_id:s.room_id,state:'waiting',pause_reason:null,rev:'1',mode:s.mode,round_count:s.total_rounds,current_round:0,snapshot_cipher:this.keys.encrypt(this.snapshot,topicAad.snapshot(s.room_id,s.session_id)),pack_digest:f.pack.digest};
  this.c={query:this.query.bind(this),release(){}};
  this.rooms=new Rooms({keys:this.keys,pool:{connect:async()=>this.c},now:()=>this.now,offer:()=>({version:'SIMULATION',digest:'sha256:'+'a'.repeat(64)})});
  this.rooms.access=async(_c,room,member)=>{requireThat(room===this.room.id,'ROOM_NOT_FOUND',404);const m=this.members.find(m=>m.id===member);requireThat(m,'AUTH_REQUIRED',401);return{room:clone(this.room),member:clone(m),sessionHash:member};};
  this.rooms.finalAccessFence=async()=>()=>{}; // Explicit pure seam, NOT auth/TTL proof.
  this.rooms.attachGames({featureAvailable:async()=>true});
  this.api=new TopicGames(this.rooms,{enabled:true,privateTextChat:descriptor.capability==='CHAT_ON',syntheticFixtureOnly:true,source:{active:async()=>({pack:f.pack,map:f.map}),pinned:async()=>({pack:f.pack,map:f.map}),assertCurrent:pins=>assert.equal(digest(pins),digest(f.map.pins))},safety:{read:async()=>this.safety,assertCurrent:(room,observed)=>{assert.equal(room,this.room.id);assert.equal(canonical(observed),canonical(this.safety));},excludeLocked:async(c,a,observed,_request,topics)=>{assert.equal(observed.revision,this.safety.revision);const next=clone(this.safety),own=next.members.find(m=>m.member_id===a.member.id);own.excluded_topic_ids=[...new Set([...own.excluded_topic_ids,...topics])].sort();own.allow_topic_ids=own.allow_topic_ids.filter(t=>!own.excluded_topic_ids.includes(t));own.revision++;next.revision++;this.safety=next;await this.api.topicsChanged(c,this.room.id,a.member.id);return next;}}});
  this.api.row=async(_c,room,id)=>room===this.room.id&&(!id||id===this.g.id)?clone(this.g):null;
  this.api.source=async()=>({pack:f.pack,map:f.map});this.api.snapshot=async()=>this.snapshot;this.api.history=async()=>this.history;this.api.saveHistory=async(_c,l)=>{this.history=l.history;};this.api.safety=async()=>this.safety;
  this.api.selectedFence=async()=>Object.assign(()=>{}, {deadline:Infinity}); // All-present pure profiles only.
 }
 snapshotDB(){return{objects:new Map(this.objects),chunks:new Map(this.chunks),rounds:new Map(this.rounds),actors:new Map(this.actors),requests:new Map(this.requests),room:clone(this.room),g:clone(this.g),history:this.history,roomEvents:this.roomEvents.slice(),privateStream:this.privateStream};}
 restoreDB(s){Object.assign(this,s);}
 async query(sql,args=[]){
  this.queryCounts[sql]=(this.queryCounts[sql]??0)+1;
  if(sql==='BEGIN'){this.transactionBefore=this.snapshotDB();return result([]);}if(sql==='COMMIT'){this.transactionBefore=null;return result([]);}if(sql==='ROLLBACK'){if(this.transactionBefore)this.restoreDB(this.transactionBefore);this.transactionBefore=null;return result([]);}
  if(sql==='SAVEPOINT topic_operation'){this.savepoint=this.snapshotDB();return result([]);}if(sql==='ROLLBACK TO SAVEPOINT topic_operation'){this.restoreDB(this.savepoint);return result([]);}if(sql==='RELEASE SAVEPOINT topic_operation'){this.savepoint=null;return result([]);}
  if(sql.startsWith('SELECT pg_advisory_xact_lock'))return result([]);
  if(sql==='SELECT private_protocol FROM rooms WHERE id=$1')return result([{private_protocol:2}]);
  if(sql.startsWith('SELECT * FROM rooms WHERE id=$1'))return result(args[0]===this.room.id?[clone(this.room)]:[]);
  if(sql.startsWith('SELECT m.*,COALESCE(p.ready,false)'))return result(this.members.slice().sort((a,b)=>a.id.localeCompare(b.id)).map(clone));
  if(sql==='SELECT id,display_name FROM room_members WHERE room_id=$1')return result(this.members.map(m=>({id:m.id,display_name:m.display_name})));
  if(sql.startsWith('UPDATE rooms SET rev=rev+1,last_activity_at=')){this.room={...this.room,rev:String(Number(this.room.rev)+1)};return result([clone(this.room)]);}
  if(sql.startsWith('INSERT INTO outbox_events(')){this.roomEvents.push({event_id:args[0],room_id:args[1],room_rev:Number(args[2]),payload:clone(args[3]),created_at:args[4]});return result([]);}
  if(sql.startsWith('DELETE FROM outbox_events WHERE'))return result([]); // Bounded audit storage is outside pure measurements.
  if(sql.startsWith('SELECT operation,request_hash,receipt_cipher FROM topic_game_requests')){const r=this.requests.get(args.join(':'));return result(r?[clone(r)]:[]);}
  if(sql==='SELECT count(*) AS count FROM topic_game_requests WHERE room_id=$1')return result([{count:String(this.requests.size)}]);
  if(sql.startsWith('INSERT INTO topic_game_requests VALUES')){this.requests.set(args.slice(0,3).join(':'),{operation:args[3],request_hash:args[4],receipt_cipher:args[5]});return result([]);}
  if(sql.startsWith('UPDATE game_sessions SET state=$2,pause_reason=$3,rev=rev+1')){assert.equal(args[0],this.g.id);this.g={...this.g,state:args[1],pause_reason:args[2],rev:String(Number(this.g.rev)+1),current_round:args[3]};return result([clone(this.g)]);}
  if(sql.startsWith('INSERT INTO game_rounds(')){this.rounds.set(args[0],{id:args[0],room_id:args[1],session_id:args[2],round_index:args[3],state:args[4],cipher:args[5],created_at:args[6]});return result([]);}
  if(sql.startsWith('SELECT * FROM game_rounds WHERE room_id=$1'))return result([...this.rounds.values()].filter(r=>r.room_id===args[0]&&r.session_id===args[1]&&r.round_index===args[2]).map(clone));
  if(sql.startsWith('UPDATE game_rounds SET state=$2,cipher=$3')){const row=this.rounds.get(args[0]);this.rounds.set(args[0],{...row,state:args[1],cipher:args[2]});return result([]);}
  if(sql.startsWith('UPDATE game_rounds SET cipher=$2')){const row=this.rounds.get(args[0]);this.rounds.set(args[0],{...row,cipher:args[1]});return result([]);}
  if(sql.startsWith('INSERT INTO game_round_actors VALUES')){this.actors.set(args.slice(0,4).join(':'),{role:args[4]});return result([]);}
  if(sql.startsWith('SELECT role FROM game_round_actors')){const row=this.actors.get(args.join(':'));return result(row?[row]:[]);}
  if(sql.startsWith('SELECT 1 FROM game_participants'))return result(this.snapshot.baseline.players.some(p=>p.id===args[2])?[{}]:[]);
  if(sql.startsWith('SELECT m.presence,m.slot,m.removed_at,m.heartbeat_at,m.reserved_until FROM game_participants'))return result(this.snapshot.baseline.players.map(p=>({presence:'online',slot:this.members.find(m=>m.id===p.id).slot,removed_at:null,heartbeat_at:new Date(this.now),reserved_until:new Date(this.now+90000)})));
  if(sql.startsWith('SELECT revision FROM topic_game_objects')||sql.startsWith('SELECT revision,chunk_count,byte_length FROM topic_game_objects')){const row=this.objects.get(args.slice(0,4).join(':'));return result(row?[clone(row)]:[]);}
  if(sql.startsWith('INSERT INTO topic_game_objects(')){this.objects.set(args.slice(0,4).join(':'),{room_id:args[0],session_id:args[1],object_id:args[2],kind:args[3],revision:String(args[4]),chunk_count:args[5],byte_length:args[6]});return result([]);}
  if(sql.startsWith('DELETE FROM topic_game_chunks WHERE')){this.chunks.delete(args.slice(0,4).join(':'));return result([]);}
  if(sql.startsWith('INSERT INTO topic_game_chunks VALUES')){const key=args.slice(0,4).join(':'),parts=this.chunks.get(key)??[];this.chunks.set(key,[...parts,{chunk_index:args[4],cipher:args[5]}]);return result([]);}
  if(sql.startsWith('SELECT chunk_index,cipher FROM topic_game_chunks'))return result((this.chunks.get(args.slice(0,4).join(':'))??[]).slice().sort((a,b)=>a.chunk_index-b.chunk_index).map(clone));
  if(sql.startsWith('DELETE FROM topic_game_objects WHERE')){let kinds;if(sql.includes("kind='chat'"))kinds=['chat'];else if(sql.includes("kind='projection'"))kinds=['projection'];else if(sql.includes("kind IN ('conversation','chat','projection')"))kinds=['conversation','chat','projection'];else throw Error('UNMODELED_OBJECT_DELETE:'+sql);for(const[k,row]of this.objects)if(row.room_id===args[0]&&row.session_id===args[1]&&kinds.includes(row.kind)){this.objects.delete(k);this.chunks.delete(k);}return result([]);}
  if(sql.startsWith('DELETE FROM topic_game_private_refs WHERE'))return result([]); // No fake transport reference grants.
  if(sql.startsWith('INSERT INTO game_private_streams('))return result([]);
  if(sql.startsWith('UPDATE game_private_streams SET rev=rev+1')){this.privateStream=(this.privateStream??0)+1;return result([{rev:String(this.privateStream)}]);}
  if(sql.startsWith('INSERT INTO topic_game_private_refs('))return result([]); // Ref publication is outside this pure adapter.
  throw Error('UNMODELED_SQL:'+sql);
 }
 async initialize(){const selected=selectNextTopicRound(this.snapshot,this.history,this.f.pack,this.f.map,this.safety);this.history=selected.history;this.g.state='active';const l={game:clone(this.g),snapshot:this.snapshot,history:this.history,pack:this.f.pack,map:this.f.map,safety:this.safety};await this.api.newRound(this.c,l,selected.round);return this;}
 async loaded(){return this.api.loaded(this.c,this.room.id,this.g.id);}
 async current(){const r=[...this.rounds.values()].find(r=>r.round_index===this.g.current_round);return r?{row:clone(r),data:this.keys.decrypt(r.cipher,topicAad.round(this.room.id,this.g.id,r.id))}:null;}
 async gameView(locale='en'){const current=await this.current();return topicGameView(clone(this.g),current?.data??null,this.f.pack,this.history,locale,this.members,this.now);}
 async roomView(){return this.rooms.view(this.c,clone(this.room));}
 async target(actor){const r=await this.current();let value;await this.api.roundTarget(this.room.id,actor,this.g.id,r.row.id,v=>{value=v;});return value;}
 async conversation(actor){const l=await this.loaded();return this.api.dto(this.c,l,actor,'en');}
 async conversationState(){const l=await this.loaded();return this.api.conversation(this.c,l);}
 async mutate(kind,actor,input={}){
  const current=await this.current(),args=[this.room.id,actor,this.g.id,current.row.id],body={request_id:randomUUID(),...input};
  if(['choice','condition','response','finish','conversationCommand','sendChat'].includes(kind))return this.api[kind](...args,body);
  if(kind==='advance')return this.api.advance(this.room.id,actor,this.g.id,body);
  throw Error('UNKNOWN_MUTATION_KIND:'+kind);
 }
 async chat(actor){const current=await this.current();let view;await this.api.dispatchChat(this.room.id,actor,this.g.id,current.row.id,v=>{view=v;});return view;}
 stepClock(ms=100){assert(Number.isSafeInteger(ms)&&ms>=0);this.now+=ms;}
}
