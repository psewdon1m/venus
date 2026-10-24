import {describe,it,expect} from 'vitest';
import {topicScenario as scenario} from './topic-test-harness.js';
const helpers=String.raw`
 const bundle=(g,c)=>({schema_version:2,own:actions(g),target:target(g),conversation:c,chat:c?.state==='active'?privateChat(c):null});
`;
describe('TopicGamesPanel actual single round-view transport',()=>{
 it('reads one bundled response and never requests independently aged private components',async()=>{expect(await scenario(helpers+String.raw`
  const g=game('s'),c=conversation(g,true),reads=[];const api={async request(path){reads.push(path);if(path.endsWith('/current'))return g;if(path.endsWith('/view'))return bundle(g,c);throw new ApiError('NOT_FOUND');}};
  const i=instance(api,false);render(i);await settle();render(i);return {reads,prompt:!!find(i,'private-prompt'),chat:JSON.stringify(find(i,'pair-chat-messages')).includes('PRIVATE CHAT')};
 `)).toEqual({reads:['/api/v2/rooms/room/game/current','/api/v2/rooms/room/game/s/round/round-s/view'],prompt:true,chat:true});});
 it('anchors all four parts at the bundle request start, not its final server time',async()=>{expect(await scenario(helpers+String.raw`
  const g=game('s');const api={async request(path){if(path.endsWith('/current'))return g;if(path.endsWith('/view')){clock+=4000;monotonic+=4000;return bundle(g,conversation(g,true));}throw new ApiError('NOT_FOUND');}};
  const i=instance(api,false);render(i);await settle();render(i);const fresh=!!find(i,'private-prompt');clock+=1001;monotonic+=1001;render(i);return {fresh,expired:!find(i,'private-prompt'),stop:!!find(i,'game-stop')};
 `)).toEqual({fresh:true,expired:true,stop:true});});
 for(const fault of ['foreign','mixed_time','missing_chat','long_lease','aged'] as const)it('refuses '+fault+' bundled data without legacy reads or fake cache publication',async()=>{expect(await scenario(helpers+String.raw`
  const g=game('s'),reads=[];const api={async request(path){reads.push(path);if(path.endsWith('/current'))return g;if(path.endsWith('/view')){if('FAULT'==='aged'){clock+=6000;monotonic+=6000;}const v=bundle(g,conversation(g,true));if('FAULT'==='foreign')v.own.member_id='other';if('FAULT'==='mixed_time')v.conversation.server_time=iso(clock-1);if('FAULT'==='missing_chat')v.chat=null;if('FAULT'==='long_lease')v.own.expires_at=iso(clock+6000);return v;}throw new ApiError('NOT_FOUND');}};
  const i=instance(api,false);render(i);await settle();render(i);return {hidden:!find(i,'private-prompt')&&!find(i,'pair-chat'),legacy:reads.some(v=>v.endsWith('/self-actions')||v.endsWith('/target')||v.endsWith('/conversation'))};
 `.replaceAll('FAULT',fault))).toEqual({hidden:true,legacy:false});});
 it('drops a held bundle on disconnect and preserves only previously confirmed Stop/Pause',async()=>{expect(await scenario(helpers+String.raw`
  const g=game('s'),c=conversation(g,true);let hold=false,release;const wait=new Promise(r=>release=r);const api={async request(path){if(path.endsWith('/current'))return g;if(path.endsWith('/view'))return hold?wait:bundle(g,c);throw new ApiError('NOT_FOUND');}};
  const i=instance(api,false);render(i);await settle();render(i);hold=true;await tick();i.props.connection='offline';render(i);release(bundle(g,c));await settle();render(i);return {hidden:!find(i,'private-prompt'),stop:!!find(i,'game-stop'),pause:!!find(i,'game-pause')};
 `)).toEqual({hidden:true,stop:true,pause:true});});
 it('retains source-independent Stop/Pause when later public/current reads fail',async()=>{expect(await scenario(helpers+String.raw`
  const g=game('s'),c=conversation(g,true);let outage=false;const api={async request(path){if(outage)throw new ApiError('SERVICE_UNAVAILABLE');if(path.endsWith('/current'))return g;if(path.endsWith('/view'))return bundle(g,c);throw new ApiError('NOT_FOUND');}};
  const i=instance(api,false);render(i);await settle();render(i);outage=true;await tick();render(i);return {hidden:!find(i,'private-prompt'),stop:!!find(i,'game-stop'),pause:!!find(i,'game-pause')};
 `)).toEqual({hidden:true,stop:true,pause:true});});
});
