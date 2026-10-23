import {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {dictionary,locales} from '@venus/i18n';
import type {Locale,RoomView,SelfPreferences,CreateResult,JoinResult,InviteResolution,Member} from '@venus/contracts';
import {SessionApi,ApiError,acceptance,inviteToken,nextSnapshot,type EntryPolicy} from './api.js';
import {RoomShell} from './room-shell.js';
import './style.css';
export type Text=ReturnType<typeof dictionary>;
export function message(t:Text,error:unknown) {
  const code=error instanceof ApiError?error.code:'SERVICE_UNAVAILABLE';
  const keys:Record<string,keyof Text>={ROOM_FULL:'roomFull',INVITE_EXPIRED:'roomClosed',ROOM_CLOSED:'roomClosed',AUTH_REQUIRED:'sessionEnded',NOT_FOUND:'inviteInvalid',INVITE_INVALID:'inviteInvalid',REVISION_CONFLICT:'revisionConflict',IDEMPOTENCY_CONFLICT:'revisionConflict',ENTRY_POLICY_UNAVAILABLE:'policyUnavailable',ENTRY_ACCEPTANCE_REQUIRED:'acceptanceRequired',ENTRY_REACCEPT_REQUIRED:'reacceptRequired',RATE_LIMITED:'rateLimited',INVALID_NAME:'invalidName',HOST_REQUIRED:'hostRequired',INVALID_REQUEST:'invalidInput',GAME_SETTINGS_LOCKED:'gameSettingsLocked'};
  return t[keys[code]??'serviceUnavailable'];
}
function App() {
  const [api]=useState(()=>new SessionApi());const [locale,setLocale]=useState<Locale>('ru');
  const [policy,setPolicy]=useState<EntryPolicy|null>(null),[room,setRoom]=useState<RoomView|null>(null);
  const [prefs,setPrefs]=useState<SelfPreferences|null>(null),[error,setError]=useState<unknown>(null),[busy,setBusy]=useState(false);
  const [retry,setRetry]=useState<(()=>Promise<void>)|null>(null);
  const [accepted,setAccepted]=useState(false),[adult,setAdult]=useState(false);
  const reacceptRequested=useRef(false);
  const [needsReaccept,setNeedsReaccept]=useState(false),[connectionEpoch,setConnectionEpoch]=useState(0);
  const [name,setName]=useState(''),[context,setContext]=useState<'online'|'in_person'>('online');
  const [initial]=useState(()=>new URLSearchParams(location.hash.slice(1)));
  const [invite,setInvite]=useState(initial.get('invite')??'');
  const [roomId,setRoomId]=useState(initial.get('room'));
  const t=dictionary(locale);
  useEffect(()=>{document.documentElement.lang=locale;},[locale]);
  useEffect(()=>{
    if(initial.has('invite')) history.replaceState(null,'','/');
    let live=true;void api.bootstrap().then(p=>{if(live) setPolicy(p);}).catch(e=>{if(live) setError(e);});
    return()=>{live=false;};
  },[api,initial]);
  async function refresh(id=roomId) {
    if(!id) return;
    const [view,own]=await Promise.all([api.request<RoomView>(`/api/v1/rooms/${id}`),api.request<SelfPreferences>(`/api/v1/rooms/${id}/me/preferences`)]);
    setRoom(view);setPrefs(own);const me=view.members.find(m=>m.id===own.owner_member_id);if(me) setLocale(me.locale);
  }
  useEffect(()=>{
    if(!roomId) return;let live=true;
    void Promise.all([api.request<RoomView>(`/api/v1/rooms/${roomId}`),api.request<SelfPreferences>(`/api/v1/rooms/${roomId}/me/preferences`)]).then(([view,own])=>{if(live) {setRoom(view);setPrefs(own);const me=view.members.find(m=>m.id===own.owner_member_id);if(me) setLocale(me.locale);}}).catch(e=>{if(live) setError(e);});
    return()=>{live=false;};
  },[api,roomId]);
  async function handleError(e:unknown) {
    setError(e);
    if(e instanceof ApiError&&e.code==='GAME_SETTINGS_LOCKED') {try {await refresh();} catch { /* Preserve the original actionable error. */ }}
    if(e instanceof ApiError&&e.code==='ENTRY_REACCEPT_REQUIRED'&&!reacceptRequested.current) {
      reacceptRequested.current=true;setNeedsReaccept(true);setAccepted(false);setAdult(false);setPolicy(null);
      try {setPolicy(await api.bootstrap());} catch {reacceptRequested.current=false; /* Retry can reload the current policy. */ }
    }
  }
  async function perform(action:()=>Promise<void>) {
    setBusy(true);setError(null);setRetry(()=>action);
    try {await action();setRetry(null);} catch(e) {
      await handleError(e);
    } finally {setBusy(false);}
  }
  function enter(view:RoomView|undefined,id:string) {reacceptRequested.current=false;setNeedsReaccept(false);if(view) setRoom(view);setRoomId(id);history.replaceState(null,'','/#room='+id);}
  async function chooseLocale(value:Locale) {
    if(!room) {setLocale(value);return;}
    const input={locale:value,expected_rev:room.room_rev,idempotency_key:crypto.randomUUID()};
    await perform(async()=>{await api.request<Member>(`/api/v1/rooms/${room.room_id}/me`,input,'PATCH');await refresh();});
  }
  const hasApproval=Boolean(policy?.available&&accepted&&adult);
  const leave=()=>{
    if(!roomId) return;const id=roomId,key=crypto.randomUUID(),rev=room?.room_rev??0;
    void perform(async()=>{await api.request(`/api/v1/rooms/${id}/leave`,{expected_rev:rev,idempotency_key:key});reacceptRequested.current=false;setNeedsReaccept(false);setRoom(null);setPrefs(null);setRoomId(null);history.replaceState(null,'','/');setAccepted(false);setAdult(false);});
  };
  const entryPanel=(<section className="entry-policy" aria-labelledby="entry-policy-title"><h2 id="entry-policy-title">{t.entryPolicy}</h2>
        {!policy?<p role="status">{t.checking}</p>:!policy.available?<p className="notice" data-testid="policy-unavailable">{t.policyUnavailable}</p>:<>
          {policy.offer?.synthetic?<p className="notice">{t.syntheticNotice}</p>:null}
          <article className="offer"><h3>{t.offerTitle} · {policy.offer?.version}</h3><p>{policy.offer?.text[locale]}</p></article>
          <label className="check"><input data-testid="accept-offer" type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/>{t.acceptOffer}</label>
          <label className="check"><input data-testid="adult18" type="checkbox" checked={adult} onChange={e=>setAdult(e.target.checked)}/>{t.adultDeclaration}</label>
          {roomId?<button data-testid="reaccept-room" disabled={!hasApproval||busy} onClick={()=>{if(!policy) return;void perform(async()=>{await api.request(`/api/v1/rooms/${roomId}/me/entry-acceptance`,acceptance(policy));await refresh();reacceptRequested.current=false;setNeedsReaccept(false);setConnectionEpoch(v=>v+1);});}}>{t.acceptOffer}</button>:null}
        </>}
      </section>);
  return <main>
    <nav aria-label={t.language}><a className="brand" href="/">venus<span aria-hidden="true">✦</span></a>
      <div className="languages">{locales.map(value=><button key={value} lang={value} aria-pressed={locale===value} onClick={()=>{void chooseLocale(value);}}>{{ru:'Русский',en:'English',tr:'Türkçe'}[value]}</button>)}</div>
    </nav>
    {error?<section className="notice error" role="alert" data-testid="error-message"><p>{message(t,error)}</p>
      <button data-testid="retry-action" onClick={()=>{void perform(async()=>{if(error instanceof ApiError&&error.code==='REVISION_CONFLICT') await refresh();else if(retry) await retry();else if(roomId) await refresh();else setPolicy(await api.bootstrap());if(roomId) setConnectionEpoch(v=>v+1);});}}>{t.retry}</button>
      {roomId?<button onClick={leave} data-testid="leave-room-error">{t.leaveRoom}</button>:null}
    </section>:null}
    {room&&prefs&&needsReaccept?entryPanel:null}
    {room&&prefs?<RoomShell api={api} room={room} prefs={prefs} t={t} locale={locale} busy={busy} connectionEpoch={connectionEpoch} perform={perform} refresh={refresh} onSnapshot={view=>setRoom(old=>nextSnapshot(old,view))} onError={e=>{void handleError(e);}} leave={leave} onClosed={()=>{setRoom(null);setPrefs(null);setRoomId(null);history.replaceState(null,'','/');setError(new ApiError('ROOM_CLOSED'));}}/>:
    <>
      <section className="intro"><p className="eyebrow">{t.tagline}</p><h1>{t.title}</h1><p className="description">{t.description}</p><p className="stage">{t.stage}</p></section>
      {entryPanel}
      <div className="entry-grid">
        <form onSubmit={event=>{event.preventDefault();if(!hasApproval||!policy) return;const input={name,locale,meeting_context:context,idempotency_key:crypto.randomUUID(),entry_acceptance:acceptance(policy)};void perform(async()=>{const result=await api.request<CreateResult>('/api/v1/rooms',input);enter(undefined,result.room_id);});}}>
          <h2>{t.createRoom}</h2><label>{t.yourName}<input data-testid="create-name" autoComplete="off" value={name} onChange={e=>setName(e.target.value)} required maxLength={192}/></label>
          <label>{t.meetingContext}<select value={context} onChange={e=>setContext(e.target.value as 'online'|'in_person')}><option value="online">{t.online}</option><option value="in_person">{t.inPerson}</option></select></label>
          <button className="primary" data-testid="create-room" disabled={!hasApproval||busy}>{busy?t.saving:t.createRoom}</button>
        </form>
        <form onSubmit={event=>{event.preventDefault();if(!hasApproval||!policy) return;const key=crypto.randomUUID();void perform(async()=>{const token=inviteToken(invite);const resolution=await api.request<InviteResolution>('/api/v1/invitations/resolve',{invite_token:token,entry_acceptance:acceptance(policy)});if(resolution.availability!=='joinable') throw new ApiError(resolution.availability==='full'?'ROOM_FULL':'INVITE_EXPIRED');const result=await api.request<JoinResult>(`/api/v1/rooms/${resolution.room_id}/join`,{invite_token:token,locale,display_name:name,idempotency_key:key,entry_acceptance:acceptance(policy)});enter(result.room_view,resolution.room_id);});}}>
          <h2>{t.joinRoom}</h2><label>{t.yourName}<input data-testid="join-name" autoComplete="off" value={name} onChange={e=>setName(e.target.value)} required maxLength={192}/></label>
          <label>{t.inviteLink}<input data-testid="join-invite" autoComplete="off" value={invite} onChange={e=>setInvite(e.target.value)} required/></label>
          <button className="primary" data-testid="join-room" disabled={!hasApproval||busy}>{busy?t.saving:t.joinRoom}</button>
        </form>
      </div>
    </>}
    <footer>Venus · {t.developmentNotice}</footer>
  </main>;
}
const root=document.getElementById('root');if(root) createRoot(root).render(<App/>);
