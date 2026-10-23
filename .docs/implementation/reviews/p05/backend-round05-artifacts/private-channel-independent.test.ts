import {describe,it,expect,vi} from 'vitest';
import {Games} from '../../apps/api/src/games.js';
import {Keyring,DomainError} from '../../apps/api/src/security.js';
import {proposeConsent,consentResponse} from '../../packages/relationship-engine/src/consent.js';
import type {Rooms} from '../../apps/api/src/rooms.js';
import type pg from 'pg';
function fixture({context='online',enabled=true,caps=true,grant=true}:{context?:'online'|'in_person';enabled?:boolean;caps?:boolean;grant?:boolean}={}){
 let now=1000,afterRead=1000;const keys=new Keyring('test',{test:Buffer.alloc(32,31).toString('base64')});
 const game={id:'game',room_id:'room',state:'active',rev:'1',current_round:1,snapshot_cipher:keys.encrypt({context,capabilities:caps?['private_text_chat']:[]},'game-snapshot:room:game:1')};
 let invite=proposeConsent('invitation',['a','b'],'invitation',0);for(const id of ['a','b'])invite=consentResponse(invite,id,'accept',0,{offer_id:'invitation',scope:'invitation',proposal_revision:1});
 const data={plan:{round_id:'round',round_index:1,interaction:'pair_private',actors:['a','b'],primary_member_id:'a',mode:'yes_but',requires_action_consent:true,card_id:'YB-1101',card_revision:1},state:'pending',invitation:invite,action:proposeConsent('action',['a','b'],'action',0,180000),choice:null,condition:{round_id:'round',author_member_id:'b',condition:'SYNTHETIC-CHANNEL-CONDITION',request_id:'req',proposal_revision:1}};
 let saved:unknown;const query=vi.fn(async(sql:string,args:unknown[]=[])=>{
  if(sql.startsWith('SELECT event_id,stream_rev,session_id'))return {rows:[{event_id:'event',stream_rev:'1',session_id:'game',round_id:'round',game_rev:game.rev,kind:'condition'}]};
  if(sql.startsWith('UPDATE game_rounds'))saved=keys.decrypt(args[2] as any,'game-round:room:game:round:1');
  if(sql.startsWith('UPDATE game_sessions'))return {rows:[{...game,rev:'2'}]};
  if(sql.startsWith('INSERT INTO game_private_streams'))return {rows:[{rev:'1'}]};
  return {rows:[],rowCount:0};
 });const db={query} as unknown as pg.PoolClient;
 const rooms={options:{keys},now:()=>now,changed:vi.fn(async()=>{}),audit:vi.fn(async()=>{}),boundEvents:vi.fn(async()=>{}),access:vi.fn(async()=>({member:{id:'a',slot:1,locale:'en'}})),transaction:async(fn:Function)=>fn(db)} as unknown as Rooms;
 const games=new Games(rooms,()=>null,true,enabled,true),a=games as any;
 a.row=vi.fn(async()=>game);a.requireGame=vi.fn(async()=>game);a.current=vi.fn(async()=>({row:{id:'round',state:data.state},data}));
 a.snapshot=vi.fn(async()=>({snapshot:{context,capabilities:caps?['private_text_chat']:[]}}));
 a.names=vi.fn(async()=>{now=afterRead;return [{id:'a',display_name:'A'},{id:'b',display_name:'B'}];});a.pack=vi.fn(async()=>({}));
 if(grant)a.chat?.register('room','game','round');query.mockClear();const enqueue=vi.fn();
 return {games,a,game,data,keys,db,query,enqueue,saved:()=>saved,setAfterRead:(value:number)=>{afterRead=value;},http:()=>games.dispatchHttpTarget('room','session','game','round','condition',enqueue),ws:()=>games.privateDelivery(db,'room','a','en','event')};
}
describe('independent B05-004 channel and readonly projection controls',()=>{
 for(const config of [{label:'cold-no-grant',grant:false},{label:'flag-off',enabled:false},{label:'missing-frozen-capability',caps:false}])it(`withholds all condition transport for ${config.label} without DB mutations`,async()=>{
  const f=fixture(config),before=JSON.stringify([f.game.snapshot_cipher,f.data]);
  await expect(f.http()).rejects.toMatchObject({code:'PRIVATE_CHAT_UNAVAILABLE'});expect(f.enqueue).not.toHaveBeenCalled();
  const event=await f.ws();expect(event?.type).toBe('game.private_cleared');expect(JSON.stringify(event)).not.toContain('SYNTHETIC-CHANNEL-CONDITION');expect(JSON.stringify([f.game.snapshot_cipher,f.data])).toBe(before);expect(f.query.mock.calls.every(([sql])=>sql.startsWith('SELECT'))).toBe(true);
 });
 it('withholds HTTP and WS when grant expires during awaited names read',async()=>{
  for(const kind of ['http','ws'] as const){const f=fixture();f.a.chat.grants.get('round').until=1500;f.setAfterRead(2000);if(kind==='http')await expect(f.http()).rejects.toMatchObject({code:'PRIVATE_CHAT_UNAVAILABLE'});else expect((await f.ws())?.type).toBe('game.private_cleared');expect(f.enqueue).not.toHaveBeenCalled();expect(f.query.mock.calls.every(([sql])=>sql.startsWith('SELECT'))).toBe(true);}
 });
 it('retains in-person private conditions while online chat is disabled',async()=>{
  const f=fixture({context:'in_person',enabled:false,caps:false,grant:false});await f.http();expect(f.enqueue.mock.calls[0]![0].condition).toBe('SYNTHETIC-CHANNEL-CONDITION');expect((await f.ws())?.type).toBe('game.pair_condition');expect(f.query.mock.calls.every(([sql])=>sql.startsWith('SELECT'))).toBe(true);
 });
 for(const enabled of [true,false])it(`safely stops unavailable online moment with flag ${enabled} despite unavailable catalogue and never registers its old grant`,async()=>{
  const f=fixture({enabled,grant:false}),before=JSON.stringify(f.game.snapshot_cipher);f.a.snapshot.mockRejectedValue(new DomainError('CATALOG_LEDGER_UNAVAILABLE',503));f.a.pack.mockRejectedValue(new DomainError('CATALOG_LEDGER_UNAVAILABLE',503));
  const register=f.a.chat?vi.spyOn(f.a.chat,'register'):null;await f.a.reconcile(f.db,f.game);
  expect(f.saved()).toMatchObject({state:'stopped',invitation:{state:'stopped',acks:[]},action:{state:'stopped',acks:[]},condition:null});expect(JSON.stringify(f.game.snapshot_cipher)).toBe(before);expect(f.a.snapshot).not.toHaveBeenCalled();expect(f.a.pack).not.toHaveBeenCalled();if(register)expect(register).not.toHaveBeenCalled();expect(f.query.mock.calls.some(([sql])=>sql.startsWith('DELETE FROM private_chat_scopes'))).toBe(true);
 });
 it('does not spend any chat-grant capacity when creating an in-person private round',async()=>{
  const f=fixture({context:'in_person',caps:false,grant:false});const register=vi.spyOn(f.a.chat,'register');await f.a.newRound(f.db,f.game,{...f.data.plan,round_id:'next-round',round_index:2});if(register)expect(register).not.toHaveBeenCalled();expect(f.a.chat.grants.size).toBe(0);
 });
 it('does not trust a matching plaintext shape encrypted with the wrong snapshot AAD',async()=>{
  const f=fixture();f.game.snapshot_cipher=f.keys.encrypt({context:'in_person',capabilities:[]},'game-snapshot:other-room:game:1');await expect(f.http()).rejects.toMatchObject({code:'PRIVATE_CHAT_UNAVAILABLE'});expect(f.enqueue).not.toHaveBeenCalled();expect(f.query).not.toHaveBeenCalled();
 });
});
