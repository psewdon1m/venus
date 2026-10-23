import {assertRevokedRoundView} from 'file:///C:/.projects/venus/.artifacts/p05-engine3-bundle-source01/.artifacts/p05-compatible-rollback-producer06/scenarios.mjs';
import assert from 'node:assert/strict';
import {assertRevokedRoundView as oldOracle} from "file:///C:/.projects/venus/.artifacts/p05-engine3-bundle-source01/.artifacts/p05-compatible-rollback-producer05/scenarios.mjs";
const f={room:'room',game:'game',plan:{round_id:'round'}},member='member',clone=x=>JSON.parse(JSON.stringify(x)),rows=[];
const own={schema_version:2,room_id:f.room,member_id:member,session_id:f.game,round_id:f.plan.round_id,game_rev:'3',room_rev:'4',server_time:new Date(1002000).toISOString(),expires_at:new Date(1007000).toISOString(),session_actions:{pause:true,stop:true,abort:false,resume:false,advance:false,neutral_reset:true,neutral_reset_aborts_game:true},round_actions:{finish:false,skip:false,choose_truth:false,choose_dare:false,propose_condition:false,accept_invitation:false,accept_action:false,decline_invitation:false,withdraw_action:false},conversation_actions:{offer_topic:false,other_question:false,respond_topic:false,offer_advice:false,chat:false}};
const response={status:200,raw:'safe',body:{schema_version:2,own,target:null,conversation:null,chat:null}};
const r=clone(response);r.body.own.game_rev={private_preference:'UNEXPECTED_PRIVATE_CANARY'};r.body.own.room_rev=['UNEXPECTED_PRIVATE_CANARY'];r.raw=JSON.stringify(r.body);
assert.equal(oldOracle(r,true,f,member).safe_own_only,true,'historical05mustretaincounterexample');
assert.throws(()=>assertRevokedRoundView(r,true,f,member),{code:'ERR_ASSERTION'},'06mustrejectsameoriginalcounterexample');
let checks=2;
for(const field of ['game_rev','room_rev'])for(const value of [undefined,3n,new Number(3)]){const x=clone(response);x.body.own.game_rev=3;x.body.own.room_rev=4;x.body.own[field]=value;assert.throws(()=>assertRevokedRoundView(x,true,f,member));checks++;}
for(const field of ['game_rev','room_rev']){const x=clone(response);x.body.own.game_rev=3;x.body.own.room_rev=4;x.body.own[field]=Number.MAX_SAFE_INTEGER;assert.equal(assertRevokedRoundView(x,true,f,member).safe_own_only,true);checks++;}
console.log(JSON.stringify({status:'PASS_EXACT_OLD_COUNTEREXAMPLE_REJECTED_PLUS_TYPED_BOUNDARIES',checks,Docker:false,RUN:false}));
