import {useEffect,useRef,useState} from 'react';
import type {Locale,RoomView,SelfPreferences,WsTicket} from '@venus/contracts';
import type {dictionary} from '@venus/i18n';
import {SessionApi,ApiError} from './api.js';
import {GamesPanel} from './games-panel.js';
import {TopicGamesPanel} from './topic-games-panel.js';
import {topicCopy} from '@venus/i18n';
import {gameCopy} from './game-copy.js';
import {MusicPanel} from './music-panel.js';
type Text=ReturnType<typeof dictionary>;
export function RoomShell({api,room,prefs,t,locale,busy,connectionEpoch,perform,refresh,onSnapshot,onError,leave,onClosed}:{api:SessionApi;room:RoomView;prefs:SelfPreferences;t:Text;locale:Locale;busy:boolean;connectionEpoch:number;perform:(action:()=>Promise<void>)=>Promise<void>;refresh:()=>Promise<void>;onSnapshot:(frame:unknown)=>void;onError:(e:unknown)=>void;leave:()=>void;onClosed:()=>void}) {
  const [invite,setInvite]=useState(''),[connection,setConnection]=useState<'checking'|'ready'|'offline'>('checking');
  const [gameFrame,setGameFrame]=useState<unknown>(null);
  const inviteInput=useRef<HTMLInputElement>(null),[inviteCopyStatus,setInviteCopyStatus]=useState<'copied'|'manual'|null>(null);
  const copyInvite=async()=>{
    if(!invite) return;
    try {if(!navigator.clipboard) throw new Error('CLIPBOARD_UNAVAILABLE');await navigator.clipboard.writeText(invite);setInviteCopyStatus('copied');}
    catch {setInviteCopyStatus('manual');inviteInput.current?.focus({preventScroll:true});inviteInput.current?.select();}
  };
  const dialog=useRef<HTMLDialogElement>(null);const me=room.members.find(m=>m.id===prefs.owner_member_id);
  const onSnapshotRef=useRef(onSnapshot),onErrorRef=useRef(onError);
  useEffect(()=>{onSnapshotRef.current=onSnapshot;onErrorRef.current=onError;},[onSnapshot,onError]);
  useEffect(()=>{
    let stopped=false,socket:WebSocket|undefined,heartbeat:ReturnType<typeof setInterval>|undefined,retry:ReturnType<typeof setTimeout>|undefined,attempts=0;
    const connect=async()=>{
      setConnection('checking');
      try {
        const ticket=await api.request<WsTicket>(`/api/v1/rooms/${room.room_id}/ws-ticket`,{request_id:crypto.randomUUID()});if(stopped) return;
        socket=new WebSocket(location.origin.replace('https:','wss:')+`/api/v1/rooms/${room.room_id}/ws`);
        socket.onopen=()=>{socket?.send(JSON.stringify({type:'auth',ticket:ticket.ticket}));};
        socket.onmessage=event=>{try {const frame:unknown=JSON.parse(String(event.data));if(frame&&typeof frame==='object'&&'type' in frame) {if(frame.type==='room.snapshot') {onSnapshotRef.current(frame);setConnection('ready');attempts=0;}else if(typeof frame.type==='string'&&frame.type.startsWith('game.')) setGameFrame(frame);}} catch {onErrorRef.current(new ApiError('SERVICE_UNAVAILABLE'));}};
        heartbeat=setInterval(()=>{if(socket?.readyState===WebSocket.OPEN) socket.send(JSON.stringify({type:'ping'}));},20000);
        socket.onerror=()=>setConnection('offline');
        socket.onclose=()=>{if(heartbeat) clearInterval(heartbeat);setConnection('offline');if(!stopped&&attempts++<3) retry=setTimeout(()=>{void connect();},Math.min(500*2**attempts,4000));};
      } catch(error) {if(!stopped) {setConnection('offline');onErrorRef.current(error);}}
    };
    void connect();return()=>{stopped=true;if(retry) clearTimeout(retry);if(heartbeat) clearInterval(heartbeat);socket?.close();};
  },[api,room.room_id,connectionEpoch]);
  useEffect(()=>{
    if(me?.role!=='host') return;let live=true;void api.request<{invite_url:string}>(`/api/v1/rooms/${room.room_id}/invite`).then(v=>{if(live) setInvite(v.invite_url);}).catch(e=>{if(live) onErrorRef.current(e);});return()=>{live=false;};
  },[api,room.room_id,me?.role]);
  return <section className="room-shell" data-testid="room-shell">
    <header className="room-heading"><div><p className="eyebrow">{t.yourRoom}</p><h1 data-testid="room-title">{room.meeting_context==='online'?t.online:t.inPerson}</h1></div><p role="status" data-testid="connection-status">{t[connection]}</p></header>
    <div className="room-grid"><section className="panel"><h2>{t.members} · {room.members.length}/8</h2><ul data-testid="member-list" className="member-list">{room.members.map(m=><li key={m.id}><span>{m.display_name}{m.id===prefs.owner_member_id?<small> · {t.you}</small>:null}</span><small>{m.role==='host'?t.host:t.member} · {m.presence==='online'?t.present:m.presence==='reconnecting'?t.reconnecting:t.absent} · {m.setup_ready?t.setupReady:t.setupPending}</small></li>)}</ul>
      {me?.role==='host'?<><label>{t.inviteLink}<input ref={inviteInput} data-testid="room-invite" value={invite} readOnly tabIndex={-1} onClick={e=>e.currentTarget.select()}/></label><button type="button" data-testid="copy-room-invite" disabled={!invite} onClick={()=>{void copyInvite();}}>{t.copyInvite}</button>{inviteCopyStatus?<p id="invite-copy-status" role="status">{inviteCopyStatus==='copied'?t.inviteCopied:t.inviteCopyManual}</p>:null}
        <label>{t.meetingContext}<select data-testid="room-context" disabled={busy||prefs.locked} value={room.meeting_context} onChange={e=>{const input={meeting_context:e.target.value,expected_rev:room.room_rev,idempotency_key:crypto.randomUUID()};void perform(async()=>{await api.request(`/api/v1/rooms/${room.room_id}/context`,input,'PATCH');await refresh();});}}><option value="online">{t.online}</option><option value="in_person">{t.inPerson}</option></select></label></>:null}
    </section>
    <PreferencesForm key={prefs.owner_member_id+':'+prefs.rev} {...{api,room,prefs,t,busy,perform,refresh,locale}}/></div>
    <RoomGames key={`${room.room_id}:${prefs.owner_member_id}:${connectionEpoch}`} {...{api,room,prefs,locale,connection}} frame={gameFrame} refreshRoom={refresh} onError={onError}/>
    {room.features.music==='available'?<MusicPanel key={room.room_id+':'+prefs.owner_member_id+':'+connectionEpoch} api={api} roomId={room.room_id} memberId={prefs.owner_member_id} locale={locale} meetingContext={room.meeting_context}/>:null}
    <section className="feature-grid" aria-label={t.modules}>{(['music','cinema','calls'] as const).filter(feature=>feature!=='music'||room.features.music!=='available').map(feature=><div className="feature" key={feature}><h3>{t[feature]}</h3><p>{t.featureUnavailable}</p></div>)}</section>
    <div className="actions room-exit"><button data-testid="leave-room" onClick={leave}>{t.leaveRoom}</button>{me?.role==='host'?<button className="danger" data-testid="close-room" onClick={()=>dialog.current?.showModal()}>{t.closeRoom}</button>:null}</div>
    <dialog ref={dialog} aria-labelledby="close-title"><h2 id="close-title">{t.closeRoom}</h2><p>{t.closeWarning}</p><div className="actions"><button onClick={()=>dialog.current?.close()}>{t.cancel}</button><button className="danger" data-testid="confirm-close" onClick={()=>{const input={expected_rev:room.room_rev,idempotency_key:crypto.randomUUID()};void perform(async()=>{await api.request(`/api/v1/rooms/${room.room_id}/close`,input);dialog.current?.close();onClosed();});}}>{t.confirmClose}</button></div></dialog>
    <span className="sr-only" lang={locale}>{t.privateHint}</span>
  </section>;
}

