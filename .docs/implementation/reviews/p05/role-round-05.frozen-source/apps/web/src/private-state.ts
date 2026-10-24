import type {ActionConsentState,PairCondition,PairInvitation,PrivatePrompt,PrivateChatView} from '@venus/contracts';
export type ChatView=PrivateChatView;
export type PrivateState={invitation:PairInvitation|null;prompt:PrivatePrompt|null;action:ActionConsentState|null;condition:PairCondition|null;chat:ChatView|null};
const obj=(x:unknown):x is Record<string,unknown>=>Boolean(x&&typeof x==='object'&&!Array.isArray(x));
const text=(x:unknown):x is string=>typeof x==='string';
const revision=(x:unknown)=>Number.isSafeInteger(x)&&Number(x)>=1;
const exp=(x:Record<string,unknown>,now:number)=>text(x.expires_at)&&Number.isFinite(Date.parse(x.expires_at))&&Date.parse(x.expires_at)>now;
/** Only HTTP responses matching this exact authenticated round become renderable. */
export function scopePrivate(raw:{invitation:unknown;prompt:unknown;action:unknown;condition:unknown;chat:unknown},session:string,round:string,member:string,now:number):PrivateState {
 const i=raw.invitation,p=raw.prompt,a=raw.action,c=raw.condition,h=raw.chat;
 const invitation=obj(i)&&i.session_id===session&&i.round_id===round&&text(i.offer_id)&&text(i.invitation)&&i.consent_scope==='invitation'&&['pending','accepted'].includes(String(i.own_state))&&revision(i.proposal_revision)&&exp(i,now)?i as unknown as PairInvitation:null;
 const prompt=obj(p)&&p.session_id===session&&p.round_id===round&&p.state==='active'&&text(p.offer_id)&&text(p.prompt)&&text(p.card_id)&&revision(p.card_revision)&&revision(p.proposal_revision)&&Array.isArray(p.actors)&&p.actors.length===2&&p.actors.every(text)&&p.actors.includes(member)&&exp(p,now)?p as unknown as PrivatePrompt:null;
 const action=obj(a)&&a.round_id===round&&text(a.offer_id)&&a.consent_scope==='action'&&revision(a.proposal_revision)&&['pending','accepted'].includes(String(a.own_state))&&['pending','active'].includes(String(a.state))&&exp(a,now)?a as unknown as ActionConsentState:null;
 const condition=obj(c)&&c.round_id===round&&text(c.author_member_id)&&text(c.condition)&&text(c.request_id)&&action&&c.proposal_revision===action.proposal_revision?c as unknown as PairCondition:null;
 const chat=obj(h)&&h.session_id===session&&h.round_id===round&&Number.isSafeInteger(h.chat_rev)&&Number(h.chat_rev)>=0&&exp(h,now)&&prompt&&Array.isArray(h.messages)&&h.messages.length<=32&&h.messages.every(m=>obj(m)&&text(m.message_id)&&text(m.sender_member_id)&&prompt.actors.includes(m.sender_member_id)&&text(m.text)&&text(m.sent_at)&&exp(m,now))?h as unknown as ChatView:null;
 return {invitation,prompt,action,condition,chat};
}
