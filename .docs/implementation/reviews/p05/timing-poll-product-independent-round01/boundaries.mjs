import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {proposeConsent} from '@venus/relationship-engine';
const require=createRequire(import.meta.url),ts=require('typescript');
const root='.docs/implementation/reviews/p05/timing-poll-product-author-round01/';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const source=fs.readFileSync(root+'source/apps/api/src/topic-games.ts','utf8');
const baseline=fs.readFileSync(root+'baseline/apps/api/src/topic-games.ts','utf8');
const freeze=JSON.parse(fs.readFileSync(root+'source-freeze.json','utf8'));
assert.equal(sha(source),freeze.files['apps/api/src/topic-games.ts']);
function members(text){const sf=ts.createSourceFile('topic-games.ts',text,ts.ScriptTarget.Latest,true);const cls=sf.statements.find(s=>ts.isClassDeclaration(s)&&s.name?.text==='TopicGames');return new Map(cls.members.filter(m=>m.name&&ts.isIdentifier(m.name)).map(m=>[m.name.text,m]));}
const old=members(baseline),now=members(source);
assert.deepEqual([...now.keys()],[...old.keys()]);
const changed=[...now.keys()].filter(k=>now.get(k).getText()!==old.get(k).getText());
assert.deepEqual(changed,['beginAction','conversationCommand']);
const insertion="if(!error&&state.offer?.state==='active')this.beginAction(l,true);";
assert.equal(now.get('conversationCommand').getText().replace(insertion+'\n  ',''),old.get('conversationCommand').getText());
const method=now.get('beginAction');
assert.equal(method.body.statements[0].getText(),"if(l.data.plan.interaction==='pair_private'&&!privatePromptReady)return;");
assert.equal(method.body.statements[1].getText(),old.get('beginAction').body.statements[0].getText());
const js=ts.transpileModule('const begin=function(l,privatePromptReady=false)'+method.body.getText()+';begin;',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const begin=vm.runInNewContext(js,{proposeConsent,randomUUID:crypto.randomUUID});
const cases=[];
function fixture(){let clock=1000;const l={game:{mode:'truth_or_dare'},data:{plan:{interaction:'pair_private',actors:['a','b'],requires_action_consent:true},choice:'dare',invitation:{active_until:181000},action:null}};return {l,setNow:n=>{clock=n;},run:ready=>begin.call({get now(){return clock;}},l,ready)};}
function check(name,f){f();cases.push({name,status:'PASS'});}
check('private pending topic creates no action',()=>{const f=fixture();f.run(false);assert.equal(f.l.data.action,null);});
check('existing expired offer never renewed',()=>{const f=fixture();f.run(true);const offer=f.l.data.action;f.setNow(31001);f.run(true);assert.equal(f.l.data.action,offer);assert.equal(offer.deadline,31000);});
check('requires_action false creates no consent',()=>{const f=fixture();f.l.data.plan.requires_action_consent=false;f.run(true);assert.equal(f.l.data.action,null);});
check('one actor cannot receive action offer',()=>{const f=fixture();f.l.data.plan.actors=['a'];f.run(true);assert.equal(f.l.data.action,null);});
check('truthdare missing choice creates no action',()=>{const f=fixture();f.l.data.choice=null;f.run(true);assert.equal(f.l.data.action,null);});
check('public pair remains immediate',()=>{const f=fixture();f.l.data.plan.interaction='pair_public';f.run(false);assert.equal(f.l.data.action.created_at,1000);assert.equal(f.l.data.action.deadline,31000);});
check('parent5ms clamps pending window without extension',()=>{const f=fixture();f.setNow(180995);f.run(true);assert.equal(f.l.data.action.deadline,181000);assert.equal(f.l.data.action.limit,181000);assert.deepEqual(f.l.data.action.acks,[]);});
check('expired invitation cannot mint new action',()=>{const f=fixture();f.setNow(181000);assert.throws(()=>f.run(true));assert.equal(f.l.data.action,null);});
check('private Questions action starts after topic ready without TD choice',()=>{const f=fixture();f.l.game.mode='questions';f.l.data.choice=null;f.run(false);assert.equal(f.l.data.action,null);f.run(true);assert.equal(f.l.data.action.created_at,1000);});
console.log(JSON.stringify({status:'PASS_NARROW_SOURCE_AND_NEGATIVE_BOUNDARIES',exact_source_sha256:sha(source),only_changed_TopicGames_members:changed,unchanged_other_members:now.size-2,controls:cases,qualification:'Exact method body with real consent engine and synthetic loaded state; no SQL/auth/browser claim. All other class members and conversationCommand excluding single gated insertion byte-identical.'},null,2));
