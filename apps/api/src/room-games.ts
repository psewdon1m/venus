/** The room's immutable protocol selects one implementation. A protocol2 room
 * never invokes legacy AAD1 serializers or consent/chat mutation code. */
import type pg from 'pg';
import type {RoomGameHooks} from './rooms.js';
import {requireThat} from './security.js';
import {unavailableTopicContent} from './topic-content-availability.js';
export class RoomGames implements RoomGameHooks {
 constructor(private readonly legacy:RoomGameHooks,private readonly topics:RoomGameHooks|null) {}
 private async implementation(c:pg.PoolClient,roomId:string):Promise<RoomGameHooks> {
  const row=(await c.query<{private_protocol:number}>('SELECT private_protocol FROM rooms WHERE id=$1',[roomId])).rows[0];
  requireThat(row,'NOT_FOUND',404);
  requireThat(row.private_protocol===1||row.private_protocol===2,'PRIVATE_PROTOCOL_UNSUPPORTED',503);
  if(row.private_protocol===1)return this.legacy;
  requireThat(this.topics,'PRIVATE_PROTOCOL_UNAVAILABLE',503);return this.topics;
 }
 async featureAvailable(c:pg.PoolClient,roomId:string) {return (await this.implementation(c,roomId)).featureAvailable(c,roomId);}
 async publicDelivery(c:pg.PoolClient,roomId:string,locale:'ru'|'en'|'tr') {const selected=await this.implementation(c,roomId);try{return await selected.publicDelivery(c,roomId,locale);}catch(error){if(selected===this.topics&&unavailableTopicContent(error))return null;throw error;}}
 async locked(c:pg.PoolClient,roomId:string) {return (await this.implementation(c,roomId)).locked(c,roomId);}
 async memberStateChanged(c:pg.PoolClient,roomId:string) {return (await this.implementation(c,roomId)).memberStateChanged(c,roomId);}
 async removing(c:pg.PoolClient,roomId:string,memberId:string) {return (await this.implementation(c,roomId)).removing(c,roomId,memberId);}
 async setupCleared(c:pg.PoolClient,roomId:string,memberId:string) {return (await this.implementation(c,roomId)).setupCleared(c,roomId,memberId);}
 async purge(c:pg.PoolClient,roomId:string) {return (await this.implementation(c,roomId)).purge(c,roomId);}
 async socketView(c:pg.PoolClient,roomId:string,memberId:string,locale:'ru'|'en'|'tr',after:number,options?:{includePublicGame?:boolean}) {const selected=await this.implementation(c,roomId);try{return selected===this.topics&&options?await selected.socketView(c,roomId,memberId,locale,after,options):await selected.socketView(c,roomId,memberId,locale,after);}catch(error){if(selected===this.topics&&unavailableTopicContent(error))return {game:null,privateEvents:[]};throw error;}}
 async privateDelivery(c:pg.PoolClient,roomId:string,memberId:string,locale:'ru'|'en'|'tr',eventId:string) {const selected=await this.implementation(c,roomId);try{return await selected.privateDelivery(c,roomId,memberId,locale,eventId);}catch(error){if(selected===this.topics&&unavailableTopicContent(error))return null;throw error;}}
}
