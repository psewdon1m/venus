import {describe,it,expect} from 'vitest';
import {randomBytes} from 'node:crypto';
import {Keyring,DeletionLedger,canonical,equal,hash} from './security.js';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
describe('room crypto boundary',()=>{
  it('uses authenticated owner/schema AAD, unpredictable nonces and explicit key versions',()=>{
    const keys={v1:randomBytes(32).toString('base64'),v2:randomBytes(32).toString('base64')};
    const ring=new Keyring('v1',keys),aad='preferences:room1:member1:1';
    const data={comfort:4,edges:{private:'crush'}};const sealed=ring.encrypt(data,aad);
    expect(ring.decrypt(sealed,aad)).toEqual(data);
    expect(JSON.stringify(sealed)).not.toMatch(/crush|comfort/);
    expect(()=>ring.decrypt(sealed,'preferences:room1:member2:1')).toThrow();
    expect(()=>ring.decrypt({...sealed,data:randomBytes(16).toString('base64')},aad)).toThrow();
    expect(()=>new Keyring('v2',{v2:keys.v2}).decrypt(sealed,aad)).toThrow();
    expect(new Keyring('v2',keys).decrypt(sealed,aad)).toEqual(data);
    const nonces=new Set(Array.from({length:1000},()=>ring.encrypt(data,aad).nonce));expect(nonces.size).toBe(1000);
    expect(()=>new Keyring('v0',{})).toThrow();
    expect(()=>new Keyring('v1:bad',{'v1:bad':keys.v1})).toThrow();
    expect(()=>new Keyring('toString',{})).toThrow();
  });
  it('canonicalizes request objects without changing meaning',()=>{
    expect(canonical({z:1,a:{c:3,b:2}})).toBe(canonical({a:{b:2,c:3},z:1}));
    expect(canonical({z:2})).not.toBe(canonical({z:1}));expect(equal('a','a')).toBe(true);expect(equal('a','aa')).toBe(false);
  });
  it('hides low-entropy settings from database fingerprint and ciphertext length observers',()=>{
    const keys={v1:randomBytes(32).toString('base64'),v2:randomBytes(32).toString('base64')},ring=new Keyring('v1',keys);
    const sizes=new Set<number>();
    for(let count=0;count<=7;count++) for(let comfort=0;comfort<=4;comfort++) for(const relation of ['just_met','friendship','crush','situationship','in_relationships','not_a_friend']) {
      const value={comfort,edges:Object.fromEntries(Array.from({length:count},(_,i)=>[String(i).padStart(36,'0'),{relation,explicit:true}]))};
      for(const payload of [value,{body:value,memberId:'member',session:null,status:200}]) {
        const sealed=ring.encrypt(payload,'preferences:test');sizes.add(Buffer.from(sealed.data,'base64').length);
        expect(ring.decrypt(sealed,'preferences:test')).toEqual(payload);
      }
      expect(ring.fingerprint(value)).not.toBe(hash(canonical(value)));
    }
    expect([...sizes]).toEqual([16384]);
    const input={comfort:4,edges:{host:'crush'}},fingerprint=ring.fingerprint(input);
    expect(new Keyring('v2',keys).matchesFingerprint(input,fingerprint)).toBe(true);
    expect(new Keyring('v2',keys).matchesFingerprint({...input,comfort:3},fingerprint)).toBe(false);
    expect(()=>ring.encrypt({value:'x'.repeat(16384)},'preferences:test')).toThrow();
  });
  it('keeps independent durable revocations until every prior backup must have expired',()=>{
    const directory=mkdtempSync(join(tmpdir(),'venus-ledger-'));
    try {
      const path=join(directory,'ledger.jsonl'),first=new DeletionLedger(path),second=new DeletionLedger(path);
      const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
      first.revoke(a,1000);second.revoke(b,2000);expect(new DeletionLedger(path).entries()).toHaveLength(2);
      first.prune(10000,9000);expect(new DeletionLedger(path).contains(a)).toBe(false);expect(new DeletionLedger(path).contains(b)).toBe(true);
      expect(readFileSync(path,'utf8')).not.toContain(a);
    } finally {expect(dirname(resolve(directory))).toBe(resolve(tmpdir()));rmSync(directory,{recursive:true,force:true});}
  });
});
