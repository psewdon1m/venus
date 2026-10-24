import {describe,it,expect,vi} from 'vitest';
import type pg from 'pg';
import {proposeConsent,type ConsentScope} from '@venus/relationship-engine';
import {Games} from './games.js';
import type {Rooms} from './rooms.js';

/** Unit boundary for the dispatch projection, not a replacement for its real-PG lock test. */
function dispatchFixture(scope:ConsentScope,afterRead:number) {
  let clock=1000;
  const offer={...proposeConsent('offer',['actor-a','actor-b'],scope,0,scope==='action'?90000:null),deadline:2000};
  const game={id:'session',room_id:'room',state:'active',rev:'1'};
  const data={plan:{round_id:'round',actors:['actor-a','actor-b']},state:'pending',invitation:scope==='invitation'?offer:null,action:scope==='action'?offer:null,condition:null};
  const games=new Games({now:()=>clock} as Rooms,()=>null,true);
  // These replace persistence adapters only; privateDelivery and its view/permission logic are real.
  const adapters=games as unknown as Record<string,unknown>;
  adapters.row=vi.fn(async()=>game);
  adapters.current=vi.fn(async()=>({row:{id:'round'},data}));
  adapters.snapshot=vi.fn(async()=>({}));
  const names=vi.fn(async()=>{clock=afterRead;return [{id:'actor-a',display_name:'A'},{id:'actor-b',display_name:'B'}];});
  adapters.names=names;
  const query=vi.fn(async()=>({rows:[{event_id:'event',stream_rev:'1',session_id:'session',round_id:'round',game_rev:'1',kind:scope}]}));
  const db={query} as unknown as pg.PoolClient;
  return {read:()=>games.privateDelivery(db,'room','actor-a','en','event'),game,data,names};
}

describe('private dispatch final time fence after awaited persistence reads',()=>{
  for(const scope of ['invitation','action'] as const) {
    it(`${scope} remains deliverable immediately before its deadline`,async()=>{
      const fixture=dispatchFixture(scope,1999),event=await fixture.read();
      expect(fixture.names).toHaveBeenCalledOnce();
      expect(event?.type).toBe(scope==='invitation'?'game.consent_requested':'game.action_consent_requested');
    });
    for(const afterRead of [2000,2001]) it(`${scope} becomes a clear when its deadline passes during the names read (${afterRead})`,async()=>{
      const fixture=dispatchFixture(scope,afterRead),event=await fixture.read();
      expect(fixture.names).toHaveBeenCalledOnce();
      expect(event).toEqual({eventId:'event',revision:1,type:'game.private_cleared',payload:{session_id:'session',round_id:'round',private_available:false}});
      expect(JSON.stringify(event)).not.toContain('offer_id');
    });
  }
  it('a reference from before a committed game revision cannot reconstruct its former content',async()=>{
    const fixture=dispatchFixture('invitation',1999);fixture.game.rev='2';
    expect(await fixture.read()).toMatchObject({type:'game.private_cleared',payload:{private_available:false}});
    expect(fixture.names).not.toHaveBeenCalled();
  });
  it('a terminal round cannot reconstruct invitation content even if a reference revision matches',async()=>{
    const fixture=dispatchFixture('invitation',1999);fixture.data.state='stopped';
    expect(await fixture.read()).toMatchObject({type:'game.private_cleared',payload:{private_available:false}});
    expect(fixture.names).not.toHaveBeenCalled();
  });
});
