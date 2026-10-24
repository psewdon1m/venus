/** Author-only exact AST extraction. No browser entrypoint import or functional execution. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const root='.artifacts/p05-v2-layout-producer-resume03',source='.artifacts/p05-private-batch-browser-producer18/browser.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),raw=readFileSync(source),text=raw.toString('utf8');
assert.equal(hash(raw),'564f7054c9c784284140aa9723d1f03c9439b8cdbfd182687176702f5b8b546e');
assert.equal(hash(readFileSync(root+'/private-batch-observer.mjs')),'8913015d820022cca873f0a8f819dcea054ef13e0591492b9d665244bdc59e8a');
assert.equal(hash(readFileSync(root+'/request-emission.mjs')),'2441671d6ed6ef14e136a007974e1b87e5d0181adabe48fa164ad7d936cd8b0f');
const ast=ts.createSourceFile(source,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);assert.equal(ast.parseDiagnostics.length,0);
const names=['read','expectedPrivateScope','privateDom','normalPrivateReady','preparePrivateClick','assertPrivateTicket','click','fillPrivate','recordMutation','approval','create','joinRoom','ownTopics','configure','connected','start','coherentGame','ownUiRound','mutationClick','advance','seekPrivate','startPrivate','participants','invite','currentOfferTopics','topicReadinessPhase','topicUiReady','acceptTopics','adviceMutation','adviceUiReady','receivedPendingAdvice','acceptActionsUi'];
mkdirSync(root+'/extracted',{recursive:true});const records=[];
const functions=names.map(name=>{const nodes=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);assert.equal(nodes.length,1,name);const node=nodes[0],start=node.getStart(ast),end=node.end,value=text.slice(start,end),file='extracted/method18-'+name+'.txt';writeFileSync(root+'/'+file,value+'\n');records.push({name,source,start_character:start,end_character:end,exact_ast_text_sha256:hash(Buffer.from(value)),extraction:file});return value;});
const prelude=`/** Separate real V2 scenes. Exact source-bound METHOD18 helpers; no historical entrypoint evaluation. */
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {URLSearchParams} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {setTimeout,clearTimeout} from 'node:timers';
import {expect} from '@playwright/test';
import {offeredTopics,expectedOfferLabels,coherentRound,uiRoundMatches} from './observations.mjs';
import {createPrivateBatchObserver} from './private-batch-observer.mjs';
import {exactUiMutation} from './request-emission.mjs';
import {safeFailedReadiness} from './readiness-diagnostics.mjs';
/* global document,window */
export function sceneDriver({browser,service,report,save=()=>{},viewport={width:1440,height:900}}){
let actors=[],phase='layout-prepare';
const base=a=>'/api/v1/rooms/'+a.room,current=a=>read(a,'/api/v2/rooms/'+a.room+'/game/current');
const observedOwnStarts=new WeakMap();
const privateBatches=createPrivateBatchObserver({sourceRoot:process.cwd(),onProjection:(actor,{kind,value})=>{if(actor.closed)return;if(kind==='current')actor.lastGameView=value;if(kind==='own'){actor.lastSelfActions=value;if(Number.isFinite(value.started_monotonic_ms))observedOwnStarts.set(actor,value.started_monotonic_ms);}}});
const normalPrivateControls=new Set(['pair-accept','action-accept','topic-accept','topic-new','advice-offer','advice-accept','advice-edit','pair-chat-send','game-condition-submit']);
`;
const tail=readFileSync(root+'/driver-tail.txt','utf8');writeFileSync(root+'/scene-driver.mjs',prelude+functions.join('\n\n')+'\n\n'+tail+'\n}\n');
writeFileSync(root+'/driver-adaptation.json',JSON.stringify({schema_version:1,status:'AUTHOR_CODE_READY_INDEPENDENT_REVIEW_REQUIRED_NOT_RUN',method18_source_sha256:hash(raw),observer03_sha256:hash(readFileSync(root+'/private-batch-observer.mjs')),request_emission_sha256:hash(readFileSync(root+'/request-emission.mjs')),extractions:records,changes:['Separate real scenes and read-only safe metadata callbacks; all32 extracted METHOD18 helper AST texts exact','Validated observer03 callback supplies timed own/current projections; model-only, not application cache.accept','New per-scene actor lifecycle and ordered public selection, fixed20 rounds with exact METHOD18 max3 real-session private setup; no seed/history reset or TTL changes','Advice/content/chat scene admission reuses exact METHOD18 normal preparation, request/receipt and post-commit own-read floors','All existing459 matrix IDs/native/role/sweep/resource thresholds retained'],production_source_changed:false,actual_run:false},null,2)+'\n');
console.log(JSON.stringify({status:'AUTHOR_V2_LAYOUT_DRIVER_GENERATED_NOT_RUN',helpers:names.length,sha256:hash(readFileSync(root+'/scene-driver.mjs'))}));
