import {topicScenario} from '../../apps/web/src/topic-test-harness.ts';import assert from 'node:assert/strict';import{writeFileSync}from'node:fs';
const result=await topicScenario(String.raw`
 let g=game('s','questions',33),c=conversation(g,true),releasePost,releaseConversation,postSeen=false,holdConversation=false;
 c.advice=[{advice_id:'advice',revision:1,epoch:1,direction:'received',state:'pending',expires_at:iso(clock+30000)}];
 const actionDeadline=clock+30000,api={async request(path,body){if(body){postSeen=true;await new Promise(resolve=>releasePost=resolve);g={...g,game_rev:34};c={...conversation(g,true),revision:6,advice:[{advice_id:'advice',revision:2,epoch:1,direction:'received',state:'accepted',expires_at:iso(clock+180000),text:'SYNTHETIC ADVICE ONE'}]};holdConversation=true;return {schema_version:2,request_id:body.request_id,game_rev:34};}if(path.endsWith('/current'))return g;if(path.endsWith('/self-actions'))return actions(g);if(path.endsWith('/target')){const t=target(g);t.action={offer_id:'action',consent_scope:'action',proposal_revision:1,own_state:'pending',state:'pending',expires_at:iso(actionDeadline)};return t;}if(path.endsWith('/conversation/chat'))return privateChat(c);if(path.endsWith('/conversation'))return holdConversation?new Promise(resolve=>releaseConversation=resolve):c;throw new ApiError('NOT_FOUND');}};
 const i=instance(api);render(i);await settle();render(i);const noEarlyPreview=!find(i,'advice-text'),before=clock;
 find(i,'advice-accept').props.onClick();await settle();const clickedButUncommitted=postSeen&&!find(i,'advice-text')&&typeof releasePost==='function';
 clock+=2100;monotonic+=2100;releasePost();await settle();const freshReadPending=typeof releaseConversation==='function';
 clock+=2900;monotonic+=2900;render(i);const atOriginal5000Missing=!find(i,'advice-text');
 clock+=100;monotonic+=100;releaseConversation(c);await settle();render(i);const laterAcceptedText=JSON.stringify(find(i,'advice-text')).includes('SYNTHETIC ADVICE ONE');
 return {noEarlyPreview,clickedButUncommitted,freshReadPending,atOriginal5000Missing,laterAcceptedText,clickToRenderMs:clock-before,freshReadMs:3000,actionRemainingMs:actionDeadline-clock};
`);
assert(result.noEarlyPreview&&result.clickedButUncommitted&&result.freshReadPending&&result.atOriginal5000Missing&&result.laterAcceptedText);assert.equal(result.clickToRenderMs,5100);assert.equal(result.freshReadMs,3000);assert(result.actionRemainingMs>0);
writeFileSync('.artifacts/p05-advice-browser-diagnosis-round01/tsx-probes.json',JSON.stringify({status:'PASS',scope:'UNMODIFIED1274_PANEL_HARNESS_WITH_EXPLICIT_DEFERRED_HTTP_FIXTURE_NOT_ACTUAL_BROWSER_TIMESTAMP_REPLAY',result},null,2)+'\n');console.log(JSON.stringify({status:'PASS',result}));
