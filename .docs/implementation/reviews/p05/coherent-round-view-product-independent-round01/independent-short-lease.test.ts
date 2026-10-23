import {it,expect} from 'vitest';
import {topicScenario} from 'C:/.projects/venus/.artifacts/p05-engine3-bundle-source01/apps/web/src/topic-test-harness.ts';
it('independent subsecond delivery lease stays request-start anchored',async()=>{expect(await topicScenario(String.raw`
 const g=game('s'),reads=[];const api={async request(path){reads.push(path);if(path.endsWith('/current'))return g;if(path.endsWith('/view')){clock+=4700;monotonic+=4700;const c=conversation(g,true);return {schema_version:2,own:actions(g),target:target(g),conversation:c,chat:privateChat(c)};}throw new ApiError('NOT_FOUND');}};
 const i=instance(api,false);render(i);await settle();render(i);const fresh=!!find(i,'private-prompt');clock+=301;monotonic+=301;render(i);return {fresh,expired:!find(i,'private-prompt'),legacy:reads.some(x=>x.endsWith('/self-actions')||x.endsWith('/conversation'))};
 `)).toEqual({fresh:true,expired:true,legacy:false});});
