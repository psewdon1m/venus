import {topicScenario} from '../../apps/web/src/topic-test-harness.ts';import assert from'node:assert/strict';import{writeFileSync}from'node:fs';
const result=await topicScenario(String.raw`
 const g=game('s','questions',28);const actionDeadline=clock+30000;let fresh=false,releaseOwn,releaseTarget,posts=[];
 const makeTarget=()=>({...target(g),action:{offer_id:'action',consent_scope:'action',proposal_revision:1,own_state:'pending',state:'pending',expires_at:iso(actionDeadline)}});
 const api={async request(path,body){if(body){posts.push({path,...body});return{schema_version:2,request_id:body.request_id,game_rev:28};}if(path.endsWith('/current'))return g;if(path.endsWith('/self-actions')){if(fresh)return new Promise(resolve=>releaseOwn=()=>resolve(actions(g,{accept_action:true})));return actions(g,{accept_action:true});}if(path.endsWith('/target')){if(fresh)return new Promise(resolve=>releaseTarget=()=>{fresh=false;resolve(makeTarget());});return makeTarget();}if(path.endsWith('/conversation/chat'))return privateChat(conversation(g,true));if(path.endsWith('/conversation'))return conversation(g,true);throw new ApiError('NOT_FOUND');}};
 const i=instance(api);render(i);await settle();render(i);const initialEnabled=find(i,'action-accept')?.props.disabled===false;
 clock+=4425;monotonic+=4425;fresh=true;await tick();clock+=572;monotonic+=572;releaseOwn();await settle();render(i);
 const heldTarget=typeof releaseTarget==='function',button=find(i,'action-accept'),enabledImmediatelyBeforeExpiry=button?.props.disabled===false;
 clock+=54;monotonic+=54;button.props.onClick();await settle();const expiredClickNoPost=posts.length===0,actionRemainingAtClick=actionDeadline-clock;
 clock+=1949;monotonic+=1949;releaseTarget();await settle();render(i);const freshEnabled=find(i,'action-accept')?.props.disabled===false;
 find(i,'action-accept').props.onClick();await settle();const retryPosted=posts.length===1&&posts[0].kind==='accept'&&posts[0].scope==='action'&&posts[0].offer_id==='action'&&posts[0].proposal_revision===1;
 return {initialEnabled,heldTarget,enabledImmediatelyBeforeExpiry,expiredClickNoPost,actionRemainingAtClick,freshEnabled,retryPosted,posts:posts.map(({path,kind,scope,offer_id,proposal_revision})=>({path,kind,scope,offer_id,proposal_revision}))};
`);
assert(result.initialEnabled&&result.heldTarget&&result.enabledImmediatelyBeforeExpiry&&result.expiredClickNoPost&&result.freshEnabled&&result.retryPosted);assert.equal(result.actionRemainingAtClick,24949);
const result2=await topicScenario(String.raw`
 const g=game('s','questions',28);let posts=0;const api={async request(path,body){if(body){posts++;return{};}if(path.endsWith('/current'))return g;if(path.endsWith('/self-actions'))return actions(g,{accept_action:true});if(path.endsWith('/target'))return{...target(g),action:{offer_id:'action',consent_scope:'action',proposal_revision:1,own_state:'pending',state:'pending',expires_at:iso(clock+30000)}};if(path.endsWith('/conversation/chat'))return privateChat(conversation(g,true));if(path.endsWith('/conversation'))return conversation(g,true);throw new ApiError('NOT_FOUND');}};
 const i=instance(api);render(i);await settle();render(i);const stale=find(i,'action-accept').props.onClick;clock+=5001;monotonic+=5001;stale();await settle();return{bothOwnAndPrivateExpiredNoPost:posts===0};
`);assert(result2.bothOwnAndPrivateExpiredNoPost);
writeFileSync('.artifacts/p05-action-accept-actual-diagnosis-round01/probes.json',JSON.stringify({status:'PASS',checks:2,result,result2,scope:'EXACT_UNMODIFIED_1274_PANEL_HARNESS_WITH_EXPLICIT_DEFERRED_TARGET_AND_RETAINED_DOM_CALLBACK_NOT_ACTUAL_BROWSER_INTERNAL_TRACE'},null,2)+'\n');console.log(JSON.stringify({status:'PASS',result,result2}));
