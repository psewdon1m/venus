import assert from 'node:assert/strict';
import https from 'node:https';
import {readFileSync} from 'node:fs';
export function protectedRequest(config,path,{method='GET',headers={},body,cap=65536}={}){
 assert(path.startsWith('/')&&!path.startsWith('//'));assert(Number.isSafeInteger(cap)&&cap>0&&cap<=4*1024**2);
 return new Promise((done,reject)=>{let total=0;const chunks=[];const request=https.request({hostname:'local-tls',servername:'localhost',port:8443,path,method,ca:readFileSync(config.caFile),rejectUnauthorized:true,agent:false,headers:{...headers,host:'localhost:8443'}},response=>{const authorized=response.socket?.authorized===true;response.on('data',b=>{total+=b.length;if(total>cap){request.destroy(Error('HTTPS_RESPONSE_CAP'));return;}chunks.push(b);});response.on('error',reject);response.on('end',()=>{const raw=Buffer.concat(chunks);const wrapped={getSetCookie:()=>response.headers['set-cookie']??[],get:name=>response.headers[name.toLowerCase()]??null};done({status:response.statusCode,raw,headers:wrapped,tls_verified:authorized});});});request.setTimeout(5000,()=>request.destroy(Error('HTTPS_REQUEST_DEADLINE')));request.on('error',reject);if(body!==undefined)request.write(body);request.end();});
}
export async function jsonCall(config,actor,path,method,body,headers){void actor;const response=await protectedRequest(config,path,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});let value;try{value=JSON.parse(response.raw);}catch{value={invalid_json:true};}return{...response,body:value,raw:response.raw.toString('utf8')};}
