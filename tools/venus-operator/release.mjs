import {createPublicKey,sign,verify} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';
import {read,sha256,canonical,requireValue,exactKeys,HEX} from './files.mjs';
export function keyIdentity(pem){const key=createPublicKey(pem);requireValue(key.asymmetricKeyType==='ed25519','RELEASE_KEY_ALGORITHM');return {key,id:sha256(key.export({type:'spki',format:'der'}))};}
export function version(value){requireValue(typeof value==='string'&&/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(value),'RELEASE_VERSION');const v=value.split('.').map(Number);requireValue(v.every(Number.isSafeInteger),'RELEASE_VERSION');return v;}
export function newer(a,b){const x=version(a),y=version(b);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i];return false;}
/** Bounded regular USTAR members only; never extract or execute archive content. */
export function inspectBundle(bytes){
 let tar;try{tar=gunzipSync(bytes,{maxOutputLength:16*1024*1024});}catch{throw new Error('BUNDLE_GZIP');}
 requireValue(tar.length%512===0,'BUNDLE_TAR');const members=new Map();let offset=0,ended=false;
 const text=b=>{const z=b.indexOf(0);const s=z<0?b:b.subarray(0,z);requireValue((z<0||b.subarray(z).every(x=>x===0))&&s.every(x=>x>=32&&x<=126),'BUNDLE_HEADER');return s.toString('ascii');};
 const octal=b=>{requireValue(/^[ 0-7]+[ \0]*$/.test(b.toString('ascii')),'BUNDLE_NUMBER');const n=parseInt(b.toString('ascii').trim().replace(/\0/g,''),8);requireValue(Number.isSafeInteger(n)&&n>=0&&n<=16*1024*1024,'BUNDLE_NUMBER');return n;};
 while(offset<tar.length){const h=tar.subarray(offset,offset+512);if(h.every(x=>x===0)){requireValue(offset+1024<=tar.length&&tar.subarray(offset).every(x=>x===0),'BUNDLE_END');ended=true;break;}
  let sum=0;for(let i=0;i<512;i++)sum+=i>=148&&i<156?32:h[i];requireValue(sum===octal(h.subarray(148,156))&&h.subarray(257,263).equals(Buffer.from('ustar\0'))&&h.subarray(263,265).equals(Buffer.from('00')),'BUNDLE_HEADER');
  const prefix=text(h.subarray(345,500)),name=(prefix?prefix+'/':'')+text(h.subarray(0,100)),size=octal(h.subarray(124,136));
  requireValue(name.length>0&&name.length<=200&&!/[\\:]/.test(name)&&name.split('/').every(s=>s!==''&&s!=='.'&&s!=='..')&&!members.has(name)&&members.size<128,'BUNDLE_PATH');
  requireValue((h[156]===0||h[156]===48)&&text(h.subarray(157,257))==='','BUNDLE_LINK_OR_TYPE');const end=offset+512+Math.ceil(size/512)*512;requireValue(end<=tar.length,'BUNDLE_TRUNCATED');members.set(name,tar.subarray(offset+512,offset+512+size));offset=end;
 }
 requireValue(ended&&members.has('compose.production.yaml'),'BUNDLE_COMPOSE');return members;
}
export function verifyRelease(dir,trust,policy){
 requireValue(trust.environment==='fixture'||trust.environment==='service'&&trust.owner_approved===true,'SERVICE_KEY_OWNER_APPROVAL_REQUIRED');
 const bytes=read(path.join(dir,'manifest.json'),65536),sig=JSON.parse(read(path.join(dir,'manifest.sig.json'),16384));exactKeys(sig,['algorithm','key_id','signature']);
 const {key,id}=keyIdentity(trust.public_key_pem);requireValue(id===trust.key_id&&sig.key_id===id&&sig.algorithm==='Ed25519','RELEASE_TRUST');const signature=Buffer.from(sig.signature,'base64');requireValue(signature.toString('base64')===sig.signature&&verify(null,bytes,key,signature),'RELEASE_SIGNATURE');
 const m=JSON.parse(bytes.toString('utf8'));requireValue(Buffer.from(canonical(m)).equals(bytes),'RELEASE_CANONICAL');exactKeys(m,['format','service','version','tag','main_sha','source_identity','image','schema','environment','bundle','key_id','created_at','trust_environment']);
 requireValue(m.format==='VENUS-RELEASE-1'&&m.service==='venus'&&m.tag===(trust.environment==='fixture'?'venus-fixture-v':'venus-v')+m.version&&m.key_id===id&&newer(m.version,'0.0.0'),'RELEASE_IDENTITY');
 requireValue(/^[a-f0-9]{40}$/.test(m.main_sha)&&HEX.test(m.source_identity)&&Number.isFinite(Date.parse(m.created_at)),'RELEASE_SOURCE');
 exactKeys(m.image,['reference','oci_digest','config_digest']);const referenceAllowed=/^ghcr\.io\/psewdon1m\/venus@sha256:[a-f0-9]{64}$/.test(m.image.reference)||(trust.environment==='fixture'&&typeof trust.fixture_registry==='string'&&/^127\.0\.0\.1:[0-9]+\/venus$/.test(trust.fixture_registry)&&m.image.reference===trust.fixture_registry+'@'+m.image.oci_digest);requireValue(/^sha256:[a-f0-9]{64}$/.test(m.image.oci_digest)&&/^sha256:[a-f0-9]{64}$/.test(m.image.config_digest)&&referenceAllowed&&m.image.reference.endsWith('@'+m.image.oci_digest),'RELEASE_IMAGE');
 exactKeys(m.schema,['generation','read_min','read_max']);requireValue([m.schema.generation,m.schema.read_min,m.schema.read_max].every(Number.isSafeInteger)&&m.schema.read_min>=0&&m.schema.read_min<=m.schema.generation&&m.schema.read_max>=m.schema.generation,'RELEASE_SCHEMA');
 requireValue(['standalone-local-pilot-v2','standalone-local-media-v3'].includes(m.environment)&&m.environment===policy.environment&&m.schema.generation===policy.schema,'RELEASE_ENV_SCHEMA');
 requireValue(m.trust_environment===trust.environment&&['service','fixture'].includes(m.trust_environment),'RELEASE_TRUST_ENV');
 if(policy.expected_main)requireValue(m.main_sha===policy.expected_main,'RELEASE_MAIN');
 exactKeys(m.bundle,['sha256','size']);requireValue(HEX.test(m.bundle.sha256)&&Number.isSafeInteger(m.bundle.size)&&m.bundle.size>0&&m.bundle.size<=16*1024*1024,'BUNDLE_LIMIT');
 const bundle=read(path.join(dir,'bundle.tar.gz'),16*1024*1024);requireValue(bundle.length===m.bundle.size&&sha256(bundle)===m.bundle.sha256,'BUNDLE_DIGEST');const members=inspectBundle(bundle);
 requireValue(members.size===2&&members.has('README.md')&&members.get('compose.production.yaml').equals(read(policy.compose_template,1024*1024)),'BUNDLE_SEMANTICS');
 return {manifest:m,release_id:sha256(bytes)};
}
export function signManifest(manifest,privateKey){const bytes=Buffer.from(canonical(manifest));return {bytes,signature:canonical({algorithm:'Ed25519',key_id:manifest.key_id,signature:sign(null,bytes,privateKey).toString('base64')})};}
