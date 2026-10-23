import {describe,it,expect,vi} from 'vitest';
import type pg from 'pg';
import {proposeConsent,consentResponse,type RoundPlan} from '@venus/relationship-engine';
import {Games} from './games.js';
import {Keyring,DomainError,type Cipher} from './security.js';
import type {Rooms} from './rooms.js';
import type {PrivateChat} from './private-chat.js';
import type {GameRow,RoundData,RoundRow} from './games-model.js';

interface Adapters {
  chat:PrivateChat|undefined;
  privateChannelAvailable:(game:GameRow,data:RoundData)=>boolean;
  reconcile:(c:pg.PoolClient,game:GameRow)=>Promise<unknown>;
  newRound:(c:pg.PoolClient,game:GameRow,plan:RoundPlan)=>Promise<RoundData>;
  current:unknown;row:unknown;requireGame:unknown;snapshot:unknown;pack:unknown;names:unknown;
}
function fixture({context='online',enabled=true,capability=true}:{context?:'online'|'in_person';enabled?:boolean;capability?:boolean}={}) {
  let now=1000;const keys=new Keyring('test',{test:Buffer.alloc(32,9).toString('base64')});
  const rooms={options:{keys},now:()=>now,changed:vi.fn(async()=>{}),audit:vi.fn(async()=>{}),boundEvents:vi.fn(async()=>{}),access:vi.fn(async()=>({member:{id:'a',slot:1,locale:'en'}})),transaction:async(fn:(c:pg.PoolClient)=>Promise<unknown>)=>fn(c)} as unknown as Rooms;
  const games=new Games(rooms,()=>null,true,enabled),adapters=games as unknown as Adapters;
  const cipher=keys.encrypt({context,capabilities:capability?['private_text_chat']:[]},'game-snapshot:room:game:1');
  const game={id:'game',room_id:'room',state:'active',rev:'1',snapshot_cipher:cipher,current_round:1} as GameRow;
  const plan={round_id:'round',round_index:1,actors:['a','b'],primary_member_id:'a',interaction:'pair_private',mode:'questions',card_id:'Q-1102',card_revision:1,requires_action_consent:true,stage:3,pack_digest:'pack',policy_digest:'policy'} as RoundPlan;
  let invitation=proposeConsent('invite',['a','b'],'invitation',0);
  for(const actor of ['a','b'])invitation=consentResponse(invitation,actor,'accept',0,{offer_id:'invite',scope:'invitation',proposal_revision:1});
  const action=proposeConsent('action',['a','b'],'action',0,180000);
  const data:RoundData={plan,state:'pending',invitation,action,choice:null,condition:{round_id:'round',author_member_id:'b',condition:'PRIVATE CONDITION',request_id:'condition',proposal_revision:1}};
  const round={row:{id:'round',room_id:'room',session_id:'game',round_index:1,state:'pending'} as RoundRow,data};
  let persisted:RoundData|null=null;
  const query=vi.fn(async(sql:string,params:unknown[]=[])=>{
    if(sql.startsWith('UPDATE game_rounds'))persisted=keys.decrypt<RoundData>(params[2] as Cipher,'game-round:room:game:round:1');
    if(sql.startsWith('UPDATE game_sessions'))return {rows:[{...game,rev:String(Number(game.rev)+1)}]};
    if(sql.startsWith('INSERT INTO game_private_streams'))return {rows:[{rev:'1'}]};
    if(sql.startsWith('SELECT event_id,stream_rev,session_id'))return {rows:[{event_id:'event',stream_rev:'1',session_id:'game',round_id:'round',game_rev:game.rev,kind:'condition'}]};
    return {rows:[],rowCount:0};
  });
  const c={query} as unknown as pg.PoolClient;
  adapters.current=vi.fn(async()=>round);adapters.row=vi.fn(async()=>game);adapters.requireGame=vi.fn(async()=>game);
  const snapshot=vi.fn(async()=>({snapshot:{context,capabilities:capability?['private_text_chat']:[]}}));adapters.snapshot=snapshot;
  const names=vi.fn(async()=>[{id:'a',display_name:'A'},{id:'b',display_name:'B'}]);adapters.names=names;
  const pack=vi.fn(async()=>({}));adapters.pack=pack;
  adapters.chat?.register('room','game','round');
  return {games,adapters,game,data,round,c,query,keys,cipher,snapshot,names,pack,setClock:(value:number)=>{now=value;},persisted:()=>persisted};
}

