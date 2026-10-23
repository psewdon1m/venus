import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {once} from 'node:events';
import pg from 'pg';
import WebSocket from 'ws';
import {startRuntime,client,request,cert,setClock} from '../../../tests/p02/harness.mjs';
import {Keyring,DeletionLedger,hash,canonical} from './security.js';
import {sealBackup,openBackup} from './backup.js';
import {timers,Rooms} from './rooms.js';
import {migrate} from './migrations.js';
import {chromium,expect as browserExpect,type Browser,type Page} from '@playwright/test';

describe('EXIT-P02 real PostgreSQL + process HTTP/WS',()=>{
  let runtime:Awaited<ReturnType<typeof startRuntime>>,pool:pg.Pool,clock:number;
  const records:{id:string;status:string;detail?:unknown}[]=[];
  const sockets=new Set<WebSocket>();
  let browser:Browser|undefined;
  function advance(ms:number) {clock+=ms;setClock(clock);}
  const mark=(id:string,detail?:unknown)=>records.push({id,status:'PASS',...(detail?{detail}:{})});
  beforeAll(async()=>{
    clock=Number(readFileSync(process.env.P02_CLOCK_FILE!,'utf8'));
    pool=new pg.Pool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:'venus',database:'venus',password:readFileSync(process.env.DB_PASSWORD_FILE!,'utf8').trim(),max:12});
    runtime=await startRuntime();
  });
  afterAll(async()=>{
    for(const ws of sockets) ws.terminate();
    if(browser) await browser.close();if(runtime) await runtime.close();if(pool) await pool.end();
    mkdirSync('.artifacts/p02',{recursive:true});
    writeFileSync('.artifacts/p02/integration-report.json',JSON.stringify({source_sha:process.env.P02_SOURCE_SHA,source_dirty:process.env.P02_SOURCE_DIRTY==='1',synthetic:true,tests:records,all_expected_checks:22,status:records.length===22?'PASS':'FAIL'},null,2));
  });
  async function create(locale='ru',displayName='host') {
    const host=await client(runtime.origin);const body={meeting_context:'online',locale,name:displayName,idempotency_key:randomUUID(),entry_acceptance:host.acceptance};
    const result=await host.call('/api/v1/rooms',{method:'POST',body});expect(result.status,result.text).toBe(201);
    const roomId=result.body.room_id,invite=new URL(result.body.invite_url).hash.slice('#invite='.length);
    return {host,roomId,invite,body,result};
  }
  async function join(room:Awaited<ReturnType<typeof create>>,locale='en',displayName='guest') {
    const guest=await client(runtime.origin);const body={invite_token:room.invite,locale,display_name:displayName,idempotency_key:randomUUID(),entry_acceptance:guest.acceptance};
    const result=await guest.call(`/api/v1/rooms/${room.roomId}/join`,{method:'POST',body});return {guest,result,body};
  }
  async function snapshot(c:Awaited<ReturnType<typeof client>>,roomId:string) {const r=await c.call('/api/v1/rooms/'+roomId);expect(r.status,r.text).toBe(200);return r.body;}
  async function ticket(c:Awaited<ReturnType<typeof client>>,roomId:string) {const r=await c.call(`/api/v1/rooms/${roomId}/ws-ticket`,{method:'POST',body:{request_id:randomUUID()}});expect(r.status,r.text).toBe(200);return r.body.ticket;}
  async function socket(c:Awaited<ReturnType<typeof client>>,roomId:string,value:string,origin=runtime.origin) {
    const ws=new WebSocket(runtime.origin.replace('https:','wss:')+`/api/v1/rooms/${roomId}/ws`,{ca:cert,origin,headers:{cookie:c.cookies}});sockets.add(ws);
    return new Promise<{ws:WebSocket;view?:Record<string,unknown>;code?:number}>((resolve,reject)=>{
      let settled=false;
      ws.on('open',()=>ws.send(JSON.stringify({type:'auth',ticket:value})));
      ws.on('message',b=>{const frame=JSON.parse(b.toString());if(frame.type==='room.snapshot'&&!settled) {settled=true;resolve({ws,view:frame});}});
      ws.on('close',code=>{sockets.delete(ws);if(!settled) {settled=true;resolve({ws,code});}});
      ws.on('unexpected-response',(_request,response)=>{response.resume();if(!settled) {settled=true;resolve({ws,code:response.statusCode});}ws.terminate();});
      ws.on('error',error=>{if(!settled) {settled=true;reject(error);}});
    });
  }
  it('runs migration idempotently and enforces SQL slot/room constraints',async()=>{
    await migrate(pool,new URL('../migrations/',import.meta.url));await migrate(pool,new URL('../migrations/',import.meta.url));
    const r=await pool.query('SELECT generation FROM venus_schema_migrations');expect(r.rows).toEqual([{generation:1}]);
    const original=(await pool.query('SELECT sha256 FROM venus_schema_migrations WHERE generation=1')).rows[0].sha256;
    try {
      await pool.query("UPDATE venus_schema_migrations SET sha256='tampered' WHERE generation=1");
      await expect(migrate(pool,new URL('../migrations/',import.meta.url))).rejects.toThrow('checksum');
      expect((await pool.query('SELECT sha256 FROM venus_schema_migrations WHERE generation=1')).rows[0].sha256).toBe('tampered');
    } finally {await pool.query('UPDATE venus_schema_migrations SET sha256=$1 WHERE generation=1',[original]);}
    try {
      await pool.query("INSERT INTO venus_schema_migrations VALUES(2,'unknown')");
      await expect(migrate(pool,new URL('../migrations/',import.meta.url))).rejects.toThrow('Unsupported');
      expect((await pool.query('SELECT generation FROM venus_schema_migrations ORDER BY generation')).rows).toEqual([{generation:1},{generation:2}]);
    } finally {await pool.query('DELETE FROM venus_schema_migrations WHERE generation=2');}
    await pool.query('ALTER TABLE audit_events RENAME TO audit_events_test_missing');
    try {expect((await request(runtime.origin,'/health/ready')).status).toBe(503);expect((await request(runtime.origin,'/health/live')).status).toBe(200);}
    finally {await pool.query('ALTER TABLE audit_events_test_missing RENAME TO audit_events');}
    expect((await request(runtime.origin,'/health/ready')).status).toBe(200);
    const room=await create();
    await expect(pool.query(`INSERT INTO room_members(room_id,id,display_name,locale,role,slot,heartbeat_at,reserved_until) VALUES($1,$2,'bad','ru','member',9,now(),now())`,[room.roomId,randomUUID()])).rejects.toMatchObject({code:'23514'});
    await expect(pool.query(`INSERT INTO room_members(room_id,id,display_name,locale,role,slot,heartbeat_at,reserved_until) VALUES($1,$2,'bad','ru','member',1,now(),now())`,[room.roomId,randomUUID()])).rejects.toMatchObject({code:'23505'});
    await expect(pool.query('UPDATE rooms SET host_member_id=$2 WHERE id=$1',[room.roomId,randomUUID()])).rejects.toMatchObject({code:'23503'});
    mark('P02-MIGRATION',{upgrade_from_generation:0,to_generation:1,repeat_noop:true,checksum_mismatch_rejected:true,unknown_generation_rejected:true});
  });
  it('wins exactly seven guest admissions plus host in 100 real concurrent races',async()=>{
    for(let i=0;i<100;i++) {
      advance(120000);const room=await create();
      const results=await Promise.all(Array.from({length:12},(_,j)=>join(room,'en',`race-${i}-${j}`)));
      expect(results.filter(r=>r.result.status===200)).toHaveLength(7);
      expect(results.filter(r=>r.result.status===409)).toHaveLength(5);
      expect(results.filter(r=>r.result.status===409).every(r=>r.result.body.code==='ROOM_FULL')).toBe(true);
      const view=await snapshot(room.host,room.roomId);expect(view.members).toHaveLength(8);expect(new Set(view.members.map((m:{id:string})=>m.id)).size).toBe(8);
      expect(view.members.filter((m:{role:string})=>m.role==='host')).toHaveLength(1);
      const rows=await pool.query('SELECT id,slot FROM room_members WHERE room_id=$1',[room.roomId]);expect(rows.rowCount).toBe(8);expect(rows.rows.every(r=>r.slot>=1&&r.slot<=8)).toBe(true);
    }
    mark('P02-CAPACITY',{races:100,concurrent_guests:12,successful_identities:8});
  });
  it('separates independent identities, host powers, CSRF/Origin and strict schema',async()=>{
    advance(120000);const room=await create('ru','<script>NAME_CANARY</script>');const {guest,result}=await join(room,'tr');expect(result.status).toBe(200);
    const view=await snapshot(room.host,room.roomId);
    const payload={meeting_context:'in_person',expected_rev:view.room_rev,idempotency_key:randomUUID()};
    expect((await guest.call(`/api/v1/rooms/${room.roomId}/context`,{method:'PATCH',body:payload})).body.code).toBe('HOST_REQUIRED');
    expect((await room.host.call(`/api/v1/rooms/${room.roomId}/context`,{method:'PATCH',body:payload,headers:{origin:'https://attacker.invalid'}})).body.code).toBe('ORIGIN_FORBIDDEN');
    expect((await room.host.call(`/api/v1/rooms/${room.roomId}/context`,{method:'PATCH',body:payload,headers:{'x-csrf-token':''}})).body.code).toBe('CSRF_FORBIDDEN');
    expect((await request(runtime.origin,`/api/v1/rooms/${room.roomId}`)).status).toBe(401);
    const other=await create();expect((await guest.call(`/api/v1/rooms/${other.roomId}/me/preferences`)).status).toBe(401);
    expect((await room.host.call(`/api/v1/rooms/${room.roomId}/me/preferences`,{method:'PUT',body:{comfort:4,edges:{[other.result.body.me.id]:'crush'},expected_rev:0,idempotency_key:randomUUID()}})).body.code).toBe('INVALID_EDGE_SCOPE');
    expect((await guest.call(`/api/v1/rooms/${room.roomId}/me`,{method:'PATCH',body:{expected_rev:view.room_rev,idempotency_key:randomUUID(),locale:'ru',role:'host'}})).status).toBe(400);
    const cookie=room.result.headers['set-cookie'].find((v:string)=>v.startsWith('venus_room_session='));expect(cookie).toMatch(/HttpOnly/);expect(cookie).toMatch(/Secure/);expect(cookie).toMatch(/SameSite=Strict/);
    expect((await guest.call(`/api/v1/rooms/${room.roomId}/invite`)).body.code).toBe('HOST_REQUIRED');
    expect((await room.host.call(`/api/v1/rooms/${room.roomId}/invite`)).body.invite_url).toBe(room.result.body.invite_url);
    const js=await request(runtime.origin,'/');expect(js.headers['content-security-policy']).toContain("script-src 'self'");
    expect(JSON.stringify(view)).not.toMatch(/comfort|edges|crush|seed|weight/);
    mark('P02-ACL');
  });
  it('replays only the authorized original mutation, conflicts on changed body/stale revision',async()=>{
    advance(120000);const room=await create();
    const replay=await room.host.call('/api/v1/rooms',{method:'POST',body:room.body});expect(replay.status).toBe(201);expect(replay.body).toEqual(room.result.body);
    const view=await snapshot(room.host,room.roomId);const input={meeting_context:'in_person',expected_rev:view.room_rev,idempotency_key:randomUUID()};
    const first=await room.host.call(`/api/v1/rooms/${room.roomId}/context`,{method:'PATCH',body:input});expect(first.status).toBe(200);
    const second=await room.host.call(`/api/v1/rooms/${room.roomId}/context`,{method:'PATCH',body:input});expect(second.body).toEqual(first.body);
    const conflict=await room.host.call(`/api/v1/rooms/${room.roomId}/context`,{method:'PATCH',body:{...input,meeting_context:'online'}});expect(conflict.body.code).toBe('IDEMPOTENCY_CONFLICT');
    const stale=await room.host.call(`/api/v1/rooms/${room.roomId}/context`,{method:'PATCH',body:{...input,idempotency_key:randomUUID()}});expect(stale.body.code).toBe('REVISION_CONFLICT');
    mark('P02-IDEMPOTENCY');
  });
  it('stores own preferences encrypted and host can see only guest setup readiness',async()=>{
    advance(120000);const room=await create();const {guest,result}=await join(room);const guestId=result.body.me.id,hostId=room.result.body.me.id;
    const put=await guest.call(`/api/v1/rooms/${room.roomId}/me/preferences`,{method:'PUT',body:{comfort:4,edges:{[hostId]:'crush'},expected_rev:0,idempotency_key:randomUUID()}});expect(put.status,put.text).toBe(200);
    expect(put.body.comfort).toBe(4);expect(put.body.edges[hostId]).toEqual({relation:'crush',explicit:true});
    const hostPrefs=await room.host.call(`/api/v1/rooms/${room.roomId}/me/preferences`);expect(hostPrefs.body.owner_member_id).toBe(hostId);expect(hostPrefs.body.edges[guestId]).toEqual({relation:'friendship',explicit:false});
    const view=await snapshot(room.host,room.roomId);expect(view.members.find((m:{id:string})=>m.id===guestId).setup_ready).toBe(true);expect(JSON.stringify(view)).not.toMatch(/comfort|edges|crush/);
    const cipher=await pool.query('SELECT * FROM private_preferences WHERE room_id=$1 AND owner_member_id=$2',[room.roomId,guestId]);expect(cipher.rows[0]).not.toHaveProperty('comfort');expect(cipher.rows[0]).not.toHaveProperty('edges');expect(JSON.stringify(cipher.rows[0])).not.toContain('"relation":"crush"');
    const keys=Keyring.fromFile(process.env.KEYRING_FILE!);expect(()=>keys.decrypt(cipher.rows[0].cipher,`preferences:${room.roomId}:${hostId}:1`)).toThrow();
    const before=await guest.call(`/api/v1/rooms/${room.roomId}/me/preferences`);await runtime.restart();const after=await guest.call(`/api/v1/rooms/${room.roomId}/me/preferences`);expect(after.body).toEqual(before.body);
    mark('P02-PREFERENCES-RESTART');
  });
  it('consumes WS tickets once, rejects expiry/foreign origin and fences duplicate sockets',async()=>{
    advance(120000);const room=await create();const value=await ticket(room.host,room.roomId);
    const guest=await join(room),other=await create();
    expect((await socket(guest.guest,room.roomId,value)).code).toBe(4401);
    expect((await socket(other.host,room.roomId,value)).code).toBe(4401);
    const anonymous=await client(runtime.origin);expect((await socket(anonymous,room.roomId,value)).code).toBe(4401);
    const foreignTicket=await ticket(other.host,other.roomId);expect((await socket(room.host,room.roomId,foreignTicket)).code).toBe(4401);
    const first=await socket(room.host,room.roomId,value);expect(first.view?.type).toBe('room.snapshot');
    expect((await socket(room.host,room.roomId,value)).code).toBe(4401);
    const closed=once(first.ws,'close');const second=await socket(room.host,room.roomId,await ticket(room.host,room.roomId));expect((await closed)[0]).toBe(4409);expect(second.view).toBeTruthy();
    expect((await socket(room.host,room.roomId,await ticket(room.host,room.roomId),'https://attacker.invalid')).code).toBe(403);
    const expiring=await ticket(room.host,room.roomId);advance(60000);expect((await socket(room.host,room.roomId,expiring)).code).toBe(4401);
    second.ws.close();mark('P02-WS-TICKETS',{guest_cookie_host_ticket_denied:true,foreign_room_cookie_denied:true,foreign_room_ticket_denied:true,unauth_denied:true,replayed_denied:true,expired_denied:true,bad_origin_denied:true});
  });
  it('checks presence/reservation/grace deadline boundaries and late heartbeat recovery',async()=>{
    advance(120000);const room=await create(),hostId=room.result.body.me.id;
    const guest=await join(room);expect(guest.result.status).toBe(200);const guestId=guest.result.body.me.id;
    const keys=Keyring.fromFile(process.env.KEYRING_FILE!),ledger=new DeletionLedger(process.env.DELETION_LEDGER_FILE!);
    const service=new Rooms({pool,keys,ledger,origin:runtime.origin,offer:()=>({version:room.host.acceptance.offer_version,digest:room.host.acceptance.offer_digest,text:{ru:'test',en:'test',tr:'test'},synthetic:true}),now:()=>clock});
    const connected=await socket(room.host,room.roomId,await ticket(room.host,room.roomId));
    const row=(await pool.query('SELECT m.*,s.token_hash FROM room_members m JOIN room_sessions s ON s.room_id=m.room_id AND s.member_id=m.id WHERE m.room_id=$1 AND m.id=$2',[room.roomId,hostId])).rows[0];
    const grant={roomId:room.roomId,memberId:hostId,generation:Number(row.socket_generation),sessionHash:row.token_hash};
    const state=async()=>(await pool.query('SELECT presence,slot,role FROM room_members WHERE room_id=$1 AND id=$2',[room.roomId,hostId])).rows[0];
    advance(timers.presence-1);await service.maintain();expect((await state()).presence).toBe('online');
    advance(1);await service.maintain();expect((await state()).presence).toBe('reconnecting');
    const prior=(await pool.query('SELECT rev,last_activity_at FROM rooms WHERE id=$1',[room.roomId])).rows[0];
    await service.liveGrant(grant,true);expect((await state()).presence).toBe('online');
    const recovered=(await pool.query('SELECT rev,last_activity_at FROM rooms WHERE id=$1',[room.roomId])).rows[0];expect(Number(recovered.rev)).toBeGreaterThan(Number(prior.rev));expect(recovered.last_activity_at).toEqual(prior.last_activity_at);
    const ended=once(connected.ws,'close');connected.ws.close();await ended;await new Promise(resolve=>setTimeout(resolve,30));
    const disconnectedAt=clock;advance(timers.reservation-1);await service.maintain();expect((await state()).slot).not.toBeNull();
    advance(1);await service.maintain();expect((await state()).slot).toBeNull();expect((await state()).presence).toBe('inactive');
    advance(timers.hostGrace-timers.reservation-1);await service.maintain();expect(clock-disconnectedAt).toBe(timers.hostGrace-1);
    for(const delta of [0,1,1]) {advance(delta);await service.maintain();expect((await state()).role).toBe('host');expect((await pool.query('SELECT state,host_member_id FROM rooms WHERE id=$1',[room.roomId])).rows[0]).toEqual({state:'open',host_member_id:hostId});expect((await pool.query('SELECT role FROM room_members WHERE room_id=$1 AND id=$2',[room.roomId,guestId])).rows[0].role).toBe('member');}
    mark('P02-TIMERS',{presence_before_at:true,reservation_before_at:true,host_grace_before_at_after:true,late_ping_online:true,heartbeat_not_activity:true});
  });
  it('reconnects the same identity without a new slot and preserves host after grace',async()=>{
    advance(120000);const room=await create();const id=room.result.body.me.id;const first=await socket(room.host,room.roomId,await ticket(room.host,room.roomId));
    const close=once(first.ws,'close');first.ws.close();await close;
    advance(45000);const next=await socket(room.host,room.roomId,await ticket(room.host,room.roomId));
    const view=await snapshot(room.host,room.roomId);expect(view.members).toHaveLength(1);expect(view.members[0].id).toBe(id);
    const nextClose=once(next.ws,'close');next.ws.close();await nextClose;advance(timers.hostGrace+1);await runtime.restart();
    const same=await snapshot(room.host,room.roomId);expect(same.state).toBe('open');expect(same.members.find((m:{id:string})=>m.id===id).role).toBe('host');
    mark('P02-RECONNECT');
  });
  it('does not evict a newly admitted identity for an expired reservation',async()=>{
    advance(120000);const room=await create();const former=await join(room);const active=[];
    for(let i=0;i<6;i++) active.push(await join(room));
    advance(timers.reservation+1);
    // Pin seven legitimate identities with fresh sockets before the replacement joins.
    const live=[];for(const c of [room.host,...active.map(v=>v.guest)]) live.push(await socket(c,room.roomId,await ticket(c,room.roomId)));
    const replacement=await join(room);expect(replacement.result.status,replacement.result.text).toBe(200);
    expect((await former.guest.call(`/api/v1/rooms/${room.roomId}/ws-ticket`,{method:'POST',body:{request_id:randomUUID()}})).body.code).toBe('ROOM_FULL');
    const view=await snapshot(room.host,room.roomId);expect(view.members).toHaveLength(8);expect(view.members.some((m:{id:string})=>m.id===replacement.result.body.me.id)).toBe(true);
    for(const v of live) v.ws.close();mark('P02-RESERVATION');
  });
  it('keeps close terminal and blocks revoked replay/WS access',async()=>{
    advance(120000);const room=await create();const {guest,result,body}=await join(room);const ws=await socket(guest,room.roomId,result.body.ws_ticket.ticket);const ended=once(ws.ws,'close');
    const view=await snapshot(room.host,room.roomId);const close=await room.host.call(`/api/v1/rooms/${room.roomId}/close`,{method:'POST',body:{expected_rev:view.room_rev,idempotency_key:randomUUID()}});expect(close.status).toBe(200);
    expect((await ended)[0]).toBe(4401);expect((await guest.call(`/api/v1/rooms/${room.roomId}/me/preferences`)).status).toBe(401);
    expect((await guest.call(`/api/v1/rooms/${room.roomId}/join`,{method:'POST',body})).status).toBe(410);
    expect((await pool.query('SELECT * FROM private_preferences WHERE room_id=$1',[room.roomId])).rowCount).toBe(0);
    mark('P02-CLOSE');
  });
  it('reconciles external revocations after encrypted backup restore; rejects seven-day expiry',async()=>{
    advance(120000);const room=await create(),open=await create();const keyring=Keyring.fromFile(process.env.KEYRING_FILE!);
    const guest=await join(open),hostId=open.result.body.me.id,guestId=guest.result.body.me.id;
    expect((await guest.guest.call(`/api/v1/rooms/${open.roomId}/me/preferences`,{method:'PUT',body:{comfort:4,edges:{[hostId]:'crush'},expected_rev:0,idempotency_key:randomUUID()}})).status).toBe(200);
    const expected=(await guest.guest.call(`/api/v1/rooms/${open.roomId}/me/preferences`)).body;
    const rowScope=async()=>(await pool.query(`SELECT m.id,m.role,m.slot,p.cipher,p.rev,p.ready,s.token_hash FROM room_members m JOIN private_preferences p ON p.room_id=m.room_id AND p.owner_member_id=m.id JOIN room_sessions s ON s.room_id=m.room_id AND s.member_id=m.id WHERE m.room_id=$1 ORDER BY m.id`,[open.roomId])).rows;
    const beforeRows=await rowScope();expect(beforeRows).toHaveLength(2);
    const dump=execFileSync('docker',['exec',process.env.P02_DB_CONTAINER!,'pg_dump','-U','venus','-d','venus','--format=custom','--no-owner','--no-acl'],{maxBuffer:128*1024*1024});
    const envelope=sealBackup(dump,keyring,clock);expect(openBackup(envelope,keyring,clock).equals(dump)).toBe(true);expect(()=>openBackup(envelope,keyring,clock+timers.backup)).toThrow();
    expect(()=>openBackup({...envelope,created_at:clock+timers.backup,expires_at:clock+2*timers.backup},keyring,clock+timers.backup)).toThrow();
    const view=await snapshot(room.host,room.roomId);await room.host.call(`/api/v1/rooms/${room.roomId}/close`,{method:'POST',body:{expected_rev:view.room_rev,idempotency_key:randomUUID()}});
    for(const ws of sockets) ws.terminate();await runtime.pause();await pool.end();
    execFileSync('docker',['exec','-i',process.env.P02_DB_CONTAINER!,'pg_restore','-U','venus','-d','venus','--clean','--if-exists','--no-owner','--no-acl','--single-transaction'],{input:openBackup(envelope,keyring,clock),maxBuffer:128*1024*1024});
    pool=new pg.Pool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:'venus',database:'venus',password:readFileSync(process.env.DB_PASSWORD_FILE!,'utf8').trim()});await runtime.resume();
    expect((await room.host.call(`/api/v1/rooms/${room.roomId}/me/preferences`)).status).not.toBe(200);
    const state=await pool.query('SELECT state FROM rooms WHERE id=$1',[room.roomId]);expect(state.rows[0].state).toBe('closed');
    expect((await pool.query('SELECT * FROM private_preferences WHERE room_id=$1',[room.roomId])).rowCount).toBe(0);
    expect(await rowScope()).toEqual(beforeRows);
    expect((await guest.guest.call(`/api/v1/rooms/${open.roomId}/me/preferences`)).body).toEqual(expected);
    const host=(await open.host.call(`/api/v1/rooms/${open.roomId}/me/preferences`)).body;expect(host.owner_member_id).toBe(hostId);expect(host.edges[guestId]).toEqual({relation:'friendship',explicit:false});
    expect((await snapshot(open.host,open.roomId)).members.map((m:{id:string})=>m.id).sort()).toEqual([hostId,guestId].sort());
    mark('P02-BACKUP-RESTORE',{encrypted_roundtrip:true,expiry_rejected:true,header_tamper_rejected:true,revocations_reapplied:true,open_room_identities_preserved:true,nondefault_private_values_preserved:true,exact_scoped_rows_preserved:true,host_cannot_read_guest_values:true});
  });
  it('runs the exact prior accepted OCI image against the upgraded schema without data mutation',async()=>{
    advance(120000);const room=await create(),guest=await join(room);
    expect((await guest.guest.call(`/api/v1/rooms/${room.roomId}/me/preferences`,{method:'PUT',body:{comfort:3,edges:{[room.result.body.me.id]:'not_a_friend'},expected_rev:0,idempotency_key:randomUUID()}})).status).toBe(200);
    const tables=['rooms','room_members','private_preferences','entry_acceptances','room_sessions'];
    const scopedRows=async()=>Object.fromEntries(await Promise.all(tables.map(async table=>[table,(await pool.query(`SELECT row_to_json(t) AS row FROM ${table} t WHERE ${table==='rooms'?'id':'room_id'}=$1 ORDER BY row_to_json(t)::text`,[room.roomId])).rows])));
    for(const ws of sockets) ws.terminate();await runtime.pause();
    const before=await scopedRows(),container='venus-p02-rollback-'+randomUUID(),image=process.env.P02_PREVIOUS_IMAGE!;
    let proof:Record<string,unknown>|undefined;
    try {
      execFileSync('docker',['run','-d','--name',container,'--network','container:'+process.env.P02_DB_CONTAINER,'--read-only','--cap-drop','ALL','--security-opt','no-new-privileges:true','--mount',`type=bind,source=${process.env.DB_PASSWORD_FILE},target=/run/secrets/db_password,readonly`,'-e','DB_HOST=127.0.0.1','-e','DB_PORT=5432','-e','DB_USER=venus','-e','DB_NAME=venus','-e','DB_PASSWORD_FILE=/run/secrets/db_password',image],{stdio:'pipe'});
      const script=`let r;for(let i=0;i<100;i++){try{r=await fetch('http://127.0.0.1:4300/health/ready');if(r.ok)break}catch{}await new Promise(r=>setTimeout(r,100))}if(!r?.ok)process.exit(1);const ready=await r.json();const version=await(await fetch('http://127.0.0.1:4300/api/v1/version')).json();const roomsStatus=(await fetch('http://127.0.0.1:4300/api/v1/rooms/${room.roomId}')).status;console.log(JSON.stringify({ready,version,roomsStatus}));`;
      proof=JSON.parse(execFileSync('docker',['exec',container,'node','--input-type=module','-e',script],{encoding:'utf8'}));
      expect((proof!.version as {source_revision:string}).source_revision).toBe('934d9a1efcccfb4380e708a8f5143a43efbc3a71');expect(proof!.roomsStatus).toBe(404);
      expect(await scopedRows()).toEqual(before);expect((await pool.query('SELECT generation FROM venus_schema_migrations')).rows).toEqual([{generation:1}]);
    } finally {execFileSync('docker',['rm','-f',container],{stdio:'pipe'});await runtime.resume();}
    expect((await guest.guest.call(`/api/v1/rooms/${room.roomId}/me/preferences`)).body.comfort).toBe(3);
    mark('P02-ROLLBACK',{previous_image:image,previous_source:'934d9a1efcccfb4380e708a8f5143a43efbc3a71',generation:1,exact_scoped_rows_preserved:true,candidate_resumed:true,previous_room_api_unavailable:true,proof});
  });
  it('writes bounded private-free audit atomically with mutations and hides stored request guesses',async()=>{
    advance(120000);const room=await create(),guest=await join(room);const key=randomUUID();
    const input={comfort:4,edges:{[room.result.body.me.id]:'crush'},expected_rev:0,idempotency_key:key};
    expect((await guest.guest.call(`/api/v1/rooms/${room.roomId}/me/preferences`,{method:'PUT',body:input})).status).toBe(200);
    const stored=(await pool.query('SELECT request_hash,result_cipher FROM idempotency_keys WHERE key=$1',[key])).rows[0];
    expect(stored.request_hash).toMatch(/^v1:/);expect(Buffer.from(stored.result_cipher.data,'base64')).toHaveLength(16384);
    for(let comfort=0;comfort<=4;comfort++) for(const relation of ['just_met','friendship','crush','situationship','in_relationships','not_a_friend']) expect(hash(canonical({...input,comfort,edges:{[room.result.body.me.id]:relation}}))).not.toBe(stored.request_hash);
    const audit=(await pool.query('SELECT * FROM audit_events WHERE room_id=$1 ORDER BY seq',[room.roomId])).rows;expect(audit.map(v=>v.action)).toEqual(['create','join','preferences']);expect(JSON.stringify(audit)).not.toMatch(/crush|comfort|cipher|token/);
    const before=(await guest.guest.call(`/api/v1/rooms/${room.roomId}/me/preferences`)).body;
    await pool.query("CREATE FUNCTION reject_test_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic audit failure'; END $$; CREATE TRIGGER reject_test_audit BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION reject_test_audit()");
    try {expect((await guest.guest.call(`/api/v1/rooms/${room.roomId}/me/preferences`,{method:'PUT',body:{...input,comfort:1,expected_rev:before.rev,idempotency_key:randomUUID()}})).status).toBe(500);expect((await guest.guest.call(`/api/v1/rooms/${room.roomId}/me/preferences`)).body).toEqual(before);}
    finally {await pool.query('DROP TRIGGER reject_test_audit ON audit_events; DROP FUNCTION reject_test_audit()');}
    await pool.query("INSERT INTO audit_events(room_id,actor_member_id,action,request_id,created_at) SELECT $1,NULL,'profile',$2,$3 FROM generate_series(1,10005)",[room.roomId,randomUUID(),new Date(clock)]);
    await guest.guest.call(`/api/v1/rooms/${room.roomId}/me/setup/skip`,{method:'POST',body:{expected_rev:before.rev,idempotency_key:randomUUID()}});
    const bounds=(await pool.query('SELECT count(*)::int AS count,sum(pg_column_size(a))::bigint AS bytes FROM audit_events a')).rows[0];expect(bounds.count).toBe(10000);expect(Number(bounds.bytes)).toBeLessThanOrEqual(67108864);
    mark('P02-CRYPTO-AUDIT',{fingerprint_keyed:true,private_cipher_bytes:16384,reply_cipher_bytes:16384,audit_atomic_rollback:true,audit_metadata_only:true,count_cap:10000,byte_cap:67108864});
  });
  it('expires idle rooms after 24h and deletes primary rows before the 24h close deadline',async()=>{
    advance(120000);const room=await create();advance(timers.idle);await runtime.restart();
    expect((await room.host.call(`/api/v1/rooms/${room.roomId}`)).status).not.toBe(200);
    const closed=await pool.query('SELECT state,closed_at FROM rooms WHERE id=$1',[room.roomId]);expect(closed.rows[0].state).toBe('closed');
    advance(timers.primaryDelete);await runtime.restart();expect((await pool.query('SELECT * FROM rooms WHERE id=$1',[room.roomId])).rowCount).toBe(0);
    for(const table of ['room_members','private_preferences','room_sessions','entry_acceptances','ws_tickets','idempotency_keys','outbox_events','audit_events']) expect((await pool.query(`SELECT * FROM ${table} WHERE room_id=$1`,[room.roomId])).rowCount).toBe(0);
    mark('P02-RETENTION');
  });
  it('rate-limits failed admission attempts and blocks an unapproved offer',async()=>{
    advance(120000);const visitor=await client(runtime.origin);let denied=false;
    for(let i=0;i<65;i++) {const result=await visitor.call('/api/v1/invitations/resolve',{method:'POST',body:{invite_token:'a'.repeat(43),entry_acceptance:visitor.acceptance}});if(result.status===429) {denied=true;break;}}
    expect(denied).toBe(true);
    const unavailable=await startRuntime({P02_OFFER_DISABLED:'1'});
    try {
      const c=await client(unavailable.origin);expect(c.acceptance).toBeNull();
      const result=await c.call('/api/v1/rooms',{method:'POST',body:{meeting_context:'online',locale:'ru',name:'blocked',idempotency_key:randomUUID(),entry_acceptance:visitor.acceptance}});expect(result.status,result.text).toBe(503);expect(result.body.code).toBe('ENTRY_POLICY_UNAVAILABLE');
    } finally {await unavailable.close();}
    mark('P02-ENTRY-RATE');
  });
  it('requires current reacceptance but preserves safety leave and neutral skip',async()=>{
    advance(120000);const room=await create();const {guest}=await join(room);
    await runtime.restart({P02_OFFER_VERSION:'synthetic-p02-2'});
    expect((await room.host.call(`/api/v1/rooms/${room.roomId}/me/preferences`)).body.code).toBe('ENTRY_REACCEPT_REQUIRED');
    expect((await guest.call(`/api/v1/rooms/${room.roomId}/me/setup/skip`,{method:'POST',body:{expected_rev:0,idempotency_key:randomUUID()}})).status).toBe(200);
    expect((await guest.call(`/api/v1/rooms/${room.roomId}/leave`,{method:'POST',body:{expected_rev:0,idempotency_key:randomUUID()}})).status).toBe(200);
    const current=await room.host.call('/api/v1/entry-policy');const offer=current.body.offer;
    const accepted=await room.host.call(`/api/v1/rooms/${room.roomId}/me/entry-acceptance`,{method:'POST',body:{offer_version:offer.version,offer_digest:offer.digest,accept_offer:true,adult18:true}});expect(accepted.status).toBe(200);
    expect((await room.host.call(`/api/v1/rooms/${room.roomId}/me/preferences`)).status).toBe(200);
    mark('P02-REACCEPT');
  });
  async function page(locale:string,origin=runtime.origin) {
    browser??=await chromium.launch({headless:true});const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:375,height:850}});const page=await context.newPage();
    await page.goto(origin);if(locale!=='ru') await page.getByRole('button',{name:locale.toUpperCase(),exact:true}).click();
    return {context,page};
  }
  async function approve(p:Page) {
    await browserExpect(p.getByTestId('accept-offer')).not.toBeChecked();await browserExpect(p.getByTestId('adult18')).not.toBeChecked();
    await browserExpect(p.getByTestId('create-room')).toBeDisabled();await p.getByTestId('accept-offer').check();await p.getByTestId('adult18').check();
  }
  it('creates, joins, preserves private settings/locale and renders XSS as text on RU/EN/TR',async()=>{
    advance(120000);mkdirSync('.artifacts/p02/browser',{recursive:true});
    for(const [locale,title] of [['ru','Онлайн-встреча'],['en','Online meeting'],['tr','Çevrim içi buluşma']]) {
      const host=await page(locale!);const guest=await page(locale!);
      try {
        await approve(host.page);await host.page.getByTestId('create-name').fill('host-'+locale);await host.page.getByTestId('create-room').click();
        await host.page.getByTestId('room-shell').waitFor();await browserExpect(host.page.getByTestId('room-title')).toHaveText(title!);
        const invite=host.page.getByTestId('room-invite');await browserExpect(invite).not.toHaveValue('');const link=await invite.inputValue();
        await approve(guest.page);const unsafe='<svg/onload=alert(1)>';let dialogs=0;guest.page.on('dialog',async dialog=>{dialogs++;await dialog.dismiss();});host.page.on('dialog',async dialog=>{dialogs++;await dialog.dismiss();});
        await guest.page.getByTestId('join-name').fill(unsafe);await guest.page.getByTestId('join-invite').fill(link);await guest.page.getByTestId('join-room').click();
        await guest.page.getByTestId('room-shell').waitFor();await browserExpect(guest.page.getByTestId('room-title')).toHaveText(title!);
        await browserExpect(host.page.getByTestId('member-list').getByText(unsafe,{exact:false})).toBeVisible();browserExpect(await host.page.locator('svg').count()).toBe(0);browserExpect(dialogs).toBe(0);
        await guest.page.getByTestId('comfort').focus();await guest.page.getByTestId('comfort').press('End');await guest.page.getByTestId('comfort').press('ArrowLeft');await guest.page.getByTestId('submit-preferences').click();
        await browserExpect(guest.page.getByTestId('submit-preferences')).toBeEnabled();await guest.page.reload();await guest.page.getByTestId('room-shell').waitFor();await browserExpect(guest.page.getByTestId('comfort')).toHaveValue('3');
        await browserExpect(guest.page.locator('html')).toHaveAttribute('lang',locale!);
        const overflow=await host.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);browserExpect(overflow).toBe(false);
        await host.page.screenshot({path:`.artifacts/p02/browser/room-${locale}.png`,fullPage:true});
        mark('P02-BROWSER-'+locale!.toUpperCase(),{create_join:true,secure_cookies:true,reload_preferences:true,xss_escaped:true,width:375});
      } finally {await host.context.close();await guest.context.close();}
    }
  });
  it('shows full then closed room with retry and a host-only close confirmation',async()=>{
    advance(120000);const host=await page('en'),outsider=await page('en');
    try {
      await approve(host.page);await host.page.getByTestId('create-name').fill('host-full');await host.page.getByTestId('create-room').click();await host.page.getByTestId('room-shell').waitFor();
      await browserExpect(host.page.getByTestId('room-invite')).not.toHaveValue('');const link=await host.page.getByTestId('room-invite').inputValue(),invite=new URL(link).hash.slice('#invite='.length);
      const roomId=new URL(host.page.url()).hash.slice('#room='.length);
      for(let i=0;i<7;i++) {const c=await client(runtime.origin);const result=await c.call(`/api/v1/rooms/${roomId}/join`,{method:'POST',body:{invite_token:invite,locale:'en',display_name:'guest-'+i,idempotency_key:randomUUID(),entry_acceptance:c.acceptance}});browserExpect(result.status).toBe(200);}
      await browserExpect(host.page.getByTestId('member-list').locator('li')).toHaveCount(8);
      await approve(outsider.page);await outsider.page.getByTestId('join-name').fill('ninth');await outsider.page.getByTestId('join-invite').fill(link);await outsider.page.getByTestId('join-room').click();
      await browserExpect(outsider.page.getByTestId('error-message')).toContainText('already eight participants');
      await host.page.getByTestId('close-room').click();await browserExpect(host.page.locator('dialog')).toBeVisible();await host.page.getByTestId('confirm-close').click();
      await browserExpect(host.page.getByTestId('error-message')).toContainText('closed');await outsider.page.getByTestId('retry-action').click();await browserExpect(outsider.page.getByTestId('error-message')).toContainText('closed');
      mark('P02-BROWSER-FULL-CLOSED');
    } finally {await host.context.close();await outsider.context.close();}
  });
  it('retries the same unconfirmed create after outage and keeps unapproved entry unavailable',async()=>{
    advance(120000);const host=await page('en');
    try {
      await approve(host.page);await host.page.getByTestId('create-name').fill('retry-host');const keys:string[]=[];
      host.page.on('request',r=>{if(new URL(r.url()).pathname==='/api/v1/rooms'&&r.method()==='POST') keys.push(r.postDataJSON().idempotency_key);});
      await host.page.route('**/api/v1/rooms',route=>route.abort('connectionrefused'));await host.page.getByTestId('create-room').click();await browserExpect(host.page.getByTestId('error-message')).toContainText('service is unavailable');
      await host.page.unroute('**/api/v1/rooms');await host.page.getByTestId('retry-action').click();await host.page.getByTestId('room-shell').waitFor();browserExpect(keys).toHaveLength(2);browserExpect(keys[0]).toBe(keys[1]);
    } finally {await host.context.close();}
    const disabled=await startRuntime({P02_OFFER_DISABLED:'1'});const viewer=await page('en',disabled.origin);
    try {await browserExpect(viewer.page.getByTestId('policy-unavailable')).toBeVisible();await browserExpect(viewer.page.getByTestId('create-room')).toBeDisabled();await browserExpect(viewer.page.getByTestId('join-room')).toBeDisabled();await browserExpect(viewer.page.getByTestId('accept-offer')).toHaveCount(0);}
    finally {await viewer.context.close();await disabled.close();}
    mark('P02-BROWSER-OFFLINE-POLICY');
  });
  it('recovers a stale preferences draft and reaccepts changed terms inside the open room',async()=>{
    advance(120000);const host=await page('en');
    try {
      await approve(host.page);await host.page.getByTestId('create-name').fill('recovery-host');await host.page.getByTestId('create-room').click();await host.page.getByTestId('room-shell').waitFor();
      const second=await host.context.newPage();await second.goto(host.page.url());await second.getByTestId('room-shell').waitFor();
      await second.getByTestId('comfort').focus();await second.getByTestId('comfort').press('Home');await second.getByTestId('comfort').press('ArrowRight');await second.getByTestId('comfort').press('ArrowRight');
      await second.getByTestId('submit-preferences').click();await browserExpect(second.getByTestId('submit-preferences')).toBeEnabled();
      await host.page.getByTestId('comfort').focus();await host.page.getByTestId('comfort').press('End');await host.page.getByTestId('submit-preferences').click();
      await browserExpect(host.page.getByTestId('error-message')).toContainText('unsaved settings');await host.page.getByTestId('retry-action').click();await browserExpect(host.page.getByTestId('comfort')).toHaveValue('2');
      await host.page.getByTestId('comfort').press('ArrowRight');await host.page.getByTestId('submit-preferences').click();await browserExpect(host.page.getByTestId('error-message')).toHaveCount(0);
      await host.page.reload();await browserExpect(host.page.getByTestId('comfort')).toHaveValue('3');await second.close();
      await host.page.route('**/ws-ticket',route=>route.abort('connectionrefused'));await host.page.reload();
      await browserExpect(host.page.getByTestId('error-message')).toContainText('service is unavailable');await host.page.unroute('**/ws-ticket');await host.page.getByTestId('retry-action').click();
      await browserExpect(host.page.getByTestId('connection-status')).toHaveText('Connected to the service');
      await runtime.restart({P02_OFFER_VERSION:'synthetic-p02-3'});
      // A failed automatic WS reconnect must fetch the current offer and reset approval.
      await browserExpect(host.page.getByTestId('reaccept-room')).toBeVisible({timeout:10000});
      await browserExpect(host.page.locator('.offer')).toContainText('synthetic-p02-3');
      await browserExpect(host.page.getByTestId('accept-offer')).not.toBeChecked();await browserExpect(host.page.getByTestId('adult18')).not.toBeChecked();await browserExpect(host.page.getByTestId('reaccept-room')).toBeDisabled();
      await host.page.getByTestId('accept-offer').check();await host.page.getByTestId('adult18').check();await host.page.getByTestId('reaccept-room').click();
      await browserExpect(host.page.getByTestId('reaccept-room')).toHaveCount(0);await browserExpect(host.page.getByTestId('room-shell')).toBeVisible();await browserExpect(host.page.getByTestId('comfort')).toHaveValue('3');
      await browserExpect(host.page.getByTestId('connection-status')).toHaveText('Connected to the service');
      const roomId=new URL(host.page.url()).hash.slice('#room='.length),link=await host.page.getByTestId('room-invite').inputValue(),peer=await client(runtime.origin);
      const joined=await peer.call(`/api/v1/rooms/${roomId}/join`,{method:'POST',body:{invite_token:new URL(link).hash.slice('#invite='.length),locale:'en',display_name:'after-reaccept-peer',idempotency_key:randomUUID(),entry_acceptance:peer.acceptance}});expect(joined.status).toBe(200);
      await browserExpect(host.page.getByTestId('member-list')).toContainText('after-reaccept-peer');
      await host.page.getByTestId('submit-preferences').click();await browserExpect(host.page.getByTestId('error-message')).toHaveCount(0);
      mark('P02-BROWSER-RECOVERY',{external_revision_conflict:true,refresh_replaces_draft:true,save_after_refresh:true,in_room_reaccept:true,explicit_adult_and_offer:true,no_reload_for_reaccept:true});
    } finally {await host.context.close();}
  });
});
