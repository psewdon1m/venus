import {describe,it,expect,vi} from 'vitest';
import {Games} from '../../apps/api/src/games.js';
import type {Rooms} from '../../apps/api/src/rooms.js';
function fixture(current:'different'|'missing'|'revoked-matching') {
 const rooms={now:()=>1000,access:vi.fn(async()=>({member:{id:'spectator',slot:1}})),transaction:async(fn:unknown)=>(fn as Function)({})} as unknown as Rooms;
 const games=new Games(rooms,()=>null,true,false,true),adapters=games as unknown as Record<string,unknown>;
 adapters.requireGame=vi.fn(async()=>({id:'session',room_id:'room',state:'active'}));
 adapters.pack=vi.fn(async()=>({card:()=>({revision:1,interaction:'pair_public'})}));
 adapters.current=vi.fn(async()=>current==='missing'?null:{row:{id:current==='different'?'new-round':'old-round'},data:{plan:{interaction:'pair_public',actors:['a','b']},invitation:{scope:'invitation',actors:['a','b'],acks:[],state:'stopped'}}});
 const receipt={session_id:'session',game_rev:7,state:'active',mode:'questions',total_rounds:20,pause_reason:null,current_round:{kind:'public',round_id:'old-round',round_index:1,state:'active',card_id:'Q-1001',card_revision:1,actors:['a','b'],text:{question:'OLD-CONSENTED-PUBLIC-PROMPT'},mode:'questions',response_state:'pending',proposal_revision:1,choice:null}};
 const enqueue=vi.fn();return {run:()=>games.dispatchHttpReceipt('room','spectator-session',receipt,enqueue),enqueue,receipt};
}
describe('quiet public-pair stale mutation receipt projection',()=>{
 for(const current of ['different','missing','revoked-matching'] as const)it(`redacts previous pair prompt when actual current round is ${current}`,async()=>{
  const f=fixture(current);await f.run();expect(f.enqueue).toHaveBeenCalledOnce();const sent=f.enqueue.mock.calls[0]![0];
  expect(sent.session_id).toBe('session');expect(sent.game_rev).toBe(7);
  expect(sent.current_round).toBeNull();expect(JSON.stringify(sent)).not.toContain('OLD-CONSENTED-PUBLIC-PROMPT');
 });
});
