import {it,expect} from 'vitest';
import {TopicGames} from 'C:/.projects/venus/apps/api/src/topic-games.ts';
import {createPrivateConversation,applyPrivateConversation} from '@venus/relationship-engine';
const actors=['alice','bob'],scope={room_id:'room',session_id:'game',round_id:'round',actors},topics=[{topic_id:'creative',labels:{ru:'x',en:'x',tr:'x'}}],candidates=[0,1].map(i=>({candidate_ref:'candidate-'+i,card_id:'synthetic-'+i,card_revision:1,card_sha256:String(i+1).repeat(64),topic_ids:['creative'],prompt:{ru:'x',en:'x',tr:'x'}}));
function fixture(now:number){let state=createPrivateConversation({scope,pins:{pack_digest:'1'.repeat(64),map_digest:'2'.repeat(64),taxonomy_digest:'3'.repeat(64)},topics,candidates,now:1000,parent_expires_at:181000});
 const run=(command:unknown,time=1000)=>{const result=applyPrivateConversation(state,command as never,{actor:'alice',now:time,scope});expect(result.error).toBeNull();state=result.state;};
 for(const actor of actors){const result=applyPrivateConversation(state,{kind:'set_topics',expected_preference_revision:1,allow:['creative'],exclude:[]},{actor,now:1000,scope});expect(result.error).toBeNull();state=result.state;}
 run({kind:'offer_topic',expected_revision:state.revision,expected_epoch:state.epoch,offer_id:'offer-0',token:'a'.repeat(64),candidate:{candidate_ref:candidates[0]!.candidate_ref,card_sha256:candidates[0]!.card_sha256}});
 const initial=state,offer=state.offer!;run({kind:'other_question',offer_id:offer.offer_id,epoch:offer.epoch,proposal_revision:offer.proposal_revision,token:offer.token,exclude_current_topics:false},now);
 const next=applyPrivateConversation(state,{kind:'offer_topic',expected_revision:state.revision,expected_epoch:state.epoch,offer_id:'offer-1',token:'b'.repeat(64),candidate:{candidate_ref:candidates[1]!.candidate_ref,card_sha256:candidates[1]!.card_sha256}},{actor:'alice',now,scope});
 const games=new TopicGames({now:()=>now,options:{}} as never,{enabled:true,source:{active:async()=>null,pinned:async()=>{throw Error('unused')},assertCurrent:()=>{}},safety:{read:async()=>{throw Error('unused')},excludeLocked:async()=>{throw Error('unused')},assertCurrent:()=>{}}});
 const data={schema_version:2,state:'active',clock_floor:1000,boot_id:games.bootId,invitation:null,action:null,plan:{actors,interaction:'pair_private',primary_member_id:'alice',requires_action_consent:false},choice:'dare'};
 const context={g:{id:'game',rev:'3',state:'active',mode:'truth_or_dare'},r:{row:{id:'round'},data},member:true,host:false,role:'primary',ordinary:true,l:{safety:{members:actors.map(member_id=>({member_id,revision:initial.preferences[member_id]!.revision,allow_topic_ids:['creative'],excluded_topic_ids:[]}))}},conv:{state:initial},presence:{deadline:181000}};
 const own=Reflect.get(games,'selfActionsValue').call(games,{room:{id:'room',rev:'1'},member:{id:'alice'}},context,true);
 return {own,next};}
for(const now of [4500,5999])it('RED capability false while actual engine RATE_LIMIT at '+now,()=>{const f=fixture(now);expect(f.next.error).toBe('RATE_LIMIT');expect(f.own.conversation_actions.offer_topic).toBe(false);});
it('exact5s boundary stays permitted without reducing engine interval',()=>{const f=fixture(6000);expect(f.next.error).toBeNull();expect(f.own.conversation_actions.offer_topic).toBe(true);});
