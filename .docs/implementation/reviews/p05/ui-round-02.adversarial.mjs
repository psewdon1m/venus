import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const root=process.cwd(),require=createRequire(resolve(root,'package.json')),ts=require('typescript');
let clock=10000,current;
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
const cases=[];
function reset(){intervals.length=0;timeouts.length=0;microtasks.length=0;clock=10000;}
function vaultOf(i){return i.hooks.find(h=>h?.current instanceof RetryVault).current;}
function afterPaint(i){render(i);render(i);}
async function record(id,action){reset();try{const detail=await action();cases.push({id,status:'PASS',...detail});}catch(e){cases.push({id,status:'FAIL',error:e.message});}}
const submit=(i)=>treeFind(i.tree,x=>x.props?.className==='game-setup').props.onSubmit({preventDefault(){}});
const frame=(view,rev=5)=>({schema:1,type:'game.snapshot',room_id:'room',stream:'game',audience:'room',room_rev:rev,stream_rev:rev,payload:view});
async function failedChat(){
 const state={deny:false,current:game('private')},expires_at=new ClockDate(20000).toISOString(),posts=[];
 const prompt={offer_id:'o',session_id:'private',round_id:'round-private',expires_at,state:'active',card_id:'Q',card_revision:1,actors:['a','b'],prompt:'PRIVATE PROMPT',proposal_revision:1};
 const api={async request(path,body){if(path.endsWith('/current'))return state.current;if(state.deny)throw new ApiError('NOT_FOUND');if(path.endsWith('/private'))return prompt;if(path.endsWith('/chat')){if(body){posts.push(body.text);throw new ApiError('SERVICE_UNAVAILABLE');}return {session_id:'private',round_id:'round-private',chat_rev:0,expires_at,messages:[]};}throw new ApiError('NOT_FOUND');}};
 const i=instance(api);render(i);await settle();afterPaint(i);assert(find(i,'pair-chat-input'));find(i,'pair-chat-input').props.onChange({target:{value:'SYNTHETIC ROUND02 PRIVATE BODY'}});render(i);
 const submitChat=treeFind(i.tree,x=>x.type==='form'&&treeFind(x,y=>y.props?.['data-testid']==='pair-chat-send')).props.onSubmit;
 submitChat({preventDefault(){}});await settle();render(i);assert.equal(posts.length,1);const retry=find(i,'game-retry').props.onClick,entry=vaultOf(i).entry;assert(entry.operation);return {i,state,posts,retry,entry,submitChat};
}
await record('UI001_ORIGINAL_DELAYED_CURRENT',async()=>{
 let release;const old=new Promise(done=>release=done),calls=[],fresh={...game('new','yes_but',4),state:'waiting',current_round:null};
 const api={async request(path,body){calls.push({path,body});if(path.endsWith('/current'))return old;if(path.endsWith('/prepare'))return fresh;if(path.endsWith('/availability'))return {available:true,requested_rounds:20,draft_rev:4,recheck_required_at_start:true};throw new ApiError('NOT_FOUND');}};
 const i=instance(api);render(i);find(i,'game-mode').props.onChange({target:{value:'yes_but'}});render(i);submit(i);await settle();render(i);const before=JSON.stringify(find(i,'game-state').props.children);release(game('old','questions',2));await settle();render(i);assert.equal(JSON.stringify(find(i,'game-state').props.children),before);assert(!calls.some(c=>/\/old\/round\//.test(c.path)));return {old_private_reads:0};
});
await record('UI002_ORIGINAL_TTL_STALE_DOM',async()=>{const x=await failedChat();clock=21000;intervals.find(t=>t.ms===500).fn();afterPaint(x.i);assert.equal(find(x.i,'pair-chat-input'),null);assert.equal(find(x.i,'game-retry'),null);assert.equal(x.entry.operation,null);assert(!x.i.hooks.some(h=>h?.value==='SYNTHETIC ROUND02 PRIVATE BODY'));x.retry();x.submitChat({preventDefault(){}});await settle();assert.equal(x.posts.length,1);return {post_count:1,old_entry_callback:null,private_input_cleared:true};});
await record('TTL_BEFORE_TIMER_OLD_HANDLER',async()=>{const x=await failedChat();clock=20000;x.retry();await settle();assert.equal(x.posts.length,1);assert.equal(x.entry.operation,null);return {deadline_checked_synchronously:true};});
for(const change of ['revoke','disconnect','new_session','different_room','different_member'])await record('STALE_RETRY_'+change.toUpperCase(),async()=>{
 const x=await failedChat();x.state.deny=true;
 if(change==='revoke')x.i.props.frame={schema:1,type:'game.private_cleared',room_id:'room',stream:'private',audience:'member',target_member_id:'a'};
 if(change==='disconnect')x.i.props.connection='offline';
 if(change==='new_session'){x.state.current=game('next');x.i.props.frame=frame(x.state.current);}
 if(change==='different_room')x.i.props.room={...x.i.props.room,room_id:'other'};
 if(change==='different_member')x.i.props.prefs={...x.i.props.prefs,owner_member_id:'b'};
 afterPaint(x.i);await settle();afterPaint(x.i);assert.equal(x.entry.operation,null);x.retry();x.submitChat({preventDefault(){}});await settle();assert.equal(x.posts.length,1);return {old_entry_callback:null,stale_payload_resent:false};
});
await record('DELAYED_PRIVATE_READ_AFTER_SESSION_FRAME',async()=>{
 let release;const pending=new Promise(done=>release=done),calls=[];const a=game('a');let live=a;
 const api={async request(path){calls.push(path);if(path.endsWith('/current'))return live;if(path.endsWith('/private')&&path.includes('/a/'))return pending;throw new ApiError('NOT_FOUND');}};
 const i=instance(api);render(i);await settle();live=game('b');i.props.frame=frame(live);render(i);release({offer_id:'o',session_id:'a',round_id:'round-a',expires_at:new ClockDate(20000).toISOString(),state:'active',card_id:'Q',card_revision:1,actors:['a','b'],prompt:'LATE PRIVATE A',proposal_revision:1});await settle();afterPaint(i);assert.equal(find(i,'private-prompt'),null);assert(!calls.some(p=>p.includes('/a/')&&p.endsWith('/chat')));return {late_prompt_not_published:true,old_chat_read_issued:false};
});
await record('PREPARE_RESULT_AFTER_NEW_SESSION_FRAME',async()=>{
 let release;const pending=new Promise(done=>release=done);const api={async request(path){if(path.endsWith('/current'))throw new ApiError('GAME_NOT_FOUND');if(path.endsWith('/prepare'))return pending;throw new ApiError('NOT_FOUND');}};
 const i=instance(api);render(i);await settle();render(i);submit(i);await settle();i.props.frame=frame({...game('c','yes_but',9),state:'waiting',current_round:null});render(i);release({...game('b','questions',4),state:'waiting',current_round:null});await settle();afterPaint(i);assert(JSON.stringify(find(i,'game-state').props.children).includes('Yes'));return {newer_frame_survives_old_prepare:true};
});
await record('AVAILABILITY_AFTER_NEW_SESSION_FRAME',async()=>{
 let release;const pending=new Promise(done=>release=done),b={...game('b','questions',4),state:'waiting',current_round:null};const api={async request(path){if(path.endsWith('/current'))throw new ApiError('GAME_NOT_FOUND');if(path.endsWith('/prepare'))return b;if(path.endsWith('/availability'))return pending;throw new ApiError('NOT_FOUND');}};
 const i=instance(api);render(i);await settle();render(i);submit(i);await settle();i.props.frame=frame({...game('c','yes_but',9),state:'waiting',current_round:null});render(i);release({available:true,draft_rev:4,requested_rounds:20,recheck_required_at_start:true});await settle();afterPaint(i);assert.equal(find(i,'game-availability'),null);assert(JSON.stringify(find(i,'game-state').props.children).includes('Yes'));return {old_availability_not_published:true};
});
await record('RETRY_VAULT_PHYSICAL_DISPOSAL',async()=>{const vault=new RetryVault(),scope={room:'r',member:'a',session:'s',round:'q',kind:'chat',offer:'o',proposal:1,deadline:20};let invoked=0;const id=vault.install(async()=>{invoked++;},scope),old=vault.get(id);vault.clear();assert.equal(old.operation,null);assert.equal(vault.get(id),null);const next=vault.install(async()=>{},scope);assert.notEqual(next,id);assert.equal(vault.get(id),null);return {old_callback_null:true,id_not_reused:true,invoked};});
await record('GRANT_DIMENSION_TABLE',async()=>{const scope={room:'r',member:'a',session:'s',round:'q',kind:'chat',offer:'o',proposal:1,deadline:20};const context={room:'r',member:'a',session:'s',round:'q',connected:true,grants:[{kind:'chat',offer:'o',proposal:1,deadline:20}]};assert(retryAllowed(scope,context,19));for(const changed of [{room:'x'},{member:'b'},{session:'new'},{round:'new'},{connected:false},{grants:[]},{grants:[{...context.grants[0],offer:'x'}]},{grants:[{...context.grants[0],proposal:2}]},{grants:[{...context.grants[0],deadline:21}]}])assert.equal(retryAllowed(scope,{...context,...changed},19),false);assert.equal(retryAllowed(scope,context,20),false);return {negative_dimensions:10};});
// Diagnostic commit-before-passive-effects observation: actual browsers must verify any repaint boundary.
for(const dimension of ['outsider_member','different_room'])await record('FIRST_RENDER_'+dimension.toUpperCase(),async()=>{const x=await failedChat();x.state.deny=true;if(dimension==='outsider_member'){x.i.props.prefs={...x.i.props.prefs,owner_member_id:'c'};x.i.props.room={...x.i.props.room,members:[...x.i.props.room.members,{id:'c',role:'member',setup_ready:true,display_name:'C'}]};}else x.i.props.room={...x.i.props.room,room_id:'room-B'};render(x.i);assert.equal(find(x.i,'private-prompt'),null,'New room/authenticated outsider render contains old pair private JSX before passive-effect rerender');return {old_private_render_hidden:true};});
await record('STALE_DOM_RETRY_BEFORE_IDENTITY_PASSIVE_EFFECT',async()=>{const x=await failedChat();x.i.props.prefs={...x.i.props.prefs,owner_member_id:'c'};x.i.props.room={...x.i.props.room,members:[...x.i.props.room.members,{id:'c',role:'member',setup_ready:true,display_name:'C'}]};current=x.i;x.i.cursor=0;x.i.effects=[];x.i.tree=GamesPanel(x.i.props);x.retry();await settle();assert.equal(x.posts.length,1,'Old DOM retry still sends private body after new-identity render and before passive effects');return {old_callback_rejected_before_effect:true};});
const result={scope:'INDEPENDENT_ACTUAL_TSX_WITH_DETERMINISTIC_HOOK_SCHEDULER_API_DOUBLES_NOT_BROWSER_E2E',status:cases.every(c=>c.status==='PASS')?'PREFLIGHT_PASS':'CHANGES_REQUESTED',cases};writeFileSync('C:/Temp/venus-p05-ui-round02-independent-result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));process.exitCode=result.status==='PREFLIGHT_PASS'?0:1;