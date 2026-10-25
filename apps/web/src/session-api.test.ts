import {afterEach,describe,expect,it,vi} from 'vitest';
import {ApiError,SessionApi} from './api.js';
const id='11111111-1111-4111-8111-111111111111';
afterEach(()=>vi.unstubAllGlobals());
describe('room API transport',()=>{
 it('sends room CSRF on authenticated GET including pair chat and keeps credentials same origin',async()=>{
  const calls:{path:string;input:RequestInit}[]=[];
  vi.stubGlobal('fetch',vi.fn(async(path:string,input:RequestInit)=>{calls.push({path,input});return new Response(JSON.stringify(path==='/api/v1/entry-policy'?{csrf_token:'admission'}:{room_id:id}),{status:200,headers:{'content-type':'application/json','x-csrf-token':path==='/api/v1/rooms'?'room-csrf':''}});}));
  const api=new SessionApi();await api.bootstrap();await api.request('/api/v1/rooms',{name:'test'});await api.request(`/api/v1/rooms/${id}/game/session/round/round/chat`);
  expect(calls[1]?.input.headers).toMatchObject({'x-csrf-token':'admission'});expect(calls[2]?.input.headers).toMatchObject({'x-csrf-token':'room-csrf'});expect(calls[2]?.input.credentials).toBe('same-origin');expect(calls[2]?.input.body).toBeUndefined();await api.request(`/api/v1/rooms/${id}/cinema/join`,{expected_rev:2,idempotency_key:'test'});expect(calls[3]?.input.headers).toMatchObject({'x-csrf-token':'room-csrf'});await api.request(`/api/v1/rooms/${id}/join`,{invite_token:'test'});expect(calls[4]?.input.headers).toMatchObject({'x-csrf-token':'admission'});
 });
 it('preserves exact retry request identity and exposes only bounded error codes',async()=>{
  const input={request_id:'fixed-request-id',kind:'stop'};const bodies:string[]=[];
  vi.stubGlobal('fetch',vi.fn(async(_path:string,options:RequestInit)=>{bodies.push(String(options.body));return new Response(JSON.stringify({code:'CONSENT_PROPOSAL_STALE',message:'private detail'}),{status:409});}));
  const api=new SessionApi();for(let n=0;n<2;n++) await expect(api.request(`/api/v1/rooms/${id}/game/stop`,input)).rejects.toEqual(new ApiError('CONSENT_PROPOSAL_STALE',409));expect(bodies).toEqual([JSON.stringify(input),JSON.stringify(input)]);
 });
 it('maps network and malformed response failures to localized service errors',async()=>{
  const api=new SessionApi();vi.stubGlobal('fetch',vi.fn(async()=>{throw new Error('private network detail');}));await expect(api.request('/api/v1/entry-policy')).rejects.toEqual(new ApiError('SERVICE_UNAVAILABLE'));
  vi.stubGlobal('fetch',vi.fn(async()=>new Response('<html>bad gateway</html>',{status:502})));await expect(api.request('/api/v1/entry-policy')).rejects.toEqual(new ApiError('SERVICE_UNAVAILABLE'));
 });
});
