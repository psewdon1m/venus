from pathlib import Path
import shutil
p=Path('.artifacts/p05-engine3-bundle-source01/.artifacts/p05-compatible-rollback-producer05');f=p/'scenarios.mjs';shutil.copyfile(f,p/'pinned-inputs/historical04-scenarios.mjs.bytes');text=f.read_text(encoding='utf-8')
marker='export async function replay(h,obs,effects,saved,baseline)'
helper='''/** Version-bound revoked bundle assertion: safe own metadata is not a legacy403 denial. */
export function assertRevokedRoundView(response,bundled,f,member){
 assert(!response.raw.includes('SYNTHETIC'));
 if(!bundled){assert.equal(response.status,404);assert.equal(response.body.statusCode,404);assert.equal(response.body.error,'Not Found');return{endpoint:'ABSENT_B3',status:404,version_bound_NA:true};}
 assert.equal(response.status,200);const v=response.body;assert.deepEqual(Object.keys(v).sort(),['chat','conversation','own','schema_version','target']);assert.equal(v.schema_version,2);assert.equal(v.target,null);assert.equal(v.conversation,null);assert.equal(v.chat,null);
 const own=v.own;assert.equal(own.schema_version,2);assert.equal(own.room_id,f.room);assert.equal(own.session_id,f.game);assert.equal(own.round_id,f.plan.round_id);assert.equal(own.member_id,member);
 assert.deepEqual(Object.keys(own).sort(),['conversation_actions','expires_at','game_rev','member_id','room_id','room_rev','round_actions','round_id','schema_version','server_time','session_actions','session_id']);
 assert.deepEqual(own.conversation_actions,{offer_topic:false,other_question:false,respond_topic:false,offer_advice:false,chat:false});
 assert.deepEqual(Object.keys(own.round_actions).sort(),['accept_action','accept_invitation','choose_dare','choose_truth','decline_invitation','finish','propose_condition','skip','withdraw_action']);
 for(const value of Object.values(own.round_actions))assert.equal(value,false);
 assert.deepEqual(Object.keys(own.session_actions).sort(),['abort','advance','neutral_reset','neutral_reset_aborts_game','pause','resume','stop']);for(const value of Object.values(own.session_actions))assert.equal(typeof value,'boolean');assert.equal(own.session_actions.resume,false);assert.equal(own.session_actions.advance,false);
 const issued=Date.parse(own.server_time),expires=Date.parse(own.expires_at);assert(Number.isFinite(issued)&&Number.isFinite(expires)&&expires>issued&&expires-issued<=5000);return{endpoint:'A3_BUNDLED',status:200,safe_own_only:true,private_parts_null:true};
}
'''
assert marker in text;text=text.replace(marker,helper+marker)
marker=" for(const request of f.requests)"
extra=""" const now=h.time();assert([1001000,1002000].includes(now));const bundled=now===1002000;assert.equal(typeof h.topics.dispatchRoundView==='function',bundled);const bundleActor=actor(f,(await obs.storedGame(h.pool,h.keys,f)).data.plan.actors[0]),bundleBefore=await effects.effectSnapshot(h),bundleResponse=await h.call(bundleActor,h.round(f)+'/view'),bundle=assertRevokedRoundView(bundleResponse,bundled,f,bundleActor.id);rows.push({kind:'revoked_round_view',...bundle,effects:await effects.verifyEffects(h,f,bundleActor,bundleBefore,await effects.effectSnapshot(h),{allowRevocationOnly:true,baseline})});
"""
assert marker in text;text=text.replace(marker,extra+marker);f.write_text(text,encoding='utf-8')
