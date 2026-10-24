import {describe,it,expect,vi} from 'vitest';
import {PrivateChat} from '../../apps/api/src/private-chat.js';
import {Keyring} from '../../apps/api/src/security.js';
import type pg from 'pg';
const keys=new Keyring('test',{test:Buffer.alloc(32,17).toString('base64')});
describe('ephemeral chat expiry is not reversed by wall-clock regression',()=>{
 it('does not revive a grant after observed TTL expiry',()=>{
  let now=1000;const chat=new PrivateChat(keys,()=>now);chat.register('room','session','round');
  now=301000;expect(chat.eligible('room','session','round')).toBe(false);
  now=2000;expect(chat.eligible('room','session','round')).toBe(false);
 });
 it('does not decrypt or enqueue message history from a future last-send time',async()=>{
  let now=1000;const chat=new PrivateChat(keys,()=>now);chat.register('room','session','round');
  const cipher=keys.encrypt({text:'SYNTHETIC-FUTURE-MESSAGE'},'private-chat:room:session:round:message:1');
  const query=vi.fn(async(sql:string)=>({rows:sql.startsWith('SELECT rev,expires_at')?[{rev:'1',expires_at:new Date(180000),last_sent_at:new Date(2000)}]:sql.startsWith('SELECT message_id')?[{message_id:'message',member_id:'a',cipher,sent_at:new Date(2000),expires_at:new Date(180000)}]:[]}));
  await expect(chat.view({query} as unknown as pg.PoolClient,'room','session','round',180000)).rejects.toMatchObject({code:'PRIVATE_CHAT_TIME_INVALID'});
 });
});
