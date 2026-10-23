import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import ts from 'typescript';
// Actual TSX evaluation with a deterministic hook/API scheduler. This checks
// asynchronous application logic; real ReactDOM/browser coverage is separate.
const harness=String.raw`let clock=10000,current;
const intervals=[],microtasks=[],timeouts=[];
class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
const react={useState(initial){const i=current.cursor++,instance=current;if(!instance.hooks[i])instance.hooks[i]={value:typeof initial==='function'?initial():initial,set:v=>{instance.hooks[i].value=typeof v==='function'?v(instance.hooks[i].value):v;}};return [instance.hooks[i].value,instance.hooks[i].set];},useRef(initial){const i=current.cursor++;if(!current.hooks[i])current.hooks[i]={current:initial};return current.hooks[i];},useCallback(fn,deps){const i=current.cursor++;if(!current.hooks[i]||!same(current.hooks[i].deps,deps))current.hooks[i]={fn,deps};return current.hooks[i].fn;},useEffect(fn,deps){const i=current.cursor++,old=current.hooks[i];if(!old||!same(old.deps,deps)){current.hooks[i]={deps,cleanup:old?.cleanup};current.effects.push(()=>{current.hooks[i].cleanup?.();current.hooks[i].cleanup=fn();});}}};
const element=(type,props,key)=>({type,key,props:props||{}});const modules={};
function load(name){if(modules[name])return modules[name].exports;const file=resolve(root,'apps/web/src',name),module={exports:{}};modules[name]=module;const source=readFileSync(file,'utf8'),out=ts.transpileModule(source,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const wrapper=vm.runInNewContext('(function(require,exports,module){'+out+'\n})',{console,Date:ClockDate,TextEncoder,AbortSignal,fetch,location:{origin:'https://fixture.invalid'},crypto:{randomUUID},window:{addEventListener(){},removeEventListener(){}},document:{addEventListener(){},removeEventListener(){},visibilityState:'visible'},queueMicrotask:fn=>microtasks.push(fn),setTimeout:(fn,ms)=>{const row={fn,ms,at:clock+ms};timeouts.push(row);return row;},clearTimeout:row=>{const i=timeouts.indexOf(row);if(i>=0)timeouts.splice(i,1);},setInterval:(fn,ms)=>{const row={fn,ms};intervals.push(row);return row;},clearInterval:row=>{const i=intervals.indexOf(row);if(i>=0)intervals.splice(i,1);}});
 wrapper(path=>{if(path==='react')return react;if(path==='react/jsx-runtime')return {jsx:element,jsxs:element,Fragment:Symbol.for('Fragment')};if(path.startsWith('./'))return load(path.slice(2).replace(/\.js$/,'.ts'));throw new Error('Unexpected import '+path);},module.exports,module);return module.exports;}
// GamesPanel TSX is the actual unmodified module, not a copied implementation.
const gamesFile=resolve(root,'apps/web/src/games-panel.tsx');const originalLoad=load;
// The loader accepts .tsx when explicitly requested.
const {GamesPanel}=load('games-panel.tsx'),{ApiError}=load('api.ts');
function treeFind(tree,predicate){if(Array.isArray(tree)){for(const x of tree){const r=treeFind(x,predicate);if(r)return r;}return null;}if(!tree||typeof tree!=='object')return null;if(predicate(tree))return tree;return treeFind(tree.props?.children,predicate);}
const find=(instance,id)=>treeFind(instance.tree,x=>x.props?.['data-testid']===id);
function instance(api){const props={api,room:{room_id:'room',room_rev:1,meeting_context:'online',features:{games:'available'},members:[{id:'a',role:'host',setup_ready:true,display_name:'A'},{id:'b',role:'member',setup_ready:true,display_name:'B'}]},prefs:{owner_member_id:'a',comfort:1,rev:1,edges:{}},locale:'en',connection:'ready',frame:null,refreshRoom:async()=>{},onError:()=>{}};return {props,hooks:[],effects:[],cursor:0,tree:null};}
function render(i){current=i;i.cursor=0;i.effects=[];i.tree=GamesPanel(i.props);for(const fn of i.effects)fn();while(microtasks.length)microtasks.shift()();return i.tree;}
async function settle(){for(let n=0;n<30;n++)await Promise.resolve();}
const game=(session,mode='questions',rev=1)=>({session_id:session,game_rev:rev,state:'active',mode,total_rounds:20,current_round:{kind:'generic',round_id:'round-'+session,round_index:1,state:'pending'},pause_reason:null});
const {RetryVault,retryAllowed}=load('game-operations.ts');
`;
async function scenario(source:string):Promise<unknown> {
 return await vm.runInNewContext(harness+'\n(async()=>{'+source+'})()',{root:process.cwd(),ts,readFileSync,resolve,vm,console,Date,TextEncoder,AbortSignal,fetch,randomUUID,assert}) as unknown;
}
describe('actual GamesPanel asynchronous publishing',()=>{
 it('drops a conflicting revision retry and requires a new explicit prepare with fresh revision/key',async()=>{
  const result=await scenario(String.raw`
   const posts=[];let lookups=0,live=null,refreshed=0;const freshGame={...game('new','questions',4),state:'waiting',current_round:null};
   const api={async request(path,body){if(path==='/api/v1/rooms/room')return {...i.props.room,state:'open',room_rev:20+lookups++,members:i.props.room.members.map(m=>({...m,presence:'online'}))};if(path.endsWith('/current')){if(live)return live;throw new ApiError('GAME_NOT_FOUND');}if(path.endsWith('/prepare')){posts.push(body);if(posts.length===1)throw new ApiError('REVISION_CONFLICT');live=freshGame;return freshGame;}if(path.endsWith('/availability'))return {available:true,draft_rev:4,requested_rounds:20,recheck_required_at_start:true};throw new ApiError('NOT_FOUND');}};
   const i=instance(api);i.props.refreshRoom=async()=>{refreshed++;};render(i);await settle();render(i);const submit=()=>treeFind(i.tree,x=>x.props?.className==='game-setup').props.onSubmit({preventDefault(){}});submit();await settle();render(i);const retryGone=find(i,'game-retry')===null,firstPosts=posts.length;submit();await settle();render(i);
   return {retryGone,firstPosts,lookups,revisions:posts.map(p=>p.expected_rev),newKey:posts[0].idempotency_key!==posts[1].idempotency_key,refreshed:refreshed>0,startEnabled:find(i,'game-start')?.props.disabled===false};
  `);expect(result).toEqual({retryGone:true,firstPosts:1,lookups:2,revisions:[20,21],newKey:true,refreshed:true,startEnabled:true});
 });
 it('retries an unknown network result with the exact original prepare body and key',async()=>{
  const result=await scenario(String.raw`
   const posts=[];let lookups=0,live=null;const freshGame={...game('new','questions',4),state:'waiting',current_round:null};
   const api={async request(path,body){if(path==='/api/v1/rooms/room'){lookups++;return {...i.props.room,state:'open',room_rev:20,members:i.props.room.members.map(m=>({...m,presence:'online'}))};}if(path.endsWith('/current')){if(live)return live;throw new ApiError('GAME_NOT_FOUND');}if(path.endsWith('/prepare')){posts.push(JSON.stringify(body));if(posts.length===1)throw new ApiError('SERVICE_UNAVAILABLE');live=freshGame;return freshGame;}if(path.endsWith('/availability'))return {available:true,draft_rev:4,requested_rounds:20,recheck_required_at_start:true};throw new ApiError('NOT_FOUND');}};
   const i=instance(api);render(i);await settle();render(i);treeFind(i.tree,x=>x.props?.className==='game-setup').props.onSubmit({preventDefault(){}});await settle();render(i);assert(find(i,'game-retry'));find(i,'game-retry').props.onClick();await settle();render(i);
   return {lookups,posts:posts.length,exactReplay:posts[0]===posts[1],startEnabled:find(i,'game-start')?.props.disabled===false};
  `);expect(result).toEqual({lookups:1,posts:2,exactReplay:true,startEnabled:true});
 });

 it('refreshes stale room revision without changing choices or automatically starting',async()=>{
  const result=await scenario(String.raw`
   const calls=[];let live=null;const freshGame={...game('new','yes_but',4),state:'waiting',current_round:null};
   const api={async request(path,body){calls.push({path,body});if(path==='/api/v1/rooms/room')return {...i.props.room,state:'open',room_rev:20,members:i.props.room.members.map(m=>({...m,presence:'online'}))};if(path.endsWith('/current')){if(live)return live;throw new ApiError('GAME_NOT_FOUND');}if(path.endsWith('/prepare')){live=freshGame;return freshGame;}if(path.endsWith('/availability'))return {available:true,draft_rev:4,requested_rounds:7,recheck_required_at_start:true};throw new ApiError('NOT_FOUND');}};
   const i=instance(api);render(i);await settle();render(i);find(i,'game-mode').props.onChange({target:{value:'yes_but'}});find(i,'game-rounds').props.onChange({target:{valueAsNumber:7}});render(i);treeFind(i.tree,x=>x.props?.className==='game-setup').props.onSubmit({preventDefault(){}});await settle();render(i);
   const posted=calls.find(c=>c.path.endsWith('/prepare'));return {freshBeforePost:calls.findIndex(c=>c.path==='/api/v1/rooms/room')<calls.indexOf(posted),revision:posted.body.expected_rev,players:posted.body.players,mode:posted.body.mode,rounds:posted.body.round_count,starts:calls.filter(c=>c.path.endsWith('/start')).length,startEnabled:find(i,'game-start')?.props.disabled===false};
  `);expect(result).toEqual({freshBeforePost:true,revision:20,players:['a','b'],mode:'yes_but',rounds:7,starts:0,startEnabled:true});
 });
 it('does not POST or retain stale retry when authoritative membership changed',async()=>{
  const result=await scenario(String.raw`
   const calls=[];let refreshed=0;const api={async request(path,body){calls.push({path,body});if(path==='/api/v1/rooms/room')return {...i.props.room,state:'open',room_rev:20,members:i.props.room.members.filter(m=>m.id!=='b')};throw new ApiError('GAME_NOT_FOUND');}};
   const i=instance(api);i.props.refreshRoom=async()=>{refreshed++;};render(i);await settle();render(i);treeFind(i.tree,x=>x.props?.className==='game-setup').props.onSubmit({preventDefault(){}});await settle();render(i);
   return {posts:calls.filter(c=>c.body!==undefined).length,retry:find(i,'game-retry')!==null,refreshed:refreshed>0,start:find(i,'game-start')!==null};
  `);expect(result).toEqual({posts:0,retry:false,refreshed:true,start:false});
 });

 for(const replay of [false,true]) it(replay?'publishes availability and enables Start after A→B replay':'publishes availability and enables Start on first null→A prepare',async()=>{
  const result=await scenario(String.raw`
   let live=REPLAY?{...game('old'),state:'completed',current_round:null}:null;
   const fresh={...game('new','yes_but',4),state:'waiting',current_round:null};
   const api={async request(path){if(path==='/api/v1/rooms/room')return {...i.props.room,state:'open',room_rev:20,members:i.props.room.members.map(m=>({...m,presence:'online'}))};if(path.endsWith('/current')){if(live)return live;throw new ApiError('GAME_NOT_FOUND');}if(path.endsWith('/prepare')){live=fresh;return fresh;}if(path.endsWith('/availability'))return {available:true,draft_rev:4,requested_rounds:20,recheck_required_at_start:true};throw new ApiError('NOT_FOUND');}};
   const i=instance(api);render(i);await settle();render(i);find(i,'game-mode').props.onChange({target:{value:'yes_but'}});render(i);
   treeFind(i.tree,x=>x.props?.className==='game-setup').props.onSubmit({preventDefault(){}});await settle();render(i);render(i);
   return {available:Boolean(find(i,'game-availability')),startEnabled:find(i,'game-start')?.props.disabled===false};
  `.replace('REPLAY',JSON.stringify(replay)));
  expect(result).toEqual({available:true,startEnabled:true});
 });
 it('keeps prepared B availability and suppresses A private reads after a held current response',async()=>{
  const result=await scenario(String.raw`
   let release;const held=new Promise(done=>release=done),calls=[];let first=true;
   const fresh={...game('new','yes_but',4),state:'waiting',current_round:null};
   const api={async request(path){if(path==='/api/v1/rooms/room')return {...i.props.room,state:'open',room_rev:20,members:i.props.room.members.map(m=>({...m,presence:'online'}))};calls.push(path);if(path.endsWith('/current')){if(first){first=false;return held;}return fresh;}if(path.endsWith('/prepare'))return fresh;if(path.endsWith('/availability'))return {available:true,draft_rev:4,requested_rounds:20,recheck_required_at_start:true};throw new ApiError('NOT_FOUND');}};
   const i=instance(api);render(i);find(i,'game-mode').props.onChange({target:{value:'yes_but'}});render(i);treeFind(i.tree,x=>x.props?.className==='game-setup').props.onSubmit({preventDefault(){}});await settle();render(i);release(game('old'));await settle();render(i);
   return {newSession:JSON.stringify(find(i,'game-state')?.props.children).includes('Yes'),startEnabled:find(i,'game-start')?.props.disabled===false,oldPrivateReads:calls.filter(p=>p.includes('/old/round/')).length};
  `);expect(result).toEqual({newSession:true,startEnabled:true,oldPrivateReads:0});
 });
 it('rejects delayed private HTTP after a first-render identity change before effects',async()=>{
  const result=await scenario(String.raw`
   let release;const held=new Promise(done=>release=done),calls=[];
   const api={async request(path){if(path==='/api/v1/rooms/room')return {...i.props.room,state:'open',room_rev:20,members:i.props.room.members.map(m=>({...m,presence:'online'}))};calls.push(path);if(path.endsWith('/current'))return game('old');if(path.endsWith('/private'))return held;throw new ApiError('NOT_FOUND');}};
   const i=instance(api);render(i);await settle();i.props.prefs={...i.props.prefs,owner_member_id:'outsider'};
   current=i;i.cursor=0;i.effects=[];i.tree=GamesPanel(i.props);
   release({offer_id:'o',session_id:'old',round_id:'round-old',expires_at:new ClockDate(20000).toISOString(),state:'active',card_id:'Q',card_revision:1,actors:['a','b'],prompt:'LATE PRIVATE OLD',proposal_revision:1});await settle();
   return {oldPublicHidden:find(i,'game-state')===null,oldPrivateHidden:find(i,'private-prompt')===null,oldChatReads:calls.filter(p=>p.endsWith('/chat')).length};
  `);expect(result).toEqual({oldPublicHidden:true,oldPrivateHidden:true,oldChatReads:0});
 });
});
