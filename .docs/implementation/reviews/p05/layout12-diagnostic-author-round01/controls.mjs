import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const base='C:/.projects/venus/.artifacts/p05-pilot-bundle-source12/.artifacts/';
const old=await import(pathToFileURL(base+'p05-v2-layout-producer-resume11/probe-policy.mjs'));
const current=await import(pathToFileURL(base+'p05-v2-layout-producer-resume12/probe-policy.mjs'));
const moduleURL=pathToFileURL(base+'p05-v2-layout-producer-resume12/probe-policy.mjs').href;
const rows=[];
function check(name,operation){operation();rows.push({name,status:'PASS'});}
function thrown(operation){try{operation();}catch(error){return error;}throw Error('CONTROL_DID_NOT_THROW');}
const canary='PRIVATE_COOKIE_BODY_DOM_TITLE_CANARY';
const multiline=thrown(()=>assert.equal(2,1,'EXACT_V2_WINDOW_REQUIRED'));
check('parent_reproduces_node24_multiline_label_loss',()=>assert.equal(old.safeFailure(multiline).code,'ASSERTION_OR_OPERATION_FAILED'));
check('node24_multiline_label_preserved',()=>assert.deepEqual(current.safeFailure(multiline),{name:'AssertionError',code:'EXACT_V2_WINDOW_REQUIRED'}));
check('static_label_colon_and_comparison_private_content_removed',()=>{
 const error=thrown(()=>assert.equal(canary,'other','KEYBOARD_UNREACHABLE:'+canary));
 const result=current.safeFailure(error);assert.equal(result.code,'KEYBOARD_UNREACHABLE');assert(!JSON.stringify(result).includes(canary));
});
const codes=JSON.parse(readFileSync(new URL('./STATIC-CODE-SOURCES.json',import.meta.url))).codes.filter(code=>code!=='OBSERVER_');
check('all_74_literal_codes_recognized',()=>{for(const code of codes)assert.equal(current.safeFailure(Error(code+'\n'+canary)).code,code);});
check('arbitrary_uppercase_and_dynamic_prefix_not_exported',()=>{for(const code of [canary,'OBSERVER_','UNKNOWN_PRIVATE_CODE'])assert.equal(current.safeFailure(Error(code)).code,'ASSERTION_OR_OPERATION_FAILED');});
check('oversize_message_falls_closed',()=>assert.deepEqual(current.safeFailure(Error('EXACT_V2_WINDOW_REQUIRED\n'+canary.repeat(1000))),{name:'Error',code:'ASSERTION_OR_OPERATION_FAILED'}));
check('actual_unnamed_own_module_site',()=>{
 const error=thrown(()=>current.assertObservation({reduced_motion:true,motion_violations:1}));const result=current.safeFailure(error);
 assert.equal(result.name,'AssertionError');assert.equal(result.code,'ASSERTION_OR_OPERATION_FAILED');assert.equal(result.source_module,'probe-policy');assert(Number.isSafeInteger(result.source_line)&&result.source_line>0);assert(Number.isSafeInteger(result.source_column));
});
check('comparison_text_forged_frame_not_used',()=>{
 const error=thrown(()=>assert.equal('x','y','EXACT_V2_WINDOW_REQUIRED\n    at '+moduleURL+':99:55\n'+canary));
 assert(!('source_module'in current.safeFailure(error)));
});
function frameError(frame){const error=Error('EXACT_V2_WINDOW_REQUIRED');error.stack='Error: EXACT_V2_WINDOW_REQUIRED\n'+frame;return error;}
check('static_exact_own_module_frame_projection_only',()=>assert.deepEqual(current.safeFailure(frameError('    at secretFunction ('+moduleURL+':12:9)')),{name:'Error',code:'EXACT_V2_WINDOW_REQUIRED',source_module:'probe-policy',source_line:12,source_column:9}));
check('unknown_basename_paths_and_invalid_numeric_bounds_omitted',()=>{
 for(const frame of ['    at file:///outside/probe-policy.mjs:12:9','    at '+moduleURL+':1000001:9','    at '+moduleURL+':12:100001','    at '+moduleURL+':0:9','    at '+moduleURL+':1:2 '+canary])assert(!('source_module'in current.safeFailure(frameError(frame))));
});
check('frame_limit_and_oversize_stack_omitted',()=>{
 const error=frameError(Array(16).fill('    at unknown:1:1').join('\n')+'\n    at '+moduleURL+':12:9');assert(!('source_module'in current.safeFailure(error)));
 error.stack='x'.repeat(16385);assert(!('source_module'in current.safeFailure(error)));
});
check('native_error_name_is_static_not_custom_name',()=>{const error=Error(canary);error.name=canary;assert.deepEqual(current.safeFailure(error),{name:'Error',code:'ASSERTION_OR_OPERATION_FAILED'});});
check('hostile_own_and_inherited_getters_never_invoked',()=>{
 let calls=0;const error=Error();for(const key of ['name','message','stack'])Object.defineProperty(error,key,{get(){calls++;throw Error(canary);}});assert.deepEqual(current.safeFailure(error),{name:'Error',code:'ASSERTION_OR_OPERATION_FAILED'});assert.equal(calls,0);
 const inherited=Error();Object.setPrototypeOf(inherited,Object.create(Error.prototype,{name:{get(){calls++;return canary;}}}));current.safeFailure(inherited);assert.equal(calls,0);
});
check('proxy_and_proxy_prototype_do_not_invoke_traps',()=>{
 let calls=0;const traps={get(){calls++;throw Error(canary);},getOwnPropertyDescriptor(){calls++;throw Error(canary);},getPrototypeOf(){calls++;throw Error(canary);}};
 assert.deepEqual(current.safeFailure(new Proxy({},traps)),{name:'Error',code:'ASSERTION_OR_OPERATION_FAILED'});
 const error=Error();Object.setPrototypeOf(error,new Proxy(Error.prototype,traps));assert.deepEqual(current.safeFailure(error),{name:'Error',code:'ASSERTION_OR_OPERATION_FAILED'});assert.equal(calls,0);
});
check('custom_formatter_and_custom_stack_accessor_not_called',()=>{
 let calls=0;const original=Object.getOwnPropertyDescriptor(Error,'prepareStackTrace');
 try{Error.prepareStackTrace=()=>{calls++;return canary;};assert.deepEqual(current.safeFailure(Error('EXACT_V2_WINDOW_REQUIRED')),{name:'Error',code:'EXACT_V2_WINDOW_REQUIRED'});}finally{if(original)Object.defineProperty(Error,'prepareStackTrace',original);else delete Error.prepareStackTrace;}
 const error=Error('EXACT_V2_WINDOW_REQUIRED');Object.defineProperty(error,'stack',{get(){calls++;return canary;}});current.safeFailure(error);assert.equal(calls,0);
});
check('null_primitives_and_non_errors_static_fallback',()=>{for(const error of [null,undefined,42,'EXACT_V2_WINDOW_REQUIRED',{message:'EXACT_V2_WINDOW_REQUIRED'}])assert.deepEqual(current.safeFailure(error),{name:'Error',code:'ASSERTION_OR_OPERATION_FAILED'});});
console.log(JSON.stringify({status:'PASS',controls:rows.length,node:process.version,rows},null,2));
