import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire('file:///C:/.projects/venus/package.json'),{parse}=require('espree');
const root='C:/.projects/venus/.artifacts/p05-pilot-bundle-source15/.artifacts/',p=root+'p05-v2-layout-producer-a18-04/',c=root+'p05-v2-layout-producer-a18-05/';
const source=fs.readFileSync(c+'x11.mjs','utf8'),parent=fs.readFileSync(p+'x11.mjs','utf8');
const tree=parse(source,{ecmaVersion:'latest',sourceType:'module',range:true});
const calls=[];function walk(v){if(!v||typeof v!=='object')return;if(v.type==='CallExpression'&&v.callee.type==='Identifier'&&v.callee.name==='execFileSync'&&v.arguments[0]?.value==='ffmpeg')calls.push(v);for(const x of Object.values(v))if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object')walk(x);}walk(tree);assert.equal(calls.length,1);
const options=calls[0].arguments[2];assert.equal(options.type,'ObjectExpression');assert.equal(options.properties.length,1);const timeout=options.properties[0];assert.equal(timeout.key.name,'timeout');const expression=source.slice(...timeout.value.range);assert.equal(expression,'Math.max(1,Math.floor(Math.min(15000,budget.remaining())))');
assert.equal(source.replace(expression,'Math.max(1,Math.min(15000,budget.remaining()))'),parent);
const actual=new Function('budget','return '+expression),old=budget=>Math.max(1,Math.min(15000,budget.remaining()));
const boundaries=[[-1,1],[0,1],[0.25,1],[1,1],[1.99,1],[14999.75,14999],[15000,15000],[15000.75,15000],[1e9,15000]];
for(const [remaining,expected]of boundaries){let count=0;const value=actual({remaining(){count++;return remaining;}});assert.equal(count,1);assert.equal(value,expected);assert(Number.isSafeInteger(value)&&value>=1&&value<=15000);assert(value<=old({remaining:()=>remaining}));}
assert.throws(()=>execFileSync(process.execPath,['-e',"process.stdout.write('CHILD_STARTED')"],{timeout:old({remaining:()=>14999.75})}),{name:'RangeError',code:'ERR_OUT_OF_RANGE'});
const result=execFileSync(process.execPath,['-e',"process.stdout.write('FINITE_NODE_API_OK')"],{encoding:'utf8',timeout:actual({remaining:()=>14999.75}),windowsHide:true});assert.equal(result,'FINITE_NODE_API_OK');
console.log(JSON.stringify({status:'PASS_FOCUSED_INTEGER_TIMEOUT_COLD_ONLY',groups:3,ast_single_original_ffmpeg_call:true,exact_inverse:true,boundaries:boundaries.length,remaining_calls_each:1,red_original:{name:'RangeError',code:'ERR_OUT_OF_RANGE',child_not_launched:true},green_real_Node_API:true,timer_extension:false,retries:0,APP_Docker_models:0}));
