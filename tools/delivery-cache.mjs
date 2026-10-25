/** Reuse only SHA-named source archives from one prior owned delivery output. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export function archiveCache(indexFile,workspace=process.cwd()){
 const stats={hits:0,bytes:0,rejected:0};if(!indexFile)return {stats,read:()=>null};
 const owned=path.resolve(workspace,'.artifacts'),file=path.resolve(indexFile),relative=path.relative(owned,file);
 if(!relative||relative.startsWith('..')||path.isAbsolute(relative)||path.basename(file)!=='SOURCE-INDEX.json')throw Error('DELIVERY_CACHE_OWNED_PATH');
 let current=owned;for(const part of ['',...relative.split(path.sep)]){if(part)current=path.join(current,part);const s=fs.lstatSync(current);if(s.isSymbolicLink())throw Error('DELIVERY_CACHE_SYMLINK');}
 const root=path.dirname(file),sourceRoot=path.join(root,'sources');if(fs.lstatSync(sourceRoot).isSymbolicLink()||!fs.statSync(sourceRoot).isDirectory())throw Error('DELIVERY_CACHE_SOURCE_ROOT');
 if(fs.statSync(file).size>32*1024*1024)throw Error('DELIVERY_CACHE_INDEX_LIMIT');const data=JSON.parse(fs.readFileSync(file,'utf8'));
 if(data.format!=='VENUS-DISTRIBUTION-SOURCES-1'||!Array.isArray(data.entries)||data.entries.length>4096)throw Error('DELIVERY_CACHE_INDEX');
 const rows=new Map();for(const row of data.entries){if(!/^[a-f0-9]{64}$/.test(row.sha256??'')||!Number.isSafeInteger(row.bytes)||row.bytes<0||row.bytes>384*1024*1024||row.file!=='sources/'+row.sha256+'.source'||typeof row.url!=='string')throw Error('DELIVERY_CACHE_ENTRY');const prior=rows.get(row.url);if(prior&&(prior.sha256!==row.sha256||prior.bytes!==row.bytes))throw Error('DELIVERY_CACHE_AMBIGUOUS');rows.set(row.url,row);}
 return {stats,read(url,max){const row=rows.get(url);if(!row)return null;const file=path.join(sourceRoot,row.sha256+'.source');let fd;try{const s=fs.lstatSync(file);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.size!==row.bytes||s.size>max)throw Error('DELIVERY_CACHE_FILE');fd=fs.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW??0));const actual=fs.fstatSync(fd);if(!actual.isFile()||actual.size!==row.bytes||actual.nlink!==1)throw Error('DELIVERY_CACHE_FILE');const bytes=fs.readFileSync(fd);if(bytes.length!==row.bytes||createHash('sha256').update(bytes).digest('hex')!==row.sha256)throw Error('DELIVERY_CACHE_HASH');stats.hits++;stats.bytes+=bytes.length;return bytes;}catch(e){if(e.code==='ENOENT'||e.message.startsWith('DELIVERY_CACHE_')){stats.rejected++;return null;}throw e;}finally{if(fd!==undefined)fs.closeSync(fd);}}};
}
