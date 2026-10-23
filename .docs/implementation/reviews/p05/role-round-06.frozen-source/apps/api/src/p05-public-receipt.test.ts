import {describe,it,expect,vi} from 'vitest';
import type pg from 'pg';
import {proposeConsent,consentResponse} from '@venus/relationship-engine';
import {Games} from './games.js';
import type {Rooms} from './rooms.js';
function fixture(current:'different'|'missing'|'revoked'|'paused'|'terminal'|'active'|'expires') {
  let now=1001;const actors=['a','b'];
  let invitation=proposeConsent('offer',actors,'invitation',1000);
  for(const actor of actors) invitation=consentResponse(invitation,actor,'accept',1001,{offer_id:'offer',scope:'invitation',proposal_revision:1});
  const rooms={now:()=>now,access:vi.fn(async()=>({member:{id:'spectator',slot:1}})),transaction:async<T>(operation:(c:pg.PoolClient)=>Promise<T>)=>operation({} as pg.PoolClient)} as unknown as Rooms;
  const games=new Games(rooms,()=>null,true,false,true),adapters=games as unknown as Record<string,unknown>;
  adapters.requireGame=vi.fn(async()=>({id:'session',room_id:'room',state:current==='paused'?'paused':'active'}));
  adapters.pack=vi.fn(async()=>({card:()=>({revision:1,interaction:'pair_public'})}));
  adapters.current=vi.fn(async()=>{
    if(current==='expires') now=invitation.active_until!;
    return current==='missing'?null:{row:{id:current==='different'?'new-round':'old-round'},data:{state:current==='terminal'?'stopped':'active',plan:{card_id:'Q-1001',card_revision:1,interaction:'pair_public',actors},invitation:current==='revoked'?{...invitation,acks:[],state:'stopped'}:invitation}};
  });
  const receipt={session_id:'session',game_rev:7,state:'active',mode:'questions',total_rounds:20,pause_reason:null,current_round:{kind:'public',round_id:'old-round',round_index:1,state:'active',card_id:'Q-1001',card_revision:1,actors,text:{question:'OLD-CONSENTED-PUBLIC-PROMPT'},mode:'questions',response_state:'pending',proposal_revision:1,choice:null}};
  const enqueue=vi.fn();return {run:()=>games.dispatchHttpReceipt('room','spectator-session',receipt,enqueue),enqueue,receipt};
}
describe('B05-001 public mutation receipt does not replay an obsolete consent',()=>{
  for(const current of ['different','missing','revoked','paused','terminal','expires'] as const) it(`redacts the optional prompt for ${current} while preserving the committed receipt`,async()=>{
    const f=fixture(current);await f.run();expect(f.enqueue).toHaveBeenCalledOnce();const sent=f.enqueue.mock.calls[0]![0];
    expect(sent.session_id).toBe('session');expect(sent.game_rev).toBe(7);expect(sent.current_round).toBeNull();expect(JSON.stringify(sent)).not.toContain('OLD-CONSENTED-PUBLIC-PROMPT');
  });
  it('still delivers an exact current round with both live opt-ins',async()=>{
    const f=fixture('active');await f.run();expect(f.enqueue).toHaveBeenCalledOnce();expect(f.enqueue.mock.calls[0]![0]).toEqual(f.receipt);
  });
});
