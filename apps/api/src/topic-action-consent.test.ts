import {describe,it,expect} from 'vitest';
import type {ConsentOffer} from '@venus/relationship-engine';
import {TopicGames} from './topic-games.js';
import type {Rooms} from './rooms.js';

/** Actual action-offer timing, with no SQL/authentication claim. Transport
 * regression in P05-TG-06 separately exercises the complete HTTP transitions. */
function fixture(interaction='pair_private',mode='truth_or_dare') {
 let now=1000;
 const games=new TopicGames({now:()=>now,options:{}} as unknown as Rooms,{
  enabled:true,source:{active:async()=>null,pinned:async()=>{throw Error('unused');},assertCurrent:()=>{}},
  safety:{read:async()=>{throw Error('unused');},excludeLocked:async()=>{throw Error('unused');},assertCurrent:()=>{}}
 });
 const data={plan:{interaction,actors:['a','b'],requires_action_consent:true},choice:'dare',
  invitation:{active_until:181000},action:null as ConsentOffer|null};
 const loaded={game:{mode},data};
 const begin=Reflect.get(games,'beginAction') as (loaded:unknown,privatePromptReady?:boolean)=>void;
 return {data,begin:(ready?:boolean)=>begin.call(games,loaded,ready),setNow:(value:number)=>{now=value;}};
}

describe('private action consent starts after visible, bilaterally approved content',()=>{
 it('does not consume an action deadline while topic acceptance is still pending',()=>{
  const f=fixture();f.begin();expect(f.data.action).toBeNull();
  f.setNow(29999);f.begin(false);expect(f.data.action).toBeNull();
  f.setNow(30000);f.begin(true);
  expect(f.data.action).toMatchObject({state:'pending',scope:'action',created_at:30000,deadline:60000,acks:[]});
 });
 it('never renews an existing offer when the active topic is read or accepted again',()=>{
  const f=fixture();f.begin(true);const original=f.data.action;
  f.setNow(20000);f.begin(true);expect(f.data.action).toBe(original);expect(f.data.action?.deadline).toBe(31000);
 });
 it('bounds the new pending window by the original private invitation',()=>{
  const f=fixture();f.setNow(175000);f.begin(true);
  expect(f.data.action?.created_at).toBe(175000);expect(f.data.action?.deadline).toBe(181000);
 });
 it('requires a fresh private topic after content replacement clears action consent',()=>{
  const f=fixture();f.begin(true);const original=f.data.action;
  f.data.action=null;f.setNow(15000);f.begin(false);expect(f.data.action).toBeNull();
  f.setNow(29000);f.begin(true);expect(f.data.action?.offer_id).not.toBe(original?.offer_id);
  expect(f.data.action?.acks).toEqual([]);expect(f.data.action?.deadline).toBe(59000);
 });
 it('preserves immediate public-pair consent timing',()=>{
  const f=fixture('pair_public');f.begin();expect(f.data.action?.created_at).toBe(1000);
  expect(f.data.action?.deadline).toBe(31000);
 });
 it('does not create consent before a truth/dare side is chosen',()=>{
  const f=fixture();Reflect.set(f.data,'choice',null);f.begin(true);expect(f.data.action).toBeNull();
 });
});
