import {describe,expect,it} from 'vitest';
import {topicScenario} from './topic-test-harness.js';
const setup=String.raw`
const {TopicSettings}=load('topic-settings.tsx');
const taxonomy={schema_version:1,taxonomy_digest:'a'.repeat(64),topics:[{topic_id:'a',labels:{ru:'Тема А',en:'TOPIC A',tr:'KONU A'}},{topic_id:'b',labels:{ru:'Тема Б',en:'TOPIC B',tr:'KONU B'}}]};
const own={schema_version:1,room_id:'room',owner_member_id:'a',rev:0,safety_revision:1,taxonomy_digest:taxonomy.taxonomy_digest,allow_topic_ids:[],exclude_topic_ids:[]};
function settings(api,events=[]){return {props:{api,room:'room',member:'a',locale:'en',onBeforeChange:()=>events.push('clear'),onChanged:()=>events.push('changed'),onError:()=>events.push('error'),onView:v=>events.push(v?'view':'empty')},hooks:[],effects:[],cursor:0,tree:null};}
function show(i){current=i;i.cursor=0;i.effects=[];i.tree=TopicSettings(i.props);for(const fn of i.effects)fn();while(microtasks.length)microtasks.shift()();return i.tree;}
`;
const scenario=(code:string)=>topicScenario(setup+code);
describe('actual own-topic settings boundaries',()=>{
 it('has no preselected permissions and saves only an explicit own allow choice',async()=>{expect(await scenario(String.raw`
  const posts=[],events=[];const api={async request(path,body,method){if(body){posts.push({path,body,method});return {...own,rev:1,allow_topic_ids:['a']};}return path.endsWith('/private-topic-taxonomy')?taxonomy:own;}};const i=settings(api,events);show(i);await settle();show(i);const defaults=[find(i,'topic-allow-a').props.checked,find(i,'topic-allow-b').props.checked];find(i,'topic-allow-a').props.onChange({target:{checked:true}});show(i);treeFind(i.tree,x=>x.type==='form').props.onSubmit({preventDefault(){}});await settle();show(i);return {defaults,method:posts[0].method,keys:Object.keys(posts[0].body).sort(),allowed:posts[0].body.allow_topic_ids,excluded:posts[0].body.exclude_topic_ids,clearBeforeConfirmed:events.indexOf('clear')<events.lastIndexOf('view'),savedCannotUntick:find(i,'topic-allow-a').props.disabled===true};
 `)).toEqual({defaults:[false,false],method:'PUT',keys:['allow_topic_ids','exclude_topic_ids','expected_rev','request_id','taxonomy_digest'],allowed:['a'],excluded:[],clearBeforeConfirmed:true,savedCannotUntick:true});});
 it('permanent exclusion is a separate exact POST and disables every future allow for that topic',async()=>{expect(await scenario(String.raw`
  const posts=[],events=[];const initial={...own,rev:2,allow_topic_ids:['a','b']};const api={async request(path,body,method){if(body){events.push('post');posts.push({path,body,method});return {...initial,rev:3,safety_revision:2,allow_topic_ids:['b'],exclude_topic_ids:['a']};}return path.endsWith('/private-topic-taxonomy')?taxonomy:initial;}};const i=settings(api,events);show(i);await settle();show(i);find(i,'topic-exclude-a').props.onChange({target:{checked:true}});show(i);find(i,'topics-exclude').props.onClick();await settle();show(i);return {method:posts[0].method,suffix:posts[0].path.endsWith('/exclusions'),keys:Object.keys(posts[0].body).sort(),topics:posts[0].body.topic_ids,before:events.indexOf('clear')<events.indexOf('post'),disabled:find(i,'topic-allow-a').props.disabled===true,checked:find(i,'topic-allow-a').props.checked,stillAllowed:find(i,'topic-allow-b').props.checked};
 `)).toEqual({method:'POST',suffix:true,keys:['request_id','taxonomy_digest','topic_ids'],topics:['a'],before:true,disabled:true,checked:false,stillAllowed:true});});
 it('unavailable taxonomy or foreign-owner response never initializes an allow form',async()=>{expect(await scenario(String.raw`
  let reads=0;const api={async request(path){reads++;if(path.endsWith('/private-topic-taxonomy'))return taxonomy;return {...own,owner_member_id:'partner',allow_topic_ids:['a']};}};const i=settings(api);show(i);await settle();show(i);return {reads,form:find(i,'topics-save')!==null,privateLabel:find(i,'topic-allow-a')!==null};
 `)).toEqual({reads:2,form:false,privateLabel:false});});
 it('a late first read cannot replace a newer explicit refresh result',async()=>{expect(await scenario(String.raw`
  let release,reads=0;const delayed=new Promise(r=>release=r);const api={async request(path){if(path.endsWith('/private-topic-taxonomy'))return taxonomy;reads++;return reads===1?delayed:{...own,rev:2,allow_topic_ids:['b'],exclude_topic_ids:['a']};}};const i=settings(api);show(i);await settle();show(i);treeFind(i.tree,x=>x.type==='button').props.onClick();await settle();show(i);release({...own,allow_topic_ids:['a']});await settle();show(i);return {reads,a:find(i,'topic-allow-a').props.checked,b:find(i,'topic-allow-b').props.checked,disabled:find(i,'topic-allow-a').props.disabled};
 `)).toEqual({reads:2,a:false,b:true,disabled:true});});
});
