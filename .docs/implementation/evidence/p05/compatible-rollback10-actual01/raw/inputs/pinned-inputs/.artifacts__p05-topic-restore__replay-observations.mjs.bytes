/** Narrow approved DESIGN04 effects. All raw rows/credentials remain transient or0600 tmpfs. */
import assert from 'node:assert/strict';
import {hash} from '../../apps/api/dist/security.js';
import {topicAad} from '../../apps/api/dist/topic-game-model.js';
import {canonical,sha,rawDatabase,authorityMap,revokedUntouched} from './observations.mjs';
const rows=(raw,name)=>(raw.privateRows[name]??[]).map(text=>JSON.parse(text));
export function admissionEffect(before,after,expectedScope,window){
 const key='public.admission_limits',a=rows(before,key),b=rows(after,key);assert.equal(b.length,a.length);const old=a.find(v=>v.scope_hash===expectedScope),next=b.find(v=>v.scope_hash===expectedScope);assert(old&&next);assert.equal(Number(old.window_start),window);assert.equal(Number(next.window_start),window);assert.equal(next.requests,old.requests+1);assert.equal(canonical({...next,requests:old.requests}),canonical(old));
 assert.equal(canonical(a.filter(v=>v.scope_hash!==expectedScope)),canonical(b.filter(v=>v.scope_hash!==expectedScope)),'Only the exact current member accounting row may change');
 return {table:key,expected_member_scope_only:true,same_window:true,request_counter_increment:1};
}
export function revocationRoundEffect(before,after,keys,f,now){
 const key='public.game_rounds',a=rows(before,key),b=rows(after,key);assert.equal(a.length,b.length);const changed=[];
 for(const old of a){const next=b.find(v=>v.id===old.id);assert(next);if(canonical(old)===canonical(next))continue;assert.equal(old.room_id,f.room);assert.equal(old.session_id,f.game);assert.equal(old.id,f.plan.round_id);assert.equal(canonical({...next,cipher:old.cipher}),canonical(old),'No round metadata or state change allowed');
  const aad=topicAad.round(f.room,f.game,old.id),oldData=keys.decrypt(old.cipher,aad),newData=keys.decrypt(next.cipher,aad);assert.equal(oldData.state,'stopped');assert.equal(newData.state,'stopped');for(const name of ['invitation','action']){assert.equal(oldData[name].state,'stopped');assert.equal(newData[name].state,'stopped');assert.equal(oldData[name].acks.length,0);assert.equal(newData[name].acks.length,0);}assert(Number.isSafeInteger(newData.clock_floor)&&newData.clock_floor>=oldData.clock_floor&&newData.clock_floor<=now);assert.equal(canonical({...newData,clock_floor:oldData.clock_floor}),canonical(oldData),'Only a monotonic clock floor may change in decrypted stopped round');changed.push({round_identity_preserved:true,cipher_rewrapped:true,clock_floor_advanced:newData.clock_floor>oldData.clock_floor});
 }
 assert(changed.length<=1);return changed;
}
export async function effectSnapshot(h){return {raw:await rawDatabase(h.pool),authority:authorityMap(h.directory)};}
export async function verifyEffects(h,f,actor,before,after,{allowRevocationOnly=false,baseline}={}){
 assert.deepEqual(after.raw.privateSequences,before.raw.privateSequences);const accounting=admissionEffect(before.raw,after.raw,hash('member:'+hash(actor.credential)),Math.floor(h.time()/60000)),changed=Object.keys(before.raw.privateRows).filter(name=>canonical(before.raw.privateRows[name])!==canonical(after.raw.privateRows[name]));assert.deepEqual(Object.keys(after.raw.privateRows),Object.keys(before.raw.privateRows));let revocation=[];
 for(const name of changed){if(name==='public.admission_limits')continue;if(name==='public.game_rounds'&&allowRevocationOnly){revocation=revocationRoundEffect(before.raw,after.raw,h.keys,f,h.time());continue;}assert.fail('Unexpected changed table outside exact accounting/revocation boundary: '+name);}
 assert.deepEqual(after.authority,before.authority);const rawBoot=await revokedUntouched(h.pool,h.keys,f,baseline);return {changed_tables:changed,admission_accounting:accounting,revocation_only_round_rewrites:revocation,all_other_tables_sequences_and_authority_equal:true,raw_grants_still_revoked:rawBoot,table_hash_before:sha(before.raw.privateRows),table_hash_after:sha(after.raw.privateRows)};
}
export function originalReceipt(response,original){assert.equal(response.status,200);assert.equal(canonical(response.body),canonical(original),'A generic200 is not an idempotent original receipt');assert.equal(response.body.schema_version,2);return {original_receipt_sha256:sha(original),actual_receipt_sha256:sha(response.body),canonical_full_receipt_equal:true};}
