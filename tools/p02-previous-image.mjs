/** Rebuild the exact accepted foundation in an isolated, disposable context. */
import {execFileSync} from 'node:child_process';
import {mkdirSync,rmSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
export const acceptedP01='934d9a1efcccfb4380e708a8f5143a43efbc3a71';
export function previousImage(directory,tag,source=acceptedP01) {
  if(!/^[a-f0-9]{40}$/.test(source)) throw new Error('Exact accepted source SHA required');
  const context=join(directory,'accepted-'+source.slice(0,12)),archive=join(directory,'accepted-'+source.slice(0,12)+'.tar');
  if(dirname(resolve(context))!==resolve(directory)) throw new Error('Unsafe archive target');
  mkdirSync(context);
  try {
    execFileSync('git',['archive','--format=tar','--output',archive,source]);
    execFileSync('tar',['-xf',archive,'-C',context]);
    execFileSync('docker',['build','--tag',tag,'--build-arg','SOURCE_REVISION='+source,'--file',join(context,'infra/venus/Dockerfile'),context],{stdio:'inherit'});
    return execFileSync('docker',['image','inspect',tag,'--format','{{.Id}}'],{encoding:'utf8'}).trim();
  } finally {rmSync(context,{recursive:true,force:true});rmSync(archive,{force:true});}
}
