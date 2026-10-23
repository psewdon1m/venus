import {writeFileSync} from 'node:fs';
import {harness,migrate,migrateGames,migrateChat,migratePrivateTopics,randomUUID} from '/app/tests/p05-topic-lifecycle/harness.mjs';
import {topicAad} from '/app/apps/api/dist/topic-game-model.js';
const h=harness(),report={schema_version:1,suite:'INDEPENDENT_V2_CHAT_CONTEXT',status:'ERROR',checks:[],observations:{}};
try {
 await migrate(h.pool);await migrateGames(h.pool);await migrateChat(h.pool);await migratePrivateTopics(h.pool);await h.listen();
 const f=await h.privateRound();await h.release(f);const g=await h.current(f),s=h.keys.decrypt(g.snapshot_cipher,topicAad.snapshot(f.room,f.game));
 const view=await h.ok(f.host,h.round(f)+'/conversation');
 const post=await h.call(f.host,h.round(f)+'/conversation/chat','POST',{request_id:randomUUID(),conversation_id:f.data.conversation_id,epoch:view.epoch,text:'SYNTHETIC_IN_PERSON_CONTEXT_CANARY'});
 const get=await h.call(f.members.find(a=>a.id!==f.host.id),h.round(f)+'/conversation/chat');
 const self=await h.call(f.host,h.base(f)+'/self-actions');
 report.observations={snapshot_context:s.baseline.context,capabilities:s.baseline.capabilities,post_status:post.status,post_code:post.body.code??null,get_status:get.status,peer_received_synthetic_canary:JSON.stringify(get.body).includes('SYNTHETIC_IN_PERSON_CONTEXT_CANARY'),self_actions:self,synthetic_fixture:true,operator_env_false:process.env.VENUS_PRIVATE_TEXT_CHAT==='false',operator_env_consumed_by_harness:false};
 report.checks=[{id:'IN_PERSON_CHAT_POST_DENIED',status:post.status>=400?'PASS':'FAIL'},{id:'IN_PERSON_CHAT_READ_DENIED',status:get.status>=400?'PASS':'FAIL'},{id:'IN_PERSON_SNAPSHOT_NO_CHAT_CAPABILITY',status:s.baseline.capabilities.includes('private_text_chat')?'FAIL':'PASS'}];
 report.status=report.checks.every(x=>x.status==='PASS')?'PASS':'FAIL';
} catch(e){report.error={message:e.message,stack:e.stack};}finally{await h.cleanup();writeFileSync('/artifacts/independent-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(report.status!=='PASS')process.exitCode=1;}
