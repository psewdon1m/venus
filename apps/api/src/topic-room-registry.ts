/** PostgreSQL/lifecycle bridge. All mutations run under Rooms' transaction and
 * room advisory lock. External authority survives a rolled-back DB transaction.
 * Provisioning is exclusively a new-room operation; reads never initialize. */
import type pg from 'pg';
import {requireThat} from './security.js';
import {revision} from './rooms.js';
import type {RoomPrivateProtocolHooks} from './room-private-protocol.js';
import type {PrivateTopicLifecycle,TopicRoomBirth} from './private-topic-preferences.js';
import {TopicRoomLifecycle,TopicRoomLifecycleError} from './topic-room-lifecycle.js';
import type {TopicPins} from './private-topic-ledger.js';

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const held=Object.freeze({roomTransactionLockHeld:true as const});
export interface TopicRoomRegistryOptions {
 storage:TopicRoomLifecycle;pins:TopicPins;
 /** Prevalidated, anchored, exclusive mkdir+fsync on the five protected roots.
  * Must reject existing rooms/aliases; never recursively initialize a read. */
 provision:(roomId:string)=>void;
 /** Mandatory real epoch/action/advice/chat invalidation, in the same PG TX. */
 topicsChanged:(c:pg.PoolClient,roomId:string,ownerId:string)=>Promise<void>;
}
export class TopicRoomRegistry implements RoomPrivateProtocolHooks,PrivateTopicLifecycle {
 constructor(private readonly options:TopicRoomRegistryOptions) {}
 private async birthRecord(c:pg.PoolClient,roomId:string):Promise<TopicRoomBirth> {
  requireThat(UUID.test(roomId),'INVALID_ROOM_ID',400);
  const row=(await c.query<{private_protocol:number;incarnation:string;minimum_sequence:string;taxonomy_digest:string;policy_digest:string}>(
   `SELECT r.private_protocol,b.incarnation,b.minimum_sequence,b.taxonomy_digest,b.policy_digest
    FROM rooms r LEFT JOIN private_topic_room_births b ON b.room_id=r.id WHERE r.id=$1`,[roomId])).rows[0];
  requireThat(row?.private_protocol===2,'PRIVATE_PROTOCOL_UNAVAILABLE',503);
  requireThat(typeof row.incarnation==='string'&&UUID.test(row.incarnation)&&row.taxonomy_digest===this.options.pins.taxonomy&&row.policy_digest===this.options.pins.policy,'TOPIC_BIRTH_UNAVAILABLE',503);
  const minimumSequence=revision(row.minimum_sequence);requireThat(minimumSequence>=1&&minimumSequence<=4096,'TOPIC_BIRTH_UNAVAILABLE',503);
  return Object.freeze({incarnation:row.incarnation,minimumSequence,taxonomy_digest:row.taxonomy_digest,policy_digest:row.policy_digest});
 }
 async birth(c:pg.PoolClient,roomId:string,hostId:string,operationId:string,createdAt:number) {
  requireThat(UUID.test(roomId)&&UUID.test(hostId)&&UUID.test(operationId),'INVALID_REQUEST',400);
  this.options.provision(roomId);
  const birth=this.options.storage.initializeRoom(roomId,createdAt,held);
  this.options.storage.admitMember(roomId,birth,hostId,operationId,held);
  await c.query(`INSERT INTO private_topic_room_births(room_id,incarnation,minimum_sequence,taxonomy_digest,policy_digest,created_at)
   VALUES($1,$2,$3,$4,$5,$6)`,[roomId,birth.incarnation,birth.minimumSequence,birth.taxonomy_digest,birth.policy_digest,new Date(createdAt)]);
  this.options.storage.assertMember(roomId,birth,hostId);
 }
 async admit(c:pg.PoolClient,roomId:string,memberId:string,operationId:string) {
  const birth=await this.birthRecord(c,roomId);
  this.options.storage.admitMember(roomId,birth,memberId,operationId,held);
  // A corrupt personal ledger must never grant a new member a usable session.
  this.options.storage.open(roomId,birth).read({roomId,ownerId:memberId});
 }
 async guard(c:pg.PoolClient,roomId:string,memberId?:string) {
  const birth=await this.birthRecord(c,roomId);
  // Member authority already freshly checks room retirement under the same metadata lock.
  const fence=()=>{if(memberId===undefined)this.options.storage.assertRoomAuthority(roomId,birth);else this.options.storage.assertMemberAuthority(roomId,birth,memberId);};
  fence();return fence;
 }
 async retireMember(c:pg.PoolClient,roomId:string,memberId:string,operationId:string) {
  this.options.storage.retireMember(roomId,await this.birthRecord(c,roomId),memberId,operationId,held);
 }
 async retireRoom(c:pg.PoolClient,roomId:string,operationId:string,retiredAt:number) {
  const birth=await this.birthRecord(c,roomId),status=this.options.storage.retirementStatus(roomId,birth);
  // Reuse the original authenticated intent even if PG COMMIT was lost or the
  // database was restored. In particular, never reset the retention deadline.
  const intent=status.state==='live'?{operationId,retiredAt}:{operationId:status.operationId,retiredAt:status.retiredAt};
  this.options.storage.retireRoom(roomId,birth,intent,held);return {retiredAt:intent.retiredAt};
 }
 async recovery(c:pg.PoolClient,roomId:string) {
  const birth=await this.birthRecord(c,roomId),status=this.options.storage.retirementStatus(roomId,birth);
  if(status.state!=='live') {
   const retirement={operationId:status.operationId,retiredAt:status.retiredAt};
   this.options.storage.retireRoom(roomId,birth,retirement,held);
   return {retirement,retiredMembers:Object.freeze([]) as readonly string[]};
  }
  const members=(await c.query<{id:string}>('SELECT id FROM room_members WHERE room_id=$1 AND removed_at IS NULL ORDER BY id',[roomId])).rows;
  const retiredMembers:string[]=[];
  for(const {id} of members) {
   try {this.options.storage.assertMemberAuthority(roomId,birth,id);}
   catch(error) {
    // Only a proven member withdrawal is replayable. Missing admission,
    // corrupt metadata, wrong birth or retired room are never guessed away.
    if(error instanceof TopicRoomLifecycleError&&error.code==='TOPIC_ROOM_MEMBER_RETIRED') retiredMembers.push(id);
    else throw error;
   }
  }
  this.options.storage.assertRoomAuthority(roomId,birth);
  return {retirement:null,retiredMembers:Object.freeze(retiredMembers)};
 }
 async cleanup(c:pg.PoolClient,roomId:string) {
  const birth=await this.birthRecord(c,roomId);
  const row=(await c.query<{state:string;closed_at:Date|null}>('SELECT state,closed_at FROM rooms WHERE id=$1',[roomId])).rows[0];
  requireThat(row?.state==='closed'&&row.closed_at,'TOPIC_CLEANUP_REQUIRES_CLOSED_ROOM',503);
  const status=this.options.storage.retirementStatus(roomId,birth);
  requireThat(status.state==='retired'&&status.retiredAt===row.closed_at.getTime(),'TOPIC_RETIREMENT_DB_MISMATCH',503);
  const input={...held,minimumTerminalAgeMs:0};
  this.options.storage.cleanupPersonal(roomId,birth,input);
  this.options.storage.cleanupRetiredMetadata(roomId,birth,input);
 }
 open(roomId:string,birth:TopicRoomBirth) {return this.options.storage.open(roomId,birth);}
 assertLive(roomId:string,birth:TopicRoomBirth) {this.options.storage.assertLive(roomId,birth);}
 revoke(c:pg.PoolClient,roomId:string,ownerId:string) {return this.options.topicsChanged(c,roomId,ownerId);}
}
