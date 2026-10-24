import {describe,it,expect,vi} from 'vitest';
import {randomUUID} from 'node:crypto';
import {createApp} from './app.js';
import type {Rooms} from './rooms.js';
import type {Games} from './games.js';
import type {PrivateChatView,PrivateChatReceipt} from '@venus/contracts';

const room=randomUUID(),game=randomUUID(),round=randomUUID(),path=`/api/v1/rooms/${room}/game/${game}/round/${round}/chat`;
async function fixture() {
  const view:PrivateChatView={session_id:game,round_id:round,chat_rev:0,expires_at:new Date(Date.now()+10000).toISOString(),messages:[]};
  const receipt:PrivateChatReceipt={request_id:randomUUID(),message_id:randomUUID(),chat_rev:1,expires_at:view.expires_at};
  const rooms={options:{origin:'https://localhost'},csrf:()=> 'csrf',rateLimit:vi.fn(async()=>{})} as unknown as Rooms;
  const dispatch=vi.fn(async(_room:string,_session:unknown,_game:string,_round:string,enqueue:(view:PrivateChatView)=>void)=>enqueue(view));
  const send=vi.fn(async()=>receipt);
  const games={dispatchHttpChat:dispatch,sendChat:send,dispatchChatReceipt:vi.fn(async(_room:unknown,_session:unknown,_game:unknown,_round:unknown,value:PrivateChatReceipt,enqueue:(value:PrivateChatReceipt)=>void)=>enqueue(value))} as unknown as Games;
  const app=await createApp({rooms,games,logger:false,probe:async()=>{},version:{service:'venus',version:'test',source_revision:'test',image_digest:'test',contract_revision:'P00-2'}});
  return {app,dispatch,send};
}
describe('private chat HTTP browser guards',()=>{
  it('allows actual same-origin browser GET without Origin using explicit CSRF; response no-store',async()=>{
    const {app,dispatch}=await fixture();try {
      const response=await app.inject({url:path,headers:{cookie:'venus_room_session=session','x-csrf-token':'csrf','sec-fetch-site':'same-origin'}});
      expect(response.statusCode).toBe(200);expect(dispatch).toHaveBeenCalledOnce();expect(response.headers['cache-control']).toBe('no-store');
      expect(response.json().messages).toEqual([]);
    } finally {await app.close();}
  });
  for(const headers of [
    {cookie:'venus_room_session=session'},
    {cookie:'venus_room_session=session','x-csrf-token':'wrong'},
    {cookie:'venus_room_session=session','x-csrf-token':'csrf',origin:'https://evil.test'},
    {cookie:'venus_room_session=session','x-csrf-token':'csrf','sec-fetch-site':'cross-site'},
    {cookie:'venus_room_session=session','x-csrf-token':'csrf','sec-fetch-site':'same-site'},
    {cookie:'venus_room_session=session; venus_room_session=other','x-csrf-token':'csrf'}
  ]) it(`rejects invalid GET guard ${JSON.stringify(headers)}`,async()=>{
    const {app,dispatch}=await fixture();try {
      const response=await app.inject({url:path,headers});expect(response.statusCode).toBeGreaterThanOrEqual(400);expect(dispatch).not.toHaveBeenCalled();
    } finally {await app.close();}
  });
  it('requires POST Origin, validates exact input and prevents message/query reflection',async()=>{
    const {app,send}=await fixture();try {
      const headers={cookie:'venus_room_session=session','x-csrf-token':'csrf'};
      expect((await app.inject({method:'POST',url:path,headers,payload:{request_id:randomUUID(),text:'secret'}})).statusCode).toBe(403);
      const invalid=await app.inject({method:'POST',url:path,headers:{...headers,origin:'https://localhost'},payload:{request_id:randomUUID(),text:'secret',extra:true}});
      expect(invalid.statusCode).toBe(400);expect(invalid.body).not.toContain('secret');expect(send).not.toHaveBeenCalled();
      const query=await app.inject({url:path+'?text=secret',headers});expect(query.statusCode).toBe(400);expect(query.body).not.toContain('secret');
      const valid=await app.inject({method:'POST',url:path,headers:{...headers,origin:'https://localhost'},payload:{request_id:randomUUID(),text:'secret'}});
      expect(valid.statusCode).toBe(200);expect(send).toHaveBeenCalledOnce();expect(valid.body).not.toContain('secret');
    } finally {await app.close();}
  });
});
