import {useEffect,useRef,useState} from 'react';
import type {Room} from 'livekit-client';
import type {CinemaState,Locale,MediaGrant} from '@venus/contracts';
import {cinemaCopy} from '@venus/i18n';
import {ApiError,SessionApi} from './api.js';
type LocalState='idle'|'connecting'|'live'|'denied'|'no_audio'|'error'|'blocked';
interface Active {revision:number;room?:Room;capture?:MediaStream;grant?:MediaGrant;renew?:ReturnType<typeof setInterval>;closed:boolean}
/** Capture permission is always a direct user gesture. A resource generation owns
 * its tracks, lease and teardown; late completion cannot stop a newer scope. */
export function CinemaPanel({api,roomId,locale,connected}:{api:SessionApi;roomId:string;locale:Locale;connected:boolean}){
 const t=cinemaCopy(locale),root=`/api/v1/rooms/${roomId}`,video=useRef<HTMLVideoElement>(null),audio=useRef<HTMLAudioElement>(null),active=useRef<Active|null>(null),serial=useRef(0),alive=useRef(true);
 const [state,setState]=useState<CinemaState|null>(null),[local,setLocal]=useState<LocalState>('idle'),[volume,setVolume]=useState(.7),[publishing,setPublishing]=useState(false),[hasMedia,setHasMedia]=useState(false),[engaged,setEngaged]=useState(false);
 const volumeRef=useRef(volume);useEffect(()=>{volumeRef.current=volume;},[volume]);
 const clearElements=()=>{for(const element of [video.current,audio.current])if(element){element.pause();element.srcObject=null;}};
 const retire=(value:Active,notify=true)=>{
  if(value.closed)return;value.closed=true;if(value.renew)clearInterval(value.renew);value.capture?.getTracks().forEach(track=>track.stop());void value.room?.disconnect(true);
  if(active.current===value){active.current=null;clearElements();if(alive.current){setHasMedia(false);setPublishing(false);setEngaged(false);}}
  if(notify&&value.grant)void api.request(`${root}/media/leases/${value.grant.lease_id}/release`,{idempotency_key:crypto.randomUUID()}).catch(()=>{});
 };
 const retireRef=useRef(retire);useEffect(()=>{retireRef.current=retire;});
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;const value=active.current;if(value)retireRef.current(value);};},[]);
 useEffect(()=>{
  if(!connected){const value=active.current;if(value)retireRef.current(value);return;}
  let stopped=false,pending=false;const refresh=async()=>{if(pending)return;pending=true;try{const value=await api.request<CinemaState>(root+'/cinema');if(stopped)return;setState(value);const current=active.current;if(current?.grant&&value.rev>=current.grant.cinema_rev&&(!['starting','live'].includes(value.state)||value.source_member_id===null)){retireRef.current(current);setLocal('idle');}}catch{if(!stopped){const current=active.current;if(current)retireRef.current(current);setLocal('error');}}finally{pending=false;}};
  void refresh();const timer=setInterval(()=>{void refresh();},1000);return()=>{stopped=true;clearInterval(timer);};
 },[api,root,connected]);
 const play=async(value:Active)=>{
  if(value.closed||active.current!==value)return;
  try{if(video.current?.srcObject)await video.current.play();if(value.closed||active.current!==value)return;if(audio.current?.srcObject){audio.current.volume=volumeRef.current;audio.current.muted=false;await audio.current.play();}if(!value.closed&&active.current===value)setLocal('live');}
  catch(error){if(value.closed||active.current!==value)return;if(error instanceof DOMException&&error.name==='AbortError')return;setLocal(error instanceof DOMException&&error.name==='NotAllowedError'?'blocked':'error');}
 };
 const begin=async(publisher:boolean)=>{
  if(!connected||!state||active.current)return;
  const value:Active={revision:++serial.current,closed:false};active.current=value;setEngaged(true);setLocal('connecting');setPublishing(publisher);
  const current=()=>!value.closed&&active.current===value&&alive.current;
  try{
   if(publisher){
    value.capture=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:15,max:30},width:{ideal:1280,max:1920},height:{ideal:720,max:1080}},audio:true});
    if(!current()){value.capture.getTracks().forEach(track=>track.stop());return;}
    if(!value.capture.getVideoTracks().some(track=>track.readyState==='live')||!value.capture.getAudioTracks().some(track=>track.readyState==='live')){retire(value);setLocal('no_audio');return;}
    for(const track of value.capture.getTracks())track.addEventListener('ended',()=>{if(current()){retire(value);setLocal('idle');}},{once:true});
    if(video.current){video.current.srcObject=value.capture;video.current.muted=true;void video.current.play().catch(()=>{});}
   }
   const grant=await api.request<MediaGrant>(root+'/cinema/'+(publisher?'start':'join'),{expected_rev:state.rev,idempotency_key:crypto.randomUUID()});value.grant=grant;
   if(!current()){void api.request(`${root}/media/leases/${grant.lease_id}/release`,{idempotency_key:crypto.randomUUID()}).catch(()=>{});return;}
   const {Room,RoomEvent,Track}=await import('livekit-client');if(!current())return;
   const room=new Room({adaptiveStream:false,dynacast:false,disconnectOnPageLeave:true});value.room=room;
   room.on(RoomEvent.Disconnected,()=>{if(current()){retire(value);setLocal('error');}});
   room.on(RoomEvent.TrackSubscribed,(track)=>{
    if(!current()||publisher)return;
    const element=track.kind===Track.Kind.Video?video.current:audio.current;if(!element)return;
    if(track.kind===Track.Kind.Video)element.muted=true;
    track.attach(element);setHasMedia(true);void play(value);
   });
   room.on(RoomEvent.TrackUnsubscribed,track=>{track.detach();if(current()){retire(value);setLocal('idle');}});
   await room.connect(grant.signaling_url,grant.token,{autoSubscribe:true,rtcConfig:{iceServers:[]}});if(!current()){void room.disconnect(true);return;}
   value.renew=setInterval(()=>{if(!current())return;void api.request(`${root}/media/leases/${grant.lease_id}/renew`,{idempotency_key:crypto.randomUUID()}).catch(()=>{if(current()){retire(value);setLocal('error');}});},5000);
   if(publisher){
    await room.localParticipant.publishTrack(value.capture!.getVideoTracks()[0]!,{source:Track.Source.ScreenShare,videoCodec:'vp8',simulcast:false,videoEncoding:{maxBitrate:1500000,maxFramerate:15},screenShareEncoding:{maxBitrate:1500000,maxFramerate:15}});
    if(!current())return;
    await room.localParticipant.publishTrack(value.capture!.getAudioTracks()[0]!,{source:Track.Source.ScreenShareAudio});
    if(!current())return;
    await api.request(root+'/cinema/source',{lease_id:grant.lease_id,scope_id:grant.scope_id,video:true,audio:true,idempotency_key:crypto.randomUUID()});if(current()){setHasMedia(true);setLocal('live');}
   }else if(current())setLocal('live');
  }catch(error){if(!current())return;retire(value);setLocal(error instanceof DOMException&&error.name==='NotAllowedError'?'denied':error instanceof ApiError&&error.code==='MEDIA_AUDIO_REQUIRED'?'no_audio':'error');}
 };
 return <section className="panel cinema-panel" data-testid="cinema-panel"><h2>{t.title}</h2><p role="status" data-testid="cinema-status">{!connected?t.offline:local!=='idle'?t[local]:state?t[state.state]:t.connecting}</p>
  <video ref={video} playsInline muted controls={false} aria-label={publishing?t.preview:t.viewer} data-testid="cinema-video" hidden={!hasMedia&&local!=='connecting'}/><audio ref={audio} data-testid="cinema-audio"/>
  <div className="actions">{!engaged?<>{state?.can_publish?<button data-testid="cinema-share" disabled={!connected||!state.transport_ready||['starting','live'].includes(state.state)} onClick={()=>{void begin(true);}}>{t.share}</button>:null}<button data-testid="cinema-watch" disabled={!connected||state?.state!=='live'} onClick={()=>{void begin(false);}}>{t.watch}</button></>:<button data-testid="cinema-stop" onClick={()=>{const value=active.current;if(value)retire(value);setLocal('idle');}}>{publishing?t.stop:t.leave}</button>}
  {hasMedia&&!publishing?<button data-testid="cinema-sound" onClick={()=>{const value=active.current;if(value){void value.room?.startAudio().then(()=>play(value)).catch(()=>{if(active.current===value&&!value.closed)setLocal('blocked');});}}}>{t.sound}</button>:null}</div>
  {hasMedia&&!publishing?<label>{t.volume}<input type="range" min="0" max="1" step="0.05" value={volume} onChange={event=>{const n=Number(event.target.value);setVolume(n);if(audio.current)audio.current.volume=n;}}/></label>:null}
  {state?.can_publish?<p className="hint">{t.hint}</p>:null}
 </section>;
}
