/** Exact public observations only. No hidden-plan/actor-response metadata imputation. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {topicGameView} from '../../apps/api/dist/topic-game-model.js';
export const dictionary=JSON.parse(readFileSync(new URL('../p05-topic-measurements/contracts/public-features.json',import.meta.url)));
assert.equal(createHash('sha256').update(JSON.stringify(dictionary.names)).digest('hex'),'2eba539a5104c8102606b8880f5d0113448a8d8fba11f1838cca16d50ad88bdd');
const forbidden=new Set(['edges','comfort','pairClass','pair_class','relationship_scope','invitation','condition','private_text','refusal_reason','seed','topic_ids','allow_topic_ids','excluded_topic_ids','candidate_ref','candidate_hash','card_sha256','epoch','conversation_id']);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export function renderActualGame(game,data,pack,history,locale,names,now){return topicGameView(game,data,pack,history,locale,names,now);}
export function structuralPublic(value){
 const paths=[];let nulls=0,sequences=[];
 function scan(v,path=''){if(v===null){nulls++;return;}if(typeof v==='string'&&uuid.test(v))paths.push({path,value:v});if(v&&typeof v==='object')for(const[k,child]of Object.entries(v)){assert(!forbidden.has(k),'STRUCTURAL_PRIVATE_FIELD:'+path+'.'+k);if(/cookie|credential|token|secret|authorization/i.test(k))throw Error('PUBLIC_SECRET_QUARANTINE:'+path+'.'+k);if(k==='sequence'&&typeof child==='number')sequences.push(child);scan(child,path+'.'+k);}}
 scan(value);return{uuid_fields:paths,nulls,sequences};
}
export function transcriptAccumulator(pack,players,{onRaw=()=>{}}={}){
 const names=dictionary.names,positions=new Map(names.map((n,i)=>[n,i])),values=new Float64Array(names.length),display=players.map((p,i)=>({id:p.id,display_name:'OBSERVER_ROLE_'+i+'_END'})),channels=new Map(),seenKinds=new Set(),seenPublicCards=new Set();let event_index=0,lastTime=null,ticks=0,lastGame=0,lastStream=0;
 const inc=(name,n=1)=>{assert(positions.has(name),'UNREGISTERED_FEATURE:'+name);values[positions.get(name)]+=n;},set=(name,n)=>{assert(positions.has(name),'UNREGISTERED_FEATURE:'+name);values[positions.get(name)]=n;};
 function stats(channel,meta){let v=channels.get(channel);if(!v){v={first:null,last:null,streamFirst:null,streamLast:null,timeFirst:null,timeLast:null,state:undefined,uuid:new Map()};channels.set(channel,v);}const pre='v2:'+channel+':';inc(pre+'observations');if(meta.emitted_frame)inc(pre+'emitted_frames');inc(pre+'serialized_utf8_bytes',meta.byte_length);const revision=channel==='room'?meta.public_room_rev:meta.public_game_rev;
  if(revision!==null){v.first??=revision;v.last=revision;set(pre+'revision_first',v.first);set(pre+'revision_last',v.last);set(pre+'revision_delta',v.last-v.first);}if(meta.public_stream_rev!==null){v.streamFirst??=meta.public_stream_rev;v.streamLast=meta.public_stream_rev;set(pre+'stream_revision_first',v.streamFirst);set(pre+'stream_revision_last',v.streamLast);set(pre+'stream_revision_delta',v.streamLast-v.streamFirst);}
  if(meta.server_time_if_present!==null){v.timeFirst??=meta.server_time_if_present;v.timeLast=meta.server_time_if_present;set(pre+'server_time_elapsed_ms',v.timeLast-v.timeFirst);}inc(pre+'uuid_fields_present',meta.analysis.uuid_fields.length);for(const row of meta.analysis.uuid_fields){if(v.uuid.has(row.path)&&v.uuid.get(row.path)!==row.value)inc(pre+'uuid_value_changes');v.uuid.set(row.path,row.value);}inc(pre+'null_fields',meta.analysis.nulls);if(meta.analysis.sequences.length){inc(pre+'public_sequence_fields_present',meta.analysis.sequences.length);set(pre+'public_sequence_last',meta.analysis.sequences.at(-1));}if(v.state!==undefined&&v.state!==meta.public_state)inc(pre+'state_transitions');v.state=meta.public_state;
 }
 return{names,display,
  observe({raw,channel,transport,observed_at_ms,emitted_frame=false,modeled_frame=false,http_status=null,operation_kind_diagnostic_only}){
   assert(['room','game'].includes(channel)&&['HTTP','WS','MODELED_HTTP','MODELED_PUBLIC'].includes(transport)&&Number.isFinite(observed_at_ms));assert(!(emitted_frame&&transport!=='WS'),'ACTUAL_FRAME_REQUIRES_WS_PROVENANCE');assert(!(modeled_frame&&transport!=='MODELED_PUBLIC'),'MODELED_FRAME_PROVENANCE');assert(typeof raw==='string','RAW_EXACT_UTF8_REQUIRED');assert(Buffer.byteLength(raw)<=16384,'PUBLIC_OBSERVATION_BYTE_BOUND');const payload=JSON.parse(raw),analysis=structuralPublic(payload),body=payload.payload??payload,game=body.game??(body.session_id?body:null),round=game?.current_round??body.current_round??null;
   if(round?.kind==='generic')assert.deepEqual(Object.keys(round).sort(),['kind','round_id','round_index','state']);
   const serverTime=typeof payload.server_time==='string'?Date.parse(payload.server_time):payload.server_time;
   const meta={event_index:event_index++,channel,transport,http_status,observed_at_ms,emitted_frame,modeled_frame,operation_kind_diagnostic_only,raw_serialized_UTF8:raw,raw_sha256:createHash('sha256').update(raw).digest('hex'),byte_length:Buffer.byteLength(raw),public_game_rev:Number.isFinite(game?.game_rev)?game.game_rev:null,public_room_rev:Number.isFinite(payload.room_rev)?payload.room_rev:Number.isFinite(body.room_rev)?body.room_rev:null,public_stream_rev:Number.isFinite(payload.stream_rev)?payload.stream_rev:null,server_time_if_present:Number.isFinite(serverTime)?serverTime:null,public_state:round?.state??game?.state??body.state??null,analysis};
   onRaw(meta);stats(channel,meta);if(round?.kind==='generic')stats('generic',meta);
   if(transport==='HTTP'||transport==='MODELED_HTTP'){assert(Number.isInteger(http_status)&&(http_status===200||http_status>=400&&http_status<600),'PUBLIC_READ_STATUS_REQUIRED');inc('v2:http:public_reads');inc('v2:http:public_status'+(http_status===200?'200':http_status>=400&&http_status<500?'4xx':'5xx'));}
   if(meta.public_game_rev!==null)lastGame=meta.public_game_rev;if(meta.public_stream_rev!==null)lastStream=meta.public_stream_rev;
   if(emitted_frame||modeled_frame){inc('frames');inc('serialized_bytes',meta.byte_length);}
   if(round){inc('round_state:'+round.state);if(round.kind==='generic')inc('generic_frames');else{inc('response_state:'+round.response_state);inc('proposal_revision',round.proposal_revision);inc('choice:'+(round.choice??'none'));const visible=new Set(round.actors);for(const p of display)if(JSON.stringify(round.text).includes(p.display_name))visible.add(p.id);for(const id of visible)inc('visible_role:'+players.findIndex(p=>p.id===id));const ids=round.actors.map(id=>players.findIndex(p=>p.id===id));if(ids.length)inc('ordered_first:'+ids[0]);if(ids.length>1){inc('ordered_second:'+ids[1]);inc('ordered_pair:'+ids[0]+':'+ids[1]);}}
    const kind=round.kind==='generic'?'generic':pack.card(round.card_id).interaction,kindKey=round.round_id+':'+kind;if(!seenKinds.has(kindKey)){seenKinds.add(kindKey);inc('interaction:'+kind);if(kind==='generic'){assert(Number.isInteger(game?.total_rounds),'PUBLIC_TOTAL_ROUNDS_REQUIRED');const stage=Math.min(4,1+Math.floor(4*(round.round_index-1)/Math.max(1,game.total_rounds-1)));inc('private_stage:'+stage);}}
    if(round.kind==='public'&&!seenPublicCards.has(round.round_id+':'+round.card_id)){seenPublicCards.add(round.round_id+':'+round.card_id);inc('card:'+round.card_id);}
   }
   lastTime=observed_at_ms;return meta;
  },clockTick({from,to}){assert(Number.isFinite(from)&&to>=from);ticks++;lastTime=to;},
  finish({committed_round_count,requested_rounds,refused=false,unavailable_branches=0}){set('last_game_revision',lastGame);set('last_stream_revision',lastStream);set('elapsed_ticks',ticks);set('v2:prefix:completed_rounds',committed_round_count);set('v2:prefix:requested_rounds',requested_rounds);set('v2:prefix:refused',Number(refused));set('v2:prefix:unavailable_branches',unavailable_branches);return{names,raw:Array.from(values),features:Array.from(values,x=>x/Math.max(1,committed_round_count)),completed_rounds:committed_round_count,requested_rounds,refused,observations:event_index,last_observed_at_ms:lastTime};}
 };
}
