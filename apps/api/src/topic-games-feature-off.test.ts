import {describe,it,expect,vi} from 'vitest';
import type pg from 'pg';
import type {Rooms} from './rooms.js';
import {TopicGames} from './topic-games.js';

describe('feature-off topic content does not disable the shared room transport',()=>{
 for(const state of ['waiting','active','paused','completed','aborted'])it('withholds every game/private projection for retained '+state+' state without consulting content',async()=>{
  const query=vi.fn(async()=>({rows:[{id:'session',room_id:'room',state,current_round:1}],rowCount:1}));
  const c={query} as unknown as pg.PoolClient;
  const unavailable=vi.fn(async()=>{throw Error('Disabled content must not be consulted');});
  const games=new TopicGames({} as Rooms,{enabled:false,source:{active:unavailable,pinned:unavailable,assertCurrent:vi.fn()},
   safety:{read:unavailable,excludeLocked:unavailable,assertCurrent:vi.fn()}});
  expect(await games.socketView(c,'room','owner','en',0)).toEqual({game:null,privateEvents:[]});
  expect(await games.publicDelivery(c,'room','en')).toBeNull();expect(await games.privateDelivery(c,'room','owner','en','old-event')).toBeNull();
  expect(query).not.toHaveBeenCalled();expect(unavailable).not.toHaveBeenCalled();
 });
 it('continues to propagate unknown database failures when enabled rather than hiding them as feature-off',async()=>{
  const failure=Error('DB transport failure'),query=vi.fn(async()=>{throw failure;});
  const unused=vi.fn(async()=>{throw Error('not reached');}),games=new TopicGames({} as Rooms,{enabled:true,
   source:{active:unused,pinned:unused,assertCurrent:vi.fn()},safety:{read:unused,excludeLocked:unused,assertCurrent:vi.fn()}});
  await expect(games.socketView({query} as unknown as pg.PoolClient,'room','owner','en',0)).rejects.toBe(failure);
  await expect(games.publicDelivery({query} as unknown as pg.PoolClient,'room','en')).rejects.toBe(failure);
 });
});
