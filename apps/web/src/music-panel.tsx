import {useCallback,useEffect,useRef,useState} from 'react';
import type {Locale,MusicCommand,MusicState,MusicTrack} from '@venus/contracts';
import {musicCopy} from '@venus/i18n';
import {SessionApi} from './api.js';
import {musicSample,applyMusicSync,type MusicSample} from './music-sync.js';
type View=MusicState&{tracks:MusicTrack[]};
export function MusicPanel({api,roomId,memberId,locale,meetingContext,connected,ducked=false}:{api:SessionApi;roomId:string;memberId:string;locale:Locale;meetingContext:'online'|'in_person';connected:boolean;ducked?:boolean}){
 const t=musicCopy(locale),[view,setView]=useState<View|null>(null),[error,setError]=useState(false),[blocked,setBlocked]=useState(false),[listen,setListen]=useState(false),[volume,setVolume]=useState(0.5),[busy,setBusy]=useState(false);
 const audio=useRef<HTMLAudioElement>(null),sample=useRef<MusicSample|null>(null),listening=useRef(false),generation=useRef(0),loaded=useRef(''),inflight=useRef(false),live=useRef(false),pendingCommand=useRef(false);
 const onBlocked=useCallback(()=>{if(live.current&&listening.current){listening.current=false;setBlocked(true);}},[]);
 const synchronize=useCallback((target:HTMLAudioElement,value:MusicSample,enabled:boolean)=>{const epoch=generation.current;applyMusicSync(target,value,performance.now(),enabled,()=>{if(generation.current===epoch)onBlocked();});},[onBlocked]);
 const prefix='/api/v1/rooms/'+roomId+'/music';
 const stop=useCallback(()=>{const a=audio.current;if(a){a.pause();a.removeAttribute('src');a.load();}loaded.current='';},[]);
 const refresh=useCallback(async()=>{
  if(inflight.current||!live.current||!connected)return;inflight.current=true;const epoch=generation.current,start=performance.now();
  try{const value=await api.request<View>(prefix);if(!live.current||epoch!==generation.current)return;sample.current=musicSample(value,start,performance.now());setView(value);setError(false);}
  catch{if(live.current&&epoch===generation.current){stop();sample.current=null;setView(null);setError(true);}}
  finally{inflight.current=false;}
 },[api,prefix,stop,connected]);
 useEffect(()=>{live.current=true;const epoch=++generation.current,initial=setTimeout(()=>{void refresh();},0),timer=setInterval(()=>{void refresh();},3000);return()=>{live.current=false;generation.current=epoch+1;clearTimeout(initial);clearInterval(timer);stop();sample.current=null;};},[refresh,roomId,memberId,stop]);
 useEffect(()=>{listening.current=listen&&connected&&!blocked;const a=audio.current;if(!a)return;a.volume=volume*(ducked?.2:1);if(!connected||!view||!view.track||view.reason!=='ready'||!listen){stop();return;}
  const src=prefix+'/tracks/'+view.track.id+'/stream'+(meetingContext==='in_person'&&!view.default_speaker?'?personal=1':'');
  if(loaded.current!==src){a.pause();a.src=src;a.load();loaded.current=src;}
  if(blocked){a.pause();return;}if(sample.current)synchronize(a,sample.current,listening.current);
 },[view,listen,volume,prefix,meetingContext,stop,connected,blocked,synchronize,ducked]);
 useEffect(()=>{const timer=setInterval(()=>{if(audio.current&&sample.current)synchronize(audio.current,sample.current,listening.current);},250);return()=>clearInterval(timer);},[synchronize]);
 const command=async(value:Omit<Extract<MusicCommand,{action:'queue'}>,'expected_rev'|'idempotency_key'>|Omit<Extract<MusicCommand,{action:'seek'}>,'expected_rev'|'idempotency_key'>|{action:'play'|'pause'|'next'|'previous'})=>{
  if(!connected||!view?.can_control||pendingCommand.current)return;pendingCommand.current=true;setBusy(true);
  try{await api.request(prefix,{...value,expected_rev:view.rev,idempotency_key:crypto.randomUUID()});await refresh();}
  catch{setError(true);await refresh();}finally{pendingCommand.current=false;setBusy(false);}
 };
 const enable=()=>{setListen(true);listening.current=true;setBlocked(false);const a=audio.current,s=sample.current,epoch=generation.current;if(a&&s?.state.track){const src=prefix+'/tracks/'+s.state.track.id+'/stream'+(meetingContext==='in_person'&&!s.state.default_speaker?'?personal=1':'');if(loaded.current!==src){a.src=src;loaded.current=src;a.load();}a.volume=volume*(ducked?.2:1);void a.play().then(()=>{if(live.current&&generation.current===epoch&&listening.current&&loaded.current===src&&sample.current)synchronize(a,sample.current,true);else a.pause();}).catch((error:unknown)=>{if(!live.current||generation.current!==epoch||!listening.current||loaded.current!==src)return;if(error&&typeof error==='object'&&'name' in error&&error.name==='NotAllowedError')onBlocked();else if(!(error&&typeof error==='object'&&'name' in error&&error.name==='AbortError'))setError(true);});}};
 return <section className="panel music-panel" data-testid="music-panel" aria-label={t.title}>
  <h2>{t.title}</h2><audio ref={audio} preload="none" onLoadedMetadata={()=>{if(audio.current&&sample.current)synchronize(audio.current,sample.current,listening.current);}} onError={()=>{if(listening.current){stop();setError(true);}}}/>
  {error?<p role="status">{t.error}</p>:!view?<p role="status">{t.loading}</p>:null}
  {blocked?<p role="status" data-testid="music-blocked">{t.blocked}</p>:null}
  {view?<><p data-testid="music-track">{view.track?.title[locale]??t.empty}</p>{view.track?.synthetic?<p className="hint">{t.synthetic}</p>:null}
   <div className="actions"><button type="button" data-testid="music-listen" onClick={listen&&!blocked?()=>{setListen(false);listening.current=false;stop();}:enable}>{listen&&!blocked?t.silent:t.listen}</button></div>
   {meetingContext==='in_person'&&!view.default_speaker?<p className="hint">{t.personal}</p>:null}
   <label>{t.volume}<input data-testid="music-volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={e=>setVolume(Number(e.target.value))}/></label>
   {view.can_control?<><div className="actions"><button type="button" disabled={busy||!view.track} onClick={()=>{void command({action:'previous'});}}>{t.previous}</button><button type="button" data-testid="music-play" disabled={busy||!view.track} onClick={()=>{void command({action:view.status==='playing'?'pause':'play'});}}>{view.status==='playing'?t.pause:t.play}</button><button type="button" data-testid="music-next" disabled={busy||view.index>=view.queue.length-1} onClick={()=>{void command({action:'next'});}}>{t.next}</button></div>
    <label>{t.seek}<input data-testid="music-seek" type="range" min="0" max={view.track?.duration_ms??0} step="1000" value={Math.round(view.position_ms)} disabled={busy||!view.track} onChange={e=>{void command({action:'seek',position_ms:Number(e.target.value)});}}/></label>
    <h3>{t.queue}</h3><ol>{view.queue.map((id,index)=><li key={index}>{view.tracks.find(track=>track.id===id)?.title[locale]??id}<button type="button" disabled={busy} aria-label={t.remove} onClick={()=>{void command({action:'queue',tracks:view.queue.filter((_,i)=>i!==index)});}}>×</button></li>)}</ol>
    <button type="button" disabled={busy||view.queue.length===0} onClick={()=>{void command({action:'queue',tracks:[]});}}>{t.clear}</button>
    <ul>{view.tracks.map(track=><li key={track.id}>{track.title[locale]} <button type="button" data-testid={'music-add-'+track.id} disabled={busy||view.queue.length>=128} onClick={()=>{void command({action:'queue',tracks:[...view.queue,track.id]});}}>{t.add}</button></li>)}</ul>
   </>:null}<p className="hint">{t.sync}</p></>:null}
  <button type="button" onClick={()=>{void refresh();}}>{t.refresh}</button>
 </section>;
}
