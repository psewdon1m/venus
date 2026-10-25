/** Exact-image read-only distribution inventory. Never executes third-party code. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const hash=b=>createHash('sha256').update(b).digest('hex');
const MAX_FILE=4*1024*1024,MAX_NOTICE=16*1024*1024;let noticeBytes=0;
const notices=[];
function notice(file,owner){try{const real=fs.realpathSync(file),s=fs.statSync(real);if(!s.isFile()||s.size>MAX_FILE)throw Error('DELIVERY_NOTICE_SIZE');const bytes=fs.readFileSync(real);noticeBytes+=bytes.length;if(noticeBytes>MAX_NOTICE)throw Error('DELIVERY_NOTICE_TOTAL');notices.push({owner,path:file,sha256:hash(bytes),bytes:bytes.length,base64:bytes.toString('base64')});return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}}
const packages=[];const visited=new Set();
function scanModules(directory,scope){if(!fs.existsSync(directory))return;for(const name of fs.readdirSync(directory).sort()){if(name.startsWith('.'))continue;const base=path.join(directory,name);if(name.startsWith('@')){for(const child of fs.readdirSync(base).sort())scanPackage(path.join(base,child),scope);}else scanPackage(base,scope);}}
function scanPackage(directory,scope){const stat=fs.lstatSync(directory);if(stat.isSymbolicLink())return;const real=fs.realpathSync(directory);if(visited.has(real))return;visited.add(real);const file=path.join(real,'package.json');if(!fs.existsSync(file))return;const bytes=fs.readFileSync(file);if(bytes.length>MAX_FILE)throw Error('DELIVERY_PACKAGE_LIMIT');const p=JSON.parse(bytes);if(typeof p.name!=='string'||typeof p.version!=='string')throw Error('DELIVERY_PACKAGE_IDENTITY');if(packages.length>=2000)throw Error('DELIVERY_PACKAGE_COUNT');const licenseFiles=[];for(const name of fs.readdirSync(real).sort())if(/^(?:licen[cs]e|copying|copyright|notice|authors)(?:[._-].*)?$/i.test(name)){const f=path.join(real,name);if(fs.statSync(f).isFile()&&notice(f,p.name+'@'+p.version))licenseFiles.push(f);}packages.push({name:p.name,version:p.version,scope,path:real,package_json_sha256:hash(bytes),declared_license:p.license??null,license_files:licenseFiles});scanModules(path.join(real,'node_modules'),scope);}
scanModules('/app/node_modules','application-runtime');scanModules('/app/apps/api/node_modules','application-runtime');
for(const root of ['/app/packages','/app/apps'])if(fs.existsSync(root))for(const name of fs.readdirSync(root).sort()){const d=path.join(root,name);if(fs.statSync(d).isDirectory())scanModules(path.join(d,'node_modules'),'application-runtime');}
scanPackage('/usr/local/lib/node_modules/npm','node-bundled-npm');
const extras=[];for(const d of fs.readdirSync('/opt').filter(n=>/^yarn-v[0-9]/.test(n))){const dir=path.join('/opt',d),p=JSON.parse(fs.readFileSync(path.join(dir,'package.json')));extras.push({name:'yarn',version:p.version,path:dir});for(const n of fs.readdirSync(dir))if(/^(LICENSE|COPYING|NOTICE)/i.test(n))notice(path.join(dir,n),'yarn@'+p.version);}
for(const f of ['/usr/local/LICENSE','/usr/local/share/doc/node/LICENSE','/usr/local/lib/node_modules/npm/LICENSE'])if(fs.existsSync(f))notice(f,'node-runtime');
const browserIndex='/app/apps/web/dist/third-party/media/INDEX.json';
if(!fs.existsSync(browserIndex))throw Error('DELIVERY_BROWSER_NOTICES_MISSING');
const browserNotices=JSON.parse(fs.readFileSync(browserIndex,'utf8'));
for(const p of browserNotices.packages??[])for(const n of p.license_files??[]){const dir=(p.package??p.name).replaceAll('@','_').replaceAll('/','__')+'_'+p.version;const file=path.join(path.dirname(browserIndex),dir,n.name);if(!notice(file,(p.package??p.name)+'@'+p.version))throw Error('DELIVERY_BROWSER_NOTICE_FILE');if(notices.at(-1).sha256!==n.sha256)throw Error('DELIVERY_BROWSER_NOTICE_HASH');}
function collectNotices(directory){if(!fs.existsSync(directory))return;for(const name of fs.readdirSync(directory).sort()){const file=path.join(directory,name);if(fs.statSync(file).isDirectory())collectNotices(file);else notice(file,'bundled-runtime');}}
collectNotices('/usr/share/licenses/venus');
const os=execFileSync('dpkg-query',['-W','-f=${binary:Package}\t${Version}\t${source:Package}\t${source:Version}\n'],{encoding:'utf8',timeout:10000,maxBuffer:4*1024*1024}).trim().split('\n').map(line=>{const [name,version,source,source_version]=line.split('\t');const f='/usr/share/doc/'+name.split(':')[0]+'/copyright';return {name,version,source,source_version,copyright_available:notice(f,'debian:'+name+'@'+version)};});
const binary=fs.readFileSync('/usr/local/bin/venus-media-server'),off=binary.indexOf(Buffer.concat([Buffer.from([255]),Buffer.from(' Go buildinf:')]));if(off<0||!(binary[off+15]&2))throw Error('DELIVERY_GO_BUILD_INFO');let cursor=off+32;
function str(){let size=0,shift=0;for(let i=0;i<5;i++){const v=binary[cursor++];size+=(v&127)*2**shift;if(!(v&128)){if(size>4*1024*1024||cursor+size>binary.length)throw Error('DELIVERY_GO_BUILD_INFO');const b=binary.subarray(cursor,cursor+size);cursor+=size;return b;}shift+=7;}throw Error('DELIVERY_GO_BUILD_INFO');}
const goVersion=str().toString(),mod=str(),lines=mod.subarray(16,-16).toString().trim().split('\n');
const modules=[];let previous;
for(const line of lines){const [kind,name,version,sum]=line.split('\t');if(kind==='dep'){previous={path:name,version,sum:sum??null};modules.push(previous);}else if(kind==='=>'&&previous)previous.replacement={path:name,version,sum:sum??null};}
const build=JSON.parse(fs.readFileSync('/app/build-metadata.json','utf8'));
const result={format:'VENUS-DELIVERY-INVENTORY-1',created_at:new Date().toISOString(),build,node_version:process.version,browser_notice_index:browserNotices,npm_packages:packages,extra_runtimes:extras,os_packages:os,go:{version:goVersion,binary_sha256:hash(binary),binary_bytes:binary.length,build_information:lines,modules},notices,scope:'Actual service image bytes only; not vulnerability, source-attestation or license-clearance verdict'};
process.stdout.write(JSON.stringify(result)+'\n');
