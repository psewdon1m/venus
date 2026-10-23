import {describe,it,expect,vi} from 'vitest';
import type pg from 'pg';
import {proposeConsent,consentResponse} from '@venus/relationship-engine';
import {Games} from './games.js';
import {Keyring} from './security.js';
import type {Rooms} from './rooms.js';
import type {PrivateChat} from './private-chat.js';

function fixture() {
  let now=1000;const offer={version:'mock',digest:'digest'};
  const keys=new Keyring('test',{test:Buffer.alloc(32,8).toString('base64')});
  let invitation=proposeConsent('offer',['a','b'],'invitation',0);
  for(const actor of ['a','b']) invitation=consentResponse(invitation,actor,'accept',0,{offer_id:'offer',scope:'invitation',proposal_revision:1});
  const auth={member:{id:'a',slot:1,presence:'online'},room:{meeting_context:'online',last_activity_at:new Date(0)},sessionHash:'session-hash'};
  const members=['a','b'].map(id=>({id,slot:1,presence:'online',removed_at:null,heartbeat_at:new Date(0),reserved_until:new Date(90000),offer_version:'mock',offer_digest:'digest',session_expiry:new Date(90000)}));
  const own={expires_at:new Date(90000)};
  const query=vi.fn(async(sql:string)=>({rows:sql.includes('SELECT m.id,m.slot')?members:sql.includes('SELECT expires_at FROM room_sessions')?[own]:[]}));
  const rooms={options:{keys,offer:()=>offer},now:()=>now,access:vi.fn(async()=>auth),transaction:async(fn:(c:pg.PoolClient)=>Promise<unknown>)=>fn({query} as unknown as pg.PoolClient)} as unknown as Rooms;
  const games=new Games(rooms,()=>null,true,true),adapters=games as unknown as Record<string,unknown>;
  const game={id:'game',state:'active'},data={plan:{interaction:'pair_private',actors:['a','b']},state:'pending',invitation,action:null};
  const snapshot={context:'online',capabilities:['private_text_chat']};
  adapters.row=vi.fn(async()=>game);adapters.requireGame=vi.fn(async()=>game);adapters.current=vi.fn(async()=>({row:{id:'round'},data}));adapters.snapshot=vi.fn(async()=>({snapshot}));
  const chat=adapters.chat as PrivateChat;chat.register('room','game','round');
  const view={session_id:'game',round_id:'round',chat_rev:1,expires_at:new Date(3000).toISOString(),messages:[{message_id:'message',sender_member_id:'b',text:'private',sent_at:new Date(0).toISOString(),expires_at:new Date(2000).toISOString()}]};
  const read=vi.spyOn(chat,'view').mockImplementation(async()=>view);
  const enqueue=vi.fn();
  return {games,data,auth,members,own,snapshot,game,read,enqueue,chat,setClock:(value:number)=>{now=value;},send:()=>games.dispatchHttpChat('room','session','game','round',enqueue)};
}
describe('private pair chat final ACL and clock fence',()=>{
  it('delivers only after both invitation acknowledgements, with no game revision change',async()=>{
    const f=fixture();await f.send();expect(f.enqueue).toHaveBeenCalledOnce();expect(f.enqueue.mock.calls[0]![0].messages[0].text).toBe('private');
  });
  for(const change of ['host','single-ack','public-pair','offline-context','missing-capability','removed-partner','slotless-partner','offline-partner','old-acceptance','expired-partner-session','expired-own-session','inactive-game','revoked-volatile-grant'] as const) it(`rejects ${change} before private storage read`,async()=>{
    const f=fixture();
    if(change==='host') f.auth.member.id='host';
    if(change==='single-ack') f.data.invitation={...f.data.invitation,acks:['a']};
    if(change==='public-pair') f.data.plan.interaction='pair_public';
    if(change==='offline-context') f.snapshot.context='in_person';
    if(change==='missing-capability') f.snapshot.capabilities=[];
    if(change==='removed-partner') f.members[1]!.removed_at=new Date(0) as never;
    if(change==='slotless-partner') f.members[1]!.slot=null as never;
    if(change==='offline-partner') f.members[1]!.presence='reconnecting';
    if(change==='old-acceptance') f.members[1]!.offer_digest='old';
    if(change==='expired-partner-session') f.members[1]!.session_expiry=new Date(1000);
    if(change==='expired-own-session') f.own.expires_at=new Date(1000);
    if(change==='inactive-game') f.game.state='paused';
    if(change==='revoked-volatile-grant') await f.chat.revoke({query:vi.fn(async()=>({rows:[]}))} as unknown as pg.PoolClient,'room','round');
    await expect(f.send()).rejects.toMatchObject({code:'PRIVATE_CHAT_UNAVAILABLE'});expect(f.enqueue).not.toHaveBeenCalled();expect(f.read).not.toHaveBeenCalled();
  });
  it('expiry crossing during awaited message read never enqueues content',async()=>{
    const f=fixture();f.read.mockImplementation(async()=>{f.setClock(180000);return {session_id:'game',round_id:'round',chat_rev:0,expires_at:new Date(181000).toISOString(),messages:[]};});
    await expect(f.send()).rejects.toMatchObject({code:'PRIVATE_CHAT_UNAVAILABLE'});expect(f.enqueue).not.toHaveBeenCalled();
  });
  it('messages expiring during persistence reads are filtered at synchronous dispatch',async()=>{
    const f=fixture();const view=await f.read();f.read.mockImplementation(async()=>{f.setClock(2000);return view;});
    await f.send();expect(f.enqueue.mock.calls[0]![0].messages).toEqual([]);
  });
});
