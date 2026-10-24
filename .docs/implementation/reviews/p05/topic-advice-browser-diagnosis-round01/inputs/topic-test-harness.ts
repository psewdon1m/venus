import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import ts from 'typescript';
// Actual TSX evaluation with a deterministic hook/API scheduler. This checks
// asynchronous application logic; real ReactDOM/browser coverage is separate.
const harness=String.raw`let clock=10000,monotonic=10000,current;
const intervals=[],microtasks=[],timeouts=[];
class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
const react={useState(initial){const i=current.cursor++,instance=current;if(!instance.hooks[i])instance.hooks[i]={value:typeof initial==='function'?initial():initial,set:v=>{instance.hooks[i].value=typeof v==='function'?v(instance.hooks[i].value):v;}};return [instance.hooks[i].value,instance.hooks[i].set];},useRef(initial){const i=current.cursor++;if(!current.hooks[i])current.hooks[i]={current:initial};return current.hooks[i];},useCallback(fn,deps){const i=current.cursor++;if(!current.hooks[i]||!same(current.hooks[i].deps,deps))current.hooks[i]={fn,deps};return current.hooks[i].fn;},useEffect(fn,deps){const i=current.cursor++,old=current.hooks[i];if(!old||!same(old.deps,deps)){current.hooks[i]={deps,cleanup:old?.cleanup};current.effects.push(()=>{current.hooks[i].cleanup?.();current.hooks[i].cleanup=fn();});}}};
const element=(type,props,key)=>({type,key,props:props||{}});const modules={};
function load(name){if(modules[name])return modules[name].exports;const file=resolve(root,'apps/web/src',name),module={exports:{}};modules[name]=module;const source=readFileSync(file,'utf8'),out=ts.transpileModule(source,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const wrapper=vm.runInNewContext('(function(require,exports,module){'+out+'\n})',{console,Date:ClockDate,performance:{now:()=>monotonic},TextEncoder,AbortSignal,fetch,location:{origin:'https://fixture.invalid'},crypto:{randomUUID},window:{addEventListener(){},removeEventListener(){}},document:{addEventListener(){},removeEventListener(){},visibilityState:'visible'},queueMicrotask:fn=>microtasks.push(fn),setTimeout:(fn,ms)=>{const row={fn,ms,at:clock+ms};timeouts.push(row);return row;},clearTimeout:row=>{const i=timeouts.indexOf(row);if(i>=0)timeouts.splice(i,1);},setInterval:(fn,ms)=>{const row={fn:()=>{monotonic+=ms;fn();},ms};intervals.push(row);return row;},clearInterval:row=>{const i=intervals.indexOf(row);if(i>=0)intervals.splice(i,1);}});
 wrapper(path=>{if(path==='react')return react;if(path==='react/jsx-runtime')return {jsx:element,jsxs:element,Fragment:Symbol.for('Fragment')};if(path==='@venus/i18n')return {topicCopy:locale=>new Proxy({}, {get:(_t,key)=>String(key)})};if(path.startsWith('./')){const name=path.slice(2).replace(/\.js$/,'.ts');return load(name==='topic-settings.ts'?'topic-settings.tsx':name);}throw new Error('Unexpected import '+path);},module.exports,module);return module.exports;}
// GamesPanel TSX is the actual unmodified module, not a copied implementation.
const gamesFile=resolve(root,'apps/web/src/games-panel.tsx');const originalLoad=load;
// The loader accepts .tsx when explicitly requested.
const {TopicGamesPanel:GamesPanel}=load('topic-games-panel.tsx'),{ApiError}=load('api.ts');
function treeFind(tree,predicate){if(Array.isArray(tree)){for(const x of tree){const r=treeFind(x,predicate);if(r)return r;}return null;}if(!tree||typeof tree!=='object')return null;if(predicate(tree))return tree;return treeFind(tree.props?.children,predicate);}
const find=(instance,id)=>treeFind(instance.tree,x=>x.props?.['data-testid']===id);
function instance(api){const props={api,room:{room_id:'room',room_rev:1,meeting_context:'online',features:{games:'available'},members:[{id:'a',role:'host',presence:'online',setup_ready:true,display_name:'A'},{id:'b',role:'member',presence:'online',setup_ready:true,display_name:'B'}]},prefs:{owner_member_id:'a',comfort:1,rev:1,edges:{}},locale:'en',connection:'ready',frame:null,refreshRoom:async()=>{},onError:()=>{}};return {props,hooks:[],effects:[],cursor:0,tree:null};}
function render(i){current=i;i.cursor=0;i.effects=[];i.tree=GamesPanel(i.props);for(const fn of i.effects)fn();while(microtasks.length)microtasks.shift()();return i.tree;}
async function settle(){for(let n=0;n<30;n++)await Promise.resolve();}
const game=(session,mode='questions',rev=1)=>({session_id:session,game_rev:rev,state:'active',mode,total_rounds:20,current_round:{kind:'generic',round_id:'round-'+session,round_index:1,state:'pending'},pause_reason:null});
const {RetryVault,retryAllowed}=load('game-operations.ts');
const iso=n=>new ClockDate(n).toISOString();
const actions=(g,overrides={},conversation={})=>({schema_version:2,room_id:'room',member_id:'a',session_id:g.session_id,round_id:g.current_round.round_id,game_rev:g.game_rev,room_rev:1,server_time:iso(clock),expires_at:iso(clock+5000),session_actions:{pause:true,stop:true,abort:true,resume:false,advance:false,neutral_reset:true,neutral_reset_aborts_game:true},round_actions:{finish:false,skip:true,choose_truth:false,choose_dare:false,propose_condition:false,accept_invitation:false,accept_action:false,decline_invitation:true,withdraw_action:false,...overrides},conversation_actions:{offer_topic:true,other_question:true,respond_topic:true,offer_advice:true,chat:true,...conversation}});
const target=(g)=>({schema_version:2,room_id:'room',session_id:g.session_id,round_id:g.current_round.round_id,game_rev:g.game_rev,content_revision:1,invitation:{offer_id:'invite',consent_scope:'invitation',proposal_revision:1,own_state:'accepted',state:'active',expires_at:iso(clock+180000)},action:null,choice:null,condition:null});
const conversation=(g,active=false)=>({schema_version:2,room_id:'room',session_id:g.session_id,round_id:g.current_round.round_id,game_rev:g.game_rev,conversation_id:'c-'+g.session_id,epoch:1,revision:1,state:active?'active':'pending',server_time:iso(clock),expires_at:iso(clock+30000),offer:{offer_id:'topic',epoch:1,proposal_revision:3,token:'token',own_accepted:active,topics:[{topic_id:'a',label:'FULL A'},{topic_id:'b',label:'FULL B'}],expires_at:iso(clock+30000)},...(active?{prompt:{text:'PRIVATE QUESTION',condition:null,choice:null}}:{}),advice:[]});
const privateChat=(c)=>({schema_version:2,conversation_id:c.conversation_id,epoch:c.epoch,revision:1,state:'active',messages:[{message_id:'m',sequence:1,direction:'received',text:'PRIVATE CHAT'}]});
const tick=async()=>{for(const row of [...intervals])if(row.ms===1500)row.fn();await settle();};

`;
export async function topicScenario(source:string):Promise<unknown> {
 return await vm.runInNewContext(harness+'\n(async()=>{'+source+'})()',{root:process.cwd(),ts,readFileSync,resolve,vm,console,Date,TextEncoder,AbortSignal,fetch,randomUUID,assert}) as unknown;
}

