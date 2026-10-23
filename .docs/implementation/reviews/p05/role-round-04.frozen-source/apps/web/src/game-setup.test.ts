import {describe,expect,it} from 'vitest';
import type {RoomView} from '@venus/contracts';
import {freshPreparation} from './game-setup.js';
const room:RoomView={room_id:'r',room_rev:3,state:'open',meeting_context:'online',features:{games:'available',music:'unavailable',cinema:'unavailable',calls:'unavailable'},members:['a','b','observer'].map((id,i)=>({id,display_name:id,locale:'en',role:i===0?'host':'member',presence:'online',setup_ready:true}))};
const intent={mode:'yes_but' as const,players:['b','a'],round_count:7,idempotency_key:'same-request'};
describe('fresh preparation keeps explicit choices',()=>{
 it('uses the authoritative revision while preserving exact selected IDs, mode, rounds and request identity',()=>{const result=freshPreparation(room,{...room,room_rev:20},intent);expect(result).toEqual({...intent,expected_rev:20});expect(result.players).not.toBe(intent.players);expect(result.players).not.toContain('observer');expect(room.room_rev).toBe(3);});
 it('requires a new decision after membership, context or selected readiness changes',()=>{for(const fresh of [{...room,members:room.members.slice(0,2)},{...room,members:[...room.members,{...room.members[1]!,id:'new'}]},{...room,meeting_context:'in_person' as const},{...room,members:room.members.map(m=>m.id==='b'?{...m,setup_ready:false}:m)}]) expect(()=>freshPreparation(room,fresh,intent)).toThrow();});
 it('does not silently remove departed selected IDs, substitute actors or accept stale/cross-room responses',()=>{for(const fresh of [{...room,room_id:'other'},{...room,room_rev:2},{...room,members:room.members.filter(m=>m.id!=='b')}]) expect(()=>freshPreparation(room,fresh,intent)).toThrow();expect(()=>freshPreparation(room,room,{...intent,players:['a','missing']})).toThrow();expect(()=>freshPreparation(room,room,{...intent,players:['a','a']})).toThrow();});
});
