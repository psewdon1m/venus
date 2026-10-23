import {describe,it,expect} from 'vitest';
import {nextSnapshot} from './api.js';
import type {RoomView} from '@venus/contracts';
const view=(rev:number):RoomView=>({room_id:'a',room_rev:rev,state:'open',meeting_context:'online',members:[],features:{games:'unavailable',music:'unavailable',cinema:'unavailable',calls:'unavailable'}});
const frame=(rev:number)=>({schema:1,type:'room.snapshot',stream:'room',audience:'room',room_id:'a',room_rev:rev,stream_rev:rev,payload:view(rev)});
describe('authoritative room snapshot ordering',()=>{
  it('never applies a duplicate, delayed, foreign-room or unsafe revision',()=>{
    const current=nextSnapshot(null,frame(3));expect(current).toEqual(view(3));
    expect(nextSnapshot(current,frame(2))).toBe(current);expect(nextSnapshot(current,frame(3))).toBe(current);
    expect(nextSnapshot(current,{...frame(4),room_id:'foreign'})).toBe(current);
    expect(nextSnapshot(current,frame(Number.MAX_SAFE_INTEGER+1))).toBe(current);
    expect(nextSnapshot(current,{...frame(4),stream_rev:1})).toBe(current);
    expect(nextSnapshot(current,frame(5))).toEqual(view(5));
  });
});
