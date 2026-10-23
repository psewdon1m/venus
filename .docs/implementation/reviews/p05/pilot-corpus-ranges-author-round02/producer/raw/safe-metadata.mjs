/** Control metadata only. Original exception/stop objects remain private. */
const names=new Set(['Error','AssertionError','TypeError','RangeError','AbortError','SyntaxError']);
const codes=new Set(['EIO','ENOSPC','EDQUOT','EACCES','EPERM','ENOENT','EBADF','ERR_ASSERTION','ERR_STREAM_DESTROYED','ERR_STREAM_WRITE_AFTER_END']);
// Read data properties only: hostile/malformed metadata must not execute getters.
const own=(o,k)=>{try{return o&&typeof o==='object'?Object.getOwnPropertyDescriptor(o,k)?.value:undefined;}catch{return undefined;}};
export function safeError(error){
 let name=own(error,'name');
 if(name===undefined)try{let p=Object.getPrototypeOf(error);for(let i=0;p&&i<4&&name===undefined;i++,p=Object.getPrototypeOf(p))name=own(p,'name');}catch{/* unavailable metadata */}
 const code=own(error,'code');
 return{name:names.has(name)?name:'Error',code:codes.has(code)?code:null,metadata_unlisted:!names.has(name)||(code!==undefined&&code!==null&&!codes.has(code))};
}
const statuses=new Set(['STOP_CONFIRMED','EXIT_CONFIRMED','STOP_CONFIRMED_WITH_MANAGER_FAILURE','STOP_FAILED','NO_WORKER_CREATED']);
const kinds=new Set(['TERMINAL','VERIFY']),categories=new Set(['INVALID_OR_CLOSED_OWNER_CONTROL','TERMINATE_JOB_FAILED',...names]);
const keys=new Set(['kind','owner','status','active_processes','worker_code','stop_requested','worker_unconfirmed','job_destroyed','errors','first_stop_failure']);
const count=n=>Number.isSafeInteger(n)&&n>=0&&n<=32;
export function safeWorkerStop(value,expectedOwner){
 const status=own(value,'status'),owner=own(value,'owner'),active=own(value,'active_processes'),unconfirmed=own(value,'worker_unconfirmed'),errors=own(value,'errors'),first=own(value,'first_stop_failure');
 let unlisted=!value||typeof value!=='object'||Array.isArray(value);
 try{unlisted ||= Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.has(k));}catch{unlisted=true;}
 const matched=typeof owner==='string'&&owner===expectedOwner&&/^[a-f0-9]{32}$/.test(owner),known=statuses.has(status),processes=count(active)?active:null;
 if(!known||!matched||processes===null)unlisted=true;
 const result={status:known?status:'UNLISTED',owner:matched?owner:null,ownership_matches:matched,active_processes:processes,worker_unconfirmed:unconfirmed===true,confirmed:matched&&known&&['STOP_CONFIRMED','EXIT_CONFIRMED','STOP_CONFIRMED_WITH_MANAGER_FAILURE'].includes(status)&&processes===0&&(unconfirmed===undefined||unconfirmed===false)};
 if(!result.confirmed&&['STOP_CONFIRMED','EXIT_CONFIRMED','STOP_CONFIRMED_WITH_MANAGER_FAILURE'].includes(status))result.worker_unconfirmed=true;
 for(const key of ['stop_requested','job_destroyed']){const v=own(value,key);result[key]=typeof v==='boolean'?v:null;if(v!==undefined&&typeof v!=='boolean')unlisted=true;}
 if(unconfirmed!==undefined&&typeof unconfirmed!=='boolean')unlisted=true;
 const kind=own(value,'kind');result.kind=kinds.has(kind)?kind:null;if(kind!==undefined&&!kinds.has(kind))unlisted=true;
 const code=own(value,'worker_code');result.worker_code=Number.isSafeInteger(code)&&code>=-2147483648&&code<=4294967295?code:null;if(code!==undefined&&code!==null&&result.worker_code===null)unlisted=true;
 result.errors_present=errors!==undefined;result.errors_count=Array.isArray(errors)?Math.min(errors.length,16):null;result.errors_truncated=Array.isArray(errors)&&errors.length>16;result.error_categories=[];
 if(errors!==undefined&&!Array.isArray(errors))unlisted=true;
 if(Array.isArray(errors))for(let i=0;i<Math.min(errors.length,16);i++){const category=own(own(errors,String(i)),'kind');result.error_categories.push(categories.has(category)?category:'UNLISTED');if(!categories.has(category))unlisted=true;}
 result.first_stop_failure_present=first!==undefined&&first!==null;
 result.metadata_unlisted=unlisted;return result;
}
