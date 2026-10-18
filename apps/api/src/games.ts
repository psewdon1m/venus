import {randomUUID,randomBytes} from 'node:crypto';
import type pg from 'pg';
import type {GameView,PrepareGame,StartGame,RevisionMutation,RoundResponse,RoundChoice,YesButCondition,PairInvitation,PrivatePrompt,ActionConsentState} from '@venus/contracts';
import {FrozenPack,immutableSnapshot,selectNextRound,preflight,policyDigest,algorithmRevision,EngineError,canonical,proposeConsent,reconcileConsent,consentResponse,consentAllows,replacePendingAction,type Snapshot,type Player,type Edge,type RoundPlan} from '@venus/relationship-engine';
import {Rooms,revision,type RoomGameHooks,type PrivateDelivery,type PrivateReference} from './rooms.js';
import {requireThat,DomainError,type Cipher} from './security.js';
import {gameView,publicRound,privateText,type GameRow,type RoundData,type RoundRow,type Draft,type NameRow,type Locale} from './games-model.js';
type Auth=Awaited<ReturnType<Rooms['access']>>;
interface Rules {host?:boolean;safety?:boolean;sessionId?:string;roundId?:string;participant?:boolean;actor?:boolean;role?:'primary'|'secondary'}
type Operation=(c:pg.PoolClient,a:Auth)=>Promise<unknown>;
const DAY=86400000;
export class Games implements RoomGameHooks {
  private packs=new Map<string,FrozenPack>();
  constructor(readonly rooms:Rooms,private readonly provider:()=>FrozenPack|null,readonly allowSynthetic=false) {}
  private get now() {return this.rooms.now();}
  private get keys() {return this.rooms.options.keys;}
  private async mapped<T>(operation:()=>Promise<T>):Promise<T> {
    try {return await operation();} catch(error) {
      if(error instanceof EngineError) throw new DomainError(error.code,error.code==='SAFE_POOL_EXHAUSTED'?422:/VERSION|PACK_|SNAPSHOT_|HISTORY/.test(error.code)?503:/ACTOR_REQUIRED/.test(error.code)?403:409);
      throw error;
    }
  }
  private async mutate(roomId:string,session:string|undefined,input:Record<string,unknown>,requestId:string,action:string,rules:Rules,operation:Operation) {
    return this.mapped(()=>this.rooms.transaction(async c=>{
      const a=await this.rooms.access(c,roomId,session,rules.safety??false);
      if(rules.host) requireThat(a.member.role==='host'&&a.room.host_member_id===a.member.id,'HOST_REQUIRED');
      if(rules.participant) requireThat((await c.query('SELECT 1 FROM game_participants WHERE room_id=$1 AND session_id=$2 AND member_id=$3',[roomId,rules.sessionId,a.member.id])).rowCount===1,'GAME_PARTICIPANT_REQUIRED');
      if(rules.actor) {
        const row=(await c.query<{role:string}>('SELECT role FROM game_round_actors WHERE room_id=$1 AND session_id=$2 AND round_id=$3 AND member_id=$4',[roomId,rules.sessionId,rules.roundId,a.member.id])).rows[0];
        requireThat(row&&(!rules.role||row.role===rules.role),'ROUND_ACTOR_REQUIRED');
      }
      const key=(input.idempotency_key??input.request_id) as string;requireThat(typeof key==='string','INVALID_REQUEST',400);
      const scope=`${roomId}:${a.member.id}:${action}:${rules.sessionId??''}:${rules.roundId??''}`;
      const old=await this.rooms.replay(c,scope,key,input);if(old) return old.body;
      const body=await operation(c,a);
      await this.rooms.remember(c,scope,key,input,roomId,{body,session:null,memberId:a.member.id,status:200},requestId,action);return body;
    }));
  }
  private async row(c:pg.PoolClient,roomId:string,id?:string):Promise<GameRow|null> {
    const result=await c.query<GameRow>(id?'SELECT * FROM game_sessions WHERE room_id=$1 AND id=$2 FOR UPDATE':'SELECT * FROM game_sessions WHERE room_id=$1 ORDER BY seq DESC LIMIT 1 FOR UPDATE',id?[roomId,id]:[roomId]);return result.rows[0]??null;
  }
  private async requireGame(c:pg.PoolClient,roomId:string,id:string) {const game=await this.row(c,roomId,id);requireThat(game,'GAME_NOT_FOUND',404);return game;}
  private draft(game:GameRow) {return this.keys.decrypt<Draft>(game.draft_cipher,`game-draft:${game.room_id}:${game.id}:1`);}
  private async current(c:pg.PoolClient,game:GameRow) {
    if(!game.current_round) return null;
    const row=(await c.query<RoundRow>('SELECT * FROM game_rounds WHERE room_id=$1 AND session_id=$2 AND round_index=$3 FOR UPDATE',[game.room_id,game.id,game.current_round])).rows[0];
    requireThat(row,'ROUND_UNAVAILABLE',503);const data=this.keys.decrypt<RoundData>(row.cipher,`game-round:${game.room_id}:${game.id}:${row.id}:1`);
    requireThat(data.plan.round_id===row.id&&data.plan.round_index===row.round_index&&data.state===row.state,'ROUND_UNAVAILABLE',503);return {row,data};
  }
  private async pack(c:pg.PoolClient,game:GameRow) {
    requireThat(game.pack_digest,'PACK_UNAVAILABLE',503);const old=this.packs.get(game.pack_digest);if(old) return old;
    const row=(await c.query<{manifest:Parameters<typeof FrozenPack.load>[1];cards:unknown[];synthetic:boolean}>('SELECT manifest,cards,synthetic FROM game_packs WHERE digest=$1',[game.pack_digest])).rows[0];
    requireThat(row&&(!row.synthetic||this.allowSynthetic),'PACK_UNAVAILABLE',503);const value=FrozenPack.load(row.cards,row.manifest,row.synthetic);requireThat(value.digest===game.pack_digest,'PACK_DIGEST_INVALID',503);this.packs.set(value.digest,value);return value;
  }
  private async snapshot(c:pg.PoolClient,game:GameRow) {
    requireThat(game.snapshot_cipher,'SNAPSHOT_UNAVAILABLE',503);const pack=await this.pack(c,game);
    const value=immutableSnapshot(this.keys.decrypt<Snapshot>(game.snapshot_cipher,`game-snapshot:${game.room_id}:${game.id}:1`),pack);
    const ids=(await c.query<{member_id:string}>('SELECT member_id FROM game_participants WHERE room_id=$1 AND session_id=$2 ORDER BY member_id',[game.room_id,game.id])).rows.map(r=>r.member_id);
    requireThat(canonical(ids)===canonical(value.players.map(p=>p.id)),'SNAPSHOT_MEMBERSHIP_CHANGED',503);return {snapshot:value,pack};
  }
  private async names(c:pg.PoolClient,roomId:string) {return (await c.query<NameRow>('SELECT id,display_name FROM room_members WHERE room_id=$1',[roomId])).rows;}
  private async view(c:pg.PoolClient,game:GameRow,locale:Locale) {
    const round=await this.current(c,game);if(!round) return gameView(game,null);
    return gameView(game,publicRound(await this.pack(c,game),round.data,locale,await this.names(c,game.room_id)));
  }
  private async bump(c:pg.PoolClient,game:GameRow,activity:boolean) {
    const row=(await c.query<GameRow>('UPDATE game_sessions SET state=$2,pause_reason=$3,rev=rev+1,current_round=$4,updated_at=$5 WHERE id=$1 RETURNING *',[game.id,game.state,game.pause_reason,game.current_round,new Date(this.now)])).rows[0];
    Object.assign(game,row);await this.rooms.changed(c,game.room_id,activity);
  }
  private async consentRows(c:pg.PoolClient,game:GameRow,data:RoundData) {
    for(const offer of [data.invitation,data.action]) if(offer) for(let index=0;index<offer.actors.length;index++) await c.query('INSERT INTO game_consent_actors(room_id,session_id,round_id,offer_id,scope,member_id,role) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(offer_id,member_id) DO NOTHING',[game.room_id,game.id,data.plan.round_id,offer.offer_id,offer.scope,offer.actors[index],index===0?'primary':'secondary']);
  }
  private async save(c:pg.PoolClient,game:GameRow,row:RoundRow,data:RoundData,activity=true) {
    await c.query('UPDATE game_rounds SET state=$2,cipher=$3 WHERE id=$1',[row.id,data.state,this.keys.encrypt(data,`game-round:${game.room_id}:${game.id}:${row.id}:1`)]);await this.consentRows(c,game,data);await this.bump(c,game,activity);await this.queue(c,game,data);
  }
  private closeRound(data:RoundData,state:'completed'|'skipped'|'stopped') {
    if(!['completed','skipped','stopped'].includes(data.state)) data.state=state;data.condition=null;
    for(const scope of ['invitation','action'] as const) if(data[scope]) data[scope]={...data[scope]!,state:['expired','declined','completed','stopped'].includes(data[scope]!.state)?data[scope]!.state:state==='completed'?'completed':'stopped',acks:[]};
  }
  private async reconcile(c:pg.PoolClient,game:GameRow) {
    const round=await this.current(c,game);if(!round||!['pending','active'].includes(round.data.state)) return round;
    const before=canonical(round.data);for(const scope of ['invitation','action'] as const) if(round.data[scope]) round.data[scope]=reconcileConsent(round.data[scope]!,this.now);
    if([round.data.invitation,round.data.action].some(o=>o?.state==='expired')) this.closeRound(round.data,'skipped');
    if(canonical(round.data)!==before) {await this.save(c,game,round.row,round.data,false);await this.rooms.audit(c,game.room_id,null,'game_expire',randomUUID());}return round;
  }
  private async newRound(c:pg.PoolClient,game:GameRow,plan:RoundPlan) {
    const privatePair=plan.interaction==='pair_private';const data:RoundData={plan,state:privatePair||plan.requires_action_consent||plan.mode==='truth_or_dare'?'pending':'active',invitation:privatePair?proposeConsent(randomUUID(),plan.actors,'invitation',this.now):null,action:!privatePair&&plan.requires_action_consent&&plan.mode!=='truth_or_dare'?proposeConsent(randomUUID(),plan.actors,'action',this.now,this.now+180000):null,choice:null,condition:null};
    await c.query('INSERT INTO game_rounds(id,room_id,session_id,round_index,state,cipher,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)',[plan.round_id,game.room_id,game.id,plan.round_index,data.state,this.keys.encrypt(data,`game-round:${game.room_id}:${game.id}:${plan.round_id}:1`),new Date(this.now)]);
    const actors=plan.actors.length?plan.actors:[plan.primary_member_id];for(let i=0;i<actors.length;i++) await c.query('INSERT INTO game_round_actors VALUES($1,$2,$3,$4,$5)',[game.room_id,game.id,plan.round_id,actors[i],i===0?'primary':'secondary']);
    await this.consentRows(c,game,data);game.current_round=plan.round_index;await this.bump(c,game,true);await this.queue(c,game,data);return data;
  }
  private async present(c:pg.PoolClient,game:GameRow) {
    const rows=await c.query<{member_id:string;presence:string;removed_at:Date|null;slot:number|null}>(`SELECT p.member_id,m.presence,m.removed_at,m.slot FROM game_participants p JOIN room_members m ON m.room_id=p.room_id AND m.id=p.member_id WHERE p.room_id=$1 AND p.session_id=$2`,[game.room_id,game.id]);
    return rows.rows.length>=2&&rows.rows.every(r=>r.presence==='online'&&r.removed_at===null&&r.slot!==null);
  }
  async prepare(roomId:string,session:string|undefined,input:PrepareGame,requestId:string) {
    return this.mutate(roomId,session,input,requestId,'game_prepare',{host:true},async(c,a)=>{
      requireThat(input.expected_rev===revision(a.room.rev),'REVISION_CONFLICT',409);const current=await this.row(c,roomId);requireThat(!current||!['active','paused'].includes(current.state),'GAME_SETTINGS_LOCKED',409);
      const pack=this.provider();requireThat(pack&&(!pack.synthetic||this.allowSynthetic),'PACK_UNAVAILABLE',503);
      const members=await c.query('SELECT id FROM room_members WHERE room_id=$1 AND id=ANY($2::uuid[]) AND removed_at IS NULL AND slot IS NOT NULL',[roomId,input.players]);requireThat(members.rowCount===input.players.length,'INVALID_GAME_PLAYERS',400);
      let game:GameRow;
      if(current?.state==='waiting') {game=current;await c.query('UPDATE game_sessions SET mode=$2,round_count=$3,draft_cipher=$4 WHERE id=$1',[game.id,input.mode,input.round_count,this.keys.encrypt({players:[...input.players].sort()},`game-draft:${roomId}:${game.id}:1`)]);game.mode=input.mode;game.round_count=input.round_count;await this.bump(c,game,true);}
      else {
        const id=randomUUID(),cipher=this.keys.encrypt({players:[...input.players].sort()},`game-draft:${roomId}:${id}:1`);game=(await c.query<GameRow>(`INSERT INTO game_sessions(id,room_id,state,mode,round_count,draft_cipher,created_at,updated_at) VALUES($1,$2,'waiting',$3,$4,$5,$6,$6) RETURNING *`,[id,roomId,input.mode,input.round_count,cipher,new Date(this.now)])).rows[0]!;await this.rooms.changed(c,roomId,true);
      }
      return this.view(c,game,a.member.locale);
    });
  }
  async start(roomId:string,session:string|undefined,input:StartGame,requestId:string) {
    return this.mutate(roomId,session,input,requestId,'game_start',{host:true},async(c)=>{
      const game=await this.row(c,roomId);requireThat(game?.state==='waiting','GAME_NOT_WAITING',409);requireThat(input.draft_rev===revision(game.rev),'REVISION_CONFLICT',409);
      const pack=this.provider();requireThat(pack&&(!pack.synthetic||this.allowSynthetic),'PACK_UNAVAILABLE',503);const ids=this.draft(game).players;
      const rows=await c.query<{id:string;presence:string;slot:number|null;ready:boolean;cipher:Cipher;offer_version:string;offer_digest:string}>(`SELECT m.id,m.presence,m.slot,p.ready,p.cipher,e.offer_version,e.offer_digest FROM room_members m JOIN private_preferences p ON p.room_id=m.room_id AND p.owner_member_id=m.id JOIN entry_acceptances e ON e.room_id=m.room_id AND e.member_id=m.id WHERE m.room_id=$1 AND m.id=ANY($2::uuid[]) AND m.removed_at IS NULL`,[roomId,ids]);
      requireThat(rows.rowCount===ids.length&&rows.rows.every(r=>r.presence==='online'&&r.slot!==null),'ACTORS_UNAVAILABLE',409);requireThat(rows.rows.every(r=>r.ready),'SETUP_REQUIRED',409);
      const offer=this.rooms.options.offer();requireThat(offer&&rows.rows.every(r=>r.offer_version===offer.version&&r.offer_digest===offer.digest),'ENTRY_REACCEPT_REQUIRED',403);
      const players:Player[]=rows.rows.map(r=>{const own=this.keys.decrypt<{comfort:number;edges:Record<string,Edge>}>(r.cipher,`preferences:${roomId}:${r.id}:1`);return {id:r.id,comfort:own.comfort,edges:Object.fromEntries(Object.entries(own.edges).filter(([id])=>ids.includes(id)&&id!==r.id))};});
      const room=(await c.query<{meeting_context:'online'|'in_person'}>('SELECT meeting_context FROM rooms WHERE id=$1',[roomId])).rows[0]!;
      const snapshot=immutableSnapshot({schema:1,session_id:game.id,room_id:roomId,engine_revision:algorithmRevision,policy_revision:'RE-1',policy_digest:policyDigest,pack_digest:pack.digest,seed:randomBytes(32).toString('hex'),mode:game.mode,context:room.meeting_context,total_rounds:game.round_count,players,capabilities:[]},pack);
      const first=preflight(snapshot,pack)[0]!;
      await c.query('INSERT INTO game_packs VALUES($1,$2,$3,$4,$5) ON CONFLICT(digest) DO NOTHING',[pack.digest,pack.manifest,JSON.stringify(pack.cards),pack.synthetic,new Date(this.now)]);this.packs.set(pack.digest,pack);
      for(const id of ids) await c.query('INSERT INTO game_participants VALUES($1,$2,$3)',[roomId,game.id,id]);
      const cipher=this.keys.encrypt(snapshot,`game-snapshot:${roomId}:${game.id}:1`);await c.query('UPDATE game_sessions SET snapshot_cipher=$2,pack_digest=$3,state=\'active\' WHERE id=$1',[game.id,cipher,pack.digest]);game.snapshot_cipher=cipher;game.pack_digest=pack.digest;game.state='active';
      await this.newRound(c,game,first);return {session_id:game.id,state:'active',game_rev:revision(game.rev),snapshot_schema:1};
    });
  }
  async advance(roomId:string,session:string|undefined,gameId:string,input:RevisionMutation,requestId:string) {
    return this.mutate(roomId,session,input,requestId,'game_advance',{host:true,sessionId:gameId},async(c,a)=>{
      const game=await this.requireGame(c,roomId,gameId);await this.memberStateChanged(c,roomId);Object.assign(game,await this.requireGame(c,roomId,gameId));
      requireThat(game.state==='active','GAME_NOT_ACTIVE',409);requireThat(input.expected_rev===revision(game.rev),'REVISION_CONFLICT',409);const round=await this.reconcile(c,game);requireThat(round&&['completed','skipped','stopped'].includes(round.data.state),'ROUND_NOT_FINISHED',409);
      if(game.current_round===game.round_count) {game.state='completed';await this.bump(c,game,true);await this.queue(c,game,round.data);return this.view(c,game,a.member.locale);}
      const {snapshot,pack}=await this.snapshot(c,game);const history=(await c.query<RoundRow>('SELECT * FROM game_rounds WHERE session_id=$1 ORDER BY round_index',[game.id])).rows.map(r=>this.keys.decrypt<RoundData>(r.cipher,`game-round:${roomId}:${game.id}:${r.id}:1`).plan);
      await this.newRound(c,game,selectNextRound(snapshot,history,pack));return this.view(c,game,a.member.locale);
    });
  }
  async getCurrent(roomId:string,session:string|undefined) {
    return this.mapped(()=>this.rooms.transaction(async c=>{const a=await this.rooms.access(c,roomId,session,true,false);await this.memberStateChanged(c,roomId);const game=await this.row(c,roomId);requireThat(game,'GAME_NOT_FOUND',404);if(game.state==='active'||game.state==='paused') await this.snapshot(c,game);return this.view(c,game,a.member.locale);}));
  }
  private async target(c:pg.PoolClient,roomId:string,gameId:string,roundId:string,active=true) {
    const game=await this.requireGame(c,roomId,gameId);await this.memberStateChanged(c,roomId);Object.assign(game,await this.requireGame(c,roomId,gameId));
    if(active) requireThat(game.state==='active','GAME_NOT_ACTIVE',409);
    const round=await this.reconcile(c,game);requireThat(round?.row.id===roundId,'ROUND_STALE',409);return {game,...round};
  }
  private beginAction(data:RoundData) {
    if(data.plan.requires_action_consent&&!data.action&&(data.plan.mode!=='truth_or_dare'||data.choice)) {
      requireThat(!data.invitation||consentAllows(data.invitation,data.plan.actors[0]!,this.now),'CONSENT_NOT_ACTIVE',409);
      data.action=proposeConsent(randomUUID(),data.plan.actors,'action',this.now,data.invitation?.active_until??this.now+180000);
    }
  }
  private canFinish(data:RoundData,memberId:string) {
    requireThat(data.state==='active','ROUND_NOT_ACTIVE',409);
    if(data.plan.requires_action_consent) {
      requireThat(data.action&&consentAllows(data.action,memberId,this.now),'ACTION_CONSENT_REQUIRED');
      if(data.invitation) requireThat(consentAllows(data.invitation,memberId,this.now),'CONSENT_NOT_ACTIVE');
    } else requireThat(data.plan.primary_member_id===memberId,'ROUND_ACTOR_REQUIRED');
  }
  async response(roomId:string,session:string|undefined,gameId:string,roundId:string,input:RoundResponse,requestId:string) {
    // Both HTTP finish aliases share the same authenticated operation and request hash.
    const {kind,...finishInput}=input;
    if(kind==='finish') return this.finish(roomId,session,gameId,roundId,finishInput,requestId);
    return this.mutate(roomId,session,input,requestId,'game_response',{sessionId:gameId,roundId,actor:true,safety:input.kind!=='accept'},async(c,a)=>{
      const {game,row,data}=await this.target(c,roomId,gameId,roundId,input.kind==='accept');
      if(input.kind==='accept') {
        requireThat(['pending','active'].includes(data.state),'CONSENT_TERMINAL',409);await this.snapshot(c,game);
        requireThat(input.scope&&data[input.scope],'CONSENT_SCOPE_INVALID',409);const scope=input.scope;
        data[scope]=consentResponse(data[scope]!,a.member.id,'accept',this.now,{offer_id:input.offer_id!,scope,proposal_revision:input.proposal_revision!});
        if(scope==='invitation'&&data.invitation?.state==='active') this.beginAction(data);
        if(data.action?.state==='active') data.state='active';
      } else {
        for(const scope of ['invitation','action'] as const) if(data[scope]) data[scope]=consentResponse(data[scope]!,a.member.id,input.kind,this.now);
        this.closeRound(data,input.kind==='skip'?'skipped':'stopped');
      }
      await this.save(c,game,row,data,true);return {rev:revision(game.rev),request_id:requestId};
    });
  }
  async choice(roomId:string,session:string|undefined,gameId:string,roundId:string,input:RoundChoice,requestId:string) {
    return this.mutate(roomId,session,input,requestId,'game_choice',{sessionId:gameId,roundId,actor:true,role:'primary'},async(c,a)=>{
      const {game,row,data}=await this.target(c,roomId,gameId,roundId);requireThat(data.plan.mode==='truth_or_dare','WRONG_GAME_MODE',409);requireThat(['pending','active'].includes(data.state),'ROUND_NOT_ACTIVE',409);
      if(data.invitation) requireThat(consentAllows(data.invitation,a.member.id,this.now),'CONSENT_NOT_ACTIVE');
      requireThat(!data.choice||data.choice===input.side,'CHOICE_LOCKED',409);
      if(!data.choice) {data.choice=input.side;this.beginAction(data);if(!data.plan.requires_action_consent) data.state='active';await this.save(c,game,row,data,true);}
      return {rev:revision(game.rev),request_id:requestId};
    });
  }
  async condition(roomId:string,session:string|undefined,gameId:string,roundId:string,input:YesButCondition,requestId:string) {
    return this.mutate(roomId,session,input,requestId,'game_condition',{sessionId:gameId,roundId,actor:true,role:'secondary'},async(c,a)=>{
      const {game,row,data}=await this.target(c,roomId,gameId,roundId);requireThat(data.plan.mode==='yes_but'&&data.action&&data.state==='pending','CONDITION_NOT_ALLOWED',409);
      if(data.invitation) requireThat(consentAllows(data.invitation,a.member.id,this.now),'CONSENT_NOT_ACTIVE');
      requireThat(input.offer_id===data.action.offer_id&&input.proposal_revision===data.action.proposal_revision,'CONSENT_PROPOSAL_STALE',409);
      requireThat(input.condition.trim().length>0&&[...input.condition].length<=2000&&!/[\p{Cc}\u202A-\u202E\u2066-\u2069]/u.test(input.condition),'INVALID_REQUEST',400);
      data.action=replacePendingAction(data.action,this.now);data.condition={round_id:roundId,author_member_id:a.member.id,condition:input.condition,request_id:input.request_id,proposal_revision:data.action.proposal_revision};
      await this.save(c,game,row,data,true);return {rev:revision(game.rev),request_id:requestId};
    });
  }
  async finish(roomId:string,session:string|undefined,gameId:string,roundId:string,input:{request_id:string},requestId:string) {
    return this.mutate(roomId,session,input,requestId,'game_finish',{sessionId:gameId,roundId,actor:true,safety:true},async(c,a)=>{
      const {game,row,data}=await this.target(c,roomId,gameId,roundId);this.canFinish(data,a.member.id);this.closeRound(data,'completed');await this.save(c,game,row,data,true);return {rev:revision(game.rev),request_id:requestId};
    });
  }
  async stop(roomId:string,session:string|undefined,gameId:string,input:{request_id:string},requestId:string,hostAbort=false) {
    return this.mutate(roomId,session,input,requestId,'game_stop',{sessionId:gameId,safety:true,...(hostAbort?{host:true}:{participant:true})},async(c)=>{
      const game=await this.requireGame(c,roomId,gameId);
      if(!['completed','aborted'].includes(game.state)) {const round=await this.current(c,game);game.state='aborted';game.pause_reason=null;if(round) {this.closeRound(round.data,'stopped');await this.save(c,game,round.row,round.data,true);}else await this.bump(c,game,true);}
      return {rev:revision(game.rev),request_id:requestId};
    });
  }
  async pause(roomId:string,session:string|undefined,gameId:string,input:RevisionMutation,requestId:string) {
    return this.mutate(roomId,session,input,requestId,'game_pause',{sessionId:gameId,participant:true,safety:true},async(c,a)=>{
      const game=await this.requireGame(c,roomId,gameId);requireThat(['active','paused'].includes(game.state),'GAME_NOT_ACTIVE',409);game.state='paused';game.pause_reason='safety';const round=await this.current(c,game);
      if(round) {this.closeRound(round.data,'stopped');await this.save(c,game,round.row,round.data,true);}else await this.bump(c,game,true);return this.view(c,game,a.member.locale);
    });
  }
  async resume(roomId:string,session:string|undefined,gameId:string,input:RevisionMutation,requestId:string) {
    return this.mutate(roomId,session,input,requestId,'game_resume',{sessionId:gameId,host:true},async(c,a)=>{
      const game=await this.requireGame(c,roomId,gameId);requireThat(game.state==='paused','GAME_NOT_PAUSED',409);requireThat(input.expected_rev===revision(game.rev),'REVISION_CONFLICT',409);requireThat(await this.present(c,game),'ACTORS_UNAVAILABLE',409);await this.snapshot(c,game);
      await this.reconcile(c,game);game.state='active';game.pause_reason=null;await this.bump(c,game,true);return this.view(c,game,a.member.locale);
    });
  }
  private invitationView(game:GameRow,data:RoundData,memberId:string,locale:Locale,names:NameRow[]):PairInvitation {
    const offer=data.invitation;requireThat(offer&&['pending','active'].includes(offer.state),'CONSENT_NOT_ACTIVE',404);
    const partner=names.find(n=>n.id===offer.actors.find(id=>id!==memberId))?.display_name??'';
    const words={ru:'Приватное приглашение. Можно отказаться. Другой участник: ',en:'Private invitation. You may decline. Other participant: ',tr:'Özel davet. Reddedebilirsiniz. Diğer katılımcı: '};
    return {offer_id:offer.offer_id,session_id:game.id,round_id:data.plan.round_id,expires_at:new Date(offer.active_until??offer.deadline).toISOString(),invitation:words[locale]+partner,own_state:offer.acks.includes(memberId)?'accepted':'pending',proposal_revision:offer.proposal_revision,consent_scope:'invitation'};
  }
  private actionView(data:RoundData,memberId:string):ActionConsentState {
    const offer=data.action;requireThat(offer,'ACTION_CONSENT_UNAVAILABLE',404);
    return {offer_id:offer.offer_id,round_id:data.plan.round_id,consent_scope:'action',proposal_revision:offer.proposal_revision,expires_at:new Date(offer.active_until??offer.deadline).toISOString(),own_state:offer.acks.includes(memberId)?'accepted':'pending',state:offer.state};
  }
  private promptView(game:GameRow,data:RoundData,memberId:string,locale:Locale,pack:FrozenPack,names:NameRow[]):PrivatePrompt {
    requireThat(data.invitation&&consentAllows(data.invitation,memberId,this.now),'CONSENT_NOT_ACTIVE',404);
    const waiting={ru:'Выберите правду или действие. Задание появится после выбора.',en:'Choose truth or dare. The prompt appears after the choice.',tr:'Doğruluk veya cesaret seçin. Görev seçimden sonra görünür.'};
    const prompt=privateText(pack,data,locale,names)??waiting[locale];
    return {offer_id:data.invitation.offer_id,session_id:game.id,round_id:data.plan.round_id,state:'active',card_id:data.plan.card_id,card_revision:data.plan.card_revision,actors:[...data.plan.actors],prompt,expires_at:new Date(data.invitation.active_until!).toISOString(),proposal_revision:data.action?.proposal_revision??1};
  }
  async readTarget(roomId:string,session:string|undefined,gameId:string,roundId:string,kind:'invitation'|'private'|'action'|'condition') {
    return this.mapped(()=>this.rooms.transaction(async c=>{
      const a=await this.rooms.access(c,roomId,session);requireThat((await c.query('SELECT 1 FROM game_round_actors WHERE room_id=$1 AND session_id=$2 AND round_id=$3 AND member_id=$4',[roomId,gameId,roundId,a.member.id])).rowCount===1,'NOT_FOUND',404);
      const {game,data}=await this.target(c,roomId,gameId,roundId,kind!=='action');
      if(kind==='action') return this.actionView(data,a.member.id);
      await this.snapshot(c,game);const names=await this.names(c,roomId);
      if(kind==='invitation') return this.invitationView(game,data,a.member.id,a.member.locale,names);
      requireThat(['pending','active'].includes(data.state),'CONSENT_NOT_ACTIVE',404);
      if(kind==='private') return this.promptView(game,data,a.member.id,a.member.locale,await this.pack(c,game),names);
      if(data.invitation) requireThat(consentAllows(data.invitation,a.member.id,this.now),'CONSENT_NOT_ACTIVE',404);
      requireThat(data.condition,'NOT_FOUND',404);return data.condition;
    }));
  }
  async locked(c:pg.PoolClient,roomId:string) {return Boolean((await c.query('SELECT 1 FROM game_sessions WHERE room_id=$1 AND state IN (\'active\',\'paused\')',[roomId])).rowCount);}
  async purge(c:pg.PoolClient,roomId:string) {await c.query('DELETE FROM game_sessions WHERE room_id=$1',[roomId]);await c.query('DELETE FROM game_private_streams WHERE room_id=$1',[roomId]);}
  async removing(c:pg.PoolClient,roomId:string,memberId:string) {
    const game=await this.row(c,roomId);if(!game||!['active','paused'].includes(game.state)) return;
    if(!(await c.query('SELECT 1 FROM game_participants WHERE room_id=$1 AND session_id=$2 AND member_id=$3',[roomId,game.id,memberId])).rowCount) return;
    const round=await this.current(c,game);game.state='paused';game.pause_reason='safety';if(round) {this.closeRound(round.data,'skipped');await this.save(c,game,round.row,round.data,false);}else await this.bump(c,game,false);
    await this.rooms.audit(c,roomId,memberId,'game_transport',randomUUID());
  }
  async memberStateChanged(c:pg.PoolClient,roomId:string) {
    await c.query('DELETE FROM game_outbox_refs WHERE room_id=$1 AND created_at<=$2',[roomId,new Date(this.now-DAY)]);
    const game=await this.row(c,roomId);if(!game||!['active','paused'].includes(game.state)) return;await this.reconcile(c,game);
    const present=await this.present(c,game);
    if(!present&&game.state==='active') {
      game.state='paused';game.pause_reason='transport';const round=await this.current(c,game);
      if(round) {this.closeRound(round.data,'skipped');await this.save(c,game,round.row,round.data,false);} else await this.bump(c,game,false);
      await this.rooms.audit(c,roomId,null,'game_transport',randomUUID());
    } else if(present&&game.state==='paused'&&game.pause_reason==='transport') {game.state='active';game.pause_reason=null;await this.bump(c,game,false);await this.rooms.audit(c,roomId,null,'game_transport',randomUUID());}
  }
  private kinds(game:GameRow,data:RoundData):string[] {
    if(game.state!=='active'||!['pending','active'].includes(data.state)) return ['cleared'];
    const kinds:string[]=[];
    if(data.invitation&&data.invitation.state==='pending') kinds.push('invitation');
    if(data.invitation?.state==='active') kinds.push('prompt');
    if(data.action?.state==='pending') kinds.push('action');
    if(data.condition) kinds.push('condition');return kinds.length?kinds:['cleared'];
  }
  private async queue(c:pg.PoolClient,game:GameRow,data:RoundData) {
    const actors=data.plan.actors.length?data.plan.actors:[data.plan.primary_member_id];
    await c.query('SELECT pg_advisory_xact_lock(746826402)');
    for(const memberId of actors) for(const kind of this.kinds(game,data)) {
      const counter=(await c.query<{rev:string}>('INSERT INTO game_private_streams(room_id,member_id,rev) VALUES($1,$2,1) ON CONFLICT(room_id,member_id) DO UPDATE SET rev=game_private_streams.rev+1 RETURNING rev',[game.room_id,memberId])).rows[0]!;
      await c.query('INSERT INTO game_outbox_refs(event_id,room_id,session_id,round_id,member_id,stream_rev,game_rev,kind,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[randomUUID(),game.room_id,game.id,data.plan.round_id,memberId,counter.rev,game.rev,kind,new Date(this.now)]);
    }
    await this.rooms.boundEvents(c,'game_outbox_refs',DAY);
  }
  async socketView(c:pg.PoolClient,roomId:string,memberId:string,locale:Locale,after:number):Promise<{game:GameView|null;privateEvents:PrivateReference[]}> {
    const game=await this.row(c,roomId);if(!game) return {game:null,privateEvents:[]};await this.reconcile(c,game);
    if(game.state==='active'||game.state==='paused') await this.snapshot(c,game);
    const round=await this.current(c,game);
    if(round&&(round.data.plan.actors.includes(memberId)||round.data.plan.primary_member_id===memberId)) {
      if(!(await c.query('SELECT 1 FROM game_outbox_refs WHERE room_id=$1 AND session_id=$2 AND round_id=$3 AND member_id=$4 AND game_rev=$5 LIMIT 1',[roomId,game.id,round.row.id,memberId,game.rev])).rowCount) await this.queue(c,game,round.data);
    }
    // Include old recipients/rounds: a finish+advance between ticks must still clear them.
    const refs=(await c.query<{event_id:string;stream_rev:string}>('SELECT event_id,stream_rev FROM game_outbox_refs WHERE room_id=$1 AND member_id=$2 AND stream_rev>$3 ORDER BY stream_rev LIMIT 32',[roomId,memberId,after])).rows;
    const privateEvents=refs.map(ref=>({eventId:ref.event_id,revision:revision(ref.stream_rev)}));
    return {game:await this.view(c,game,locale),privateEvents};
  }
  /** Read-only reconstruction, called while Rooms holds the revoke/dispatch fence. */
  async privateDelivery(c:pg.PoolClient,roomId:string,memberId:string,locale:Locale,eventId:string):Promise<PrivateDelivery|null> {
    const ref=(await c.query<{event_id:string;stream_rev:string;session_id:string;round_id:string;game_rev:string;kind:string}>('SELECT event_id,stream_rev,session_id,round_id,game_rev,kind FROM game_outbox_refs WHERE room_id=$1 AND member_id=$2 AND event_id=$3 AND created_at>$4',[roomId,memberId,eventId,new Date(this.now-DAY)])).rows[0];
    if(!ref) return null;
    const clear:PrivateDelivery={eventId:ref.event_id,revision:revision(ref.stream_rev),type:'game.private_cleared',payload:{session_id:ref.session_id,round_id:ref.round_id,private_available:false}};
    const game=await this.row(c,roomId);if(!game||game.id!==ref.session_id||game.rev!==ref.game_rev||game.state!=='active') return clear;
    const round=await this.current(c,game);
    if(!round||round.row.id!==ref.round_id||!round.data.plan.actors.includes(memberId)||!['pending','active'].includes(round.data.state)) return clear;
    const data=round.data;
    if([data.invitation,data.action].some(o=>o&&reconcileConsent(o,this.now).state==='expired')) return clear;
    if(!this.kinds(game,data).includes(ref.kind)||ref.kind==='cleared') return clear;
    await this.snapshot(c,game);const names=await this.names(c,roomId);let type:string,payload:unknown;
    if(ref.kind==='invitation') {type='game.consent_requested';payload=this.invitationView(game,data,memberId,locale,names);}
    else if(ref.kind==='prompt') {type='game.private_prompt';payload=this.promptView(game,data,memberId,locale,await this.pack(c,game),names);}
    else if(ref.kind==='action') {type='game.action_consent_requested';const state=this.actionView(data,memberId);payload={offer_id:state.offer_id,round_id:state.round_id,consent_scope:state.consent_scope,proposal_revision:state.proposal_revision,expires_at:state.expires_at,own_state:state.own_state};}
    else if(ref.kind==='condition') {if(data.invitation&&!consentAllows(data.invitation,memberId,this.now)) return clear;type='game.pair_condition';payload=data.condition;}
    else return clear;
    // No await may separate this final clock fence from returning to synchronous enqueue.
    if([data.invitation,data.action].some(o=>o&&reconcileConsent(o,this.now).state==='expired')) return clear;
    return {eventId:ref.event_id,revision:revision(ref.stream_rev),type,payload};
  }
  /** Local trusted rollback primitive; never exposed on the consumer HTTP surface. */
  async quiesce() {
    const rooms=(await this.rooms.options.pool.query<{room_id:string}>('SELECT DISTINCT room_id FROM game_sessions WHERE state IN (\'waiting\',\'active\',\'paused\') ORDER BY room_id')).rows;
    for(const {room_id} of rooms) await this.rooms.transaction(async c=>{
      await c.query('SELECT id FROM rooms WHERE id=$1 FOR UPDATE',[room_id]);
      const games=(await c.query<GameRow>('SELECT * FROM game_sessions WHERE room_id=$1 AND state IN (\'waiting\',\'active\',\'paused\') FOR UPDATE',[room_id])).rows;
      for(const game of games) {
        await c.query('DELETE FROM game_rounds WHERE session_id=$1',[game.id]);
        await c.query("UPDATE game_sessions SET state='aborted',pause_reason=NULL,current_round=0,snapshot_cipher=NULL,rev=rev+1,updated_at=$2 WHERE id=$1",[game.id,new Date(this.now)]);
        await this.rooms.audit(c,room_id,null,'game_quiesce',randomUUID());
      }
      if(games.length) await this.rooms.changed(c,room_id,false);
    });
  }
}
