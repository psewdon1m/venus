import http from 'node:http';
import fs from 'node:fs';
import {timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {read,requireValue,exactKeys,UUID} from './files.mjs';
export async function body(request){const parts=[];let bytes=0;for await(const part of request){bytes+=part.length;requireValue(bytes<=16384,'BODY_LIMIT');parts.push(part);}return JSON.parse(Buffer.concat(parts).toString('utf8'));}
export function respond(response,status,value){response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});response.end(JSON.stringify(value));}
function failure(response,error){respond(response,409,{code:/^[A-Z][A-Z0-9_]{1,80}$/.test(error.message)?error.message:'OPERATION_REJECTED'});}
export function workerServer(engine){return http.createServer(async(request,response)=>{try{
  requireValue(request.url&&!request.url.includes('?'),'INVALID_ROUTE');const route=request.url,method=request.method;
  if(method==='GET'&&route==='/v1/status')return respond(response,200,engine.status());
  const match=/^\/v1\/jobs\/([a-f0-9-]{36})(?:\/(confirm|apply|cancel|recover))?$/.exec(route);
  if(method==='GET'&&match&&!match[2])return respond(response,200,engine.status(match[1]));
  if(method==='POST'&&route==='/v1/jobs'){const value=await body(request);exactKeys(value,['release_id']);return respond(response,201,engine.create(value.release_id));}
  if(method==='POST'&&match&&match[2]){exactKeys(await body(request),[]);requireValue(UUID.test(match[1]),'JOB_ID');return respond(response,202,await engine[match[2]](match[1]));}
  respond(response,404,{code:'NOT_FOUND'});
 }catch(error){failure(response,error);}});}
export function executorRequest(socket,method,route,payload){
 return new Promise((resolve,reject)=>{
  const request=http.request({socketPath:socket,path:route,method,timeout:180000,headers:{'Content-Type':'application/json'}},response=>{
   const parts=[];let size=0;
   response.on('data',b=>{size+=b.length;if(size>1024*1024)request.destroy(new Error('EXECUTOR_RESPONSE_LIMIT'));else parts.push(b);});
   response.on('end',()=>{try{resolve({status:response.statusCode,value:JSON.parse(Buffer.concat(parts))});}catch{reject(new Error('EXECUTOR_UNAVAILABLE'));}});
  });
  request.on('timeout',()=>request.destroy(new Error('EXECUTOR_TIMEOUT')));
  request.on('error',()=>reject(new Error('EXECUTOR_UNAVAILABLE')));
  request.end(payload?JSON.stringify(payload):undefined);
 });
}
export function operatorServer(config){
 const credential=()=>{const token=read(config.token_file,65536);requireValue(token.length>0,'OPERATOR_CREDENTIAL');return token.toString('base64url');};credential();const expected=new URL(config.origin);requireValue(expected.protocol==='http:'&&['127.0.0.1','localhost'].includes(expected.hostname)&&expected.origin===config.origin,'OPERATOR_LOOPBACK_REQUIRED');
 return http.createServer(async(request,response)=>{try{
  requireValue(request.headers.host===expected.host,'HOST_REJECTED');const route=request.url;
  if(request.headers.origin!==undefined)requireValue(request.headers.origin===config.origin,'ORIGIN_REJECTED');
  response.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  if(request.method==='GET'&&['/','/operator.js','/operator.css'].includes(route)){
   const file=route==='/'?'index.html':route.slice(1),type=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html';response.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});response.end(fs.readFileSync(fileURLToPath(new URL('./ui/'+file,import.meta.url))));return;
  }
  const supplied=typeof request.headers.authorization==='string'?request.headers.authorization:'';const actual=Buffer.from(supplied),wanted=Buffer.from('Bearer '+credential());if(actual.length!==wanted.length||!timingSafeEqual(actual,wanted))return respond(response,403,{code:'OPERATOR_REQUIRED'});
  requireValue(typeof route==='string'&&!route.includes('?')&&(/^\/api\/operator\/status$/.test(route)||/^\/api\/operator\/jobs(?:\/[a-f0-9-]{36}(?:\/(confirm|apply|cancel|recover))?)?$/.test(route)),'INVALID_ROUTE');
  requireValue(request.method==='GET'||request.method==='POST','METHOD_REJECTED');if(request.method==='POST')requireValue(request.headers.origin===config.origin&&request.headers['content-type']==='application/json','ORIGIN_REJECTED');
  const payload=request.method==='POST'?await body(request):undefined;const target=route.replace('/api/operator','/v1');const result=await executorRequest(config.socket,request.method,target,payload);respond(response,result.status,result.value);
 }catch(error){failure(response,error);}});
}
