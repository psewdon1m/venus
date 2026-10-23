import {describe,it,expect} from 'vitest';
import {TopicGames} from './topic-games.js';
import {DomainError} from './security.js';
import type {Rooms} from './rooms.js';
import type {TopicGameSelfActions} from '@venus/contracts';
/** Execute actual display method with explicit SQL/source/auth boundary doubles.
 * These assertions are not PostgreSQL/authentication or HTTP proof. */
function fixture(state='active'){
 let now=1000,late=()=>{},present=true,sourceHealthy=true;const auth={room:{id:'room',rev:'4',host_member_id:'member'},member:{id:'member',role:'host'}},g={id:'session',room_id:'room',state,rev:'3',mode:'questions'},data={state:'active',clock_floor:1000,boot_id:'boot',plan:{requires_action_consent:false,interaction:'group'},invitation:null,action:null,choice:null},r={row:{id:'round'},data};
 const c={query:async(sql:string)=>sql.includes('private_protocol')?{rows:[{private_protocol:2}]}:sql.includes('game_round_actors')?{rows:[{role:'primary'}]}:{rows:[{}],rowCount:1}};
 const rooms={now:()=>now,options:{},transaction:async(fn:(arg:unknown)=>unknown)=>fn(c),access:async()=>auth} as unknown as Rooms;
 const games=new TopicGames(rooms,{enabled:true,source:{active:async()=>null,pinned:async()=>{throw new Error('not called');},assertCurrent:()=>{if(!sourceHealthy)throw new DomainError('SOURCE_UNAVAILABLE',503);}},safety:{read:async()=>{throw new Error('not called');},excludeLocked:async()=>{throw new Error('not called');},assertCurrent:()=>{}}});data.boot_id=games.bootId;
 Object.assign(games,{row:async()=>g,current:async()=>r,loaded:async()=>({game:g,...r,map:{pins:{}},safety:{members:[]}}),conversation:async()=>null,selectedFence:async()=>Object.assign(()=>{if(!present)throw new DomainError('ACTORS_UNAVAILABLE',409);},{deadline:30000}),finalAuth:async()=>{late();return ()=>{};}});
 return {games,g,data,setNow:(n:number)=>now=n,setLate:(fn:()=>void)=>late=fn,setPresent:(v:boolean)=>present=v,setSource:(v:boolean)=>sourceHealthy=v,async view(){let result:TopicGameSelfActions|undefined;await games.dispatchSelfActions('room','credential',value=>result=value);return result!;}};
}
describe('V2 own display final-time regressions',()=>{
 it('allows host Next for completed round while suppressing round controls',async()=>{const f=fixture();f.data.state='completed';const view=await f.view();expect(view.session_actions.advance).toBe(true);expect(view.round_actions.finish).toBe(false);expect(view.round_actions.skip).toBe(false);});
 it('keeps Stop/Pause and host Abort when source fails during final credential await',async()=>{const f=fixture();f.setLate(()=>f.setSource(false));const view=await f.view();expect(view.round_actions.finish).toBe(false);expect(view.session_actions.pause).toBe(true);expect(view.session_actions.stop).toBe(true);expect(view.session_actions.abort).toBe(true);});
 it('does not retain ordinary true when presence becomes invalid at final await',async()=>{const f=fixture();f.setLate(()=>f.setPresent(false));const view=await f.view();expect(view.round_actions.finish).toBe(false);expect(view.session_actions.stop).toBe(true);});
 it('evaluates local clock rewind after final await without reviving Finish',async()=>{const f=fixture();f.setLate(()=>f.setNow(999));const view=await f.view();expect(view.round_actions.finish).toBe(false);expect(view.session_actions.stop).toBe(true);});
 it('allows healthy host resume only with present selected participants',async()=>{const f=fixture('paused');expect((await f.view()).session_actions.resume).toBe(true);f.setPresent(false);expect((await f.view()).session_actions.resume).toBe(false);});
});
