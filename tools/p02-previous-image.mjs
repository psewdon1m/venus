/** Rebuild the exact accepted foundation in an isolated, disposable context. */
import {execFileSync} from 'node:child_process';
import {mkdirSync,rmSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
export const acceptedP01='934d9a1efcccfb4380e708a8f5143a43efbc3a71';
export function previousImage(directory,tag) {
  const context=join(directory,'accepted-p01'),archive=join(directory,'accepted-p01.tar');
  if(dirname(resolve(context))!==resolve(directory)) throw new Error('Unsafe archive target');
  mkdirSync(context);
  try {
    execFileSync('git',['archive','--format=tar','--output',archive,acceptedP01]);
    execFileSync('tar',['-xf',archive,'-C',context]);
    execFileSync('docker',['build','--tag',tag,'--build-arg','SOURCE_REVISION='+acceptedP01,'--file',join(context,'infra/venus/Dockerfile'),context],{stdio:'inherit'});
    return execFileSync('docker',['image','inspect',tag,'--format','{{.Id}}'],{encoding:'utf8'}).trim();
  } finally {rmSync(context,{recursive:true,force:true});rmSync(archive,{force:true});}
}
