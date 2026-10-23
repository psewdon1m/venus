import {afterEach,describe,expect,it,vi} from 'vitest';
import type pg from 'pg';
import {algorithmRevision,TOPIC_ALGORITHM,TOPIC_PRIVATE_POLICY,TOPIC_RECOVERY_POLICY,digest,policyDigest,immutableTopicSnapshot,createTopicHistory,selectNextTopicRound,type TopicSnapshot,type TopicPlannerHistory} from '@venus/relationship-engine';
import {ownerProvisionalPilot} from '@venus/card-catalog';
import {TopicGames} from '../../apps/api/src/topic-games.js';
import {Keyring,DomainError} from '../../apps/api/src/security.js';
import {encodeTopicObject,topicAad} from '../../apps/api/src/topic-game-model.js';
import type {Rooms} from '../../apps/api/src/rooms.js';
const instances:TopicGames[]=[];afterEach(()=>{for(const games of instances.splice(0))games.clearSnapshotCache();});
/** Real chunk AES/AAD/digest + native immutable history. Only DB/source boundary
 * doubles; this is not a PG/HTTP benchmark or authorization proof. */
function fixture(){
 const room='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222',ids=['33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444'];
 const material={v1:Buffer.alloc(32,7).toString('base64')},keys=new Keyring('v1',material),{pack,map}=ownerProvisionalPilot;
 const input:TopicSnapshot={schema:2,engine_revision:TOPIC_ALGORITHM,private_policy_revision:TOPIC_PRIVATE_POLICY,recovery_policy_revision:TOPIC_RECOVERY_POLICY,pins_digest:digest(map.pins),baseline:{schema:1,engine_revision:algorithmRevision,policy_revision:'RE-1',policy_digest:policyDigest,pack_digest:pack.digest,room_id:room,session_id:session,seed:'a'.repeat(64),mode:'questions',context:'online',total_rounds:20,capabilities:['private_text_chat'],players:ids.map(id=>({id,comfort:0,edges:{}}))}};
 const snapshot=immutableTopicSnapshot(input,pack,map),safety={room_id:room,revision:1,members:ids.map(member_id=>({member_id,revision:1,allow_topic_ids:map.topics.map(t=>t.topic_id),excluded_topic_ids:[]}))};
 const native=selectNextTopicRound(snapshot,createTopicHistory(snapshot,pack,map),pack,map,safety).history;
 const game={id:session,room_id:room,state:'active',rev:'1',current_round:1,snapshot_cipher:keys.encrypt(input,topicAad.snapshot(room,session))};
 let encoded=encodeTopicObject(keys,{room,session,id:session,kind:'history'},1,native),objectRevision=1,missing=false,members=[...ids],sourceCurrent=true;
 let revoked=false;const finalAccessFence=vi.fn(async()=>()=>{if(revoked)throw new DomainError('CONTROLLED_AUTH_REVOKED',401);});
 const query=vi.fn(async(sql:string)=>{if(sql.includes('SELECT revision,chunk_count,byte_length'))return {rows:missing?[]:[{revision:String(objectRevision),chunk_count:encoded.chunks.length,byte_length:encoded.bytes}]};if(sql.includes('SELECT chunk_index,cipher'))return {rows:encoded.chunks.map((cipher,chunk_index)=>({chunk_index,cipher}))};if(sql.includes('SELECT member_id FROM game_participants'))return {rows:members.map(member_id=>({member_id}))};if(sql.includes('SELECT pins_cipher'))return {rows:[{pins_cipher:keys.encrypt(map.pins,topicAad.pins(room,session))}]};if(sql.includes('SELECT private_protocol'))return {rows:[{private_protocol:2}]};return {rows:[]};}),c={query} as unknown as pg.PoolClient;
 const rooms={options:{keys},now:()=>1000,transaction:async(fn:(client:pg.PoolClient)=>unknown)=>fn(c),access:async()=>({room:{id:room},member:{id:ids[0],locale:'en'}}),finalAccessFence} as unknown as Rooms;
 const pinned=vi.fn(async()=>{if(!sourceCurrent)throw new DomainError('CONTROLLED_SOURCE_WITHDRAWN',503);return {pack,map};});
 const games=new TopicGames(rooms,{enabled:true,source:{pinned,active:async()=>({pack,map}),assertCurrent:()=>{if(!sourceCurrent)throw new DomainError('CONTROLLED_SOURCE_WITHDRAWN',503);}},safety:{read:async()=>{throw Error('not used');},excludeLocked:async()=>{throw Error('not used');},assertCurrent:()=>{}}});instances.push(games);
 const round={row:{id:native.rounds[0]!.round_id},data:{plan:native.rounds[0],state:'active',clock_floor:0}};
 Object.assign(games,{required:async()=>game,current:async()=>round,safety:async()=>safety,selectedFence:async()=>()=>{},reconcile:async()=>true});
 const read=(s=snapshot)=>Reflect.get(games,'history').call(games,c,game,s,pack,map) as Promise<TopicPlannerHistory>;
 return {games,keys,material,input,snapshot,native,safety,pack,map,game,c,query,pinned,read,finalAccessFence,revoke:()=>{revoked=true;},get encoded(){return encoded;},write:(raw:unknown)=>{objectRevision++;encoded=encodeTopicObject(keys,{room,session,id:session,kind:'history'},objectRevision,raw);},setMissing:()=>{missing=true;},setMembers:(value:string[])=>{members=value;},withdraw:()=>{sourceCurrent=false;},loaded:()=>Reflect.get(games,'loaded').call(games,c,room,session),getCurrent:()=>games.getCurrent(room,'controlledcredential')};
}
describe('independent authenticated history memo regressions',()=>{
 it('cannot hit memo across newly tampered object revision metadata',async()=>{const f=fixture();await f.read();f.query.mockResolvedValueOnce({rows:[{revision:'2',chunk_count:f.encoded.chunks.length,byte_length:f.encoded.bytes}]});await expect(f.read()).rejects.toThrow();expect(Reflect.get(Reflect.get(f.games,'histories'),'entries')).toHaveLength(0);});
 it('fresh valid-GCM but false chunk digest cannot reuse validated plaintext',async()=>{const f=fixture();await f.read();const aad=`topic-game-object:${f.game.room_id}:${f.game.id}:${f.game.id}:history:1:0:${f.encoded.chunks.length}:2`,old=f.keys.decrypt<Record<string,unknown>>(f.encoded.chunks[0]!,aad);f.encoded.chunks[0]=f.keys.encrypt({...old,digest:'0'.repeat(64)},aad);await expect(f.read()).rejects.toMatchObject({code:'TOPIC_OBJECT_INVALID'});expect(Reflect.get(Reflect.get(f.games,'histories'),'entries')).toHaveLength(0);});
});
