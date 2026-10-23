import {fileURLToPath} from 'node:url';
import {types} from 'node:util';

const classes=[[TypeError,'TypeError'],[RangeError,'RangeError'],[ReferenceError,'ReferenceError'],[SyntaxError,'SyntaxError'],[URIError,'URIError'],[EvalError,'EvalError'],[AggregateError,'AggregateError'],[Error,'Error']] as const;
const failureCodes=new Set(['40P01','40001','57014','25P02','23505','08006']);
// These labels/locations are application-owned constants, never error basenames.
const modules=['app','rooms','security','catalog','database','games','games-model','room-routes','room-games',
 'room-private-protocol','topic-games','topic-game-model','topic-game-source','topic-runtime','topic-game-routes',
 'private-topic-preferences','private-topic-ledger','topic-room-registry','topic-room-lifecycle','http-delivery'] as const;
const locations=modules.map(source_module=>({source_module,paths:[new URL('./'+source_module+'.js',import.meta.url),new URL('../src/'+source_module+'.ts',import.meta.url)]
 .flatMap(url=>[url.href,fileURLToPath(url).replace(/\\/g,'/')])}));
const nativeStackGetter=Object.getOwnPropertyDescriptor(new Error(),'stack')?.get;
// Node24's default formatter is JavaScript, not an absent/native hook. Pin its
// exact built-in body and reference; any instrumentation/replacement is omitted.
const preparer=Object.getOwnPropertyDescriptor(Error,'prepareStackTrace');
const nodePreparer=preparer&&'value'in preparer&&typeof preparer.value==='function'&&
 Function.prototype.toString.call(preparer.value).replace(/\r\n/g,'\n')==='function ErrorPrepareStackTrace(error, trace) {\n  return internalPrepareStackTrace(error, trace);\n}'?preparer.value:undefined;
type ErrorKind='TypeError'|'RangeError'|'ReferenceError'|'SyntaxError'|'URIError'|'EvalError'|'AggregateError'|'Error'|'UNKNOWN';
export interface RequestErrorDiagnostic {error_kind:ErrorKind;failure_code:string;source_module?:typeof modules[number];source_line?:number;source_column?:number}
function data(value:unknown,key:string):unknown{
 try{if(!value||typeof value!=='object')return undefined;const d=Object.getOwnPropertyDescriptor(value,key);return d&&'value'in d?d.value:undefined;}catch{return undefined;}
}
function kind(error:unknown):ErrorKind{
 if(!types.isNativeError(error))return 'UNKNOWN';
 try{for(const [constructor,label] of classes)if(error instanceof constructor)return label;}catch{/* hostile prototype: no class claim */}
 return 'UNKNOWN';
}
function boundedStack(error:unknown):string|undefined{
 try{
  if(!error||typeof error!=='object'||!types.isNativeError(error))return;
  const d=Object.getOwnPropertyDescriptor(error,'stack');let stack:unknown;
  if(d&&'value'in d)stack=d.value;
  else if(d?.get&&d.get===nativeStackGetter){
   // Node24 lazily formats native stacks. Do not invoke custom getters or a
   // custom prepareStackTrace hook, or format hostile name/message accessors.
   const hook=Object.getOwnPropertyDescriptor(Error,'prepareStackTrace');if(hook&&(!('value'in hook)||!nodePreparer||hook.value!==nodePreparer))return;
   for(const key of ['name','message']){
    let current:object|null=error,found=false;
    for(let depth=0;current&&depth<8;depth++,current=Object.getPrototypeOf(current)){
     const own=Object.getOwnPropertyDescriptor(current,key);if(!own)continue;
     if(!('value'in own)||typeof own.value!=='string'||own.value.length>2048||/[\r\n\0]/.test(own.value))return;found=true;break;
    }
    if(!found)return;
   }
   stack=d.get.call(error);
  }
  return typeof stack==='string'&&stack.length<=16384&&Buffer.byteLength(stack,'utf8')<=16384?stack:undefined;
 }catch{return undefined;}
}
function location(error:unknown):Pick<RequestErrorDiagnostic,'source_module'|'source_line'|'source_column'>|undefined{
 const stack=boundedStack(error);if(!stack)return;
 for(const raw of stack.split('\n').slice(1,17)){
  const line=raw.replace(/\\/g,'/');if(line.length>1024||!line.startsWith('    at ')||/[\r\0]/.test(line))continue;
  for(const module of locations)for(const pathname of module.paths){
   const at=line.lastIndexOf(pathname);if(at<0)continue;const prefix=line.slice(0,at),parenthesized=prefix.endsWith(' (');
   if(prefix!=='    at '&&prefix!=='    at async '&&!parenthesized)continue;
   const match=/^:([1-9]\d{0,6}):([1-9]\d{0,5})(\)?)$/.exec(line.slice(at+pathname.length));
   if(!match||Boolean(match[3])!==parenthesized)continue;
   const source_line=Number(match[1]),source_column=Number(match[2]);if(source_line>1000000||source_column>100000)continue;
   return {source_module:module.source_module,source_line,source_column};
  }
 }
}
/** Server-only literal projection. Never pass an error object to the logger. */
export function requestErrorDiagnostic(error:unknown):RequestErrorDiagnostic{
 const error_kind=kind(error),code=data(error,'code');
 const failure_code=typeof code==='string'&&failureCodes.has(code)?code:
  error_kind==='Error'&&code===undefined&&data(error,'message')==='Query read timeout'?'QUERY_TIMEOUT':'UNKNOWN';
 return {error_kind,failure_code,...location(error)};
}