/** A refreshed authoritative revision discards the stale draft; the room/WS stays mounted. */
function PreferencesForm({api,room,prefs,t,busy,perform,refresh,locale}:{api:SessionApi;room:RoomView;prefs:SelfPreferences;t:Text;busy:boolean;perform:(action:()=>Promise<void>)=>Promise<void>;refresh:()=>Promise<void>;locale:Locale}) {
  const c=gameCopy(locale);
  const [comfort,setComfort]=useState(prefs.comfort),[edges,setEdges]=useState<Record<string,string>>(()=>Object.fromEntries(Object.entries(prefs.edges).map(([id,edge])=>[id,edge.relation])));
  const savedRev=prefs.rev;
  const relations=[['just_met',t.justMet],['friendship',t.friendship],['crush',t.crush],['situationship',t.situationship],['in_relationships',t.inRelationships],['not_a_friend',t.notAFriend]];
  return <form className="panel" onSubmit={e=>{e.preventDefault();const input={comfort,edges:Object.fromEntries(room.members.filter(m=>m.id!==prefs.owner_member_id).map(m=>[m.id,edges[m.id]??'friendship'])),expected_rev:savedRev,idempotency_key:crypto.randomUUID()};void perform(async()=>{const result=await api.request<SelfPreferences>(`/api/v1/rooms/${room.room_id}/me/preferences`,input,'PUT');void result;await refresh();});}}>
      <h2>{t.privateSetup}</h2>{prefs.locked?<p role="status">{t.gameSettingsLocked}</p>:null}<p className="hint">{t.privateHint}</p><label>{t.comfort} · {c[`comfort${comfort}` as 'comfort0']}<input data-testid="comfort" aria-valuetext={c[`comfort${comfort}` as 'comfort0']} disabled={prefs.locked} type="range" min="0" max="4" value={comfort} onChange={e=>setComfort(Number(e.target.value))}/></label>
      {room.members.filter(m=>m.id!==prefs.owner_member_id).map(m=><label key={m.id}>{m.display_name}<select data-testid={'relation-'+m.id} disabled={prefs.locked} value={edges[m.id]??'friendship'} onChange={e=>setEdges(old=>({...old,[m.id]:e.target.value}))}>{relations.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>)}
      <div className="actions"><button className="primary" data-testid="submit-preferences" disabled={busy||prefs.locked}>{busy?t.saving:t.saveSetup}</button>
      <button type="button" data-testid="skip-setup" disabled={busy||prefs.locked} onClick={()=>{const input={expected_rev:savedRev,idempotency_key:crypto.randomUUID()};void perform(async()=>{const value=await api.request<SelfPreferences>(`/api/v1/rooms/${room.room_id}/me/setup/skip`,input);setComfort(0);setEdges({});void value;await refresh();});}}>{t.neutralSetup}</button></div>
    </form>;
}

/** Protocol is authenticated and immutable. A fetch failure is never evidence
 * for selecting the legacy reader. Mounting is identity-bound. */
function RoomGames(props:Parameters<typeof GamesPanel>[0]){
 const {api,room,prefs,locale,onError}=props,t=topicCopy(locale),errorCallback=useRef(onError);
 useEffect(()=>{errorCallback.current=onError;},[onError]);
 const [protocol,setProtocol]=useState<1|2|null>(null),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let live=true;void api.request<unknown>(`/api/v1/rooms/${room.room_id}/me/private-protocol`).then(v=>{if(!live)return;if(!v||typeof v!=='object'||Object.keys(v).sort().join(',')!=='private_protocol,room_id,schema_version'||!('schema_version'in v)||v.schema_version!==1||!('room_id'in v)||v.room_id!==room.room_id||!('private_protocol'in v)||(v.private_protocol!==1&&v.private_protocol!==2))throw new ApiError('SERVICE_UNAVAILABLE');setProtocol(v.private_protocol);setFailed(false);}).catch(e=>{if(live){setProtocol(null);setFailed(true);if(e instanceof ApiError&&['AUTH_REQUIRED','ENTRY_REACCEPT_REQUIRED'].includes(e.code))errorCallback.current(e);}});return()=>{live=false;};},[api,room.room_id,prefs.owner_member_id,attempt]);
 return protocol===1?<GamesPanel {...props}/>:protocol===2?<TopicGamesPanel {...props}/>:<section className="panel" role="status"><p>{failed?t.error:t.loading}</p>{failed?<button onClick={()=>setAttempt(n=>n+1)}>{t.refresh}</button>:null}</section>;
}
