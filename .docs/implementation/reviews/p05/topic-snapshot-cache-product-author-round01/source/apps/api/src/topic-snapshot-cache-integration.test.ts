import {afterEach,describe,expect,it,vi} from 'vitest';
import type pg from 'pg';
import {algorithmRevision,TOPIC_ALGORITHM,TOPIC_PRIVATE_POLICY,TOPIC_RECOVERY_POLICY,digest,policyDigest,type TopicSnapshot} from '@venus/relationship-engine';
import {ownerProvisionalPilot} from '@venus/card-catalog';
import {TopicGames} from './topic-games.js';
import {Keyring,DomainError} from './security.js';
import {topicAad} from './topic-game-model.js';
import type {Rooms} from './rooms.js';
const instances:TopicGames[]=[];afterEach(()=>{for(const games of instances.splice(0))games.clearSnapshotCache();});
/** Real AES/AAD and immutable snapshot validators, literal DB/source boundary
 * doubles. No selectors, real DB/HTTP authorization, or measured latency claim. */
function fixture(){
 const room='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222',ids=['33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444'];
 const material={v1:Buffer.alloc(32,7).toString('base64')},keys=new Keyring('v1',material),{pack,map}=ownerProvisionalPilot;
 const input:TopicSnapshot={schema:2,engine_revision:TOPIC_ALGORITHM,private_policy_revision:TOPIC_PRIVATE_POLICY,recovery_policy_revision:TOPIC_RECOVERY_POLICY,pins_digest:digest(map.pins),baseline:{schema:1,engine_revision:algorithmRevision,policy_revision:'RE-1',policy_digest:policyDigest,pack_digest:pack.digest,room_id:room,session_id:session,seed:'a'.repeat(64),mode:'questions',context:'online',total_rounds:20,capabilities:['private_text_chat'],players:ids.map(id=>({id,comfort:0,edges:{}}))}};
 const game={id:session,room_id:room,state:'active',rev:'1',current_round:1,snapshot_cipher:keys.encrypt(input,topicAad.snapshot(room,session))};let members=[...ids],sourceCurrent=true,historyReads=0;
 const query=vi.fn(async(sql:string)=>{if(sql.includes('SELECT member_id FROM game_participants'))return {rows:members.map(member_id=>({member_id}))};if(sql.includes('SELECT pins_cipher'))return {rows:[{pins_cipher:keys.encrypt(map.pins,topicAad.pins(room,session))}]};return {rows:[]};}),c={query} as unknown as pg.PoolClient;
 const rooms={options:{keys},now:()=>1000,transaction:async(fn:(client:pg.PoolClient)=>unknown)=>fn(c)} as unknown as Rooms;
 const pinned=vi.fn(async()=>{if(!sourceCurrent)throw new DomainError('CONTROLLED_SOURCE_WITHDRAWN',503);return {pack,map};});
 const games=new TopicGames(rooms,{enabled:true,source:{pinned,active:async()=>({pack,map}),assertCurrent:()=>{if(!sourceCurrent)throw new DomainError('CONTROLLED_SOURCE_WITHDRAWN',503);}},safety:{read:async()=>{throw Error('not used');},excludeLocked:async()=>{throw Error('not used');},assertCurrent:()=>{}}});instances.push(games);
 const plan={schema:2},round={row:{id:'round'},data:{plan,state:'active',clock_floor:0}};
 Object.assign(games,{required:async()=>game,current:async()=>round,history:async()=>{historyReads++;return {rounds:[plan]};},safety:async()=>({members:[]}),selectedFence:async()=>()=>{}});
 const snapshot=()=>Reflect.get(games,'snapshot').call(games,c,game,pack,map) as Promise<TopicSnapshot>;
 return {games,keys,material,input,game,query,pinned,snapshot,loaded:()=>Reflect.get(games,'loaded').call(games,c,room,session),setMembers:(value:string[])=>members=value,withdraw:()=>sourceCurrent=false,get historyReads(){return historyReads;},c};
}
describe('TopicGames snapshot reuse keeps current fences',()=>{
 it('reuses one actual validated immutable snapshot with fresh AES and membership on every read',async()=>{const f=fixture(),decrypt=vi.spyOn(f.keys,'decrypt'),one=await f.snapshot();expect(await f.snapshot()).toBe(one);expect(Object.isFrozen(one.baseline.players)).toBe(true);expect(decrypt).toHaveBeenCalledTimes(2);expect(f.query).toHaveBeenCalledTimes(2);});
 it('rejects changed membership even when the ciphertext is unchanged and cache is warm',async()=>{const f=fixture();await f.snapshot();f.setMembers([]);await expect(f.snapshot()).rejects.toMatchObject({code:'SNAPSHOT_MEMBERSHIP_CHANGED'});expect(f.query).toHaveBeenCalledTimes(2);});
 it('does not reuse reencryption and never bypasses tampered ciphertext authentication',async()=>{const f=fixture(),one=await f.snapshot();f.game.snapshot_cipher=f.keys.encrypt(f.input,topicAad.snapshot(f.game.room_id,f.game.id));expect(await f.snapshot()).not.toBe(one);f.game.snapshot_cipher={...f.game.snapshot_cipher,tag:Buffer.alloc(16).toString('base64')};await expect(f.snapshot()).rejects.toThrow();});
 it('does not bypass missing key or another room AAD after warming the cache',async()=>{const f=fixture();await f.snapshot();Reflect.deleteProperty(f.material,'v1');await expect(f.snapshot()).rejects.toMatchObject({code:'KEY_VERSION_UNAVAILABLE'});const other=fixture();await other.snapshot();other.game.room_id='55555555-5555-4555-8555-555555555555';await expect(other.snapshot()).rejects.toThrow();});
 it('still checks source/catalog boundary and reads history on every loaded context',async()=>{const f=fixture(),one=await f.loaded(),two=await f.loaded();expect(two.snapshot).toBe(one.snapshot);expect(f.pinned).toHaveBeenCalledTimes(2);expect(f.historyReads).toBe(2);f.withdraw();await expect(f.loaded()).rejects.toMatchObject({code:'CONTROLLED_SOURCE_WITHDRAWN'});expect(f.pinned).toHaveBeenCalledTimes(3);});
 it('clears cached baseline relationships on boot barrier, purge and explicit service close',async()=>{const f=fixture(),one=await f.snapshot();await f.games.bootGate();const two=await f.snapshot();expect(two).not.toBe(one);await f.games.purge(f.c,f.game.room_id);const three=await f.snapshot();expect(three).not.toBe(two);f.games.clearSnapshotCache();expect(await f.snapshot()).not.toBe(three);});
});
