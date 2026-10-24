from pathlib import Path
p=Path('apps/web/src/topic-games-panel.tsx');s=p.read_text(encoding='utf-8')
s=s.replace('TopicCache,validTopicTarget,topicRefusals,','TopicCache,topicRefusals,')
s=s.replace("import {OtherQuestionSafety}","import {validTopicRoundView} from './topic-round-view.js';\nimport {OtherQuestionSafety}")
start=s.index('  const token=controls.token(),sequence=controls.begin(),started=presentationNow();')
end=s.index('\n }catch(e){',start)
replacement='''  const token=controls.token(),sequence=controls.begin(),started=presentationNow();
  const publishOwn=(value:unknown,received:number)=>{if(!validSelfActions(value,2)||value.schema_version!==2)return false;const accepted=controls.accept(value,token,sequence,started,received);if(accepted)publicLease.grant(publicRead,currentStarted,received,value.server_time,value.expires_at);else publicLease.clear();if(!value.conversation_actions.other_question)otherSafety.clear();redraw(n=>n+1);return accepted;};
  if(!round||!s||connection!=='ready'||current.state!=='active'||terminalRound(current)){
   try{const value=await api.request<unknown>(base+'/self-actions');if(alive.current&&boundary.sameTransport(requestAuth)&&cache.current(read))publishOwn(value,presentationNow());}catch{publicLease.clear();}return;
  }
  const path=`${base}/${current.session_id}/round/${round.round_id}`,value=await api.request<unknown>(path+'/view');
  if(!alive.current||!boundary.sameTransport(requestAuth)||!cache.current(read))return;
  if(!validTopicRoundView(value,s))throw new ApiError('SERVICE_UNAVAILABLE');
  const received=presentationNow();if(!publishOwn(value.own,received)){cache.clear();return;}
  if(value.target)controls.observeRefusals(topicRefusals(value.target),token,received);
  if(cache.accept(read,s,value.target,value.conversation,value.chat,value.own.server_time,started,received,value.own.expires_at)&&cache.conversation)otherSafety.observe(cache.conversation,started,received,controls.conversationAllowed('other_question',token,received)===true);redraw(n=>n+1);'''
s=s[:start]+replacement+s[end:];p.write_text(s,encoding='utf-8')
