import {describe,expect,it} from 'vitest';
import {AuthBoundary,RetryVault,retryAllowed,type RetryContext,type RetryScope} from './game-operations.js';
const scope:RetryScope={room:'r',member:'a',identity:1,transport:1,session:'s',round:'round',kind:'chat',offer:'offer',proposal:2,deadline:20000};
const context:RetryContext={room:'r',member:'a',identity:1,transport:1,session:'s',round:'round',connected:true,grants:[{kind:'chat',offer:'offer',proposal:2,deadline:20000}]};
describe('revocable private retry',()=>{
 it('expires at the exact deadline and rejects every revoked authentication or grant dimension',()=>{expect(retryAllowed(scope,context,19999)).toBe(true);expect(retryAllowed(scope,context,20000)).toBe(false);for(const change of [{room:'other'},{member:'b'},{identity:2},{transport:2},{session:'next'},{round:'next'},{connected:false},{grants:[]},{grants:[{...context.grants[0]!,proposal:3}]}]) expect(retryAllowed(scope,{...context,...change},10000)).toBe(false);});
 it('physically destroys callbacks even in a stale retained entry and makes old DOM IDs unusable',()=>{const vault=new RetryVault(),callback=async()=>{};const id=vault.install(callback,scope),old=vault.get(id);expect(old?.operation).toBe(callback);vault.clear();expect(old?.operation).toBeNull();expect(vault.get(id)).toBeNull();vault.install(callback,{...scope,proposal:3});expect(vault.get(id)).toBeNull();});
 it('retains setup retry across its own new-session transition but public safety cannot target a replaced round',()=>{expect(retryAllowed({...scope,kind:'setup'}, {...context,session:'new',round:null},10000)).toBe(true);expect(retryAllowed({...scope,kind:'public'}, {...context,session:'new'},10000)).toBe(false);});
});

describe('synchronous authentication boundary',()=>{
 it('revokes before passive effects and never revives an old token after switching back',()=>{const boundary=new AuthBoundary('r','a',true),old=boundary.current;const id=boundary.vault.install(async()=>{},scope),retained=boundary.vault.get(id);boundary.bind('r','outsider',true);expect(boundary.sameIdentity(old)).toBe(false);expect(retained?.operation).toBeNull();boundary.bind('r','a',true);expect(boundary.sameIdentity(old)).toBe(false);});
 it('transport loss invalidates private grants while keeping identity-bound public safety state',()=>{const boundary=new AuthBoundary('r','a',true),old=boundary.current;boundary.bind('r','a',false);expect(boundary.sameIdentity(old)).toBe(true);expect(boundary.sameTransport(old)).toBe(false);boundary.bind('r','a',true);expect(boundary.sameTransport(old)).toBe(false);});
});
