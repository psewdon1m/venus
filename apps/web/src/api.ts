import type {RoomView,EntryAcceptance} from '@venus/contracts';
export interface EntryPolicy {available:boolean;offer:null|{version:string;digest:string;text:Record<'ru'|'en'|'tr',string>;synthetic:boolean};csrf_token:string}
export class ApiError extends Error {readonly status?:number;constructor(readonly code:string,status?:number) {super(code);if(status!==undefined)this.status=status;}}
export class SessionApi {
  admissionCsrf='';private roomCsrf=new Map<string,string>();
  async request<T>(path:string,body?:unknown,method=body===undefined?'GET':'POST'):Promise<T> {
    const room=path.match(/^\/api\/v[12]\/rooms\/([a-f0-9-]{36})/i)?.[1];
    const publicAction=/^\/api\/v[12]\/rooms$/.test(path)||path==='/api/v1/invitations/resolve'||/^\/api\/v[12]\/rooms\/[a-f0-9-]{36}\/join$/i.test(path);
    let response:Response;
    try {response=await fetch(path,{method,credentials:'same-origin',signal:AbortSignal.timeout(8000),headers:body===undefined?(room?{'x-csrf-token':this.roomCsrf.get(room)??''}:{}):{'content-type':'application/json','x-csrf-token':publicAction?this.admissionCsrf:this.roomCsrf.get(room??'')??''},...(body===undefined?{}:{body:JSON.stringify(body)})});}
    catch {throw new ApiError('SERVICE_UNAVAILABLE');}
    let result:unknown;try {result=await response.json();} catch {throw new ApiError('SERVICE_UNAVAILABLE');}
    if(!response.ok) throw new ApiError(result&&typeof result==='object'&&'code' in result&&typeof result.code==='string'?result.code:'SERVICE_UNAVAILABLE',response.status);
    const csrf=response.headers.get('x-csrf-token');
    if(csrf) {const id=room??(result&&typeof result==='object'&&'room_id' in result?String(result.room_id):'');this.roomCsrf.set(id,csrf);}
    return result as T;
  }
  /** Presentation bodies never enter JSON serialization or browser persistence. */
  private async presentationTransfer<T>(path:string,init:RequestInit,signal:AbortSignal|undefined,timeout:number,read:(response:Response)=>Promise<T>):Promise<T> {
    const room=path.match(/^\/api\/v1\/rooms\/([a-f0-9-]{36})\/presentations(?:\/|\?|$)/i)?.[1];
    if(!room)throw new ApiError('INVALID_REQUEST');
    const controller=new AbortController(),abort=()=>controller.abort(),timer=setTimeout(abort,timeout);
    if(signal?.aborted)controller.abort();else signal?.addEventListener('abort',abort,{once:true});
    try {
      const headers=new Headers(init.headers);headers.set('x-csrf-token',this.roomCsrf.get(room)??'');
      const response=await fetch(path,{...init,credentials:'same-origin',cache:'no-store',redirect:'error',signal:controller.signal,headers});
      if(!response.ok){let value:unknown;try{value=await response.json();}catch{/* Do not expose raw proxy/parser errors. */}throw new ApiError(value&&typeof value==='object'&&'code'in value&&typeof value.code==='string'?value.code:'SERVICE_UNAVAILABLE',response.status);}
      const csrf=response.headers.get('x-csrf-token');if(csrf)this.roomCsrf.set(room,csrf);
      return await read(response);
    }catch(error){if(error instanceof ApiError)throw error;throw new ApiError(signal?.aborted?'REQUEST_ABORTED':'SERVICE_UNAVAILABLE');}
    finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  }
  upload<T>(path:string,source:Blob,sha256:string,signal?:AbortSignal):Promise<T> {
    if(source.size<1||source.size>16*1024*1024)return Promise.reject(new ApiError('PRESENTATION_LIMITS'));
    if(!/^[a-f0-9]{64}$/.test(sha256))return Promise.reject(new ApiError('INVALID_REQUEST'));
    return this.presentationTransfer(path,{method:'PUT',headers:{'content-type':'application/pdf','x-content-sha256':sha256},body:source},signal,60000,response=>response.json() as Promise<T>);
  }
  binary(path:string,signal?:AbortSignal):Promise<Blob> {
    return this.presentationTransfer(path,{method:'GET'},signal,8000,async response=>{
      const maximum=4*1024*1024,length=response.headers.get('content-length');
      if(response.headers.get('content-type')?.split(';')[0]?.trim()!=='image/png'||length!==null&&(!/^\d+$/.test(length)||Number(length)>maximum))throw new ApiError('PRESENTATION_PAGE_UNAVAILABLE');
      if(!response.body)throw new ApiError('PRESENTATION_PAGE_UNAVAILABLE');
      const reader=response.body.getReader(),chunks:ArrayBuffer[]=[];let bytes=0,complete=false;
      try{for(;;){const next=await reader.read();if(next.done)break;bytes+=next.value.byteLength;if(bytes>maximum)throw new ApiError('PRESENTATION_LIMITS');chunks.push(next.value.slice().buffer as ArrayBuffer);}if(bytes<8)throw new ApiError('PRESENTATION_PAGE_UNAVAILABLE');complete=true;return new Blob(chunks,{type:'image/png'});}
      finally{if(!complete)await reader.cancel().catch(()=>{});reader.releaseLock();}
    });
  }
  async creationPath():Promise<'/api/v1/rooms'|'/api/v2/rooms'> {
    const value=await this.request<unknown>('/api/v1/runtime-capabilities');
    if(!value||typeof value!=='object'||Object.keys(value).sort().join(',')!=='room_creation_protocol,schema_version'||!('schema_version' in value)||value.schema_version!==1||!('room_creation_protocol' in value)||!(value.room_creation_protocol===1||value.room_creation_protocol===2)) throw new ApiError('SERVICE_UNAVAILABLE');
    return value.room_creation_protocol===2?'/api/v2/rooms':'/api/v1/rooms';
  }
  async bootstrap() {const result=await this.request<EntryPolicy>('/api/v1/entry-policy');this.admissionCsrf=result.csrf_token;return result;}
}
export function acceptance(policy:EntryPolicy):EntryAcceptance {
  if(!policy.offer) throw new ApiError('ENTRY_POLICY_UNAVAILABLE');
  return {offer_version:policy.offer.version,offer_digest:policy.offer.digest,accept_offer:true,adult18:true};
}
export function inviteToken(value:string) {
  if(/^[A-Za-z0-9_-]{43}$/.test(value.trim())) return value.trim();
  try {const url=new URL(value);if(url.origin===location.origin) {const invite=new URLSearchParams(url.hash.slice(1)).get('invite');if(invite&&/^[A-Za-z0-9_-]{43}$/.test(invite)) return invite;}} catch { /* Return only a safe localized error. */ }
  throw new ApiError('INVITE_INVALID');
}
export function nextSnapshot(current:RoomView|null,frame:unknown):RoomView|null {
  if(!frame||typeof frame!=='object') return current;
  const e=frame as Record<string,unknown>;
  if(e.type!=='room.snapshot'||e.schema!==1||e.stream!=='room'||e.audience!=='room'||!Number.isSafeInteger(e.room_rev)||!Number.isSafeInteger(e.stream_rev)||e.room_rev!==e.stream_rev||typeof e.room_rev!=='number'||e.room_rev<0||!e.payload||typeof e.payload!=='object') return current;
  const view=e.payload as RoomView;
  if(view.room_id!==e.room_id||view.room_rev!==e.room_rev||!Array.isArray(view.members)||view.members.length>8) return current;
  if(current&&(view.room_id!==current.room_id||view.room_rev<=current.room_rev)) return current;
  return view;
}
