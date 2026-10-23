import type {Offer} from './rooms.js';
import {canonical,hash} from './security.js';

/** Explicit local owner-authorized pilot. Never supplies production legal terms. */
export function entryProfile(profile:string|undefined,origin:string):Offer|null {
  if(profile===undefined||profile==='closed') return null;
  if(profile!=='local-pilot') throw new Error('ENTRY_PROFILE_INVALID');
  const url=new URL(origin);
  if(url.origin!==origin||url.protocol!=='https:'||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)) throw new Error('LOCAL_PILOT_ORIGIN_REQUIRED');
  const text={
    ru:'Тестовый Venus для приглашённых друзей. Данные оператора и юридические тексты — макеты. Подтверди, что тебе исполнилось 18 лет. Любое задание можно пропустить, а согласие — отозвать.',
    en:'Venus test for invited friends. Operator details and legal texts are mock values. Confirm that you are at least 18. You may skip any task and withdraw consent.',
    tr:'Davet edilen arkadaşlar için Venus testi. İşletmeci bilgileri ve hukuki metinler örnektir. En az 18 yaşında olduğunu onayla. Her görevi atlayabilir ve verdiğin onayı geri çekebilirsin.'
  };
  return {version:'local-pilot-mock-1',digest:'sha256:'+hash(canonical(text)),text,synthetic:true};
}
