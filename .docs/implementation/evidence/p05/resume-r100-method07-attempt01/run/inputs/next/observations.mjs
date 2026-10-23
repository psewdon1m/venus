import {transcriptAccumulator} from './public-transcript.mjs';
import {makeWireRenderers} from './wire-renderers.mjs';
/** Conservative uncoalesced observation model, NOT actual WebSocket arrival. */
export function observations(session,{onPublic=()=>{},onClock=()=>{}}={}){
 const acc=transcriptAccumulator(session.f.pack,session.snapshot.baseline.players,{onRaw:onPublic});let lastRoomRev=-1,modeledFrames=0,actualFrames=0;
 const socket={readyState:1,send:raw=>{const frame=JSON.parse(raw);modeledFrames++;acc.observe({raw,channel:frame.stream,transport:'MODELED_PUBLIC',observed_at_ms:session.now,emitted_frame:false,modeled_frame:true,operation_kind_diagnostic_only:'conservative_uncoalesced_formatter_snapshot'});}};
 const render=makeWireRenderers({now:()=>session.now,dispatchGame:async(_grant,enqueue)=>enqueue(await session.gameView(),Number(session.room.rev))}),grant={roomId:session.room.id,memberId:session.snapshot.baseline.players.length===8?session.snapshot.baseline.players[2].id:'99999999-9999-4999-8999-999999999999'};
 return{acc,
  async observe(_session,label,clock){if(label==='clock_tick'){acc.clockTick(clock);onClock(clock);return;}const room=await session.roomView(),game=await session.gameView();
   acc.observe({raw:JSON.stringify(room),channel:'room',transport:'MODELED_HTTP',observed_at_ms:session.now,http_status:200,operation_kind_diagnostic_only:label});acc.observe({raw:JSON.stringify(game),channel:'game',transport:'MODELED_HTTP',observed_at_ms:session.now,http_status:200,operation_kind_diagnostic_only:label});
   if(room.room_rev>lastRoomRev){lastRoomRev=room.room_rev;render.send(socket,grant,room);await render.sendGame(socket,grant,{room,privateEvents:[]},true);}
  },finish(summary){return{...acc.finish({committed_round_count:summary.completed_rounds,requested_rounds:summary.requested_rounds,refused:Boolean(summary.refusal),unavailable_branches:summary.unavailable_branches}),modeled_public_frames:modeledFrames,actual_WS_frames:actualFrames,model:'CONSERVATIVE_UNCOALESCED_PUBLIC_OBSERVATIONS_PROPOSED_NOT_TRANSPORT_ARRIVAL_PROOF'};}
 };
}
