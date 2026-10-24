import {afterEach,describe,expect,it,vi} from 'vitest';
import {TopicSnapshotCache} from './topic-snapshot-cache.js';
const caches:TopicSnapshotCache<unknown>[]=[];
afterEach(()=>{for(const cache of caches.splice(0))cache.clear();vi.useRealTimers();});
function fixture(){let now=0,authCalls=0,validations=0;const cache=new TopicSnapshotCache<object>(()=>now);caches.push(cache);const identity={room:'room',session:'session',cipher:'authenticated-cipher',pack:{},map:{}};
 const authenticate=()=>{authCalls++;return {baseline:'controlled'};},validate=()=>{validations++;return Object.freeze({validation:validations});};
 return {cache,identity,authenticate,validate,setNow:(value:number)=>now=value,get authCalls(){return authCalls;},get validations(){return validations;},read:(patch={})=>cache.read({...identity,...patch},authenticate,validate)};
}
describe('bounded immutable snapshot memoization, no authorization cache',()=>{
 it('preserves exact validated object but authenticates every hit',()=>{const f=fixture(),first=f.read();expect(f.read()).toBe(first);expect(f.authCalls).toBe(2);expect(f.validations).toBe(1);});
 for(const field of ['room','session','cipher','pack','map'] as const)it('never reuses another '+field+' binding',()=>{const f=fixture(),first=f.read();expect(f.read({[field]:['pack','map'].includes(field)?{}:'changed'})).not.toBe(first);expect(f.authCalls).toBe(2);expect(f.validations).toBe(2);});
 it('uses an absolute30s monotonic TTL and hits cannot renew it',()=>{const f=fixture(),first=f.read();f.setNow(29999);expect(f.read()).toBe(first);f.setNow(30000);expect(f.read()).not.toBe(first);expect(f.validations).toBe(2);});
 it('evicts the least recently used entry at the32entry bound',()=>{const f=fixture(),first=f.read({session:'s0'});for(let i=1;i<32;i++)f.read({session:'s'+i});expect(f.read({session:'s0'})).toBe(first);f.read({session:'s32'});expect(f.read({session:'s1'})).toEqual({validation:34});expect(f.read({session:'s0'})).toBe(first);});
 it('never serves a warm entry after decrypt/keyring failure and clears old values',()=>{const f=fixture(),first=f.read();const fail=vi.fn(()=>{throw Error('CONTROLLED_KEY_UNAVAILABLE');});expect(()=>f.cache.read(f.identity,fail,f.validate)).toThrow('CONTROLLED_KEY_UNAVAILABLE');expect(fail).toHaveBeenCalledTimes(1);expect(f.validations).toBe(1);expect(f.read()).not.toBe(first);});
 it('propagates changed source validation failure without falling back to old value',()=>{const f=fixture();f.read();expect(()=>f.cache.read({...f.identity,map:{}},f.authenticate,()=>{throw Error('CONTROLLED_MAP_REJECTED');})).toThrow('CONTROLLED_MAP_REJECTED');expect(Reflect.get(f.cache,'entries')).toHaveLength(0);});
 it('removes expired sensitive values on its unref timer even without another read',()=>{vi.useFakeTimers();const f=fixture();f.read();f.setNow(30000);vi.advanceTimersByTime(30000);expect(Reflect.get(f.cache,'entries')).toHaveLength(0);expect(vi.getTimerCount()).toBe(0);});
 it('clears only a purged room and clears all values explicitly',()=>{const f=fixture(),one=f.read(),two=f.read({room:'other'});f.cache.forgetRoom('room');expect(f.read({room:'other'})).toBe(two);expect(f.read()).not.toBe(one);f.cache.clear();expect(Reflect.get(f.cache,'entries')).toHaveLength(0);});
 it('clock rewind/nonfinite cannot revive a cached value',()=>{const f=fixture(),one=f.read();f.setNow(10);expect(f.read()).toBe(one);f.setNow(9);expect(f.read()).not.toBe(one);f.setNow(Infinity);f.read();expect(Reflect.get(f.cache,'entries')).toHaveLength(0);});
});
