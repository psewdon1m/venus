/** Read-only actual TSX/cache probes with existing explicit inert scheduler. */
import fs from 'node:fs';import assert from 'node:assert/strict';
import {topicScenario} from '../../apps/web/src/topic-test-harness.ts';
const rows=[];
async function check(name,source,expected){const result=await topicScenario(source);assert.deepEqual(JSON.parse(JSON.stringify(result)),expected);rows.push({name,status:'PASS',result});}
await check('auth_object_identity_stable_without_transport_change',String.raw`
 const {AuthBoundary}=load('game-operations.ts'),boundary=new AuthBoundary('room','a',true),a=Object.freeze(boundary.bind('room','a',true)),b=Object.freeze(boundary.bind('room','a',true));return {same:a===b};
`,{same:true});
await check('stable_clear_frame_is_not_recleared_on_every_tick',String.raw`
 const g=game('s'),c=conversation(g,true);const api={async request(path){if(path.endsWith('/current'))return g;if(path.endsWith('/self-actions'))return actions(g,{accept_action:true});if(path.endsWith('/target'))return target(g);if(path.endsWith('/conversation/chat'))return privateChat(c);if(path.endsWith('/conversation'))return c;throw new ApiError('NOT_FOUND');}};const i=instance(api);render(i);await settle();render(i);const before=!!find(i,'private-prompt');const signal={schema:1,room_id:'room',stream:'private',audience:'member',target_member_id:'a',type:'game.private_cleared'};i.props.frame=signal;render(i);await settle();render(i);await tick();render(i);await settle();render(i);const recovered=!!find(i,'private-prompt');for(let n=0;n<4;n++){for(const row of [...intervals])if(row.ms===250)row.fn();render(i);await settle();render(i);}return {before,recovered,stillVisible:!!find(i,'private-prompt')};
`,{before:true,recovered:true,stillVisible:true});
await check('complete_batch_beyond_lease_is_fail_closed_even_valid_payload',String.raw`
 const {TopicCache}=load('topic-state.ts'),g=game('s'),c=conversation(g,true),scope={room:'room',member:'a',identity:1,transport:1,session:g.session_id,round:g.current_round.round_id,rev:g.game_rev},cache=new TopicCache(),read=cache.bind(scope);const accepted=cache.accept(read,scope,target(g),c,privateChat(c),iso(clock),clock,clock+5100,iso(clock+5000));return {accepted,targetAbsent:cache.target===null,conversationAbsent:cache.conversation===null};
`,{accepted:false,targetAbsent:true,conversationAbsent:true});
const report={status:'PASS',scope:'INDEPENDENT_ACTUAL_TSX_INERT_SCHEDULER_NOT_BROWSER_OR_DOCKER',checks:rows.length,rows,actual05_cause_confirmed:false};fs.writeFileSync('.artifacts/p05-topic-browser-delivery-diagnostic/probes.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
