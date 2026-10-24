import {describe,it,expect,vi} from 'vitest';
import {Games} from '../../apps/api/src/games.js';
import {Keyring} from '../../apps/api/src/security.js';
import {proposeConsent,consentResponse} from '../../packages/relationship-engine/src/consent.js';
import type {Rooms} from '../../apps/api/src/rooms.js';
import type pg from 'pg';
function fixture(afterMessageRead:number){
 let now=1000;const keys=new Keyring('test',{test:Buffer.alloc(32,19).toString('base64')});
 let invitation=proposeConsent('offer',['a','b'],'invitation',0);for(const actor of ['a','b'])invitation=consentResponse(invitation,actor,'accept',0,{offer_id:'offer',scope:'invitation',proposal_revision:1});
 const members=['a','b'].map(id=>({id,slot:1,presence:'online',removed_at:null,heartbeat_at:new Date(0),reserved_until:new Date(90000),offer_version:'mock',offer_digest:'digest',session_expiry:new Date(90000)}));
 const cipher=keys.encrypt({text:'PRIVATE-FINAL-FENCE'},'private-chat:room:game:round:message:1');
 const query=vi.fn(async(sql:string)=>{
  if(sql.includes('SELECT m.id,m.slot'))return {rows:members};
  if(sql.includes('SELECT expires_at FROM room_sessions'))return {rows:[{expires_at:new Date(90000)}]};
  if(sql.startsWith('SELECT rev,expires_at'))return {rows:[{rev:'1',expires_at:new Date(180000),last_sent_at:new Date(1000)}]};
  if(sql.startsWith('SELECT message_id')){now=afterMessageRead;return {rows:[{message_id:'message',member_id:'b',cipher,sent_at:new Date(1000),expires_at:new Date(5000)}]};}
  throw Error('Unexpected isolated query');
 });
 const db={query} as unknown as pg.PoolClient;
 const rooms={options:{keys,offer:()=>({version:'mock',digest:'digest'})},now:()=>now,access:vi.fn(async()=>({member:{id:'a',slot:1,presence:'online'},room:{meeting_context:'online',last_activity_at:new Date(0)},sessionHash:'session'})),transaction:async(fn:Function)=>fn(db)} as unknown as Rooms;
 const games=new Games(rooms,()=>null,true,true,true),a=games as unknown as Record<string,unknown>;
 const game={id:'game',state:'active'};a.requireGame=vi.fn(async()=>game);a.row=vi.fn(async()=>game);a.current=vi.fn(async()=>({row:{id:'round'},data:{plan:{interaction:'pair_private',actors:['a','b']},state:'pending',invitation,action:null}}));a.snapshot=vi.fn(async()=>({snapshot:{context:'online',capabilities:['private_text_chat']}}));
 (a.chat as {register:Function}).register('room','game','round');now=2000;const enqueue=vi.fn();
 return {enqueue,run:()=>games.dispatchHttpChat('room','session','game','round',enqueue)};
}
describe('actual whole Games chat final fence after awaited ciphertext read',()=>{
 it('delivers normally under a stable clock',async()=>{const f=fixture(2000);await f.run();expect(f.enqueue.mock.calls[0]![0].messages[0].text).toBe('PRIVATE-FINAL-FENCE');});
 for(const [label,clock] of [['backward',1500],['expired',180000]] as const)it(`never enqueues when clock becomes ${label} during message query`,async()=>{const f=fixture(clock);await expect(f.run()).rejects.toMatchObject({code:label==='backward'?'PRIVATE_CHAT_TIME_INVALID':'PRIVATE_CHAT_UNAVAILABLE'});expect(f.enqueue).not.toHaveBeenCalled();});
});
