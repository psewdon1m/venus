import {describe,it,expect,vi} from 'vitest';
import {randomUUID} from 'node:crypto';
import type pg from 'pg';
import {Keyring} from './security.js';
import {PrivateChat,chatInput,privateChatEnabled} from './private-chat.js';
import {privateChatLimits} from '@venus/contracts';

const keys=new Keyring('test',{test:Buffer.alloc(32,7).toString('base64')});
describe('private chat input and explicit capability config',()=>{
  it('fails closed unless explicitly enabled and rejects deployment typos',()=>{
    expect(privateChatEnabled(undefined)).toBe(false);expect(privateChatEnabled('false')).toBe(false);expect(privateChatEnabled('true')).toBe(true);
    for(const value of ['1','yes','TRUE','',' false ']) expect(()=>privateChatEnabled(value)).toThrow();
  });
  it('validates Unicode scalars, byte bounds, controls, exact fields, and UUID',()=>{
    const id=randomUUID();expect(chatInput({request_id:id,text:'Привет 👋 merhaba'})).toEqual({request_id:id,text:'Привет 👋 merhaba'});
    expect(chatInput({request_id:id,text:'😀'.repeat(1000)}).text.length).toBe(2000);
    for(const value of [{request_id:id,text:''},{request_id:id,text:'  '},{request_id:id,text:'a'.repeat(1001)},{request_id:id,text:'😀'.repeat(1001)},{request_id:id,text:'\ud800'},{request_id:id,text:'x\nsecret'},{request_id:id,text:'\u202etext'},{request_id:id,text:'ok',extra:true},{request_id:'bad',text:'ok'},{request_id:id,text:1},null,[]]) expect(()=>chatInput(value)).toThrow();
  });
});
describe('volatile private chat grant and encrypted bounded storage',()=>{
  it('never resurrects an observed expired grant after wall-clock regression',()=>{
    let now=1000;const chat=new PrivateChat(keys,()=>now);chat.register('room','session','round');
    now+=privateChatLimits.ttl;expect(chat.eligible('room','session','round')).toBe(false);
    now=2000;expect(chat.eligible('room','session','round')).toBe(false);
    now=1001+privateChatLimits.ttl;expect(chat.eligible('room','session','round')).toBe(false);
  });
  it('rejects a transcript from a future last-send time before decrypting its messages',async()=>{
    const chat=new PrivateChat(keys,()=>1000);chat.register('room','session','round');
    const cipher=keys.encrypt({text:'FUTURE_PRIVATE_MESSAGE'},'private-chat:room:session:round:message:1');
    const query=vi.fn(async(sql:string)=>({rows:sql.startsWith('SELECT rev,expires_at')?[{rev:'1',expires_at:new Date(180000),last_sent_at:new Date(2000)}]:sql.startsWith('SELECT message_id')?[{message_id:'message',member_id:'a',cipher,sent_at:new Date(2000),expires_at:new Date(180000)}]:[]}));
    const decrypt=vi.spyOn(keys,'decrypt');
    try {await expect(chat.view({query} as unknown as pg.PoolClient,'room','session','round',180000)).rejects.toMatchObject({code:'PRIVATE_CHAT_TIME_INVALID'});expect(decrypt).not.toHaveBeenCalled();} finally {decrypt.mockRestore();}
  });
  it('rejects capacity exhaustion without extending an existing grant and recovers expired capacity',()=>{
    let now=1000;const chat=new PrivateChat(keys,()=>now);
    for(let i=0;i<privateChatLimits.activeScopes;i++) expect(chat.register('room','session','round-'+i)).toBe(true);
    expect(chat.register('room','session','overflow')).toBe(false);
    now+=privateChatLimits.ttl-1;
    expect(chat.register('room','session','round-0')).toBe(true);
    expect(chat.register('foreign','session','round-0')).toBe(false);
    now++;
    expect(chat.eligible('room','session','round-0')).toBe(false);
    expect(chat.register('room','session','next-round')).toBe(true);
  });
  it('rejects cross room/session, TTL boundary, revoke and cold restore grants',async()=>{
    let now=1000;const chat=new PrivateChat(keys,()=>now);chat.register('room','session','round');
    expect(chat.eligible('room','session','round')).toBe(true);expect(chat.eligible('other','session','round')).toBe(false);expect(chat.eligible('room','other','round')).toBe(false);
    expect(new PrivateChat(keys,()=>now).eligible('room','session','round')).toBe(false);
    const c={query:vi.fn(async()=>({rows:[]}))} as unknown as pg.PoolClient;
    await chat.revoke(c,'room','round');expect(chat.eligible('room','session','round')).toBe(false);
    chat.register('room','session','round');now+=privateChatLimits.ttl;expect(chat.eligible('room','session','round')).toBe(false);
  });
  it('encrypts actual inserted text with actor-scoped metadata and bounded counters, never raw body',async()=>{
    let now=1000;const chat=new PrivateChat(keys,()=>now);chat.register('room','session','round');
    const input={request_id:randomUUID(),text:'private secret alpha'};
    const query=vi.fn(async(sql:string)=>({rows:sql.startsWith('SELECT * FROM private_chat_scopes')?[{rev:'0',total:0,minute:'0',actor_counts:{},last_sent_at:null,expires_at:new Date(180000)}]:[]}));
    const receipt=await chat.send({query} as unknown as pg.PoolClient,'room','session','round','actor',180000,input);
    expect(receipt.chat_rev).toBe(1);expect(Date.parse(receipt.expires_at)).toBe(180000);
    const insert=query.mock.calls.find(args=>args[0].startsWith('INSERT INTO private_chat_messages'))!;
    const args=(insert as unknown as [string,unknown[]])[1];
    expect(JSON.stringify(query.mock.calls)).not.toContain(input.text);
    const cipher=args[6] as Parameters<Keyring['decrypt']>[0];expect(Buffer.from(cipher.data,'base64')).toHaveLength(16384);
    expect(keys.decrypt(cipher,`private-chat:room:session:round:${receipt.message_id}:1`)).toEqual({text:input.text});
    expect(()=>keys.decrypt(cipher,`private-chat:other:session:round:${receipt.message_id}:1`)).toThrow();
    expect(query.mock.calls.some(args=>args[0].includes('chat_rev<=$3'))).toBe(true);
    now=privateChatLimits.ttl+1000;await expect(chat.send({query} as unknown as pg.PoolClient,'room','session','round','actor',900000,input)).rejects.toMatchObject({code:'PRIVATE_CHAT_UNAVAILABLE'});
  });
  it('deduplicates request IDs before rate/volume counters and rejects changed text',async()=>{
    const now=1000,chat=new PrivateChat(keys,()=>now);chat.register('room','session','round');
    const input={request_id:randomUUID(),text:'same message'},receipt={request_id:input.request_id,message_id:randomUUID(),chat_rev:1,expires_at:new Date(2000).toISOString()};
    const query=vi.fn(async(sql:string)=>({rows:sql.startsWith('SELECT * FROM private_chat_scopes')?[{rev:'128',total:128,minute:'0',actor_counts:{actor:12},last_sent_at:new Date(1000),expires_at:new Date(180000)}]:sql.startsWith('SELECT request_hash')?[{request_hash:keys.fingerprint(input),receipt,expires_at:new Date(2000)}]:[]}));
    expect(await chat.send({query} as unknown as pg.PoolClient,'room','session','round','actor',180000,input)).toEqual(receipt);
    expect(query.mock.calls.some(args=>args[0].startsWith('INSERT INTO private_chat_messages'))).toBe(false);
    await expect(chat.send({query} as unknown as pg.PoolClient,'room','session','round','actor',180000,{...input,text:'different'})).rejects.toMatchObject({code:'IDEMPOTENCY_CONFLICT'});
  });
  for(const [patch,code] of [[{actor_counts:{actor:12}},'RATE_LIMITED'],[{total:128},'PRIVATE_CHAT_VOLUME_LIMIT'],[{last_sent_at:new Date(1001)},'PRIVATE_CHAT_TIME_INVALID']] as const) it(`rejects ${code} with no message insertion`,async()=>{
    const chat=new PrivateChat(keys,()=>1000);chat.register('room','session','round');
    const query=vi.fn(async(sql:string)=>({rows:sql.startsWith('SELECT * FROM private_chat_scopes')?[{rev:'0',total:0,minute:'0',actor_counts:{},last_sent_at:null,expires_at:new Date(180000),...patch}]:[]}));
    await expect(chat.send({query} as unknown as pg.PoolClient,'room','session','round','actor',180000,{request_id:randomUUID(),text:'test'})).rejects.toMatchObject({code});
    expect(query.mock.calls.some(args=>args[0].startsWith('INSERT INTO private_chat_messages'))).toBe(false);
  });
});
