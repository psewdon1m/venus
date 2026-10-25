/** Finite, read-only source collection for one actual Venus service image.
 * Does not install, execute or extract downloaded source. No general scanner. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {archiveCache} from './delivery-cache.mjs';
const args=process.argv.slice(2),options={};
if(![8,10].includes(args.length))throw Error('DELIVERY_ARGUMENTS');for(let i=0;i<args.length;i+=2){if(!['--inventory','--image','--source','--output','--reuse-index'].includes(args[i])||options[args[i]])throw Error('DELIVERY_ARGUMENTS');options[args[i]]=args[i+1];}
const input=path.resolve(options['--inventory']),output=path.resolve(options['--output']),source=options['--source'],image=options['--image'];
if(!/^[a-f0-9]{40}$/.test(source)||!/^sha256:[a-f0-9]{64}$/.test(image)||fs.existsSync(output))throw Error('DELIVERY_IDENTITY_OR_OUTPUT');
const invBytes=fs.readFileSync(input);if(invBytes.length>32*1024*1024)throw Error('DELIVERY_INVENTORY_SIZE');const inv=JSON.parse(invBytes);
if(inv.format!=='VENUS-DELIVERY-INVENTORY-1'||inv.build?.source_revision!==source||inv.node_version!=='v24.22.1'||inv.go?.version!=='go1.27.3'||!Array.isArray(inv.npm_packages)||!Array.isArray(inv.go.modules)||!Array.isArray(inv.os_packages)||inv.npm_packages.length>2000||inv.go.modules.length>512||inv.os_packages.length>512)throw Error('DELIVERY_ACTUAL_INVENTORY_REQUIRED');
const sha=b=>createHash('sha256').update(b).digest('hex'),assetLimit=384*1024*1024,totalLimit=1800*1024*1024,started=Date.now();let total=0;
const roots=new Set(['nodejs.org','go.dev','dl.google.com','proxy.golang.org','registry.npmjs.org','deb.debian.org','security.debian.org','snapshot.debian.org','github.com','codeload.github.com','raw.githubusercontent.com','objects.githubusercontent.com','release-assets.githubusercontent.com','storage.googleapis.com']);
fs.mkdirSync(output,{recursive:true});fs.mkdirSync(path.join(output,'sources'));fs.mkdirSync(path.join(output,'notices'));
const entries=[],failures=[],noticeRows=[];let noticeTotal=0;const cache=archiveCache(options['--reuse-index']);
function safeURL(value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port||!roots.has(u.hostname)||(u.hostname==='storage.googleapis.com'&&!u.pathname.startsWith('/proxy-golang-org-prod/')))throw Error('DELIVERY_SOURCE_URL');return u;}
function clock(){if(Date.now()-started>30*60*1000)throw Error('DELIVERY_COLLECTION_DEADLINE');}
async function download(url,max=assetLimit,reuse=false){clock();if(reuse){safeURL(url);const bytes=cache.read(url,max);if(bytes)return bytes;}let current=safeURL(url);for(let redir=0;redir<7;redir++){const response=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(90000),headers:{'user-agent':'Venus-source-collection/1'}});if(response.status>=300&&response.status<400){await response.body?.cancel();current=safeURL(new URL(response.headers.get('location'),current).href);continue;}if(!response.ok){await response.body?.cancel();throw Error('DELIVERY_HTTP_'+response.status);}const declared=Number(response.headers.get('content-length')??0);if(declared>max){await response.body.cancel();throw Error('DELIVERY_DOWNLOAD_SIZE');}const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>max)throw Error('DELIVERY_DOWNLOAD_SIZE');chunks.push(chunk);clock();}return Buffer.concat(chunks);}throw Error('DELIVERY_REDIRECT_LIMIT');}
function save(bytes,kind,identity,url,extra={}){clock();if(total+bytes.length>totalLimit)throw Error('DELIVERY_SOURCE_TOTAL');const digest=sha(bytes),file='sources/'+digest+'.source';if(!fs.existsSync(path.join(output,file))){fs.writeFileSync(path.join(output,file),bytes,{flag:'wx'});total+=bytes.length;}const row={kind,identity,url,bytes:bytes.length,sha256:digest,file,...extra};entries.push(row);return row;}
function addNotice(owner,name,bytes,origin){noticeTotal+=bytes.length;if(noticeTotal>64*1024*1024)throw Error('DELIVERY_NOTICE_TOTAL');if(bytes.length>4*1024*1024)throw Error('DELIVERY_NOTICE_SIZE');const digest=sha(bytes),file='notices/'+digest+'.txt';if(!fs.existsSync(path.join(output,file)))fs.writeFileSync(path.join(output,file),bytes,{flag:'wx'});noticeRows.push({owner,name,origin,bytes:bytes.length,sha256:digest,file});}
for(const row of inv.notices??[]){const bytes=Buffer.from(row.base64,'base64');if(sha(bytes)!==row.sha256||bytes.length!==row.bytes)throw Error('DELIVERY_NOTICE_INVENTORY');addNotice(row.owner,row.path,bytes,'actual-service-image');}
const python=process.env.PYTHON??'python';
// Standard-library readers only; source files are never extracted or executed.
const inspectCode=String.raw`
import sys,tarfile,zipfile,hashlib,json,base64,re,time,stat
f,kind=sys.argv[1:];out=[];count=0;total=0;start=time.monotonic();names=[];seen=set();package_json=None

def checked(name,size):
 global count,total
 count+=1;total+=size
 if count>150000 or size>512*1024*1024 or total>3*1024*1024*1024 or time.monotonic()-start>105:raise ValueError('archive bounds')
 if not name or name.startswith('/') or re.match(r'^[A-Za-z]:',name) or '\\' in name or any(x=='..' for x in name.split('/')) or '\x00' in name:raise ValueError('archive path')
 if name in seen:raise ValueError('duplicate archive member')
 seen.add(name)

def notice(name,data):
 if re.match(r'(?i)^(licen[cs]e|copying|copyright|notice|authors)(?:[._-].*)?$',name.rsplit('/',1)[-1]):
  if len(data)>4*1024*1024:raise ValueError('notice bounds')
  out.append({'name':name,'sha256':hashlib.sha256(data).hexdigest(),'base64':base64.b64encode(data).decode()})

if kind=='go-zip':
 with zipfile.ZipFile(f)as z:
  for v in z.infolist():
   checked(v.filename,v.file_size)
   if stat.S_ISLNK(v.external_attr>>16):raise ValueError('archive symlink')
   if v.is_dir():continue
   h=hashlib.sha256();data=bytearray();is_notice=bool(re.match(r'(?i)^(licen[cs]e|copying|copyright|notice|authors)(?:[._-].*)?$',v.filename.rsplit('/',1)[-1]))
   with z.open(v)as stream:
    while True:
     b=stream.read(65536)
     if not b:break
     h.update(b)
     if is_notice:
      data.extend(b)
      if len(data)>4*1024*1024:raise ValueError('notice bounds')
   names.append((v.filename,h.hexdigest()))
   if is_notice:notice(v.filename,data)
 h=hashlib.sha256()
 for n,d in sorted(names):h.update((d+'  '+n+'\n').encode())
 h1='h1:'+base64.b64encode(h.digest()).decode()
else:
 h1=None
 with tarfile.open(f,mode='r:*')as t:
  for v in t:
   checked(v.name,v.size)
   if v.isdev() or v.isfifo() or v.issym() or v.islnk():
    # Source symlinks are never followed/extracted. Validate relative target and retain archive only.
    target=v.linkname
    if not(v.issym()or v.islnk())or target.startswith('/')or '\\'in target:raise ValueError('archive special member')
    continue
   if not v.isfile():continue
   base=v.name.rsplit('/',1)[-1]
   if re.match(r'(?i)^(licen[cs]e|copying|copyright|notice|authors)(?:[._-].*)?$',base):
    if v.size>4*1024*1024:raise ValueError('notice bounds')
    notice(v.name,t.extractfile(v).read(4*1024*1024+1))
   if kind=='npm-tar'and base.lower().startswith('readme')and v.size<=4*1024*1024:
    b=t.extractfile(v).read(4*1024*1024+1)
    if all(x in b for x in [b'Permission is hereby granted',b'The above copyright notice',b'FITNESS FOR A PARTICULAR PURPOSE',b'Copyright']):out.append({'name':v.name,'sha256':hashlib.sha256(b).hexdigest(),'base64':base64.b64encode(b).decode()})
   if kind=='npm-tar'and v.name.count('/')==1 and v.name.endswith('/package.json'):
    b=t.extractfile(v).read(4*1024*1024+1)
    if len(b)>4*1024*1024:raise ValueError('manifest bounds')
    if package_json is not None:raise ValueError('multiple npm package roots')
    p=json.loads(b);package_json={'name':p.get('name'),'version':p.get('version'),'sha256':hashlib.sha256(b).hexdigest()}
print(json.dumps({'notices':out,'members':count,'declared_unpacked_bytes':total,'h1':h1,'package_json':package_json}))
`;
function inspect(row,kind){const result=JSON.parse(execFileSync(python,['-I','-B','-c',inspectCode,path.join(output,row.file),kind],{encoding:'utf8',timeout:120000,maxBuffer:32*1024*1024}));row.archive={members:result.members,declared_unpacked_bytes:result.declared_unpacked_bytes,notice_count:result.notices.length};for(const n of result.notices)addNotice(row.identity,n.name,Buffer.from(n.base64,'base64'),row.url);return result;}
async function archive(url,kind,identity,expectedSha){const bytes=await download(url,assetLimit,true);if(expectedSha&&sha(bytes)!==expectedSha)throw Error('DELIVERY_SOURCE_CHECKSUM');const row=save(bytes,kind,identity,url);return {row,result:inspect(row,kind)};}
async function task(id,fn){try{await fn();process.stdout.write(JSON.stringify({collected:id})+'\n');}catch(e){failures.push({identity:id,error:/^[A-Z0-9_]+$/.test(e.message)?e.message:'DELIVERY_SOURCE_INSPECTION_FAILED'});process.stderr.write(JSON.stringify({failed:id,code:failures.at(-1).error})+'\n');}}
function fields(text){const map={};let key;for(const line of text.replace(/\r/g,'').split('\n')){if(/^[A-Za-z][A-Za-z0-9-]*:/.test(line)){const at=line.indexOf(':');key=line.slice(0,at);map[key]=line.slice(at+1).trim();}else if(key&&/^\s/.test(line))map[key]+='\n'+line.trim();}return map;}
async function debian(p){const version=p.source_version.replace(/^\d+:/,''),prefix=p.source.startsWith('lib')?p.source.slice(0,4):p.source.slice(0,1),filename=p.source+'_'+version+'.dsc';let bytes,url;
 for(const base of ['https://deb.debian.org/debian/pool/main/','https://deb.debian.org/debian-security/pool/updates/main/','https://security.debian.org/debian-security/pool/updates/main/']){try{url=base+prefix+'/'+p.source+'/'+filename;bytes=await download(url,2*1024*1024);break;}catch(e){if(!/^DELIVERY_HTTP_(404|410)$/.test(e.message))throw e;}}
 if(!bytes){const meta=JSON.parse((await download('https://snapshot.debian.org/mr/package/'+encodeURIComponent(p.source)+'/'+encodeURIComponent(p.source_version)+'/srcfiles',2*1024*1024)).toString());for(const x of meta.result??[]){const info=JSON.parse((await download('https://snapshot.debian.org/mr/file/'+x.hash+'/info',2*1024*1024)).toString());if((info.result??[]).some(y=>y.name===filename)){url='https://snapshot.debian.org/file/'+x.hash;bytes=await download(url,2*1024*1024);break;}}}
 if(!bytes)throw Error('DELIVERY_DEBIAN_EXACT_SOURCE_MISSING');const data=fields(bytes.toString());if(data.Source!==p.source||data.Version!==p.source_version)throw Error('DELIVERY_DEBIAN_SOURCE_IDENTITY');const checks=(data['Checksums-Sha256']??'').trim().split('\n').filter(Boolean).map(l=>l.trim().split(/\s+/));if(!checks.length||checks.length>12)throw Error('DELIVERY_DEBIAN_DSC_CHECKSUMS');save(bytes,'debian-dsc',p.source+'@'+p.source_version,url);for(const [digest,size,name]of checks){if(!/^[a-f0-9]{64}$/.test(digest)||!/^\d+$/.test(size)||Number(size)>assetLimit||!/^[A-Za-z0-9.+~_-]+$/.test(name))throw Error('DELIVERY_DEBIAN_SOURCE_MEMBER');let b,u;for(const base of ['https://deb.debian.org/debian/pool/main/','https://deb.debian.org/debian-security/pool/updates/main/','https://security.debian.org/debian-security/pool/updates/main/']){try{u=base+prefix+'/'+p.source+'/'+name;b=await download(u,assetLimit,true);break;}catch(e){if(!/^DELIVERY_HTTP_(404|410)$/.test(e.message))throw e;}}
 if(!b){const meta=JSON.parse((await download('https://snapshot.debian.org/mr/package/'+encodeURIComponent(p.source)+'/'+encodeURIComponent(p.source_version)+'/srcfiles',2*1024*1024)).toString());for(const x of meta.result??[]){const info=JSON.parse((await download('https://snapshot.debian.org/mr/file/'+x.hash+'/info',2*1024*1024)).toString());if((info.result??[]).some(y=>y.name===name)){u='https://snapshot.debian.org/file/'+x.hash;b=await download(u,assetLimit,true);break;}}}
 if(!b||b.length!==Number(size)||sha(b)!==digest)throw Error('DELIVERY_DEBIAN_SOURCE_CHECKSUM');save(b,'debian-source',p.source+'@'+p.source_version,u,{dsc_sha256:sha(bytes),archive_member:name});}
}
await task('venus@'+source,async()=>{const roots=execFileSync('git',['ls-tree','-z',source],{encoding:'utf8',timeout:30000,maxBuffer:1024*1024}).split('\0').filter(Boolean).filter(line=>!line.startsWith('040000 ')).map(line=>line.slice(line.indexOf('\t')+1));if(roots.some(name=>/^\.env(?:$|\.(?!example$))/.test(name)||/\.(?:pem|key)$/i.test(name)))throw Error('DELIVERY_TRACKED_SECRET_NAME');const paths=[...roots,'apps','packages','infra','tools','tests','.github','.docs/contracts','.docs/implementation/DELIVERY_NOTICES.md'];const bytes=execFileSync('git',['archive','--format=tar',source,'--',...paths],{timeout:90000,maxBuffer:assetLimit});const row=save(bytes,'venus-source','venus@'+source,'https://github.com/psewdon1m/venus/tree/'+source,{included_pathspecs:paths,scope:'Exact Git commit code/build inputs; historical evidence/journals excluded'});inspect(row,'venus-source');});
await task('node@24.22.1',async()=>{const sums=(await download('https://nodejs.org/dist/v24.22.1/SHASUMS256.txt',65536)).toString(),name='node-v24.22.1.tar.xz',digest=sums.split('\n').map(x=>x.trim().split(/\s+/)).find(x=>x[1]===name)?.[0];if(!/^[a-f0-9]{64}$/.test(digest??''))throw Error('DELIVERY_NODE_CHECKSUM');const {result}=await archive('https://nodejs.org/dist/v24.22.1/'+name,'node-source','node@24.22.1',digest);if(!result.notices.length)throw Error('DELIVERY_NODE_LICENSE');});
await task('go@1.27.3',async()=>{const dl=JSON.parse((await download('https://go.dev/dl/?mode=json&include=all',4*1024*1024)).toString()),file=dl.find(v=>v.version==='go1.27.3')?.files.find(v=>v.kind==='source');if(!file||!/^go1\.27\.3\.src\.tar\.gz$/.test(file.filename))throw Error('DELIVERY_GO_SOURCE');await archive('https://go.dev/dl/'+file.filename,'go-source','go@1.27.3',file.sha256);});
await task('livekit@1.13.11',async()=>{await archive('https://codeload.github.com/livekit/livekit/tar.gz/385aa40f9292fe1db8caad87301e4b285b7c198a','livekit-source','livekit@1.13.11');});
const modules=new Map(inv.go.modules.map(p=>{const e=p.replacement??p;return [e.path+'@'+e.version,e];}));
const npm=new Map();for(const p of inv.npm_packages.filter(p=>p.scope==='application-runtime'&&!p.name.startsWith('@venus/'))){const id=p.name+'@'+p.version;if(npm.has(id)&&npm.get(id).package_json_sha256!==p.package_json_sha256)throw Error('DELIVERY_NPM_DUPLICATE_IDENTITY');npm.set(id,p);}
const os=new Map(inv.os_packages.map(p=>[p.source+'@'+p.source_version,p]));
const tasks=[];
for(const [id,p]of modules)tasks.push([id,async()=>{if(!p.path||!p.version||!p.sum?.startsWith('h1:'))throw Error('DELIVERY_GO_MODULE_IDENTITY');const escape=s=>s.replace(/[A-Z]/g,c=>'!'+c.toLowerCase()),url='https://proxy.golang.org/'+escape(p.path)+'/@v/'+escape(p.version)+'.zip';const {row,result}=await archive(url,'go-zip',id);if(result.h1!==p.sum)throw Error('DELIVERY_GO_H1');row.go_sum_h1=result.h1;if(!result.notices.length)throw Error('DELIVERY_GO_MODULE_NOTICE_MISSING');}]);

async function abstractLoggingNotice(meta,p,row){
 if(p.name!=='abstract-logging'||p.version!=='2.0.1'||meta.gitHead!=='80dfaef91ee87008f4ed2b6e78921d383bccd406'||p.package_json_sha256!=='33f6c3a8ec869b76fba4173cd688d1865ae74d746cc3f3b5d85abf9f40ab4038')throw Error('DELIVERY_NPM_NOTICE_MISSING');
 const materials=[];
 {const url="https://raw.githubusercontent.com/remy/mit-license/73ebb8ca1e2280883e92498e18fcdb1c633c226c/users/jsumners.json",bytes=await download(url,65536);if(sha(bytes)!=="15932b5c544d31afb72ca38c331ea0f11b24f5eb12c850923392c18dd8641b75")throw Error('DELIVERY_HOSTED_LICENSE_HASH');save(bytes,'publisher-license-source','abstract-logging@2.0.1',url);materials.push(bytes.toString('utf8'));}
 {const url="https://raw.githubusercontent.com/remy/mit-license/73ebb8ca1e2280883e92498e18fcdb1c633c226c/licenses/MIT.ejs",bytes=await download(url,65536);if(sha(bytes)!=="75bd0d442091ebfb2ab8f7e3a1d507686fc7c9e87a1579558e2537e7b2b447a4")throw Error('DELIVERY_HOSTED_LICENSE_HASH');save(bytes,'publisher-license-source','abstract-logging@2.0.1',url);materials.push(bytes.toString('utf8'));}
 const author=JSON.parse(materials[0]);if(author.copyright!=='James Sumners')throw Error('DELIVERY_HOSTED_LICENSE_OWNER');
 const template=materials[1],article=template.match(/<article>([\s\S]*?)<\/article>/)?.[1];if(!article||!article.includes('<%- info %>'))throw Error('DELIVERY_HOSTED_LICENSE_TEMPLATE');
 const text=article.replace('<%- info %>',new Date().getUTCFullYear()+' '+author.copyright).replace('<%- gravatar %>','').replace(/<[^>]*>/g,'').trim()+'\n';
 if(!text.includes('Permission is hereby granted')||!text.includes('THE SOFTWARE.'))throw Error('DELIVERY_HOSTED_LICENSE_TEXT');
 addNotice('abstract-logging@2.0.1','publisher-linked MIT license (plain rendering of pinned service template)',Buffer.from(text),'https://jsumners.mit-license.org/');row.supplemental_license={publisher_readme_link:'http://jsumners.mit-license.org/',service_source_commit:'73ebb8ca1e2280883e92498e18fcdb1c633c226c',copyright_record:'users/jsumners.json',template:'licenses/MIT.ejs',rendering:'HTML tags removed, author and current UTC year substituted as documented by publisher-selected service; EJS never executed'};
}
for(const [id,p]of npm)tasks.push([id,async()=>{const meta=JSON.parse((await download('https://registry.npmjs.org/'+encodeURIComponent(p.name)+'/'+encodeURIComponent(p.version),4*1024*1024)).toString());if(meta.name!==p.name||meta.version!==p.version||!meta.dist?.integrity)throw Error('DELIVERY_NPM_IDENTITY');const b=await download(meta.dist.tarball,assetLimit,true),integrity=meta.dist.integrity.split(/\s+/).find(x=>x.startsWith('sha512-'));if(!integrity||'sha512-'+createHash('sha512').update(b).digest('base64')!==integrity)throw Error('DELIVERY_NPM_INTEGRITY');const row=save(b,'npm-tar',id,meta.dist.tarball,{registry_integrity:integrity});const result=inspect(row,'npm-tar');if(result.package_json?.name!==p.name||result.package_json?.version!==p.version||result.package_json?.sha256!==p.package_json_sha256)throw Error('DELIVERY_NPM_INSTALLED_MANIFEST');if(!result.notices.length&&!p.license_files?.length&&!noticeRows.some(n=>n.owner===id))await abstractLoggingNotice(meta,p,row);}]);
for(const [id,p]of os)tasks.push([id,()=>debian(p)]);
for(const p of inv.extra_runtimes??[])tasks.push([p.name+'@'+p.version,async()=>{if(p.name!=='yarn'||!/^\d+\.\d+\.\d+$/.test(p.version))throw Error('DELIVERY_EXTRA_RUNTIME');await archive('https://github.com/yarnpkg/yarn/releases/download/v'+p.version+'/yarn-v'+p.version+'.tar.gz','yarn-source','yarn@'+p.version);}]);
let next=0;await Promise.all(Array.from({length:3},async()=>{while(next<tasks.length){const [id,fn]=tasks[next++];await task(id,fn);}}));
if(inv.os_packages.some(p=>!p.copyright_available))failures.push({identity:'debian-notices',error:'DELIVERY_OS_COPYRIGHT_MISSING'});
const index={format:'VENUS-DISTRIBUTION-SOURCES-1',status:failures.length?'HOLD':'COLLECTED_NOTES_AND_EXACT_SOURCES',created_at:new Date().toISOString(),source_revision:source,image_id:image,inventory_sha256:sha(invBytes),counts:{npm_application:npm.size,npm_bundled_in_node_source:inv.npm_packages.filter(p=>p.scope==='node-bundled-npm').length,go_modules:modules.size,debian_sources:os.size,archives:entries.length,notices:noticeRows.length},downloaded_unique_bytes:total,reused_archive_cache:{...cache.stats,index_supplied:Boolean(options['--reuse-index'])},entries,notices:noticeRows,failures,not_a_zero_cve_or_legal_approval:true};
fs.writeFileSync(path.join(output,'SOURCE-INDEX.json'),JSON.stringify(index,null,2)+'\n');fs.writeFileSync(path.join(output,'THIRD-PARTY-NOTICES.md'),'# Venus distribution notices\n\nSource '+source+'; actual image '+image+'.\n\nFull texts are in notices/; the source index maps each owner to exact source archives and SHA256. Preserve the complete index, notices and sources together. No written source offer is substituted for an unavailable archive.\n\n'+noticeRows.map(n=>'- '+n.owner+': '+n.name+' → '+n.file+' SHA256 '+n.sha256).join('\n')+'\n');
// Flat USTAR output; opaque SHA filenames prevent archive paths from source input.
const bundle=path.join(output,'sources.tar'),stream=fs.createWriteStream(bundle,{flags:'wx'});let bundleBytes=0;
async function write(b){bundleBytes+=b.length;if(bundleBytes>totalLimit+64*1024*1024)throw Error('DELIVERY_BUNDLE_LIMIT');if(!stream.write(b))await once(stream,'drain');}
async function member(name,file){if(!/^[a-zA-Z0-9./_-]+$/.test(name)||name.length>99||name.split('/').includes('..'))throw Error('DELIVERY_BUNDLE_PATH');const size=fs.statSync(file).size,h=Buffer.alloc(512);h.write(name);const oct=(n,w)=>n.toString(8).padStart(w-1,'0')+'\0';h.write(oct(0o644,8),100);h.write(oct(0,8),108);h.write(oct(0,8),116);h.write(oct(size,12),124);h.write(oct(0,12),136);h.fill(32,148,156);h[156]=48;h.write('ustar\0',257);h.write('00',263);h.write(h.reduce((a,b)=>a+b,0).toString(8).padStart(6,'0')+'\0 ',148);await write(h);for await(const b of fs.createReadStream(file))await write(b);await write(Buffer.alloc((512-size%512)%512));}
for(const name of ['SOURCE-INDEX.json','THIRD-PARTY-NOTICES.md'])await member(name,path.join(output,name));for(const dir of ['sources','notices'])for(const f of fs.readdirSync(path.join(output,dir)).sort())await member(dir+'/'+f,path.join(output,dir,f));await write(Buffer.alloc(1024));stream.end();await once(stream,'finish');const h=createHash('sha256');for await(const b of fs.createReadStream(bundle))h.update(b);const receipt={format:'VENUS-SOURCES-RECEIPT-1',status:index.status,source_revision:source,image_id:image,inventory_sha256:sha(invBytes),source_index_sha256:sha(fs.readFileSync(path.join(output,'SOURCE-INDEX.json'))),bundle:{name:'sources.tar',bytes:bundleBytes,sha256:h.digest('hex')},failures:failures.length};fs.writeFileSync(path.join(output,'SOURCES-RECEIPT.json'),JSON.stringify(receipt,null,2)+'\n');process.stdout.write(JSON.stringify(receipt)+'\n');if(failures.length)process.exitCode=1;
