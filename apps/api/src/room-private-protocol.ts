import type pg from 'pg';

/** Trusted server integration hooks; none of these parameters authenticate a
 * caller. Rooms owns the PostgreSQL transaction, room row/advisory ordering,
 * credential/entry checks, and invokes these before durable side effects. */
export interface RoomPrivateProtocolHooks {
 birth(c:pg.PoolClient,roomId:string,hostId:string,operationId:string,createdAt:number):Promise<void>;
 admit(c:pg.PoolClient,roomId:string,memberId:string,operationId:string):Promise<void>;
 /** Load authenticated external scope, then return a synchronous last-enqueue
  * fence. It must recheck external room/member withdrawal; never initialize. */
 guard(c:pg.PoolClient,roomId:string,memberId?:string):Promise<()=>void>;
 /** Trusted late-fence builder: validates DB scope only; success grants no access.
  * Caller must invoke its fresh synchronous physical fence before publication.
  * Never initialize, cache permission, or skip invocation after an awaited read. */
 prepareGuard?(c:pg.PoolClient,roomId:string,memberId?:string):Promise<()=>void>;
 retireMember(c:pg.PoolClient,roomId:string,memberId:string,operationId:string):Promise<void>;
 retireRoom(c:pg.PoolClient,roomId:string,operationId:string,retiredAt:number):Promise<{retiredAt:number}>;
 recovery(c:pg.PoolClient,roomId:string):Promise<{
  retirement:{operationId:string;retiredAt:number}|null;
  retiredMembers:readonly string[];
 }>;
 cleanup(c:pg.PoolClient,roomId:string):Promise<void>;
}
