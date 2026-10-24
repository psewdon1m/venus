import {describe,expect,it} from 'vitest';
import {scopePrivate} from './private-state.js';
const now=10000,expires_at=new Date(20000).toISOString();
const invitation={offer_id:'offer',session_id:'s',round_id:'r',expires_at,invitation:'neutral',own_state:'pending',proposal_revision:1,consent_scope:'invitation'};
const prompt={offer_id:'offer',session_id:'s',round_id:'r',expires_at,state:'active',card_id:'Q',card_revision:1,actors:['a','b'],prompt:'PRIVATE SAMPLE',proposal_revision:1};
const action={offer_id:'action',round_id:'r',expires_at,consent_scope:'action',proposal_revision:2,own_state:'pending',state:'pending'};
const condition={round_id:'r',author_member_id:'b',condition:'private condition',request_id:'request',proposal_revision:2};
const chat={session_id:'s',round_id:'r',chat_rev:1,expires_at,messages:[{message_id:'m',sender_member_id:'a',text:'sample',sent_at:new Date(now).toISOString(),expires_at}]};
const raw={invitation,prompt,action,condition,chat};
describe('private rendering fence',()=>{
 it('requires exact session/round/member scope, never grants host implicit access',()=>{expect(scopePrivate(raw,'s','r','a',now)).toEqual(raw);expect(scopePrivate(raw,'s','r','host',now).prompt).toBeNull();expect(scopePrivate(raw,'s','r','host',now).chat).toBeNull();expect(scopePrivate(raw,'other','r','a',now).invitation).toBeNull();expect(scopePrivate(raw,'s','other','a',now)).toEqual({invitation:null,prompt:null,action:null,condition:null,chat:null});});
 it('hides expired content and clears stale terms when proposal revision changes',()=>{expect(scopePrivate(raw,'s','r','a',20000)).toEqual({invitation:null,prompt:null,action:null,condition:null,chat:null});expect(scopePrivate({...raw,action:{...action,proposal_revision:3}},'s','r','a',now).condition).toBeNull();expect(scopePrivate({...raw,action:{...action,state:'declined'}},'s','r','a',now).condition).toBeNull();});
 it('rejects chat with outsiders, overlong history or a stale round',()=>{for(const value of [{...chat,round_id:'old'},{...chat,messages:Array(33).fill(chat.messages[0])},{...chat,messages:[{...chat.messages[0],sender_member_id:'host'}]}]) expect(scopePrivate({...raw,chat:value},'s','r','a',now).chat).toBeNull();});
});
