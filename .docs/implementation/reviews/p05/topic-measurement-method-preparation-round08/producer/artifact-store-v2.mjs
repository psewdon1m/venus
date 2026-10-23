/** Checked owned artifact tree. Best-effort link/race detection, not openat2 or
 * an atomic guarantee against a malicious concurrent filesystem actor. */
import {lstatSync,realpathSync,mkdirSync,readdirSync,existsSync,openSync,closeSync,writeSync,fstatSync,constants} from 'node:fs';
import {resolve,parse,relative,sep,dirname} from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const reserved=/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
export function portableArtifactName(name){assert(typeof name==='string'&&name.length>0&&name.length<=2048,'ARTIFACT_NAME_GRAMMAR');const parts=name.split('/');for(const component of parts)assert(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(component)&&!component.endsWith('.')&&!reserved.test(component),'ARTIFACT_NAME_GRAMMAR');return name;}
function rejectAlternateStreams(root){if(process.platform!=='win32')return;
 // NTFS alternate streams are invisible to readdir/stat byte accounting. Query
 // all existing files AND directories using a fixed script and a literal env path.
 const script="$ErrorActionPreference='Stop'; if($PSVersionTable.PSVersion -lt [Version]'7.2'){ throw 'WINDOWS_STREAM_ENUMERATOR_VERSION_REQUIRED' }; $r=[Environment]::GetEnvironmentVariable('VENUS_ARTIFACT_STREAM_PATH'); $items=@(Get-Item -LiteralPath $r -Force)+@(Get-ChildItem -LiteralPath $r -Recurse -Force); foreach($i in $items){ foreach($s in @(Get-Item -LiteralPath $i.FullName -Stream * -ErrorAction Stop)){ if($s.Stream -ne ':$DATA'){ Write-Output 'NONDEFAULT_STREAM'; exit 12 } } }";
 const value=execFileSync('pwsh.exe',['-NoLogo','-NoProfile','-NonInteractive','-Command',script],{encoding:'utf8',windowsHide:true,timeout:10000,maxBuffer:4096,env:{...process.env,VENUS_ARTIFACT_STREAM_PATH:root}});assert.equal(value.trim(),'','ARTIFACT_ALTERNATE_STREAM');
}
const norm=p=>process.platform==='win32'?p.toLowerCase():p;
const id=s=>String(s.dev)+':'+String(s.ino);
export class ArtifactStore{
 constructor(directory,{limit=32*1024**3}={}){
  assert(Number.isSafeInteger(limit)&&limit>0);this.root=resolve(directory);this.limit=limit;this.identities=new Map();
  this.checkAncestors(this.root,{allowMissing:true});if(!existsSync(this.root))mkdirSync(this.root,{recursive:true,mode:0o700});this.checkAncestors(this.root);this.realRoot=realpathSync.native(this.root);assert.equal(norm(this.realRoot),norm(this.root),'ARTIFACT_ROOT_REALPATH_MISMATCH');this.check();
 }
 checkAncestors(target,{allowMissing=false}={}){
  const absolute=resolve(target),anchor=parse(absolute).root,parts=absolute.slice(anchor.length).split(sep).filter(Boolean);let current=anchor;
  for(const part of ['',...parts]){
   if(part)current=resolve(current,part);let s;try{s=lstatSync(current,{bigint:true});}catch(error){if(error.code==='ENOENT'&&allowMissing)break;throw error;}
   assert(!s.isSymbolicLink(),'ARTIFACT_LINK_ANCESTOR:'+current);assert(s.isDirectory(),'ARTIFACT_ANCESTOR_NOT_DIRECTORY:'+current);assert.equal(norm(realpathSync.native(current)),norm(current),'ARTIFACT_ANCESTOR_REALPATH:'+current);
   const previous=this.identities.get(norm(current));assert(previous===undefined||previous===id(s),'ARTIFACT_ANCESTOR_IDENTITY_CHANGED:'+current);this.identities.set(norm(current),id(s));
  }
 }
 check(){this.checkAncestors(this.root);assert.equal(norm(realpathSync.native(this.root)),norm(this.realRoot),'ARTIFACT_ROOT_CHANGED');let bytes=0;
  const scan=directory=>{this.checkAncestors(directory);for(const entry of readdirSync(directory,{withFileTypes:true})){const path=resolve(directory,entry.name),s=lstatSync(path,{bigint:true});assert(!s.isSymbolicLink(),'ARTIFACT_TREE_LINK:'+path);if(s.isDirectory())scan(path);else{assert(s.isFile(),'ARTIFACT_TREE_NOT_REGULAR:'+path);bytes+=Number(s.size);assert(Number.isSafeInteger(bytes),'ARTIFACT_SIZE_OVERFLOW');}}};scan(this.root);rejectAlternateStreams(this.root);assert(bytes<=this.limit,'ARTIFACT_BUDGET_EXCEEDED');this.bytes=bytes;return bytes;
 }
 path(name){portableArtifactName(name);const target=resolve(this.root,name),r=relative(this.root,target);assert(r&&!r.startsWith('..'+sep)&&r!=='..'&&!parse(r).root,'ARTIFACT_OUTPUT_SCOPE');return target;}
 write(name,value){const buffer=Buffer.isBuffer(value)?value:Buffer.from(value),path=this.path(name);this.check();this.checkAncestors(dirname(path),{allowMissing:true});assert(this.bytes+buffer.length<=this.limit,'ARTIFACT_BUDGET_EXCEEDED');
  if(!existsSync(dirname(path))){mkdirSync(dirname(path),{recursive:true,mode:0o700});this.checkAncestors(dirname(path));}this.check();this.checkAncestors(dirname(path));assert(!existsSync(path),'ARTIFACT_OVERWRITE');let fd;
  try{
   fd=openSync(path,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|(constants.O_NOFOLLOW??0),0o600);this.checkAncestors(dirname(path));const opened=fstatSync(fd,{bigint:true}),located=lstatSync(path,{bigint:true});assert(opened.isFile()&&located.isFile()&&!located.isSymbolicLink()&&id(opened)===id(located),'ARTIFACT_FILE_IDENTITY_CHANGED');
   let offset=0;while(offset<buffer.length){const n=writeSync(fd,buffer,offset,buffer.length-offset);assert(n>0,'ARTIFACT_WRITE_INCOMPLETE');offset+=n;}
   this.checkAncestors(dirname(path));assert.equal(id(lstatSync(path,{bigint:true})),id(fstatSync(fd,{bigint:true})),'ARTIFACT_FILE_REPLACED');
  }finally{if(fd!==undefined)closeSync(fd);}this.check();return{path,bytes:buffer.length};
 }
}
