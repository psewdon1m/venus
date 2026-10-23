import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const root=process.cwd(),require=createRequire(resolve(root,'package.json')),ts=require('typescript');
let clock=10000,current;
const intervals=[],microtasks=[];
class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
const react={useState(initial){const i=current.cursor++,instance=current;if(!instance.hooks[i])instance.hooks[i]={value:typeof initial==='function'?initial():initial,set:v=>{instance.hooks[i].value=typeof v==='function'?v(instance.hooks[i].value):v;}};return [instance.hooks[i].value,instance.hooks[i].set];},useRef(initial){const i=current.cursor++;if(!current.hooks[i])current.hooks[i]={current:initial};return current.hooks[i];},useCallback(fn,deps){const i=current.cursor++;if(!current.hooks[i]||!same(current.hooks[i].deps,deps))current.hooks[i]={fn,deps};return current.hooks[i].fn;},useEffect(fn,deps){const i=current.cursor++,old=current.hooks[i];if(!old||!same(old.deps,deps)){current.hooks[i]={deps,cleanup:old?.cleanup};current.effects.push(()=>{current.hooks[i].cleanup?.();current.hooks[i].cleanup=fn();});}}};
const element=(type,props,key)=>({type,key,props:props||{}});const modules={};
function load(name){if(modules[name])return modules[name].exports;const file=resolve(root,'apps/web/src',name),module={exports:{}};modules[name]=module;const source=readFileSync(file,'utf8'),out=ts.transpileModule(source,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const wrapper=vm.runInNewContext('(function(require,exports,module){'+out+'\n})',{console,Date:ClockDate,TextEncoder,AbortSignal,fetch,location:{origin:'https://fixture.invalid'},crypto:{randomUUID},window:{addEventListener(){},removeEventListener(){}},document:{addEventListener(){},removeEventListener(){},visibilityState:'visible'},queueMicrotask:fn=>microtasks.push(fn),setInterval:(fn,ms)=>{const row={fn,ms};intervals.push(row);return row;},clearInterval:row=>{const i=intervals.indexOf(row);if(i>=0)intervals.splice(i,1);}});
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
const cases=[];
{
 let release;const old=new Promise(done=>release=done),calls=[];const fresh={...game('new','yes_but',4),state:'waiting',current_round:null};const api={async request(path,body){calls.push({path,body});if(path.endsWith('/current'))return old;if(path.endsWith('/prepare'))return fresh;if(path.endsWith('/availability'))return {available:true,requested_rounds:20,draft_rev:4,recheck_required_at_start:true};throw new ApiError('NOT_FOUND');}};
 const i=instance(api);render(i);assert(calls.some(c=>c.path.endsWith('/current')));find(i,'game-mode').props.onChange({target:{value:'yes_but'}});render(i);treeFind(i.tree,x=>x.props?.className==='game-setup').props.onSubmit({preventDefault(){}});await settle();render(i);const before=JSON.stringify(find(i,'game-state').props.children);assert(before.includes('Yes'));
 release(game('old','questions',2));await settle();render(i);const after=JSON.stringify(find(i,'game-state').props.children);const reproduced=after.includes('Questions');cases.push({id:'UI-001',reproduced,before,after,calls:calls.map(c=>c.path)});assert(reproduced,'Expected stale HTTP to replace prepared session in current code');
}
intervals.length=0;microtasks.length=0;clock=10000;
{
 const currentGame=game('private'),expires_at=new ClockDate(20000).toISOString(),posts=[];const prompt={offer_id:'private-offer',session_id:'private',round_id:'round-private',expires_at,state:'active',card_id:'Q',card_revision:1,actors:['a','b'],prompt:'PRIVATE PROMPT',proposal_revision:1};
 const api={async request(path,body){if(path.endsWith('/current'))return currentGame;if(path.endsWith('/private'))return prompt;if(path.endsWith('/chat')){if(body){posts.push(body.text);throw new ApiError('SERVICE_UNAVAILABLE');}return {session_id:'private',round_id:'round-private',chat_rev:0,expires_at,messages:[]};}throw new ApiError('NOT_FOUND');}};
 const i=instance(api);render(i);await settle();render(i);assert(find(i,'pair-chat-input'));find(i,'pair-chat-input').props.onChange({target:{value:'SYNTHETIC RETAINED PRIVATE TEXT'}});render(i);treeFind(i.tree,x=>x.type==='form'&&treeFind(x,y=>y.props?.['data-testid']==='pair-chat-send')).props.onSubmit({preventDefault(){}});await settle();render(i);assert.equal(posts.length,1);assert(find(i,'game-retry'));
 clock=21000;intervals.find(t=>t.ms===500).fn();render(i);assert.equal(find(i,'private-prompt'),null);assert.equal(find(i,'pair-chat-input'),null);assert(find(i,'game-retry'));find(i,'game-retry').props.onClick();await settle();render(i);cases.push({id:'UI-002',reproduced:posts.length===2,private_ui_hidden_after_expiry:true,post_count_after_expired_retry:posts.length,synthetic_payload_retained:posts[0]===posts[1]});assert.equal(posts.length,2,'Expected expired private retry to resend retained payload in current code');
}
const result={scope:'ADVERSARIAL_ACTUAL_GAMES_PANEL_CODE_WITH_FAKE_REACT_HOOKS_AND_API_NOT_BROWSER_E2E',status:'REPRODUCED',cases};writeFileSync('C:/Temp/venus-p05-ui-adversarial-result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));