describe('B05-004 private prompt requires its actual current channel',()=>{
  it('permits a current online grant, but never recovers it from restored authenticated bytes',async()=>{
    const f=fixture();expect(f.adapters.privateChannelAvailable(f.game,f.data)).toBe(true);
    await f.adapters.chat!.revoke(f.c,'room','round');expect(f.adapters.privateChannelAvailable(f.game,f.data)).toBe(false);
    const cold=fixture();cold.game.snapshot_cipher=f.cipher;
    await cold.adapters.chat!.revoke(cold.c,'room','round');expect(cold.adapters.privateChannelAvailable(cold.game,cold.data)).toBe(false);
  });
  it('rejects flag-off and no-capability online snapshots even in synthetic factories',()=>{
    for(const config of [{enabled:false},{capability:false},{enabled:false,capability:false}]){
      const f=fixture(config);expect(f.adapters.privateChannelAvailable(f.game,f.data)).toBe(false);
    }
  });
  it('keeps legitimate in-person private moments independent of online chat and its capacity',async()=>{
    const f=fixture({context:'in_person',enabled:false,capability:false});
    expect(f.adapters.privateChannelAvailable(f.game,f.data)).toBe(true);await f.adapters.reconcile(f.c,f.game);
    expect(f.data.state).toBe('pending');expect(f.persisted()).toBe(null);expect(f.query).not.toHaveBeenCalled();
    await f.adapters.newRound(f.c,f.game,{...f.data.plan,round_id:'next-round',round_index:2});
    expect(f.query.mock.calls.some(([sql])=>sql.includes('private_chat_scopes'))).toBe(false);
  });
  it('fails closed for corrupt or wrong-room authenticated snapshots without crashing safety reconciliation',async()=>{
    const f=fixture();f.game.snapshot_cipher=f.keys.encrypt({context:'online',capabilities:['private_text_chat']},'game-snapshot:other:game:1');
    expect(f.adapters.privateChannelAvailable(f.game,f.data)).toBe(false);
    await f.adapters.reconcile(f.c,f.game);expect(f.persisted()?.state).toBe('stopped');
  });
  for(const enabled of [true,false])it(`writes encrypted stopped state and clears every consent/condition without consulting failed catalogue (flag ${enabled})`,async()=>{
    const f=fixture({enabled});if(enabled)await f.adapters.chat!.revoke(f.c,'room','round');
    f.snapshot.mockRejectedValue(new DomainError('CATALOG_LEDGER_REQUIRED',503));f.pack.mockRejectedValue(new DomainError('CATALOG_LEDGER_REQUIRED',503));
    const before=JSON.stringify(f.game.snapshot_cipher);await f.adapters.reconcile(f.c,f.game);
    expect(f.persisted()).toMatchObject({state:'stopped',invitation:{state:'stopped',acks:[]},action:{state:'stopped',acks:[]},condition:null});
    expect(JSON.stringify(f.game.snapshot_cipher)).toBe(before);expect(f.snapshot).not.toHaveBeenCalled();expect(f.pack).not.toHaveBeenCalled();
    expect(f.query.mock.calls.some(([sql])=>sql.startsWith('DELETE FROM private_chat_scopes'))).toBe(true);
    expect(f.query.mock.calls.some(([sql])=>sql.startsWith('UPDATE game_rounds'))).toBe(true);
    if(enabled){
      const next=await f.adapters.newRound(f.c,f.game,{...f.data.plan,round_id:'next-round',round_index:2});
      expect(f.adapters.privateChannelAvailable(f.game,f.data)).toBe(false);expect(f.adapters.privateChannelAvailable(f.game,next)).toBe(true);
    }
  });
  for(const kind of ['invitation','private','action','condition'] as const)it(`HTTP ${kind} cannot enqueue without a working grant and never writes during final projection`,async()=>{
    const f=fixture();await f.adapters.chat!.revoke(f.c,'room','round');f.query.mockClear();const enqueue=vi.fn();
    await expect(f.games.dispatchHttpTarget('room','session','game','round',kind,enqueue)).rejects.toMatchObject({code:'PRIVATE_CHAT_UNAVAILABLE'});
    expect(enqueue).not.toHaveBeenCalled();expect(f.query).not.toHaveBeenCalled();expect(f.snapshot).not.toHaveBeenCalled();
  });
  it('WS condition queued before revocation is a read-only clear',async()=>{
    const f=fixture();await f.adapters.chat!.revoke(f.c,'room','round');f.query.mockClear();
    const event=await f.games.privateDelivery(f.c,'room','a','en','event');expect(event).toMatchObject({type:'game.private_cleared'});
    expect(JSON.stringify(event)).not.toContain('PRIVATE CONDITION');expect(f.query.mock.calls.every(([sql])=>sql.startsWith('SELECT'))).toBe(true);expect(f.snapshot).not.toHaveBeenCalled();
  });
  it('WS rechecks the channel after awaited reads instead of using a stale initial availability result',async()=>{
    const f=fixture();f.names.mockImplementation(async()=>{await f.adapters.chat!.revoke(f.c,'room','round');return [];});
    const event=await f.games.privateDelivery(f.c,'room','a','en','event');expect(event).toMatchObject({type:'game.private_cleared'});expect(JSON.stringify(event)).not.toContain('PRIVATE CONDITION');
  });
  it('HTTP condition rechecks after awaited reads, blocks enqueue and leaves the round/snapshot untouched',async()=>{
    const f=fixture(),enqueue=vi.fn(),before=JSON.stringify(f.game.snapshot_cipher);
    f.names.mockImplementation(async()=>{await f.adapters.chat!.revoke(f.c,'room','round');return [];});
    await expect(f.games.dispatchHttpTarget('room','session','game','round','condition',enqueue)).rejects.toMatchObject({code:'PRIVATE_CHAT_UNAVAILABLE'});
    expect(enqueue).not.toHaveBeenCalled();expect(f.data.state).toBe('pending');expect(JSON.stringify(f.game.snapshot_cipher)).toBe(before);
    expect(f.query.mock.calls.some(([sql])=>sql.startsWith('UPDATE game_')||sql.startsWith('INSERT INTO game_'))).toBe(false);
  });
});
