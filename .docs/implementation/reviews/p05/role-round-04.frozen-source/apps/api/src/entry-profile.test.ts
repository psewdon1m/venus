import {describe,it,expect} from 'vitest';
import {entryProfile} from './entry-profile.js';
import {canonical,hash} from './security.js';

describe('explicit local pilot entry policy',()=>{
  it('keeps unconfigured and closed admission unavailable',()=>{
    expect(entryProfile(undefined,'https://venus.shmoza.net')).toBeNull();
    expect(entryProfile('closed','https://localhost')).toBeNull();
  });
  it('binds all three mock texts to a deterministic current digest',()=>{
    const offer=entryProfile('local-pilot','https://localhost:8443')!;
    expect(offer.synthetic).toBe(true);expect(offer.version).toBe('local-pilot-mock-1');
    expect(Object.keys(offer.text)).toEqual(['ru','en','tr']);
    expect(offer.digest).toBe('sha256:'+hash(canonical(offer.text)));
    expect(entryProfile('local-pilot','https://localhost:8443')).toEqual(offer);
  });
  it('does not share mutable text objects between requests',()=>{
    const offer=entryProfile('local-pilot','https://127.0.0.1')!;offer.text.ru='changed';
    expect(entryProfile('local-pilot','https://127.0.0.1')!.text.ru).not.toBe('changed');
  });
  it('rejects public, non-HTTPS, credentialed and non-origin pilot addresses',()=>{
    for(const origin of ['https://venus.shmoza.net','https://localhost.example.org','http://localhost','https://localhost/path','https://user:password@localhost','https://localhost?x=1']) expect(()=>entryProfile('local-pilot',origin)).toThrow('LOCAL_PILOT_ORIGIN_REQUIRED');
  });
  it('rejects typo or invented deployment profiles instead of enabling entry',()=>{
    for(const value of ['production','local','LOCAL-PILOT','local-pilot ']) expect(()=>entryProfile(value,'https://localhost')).toThrow('ENTRY_PROFILE_INVALID');
  });
});
