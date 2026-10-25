import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {encryptedPdf} from './encrypted-pdf.mjs';
test('actual Poppler recognizes original valid encrypted PDF; fixed Venus no-password CLI rejects it',()=>{
 assert.equal(process.platform,'linux','Run in actual Linux converter image');const directory=fs.mkdtempSync(path.join(os.tmpdir(),'venus-password-boundary-')),file=path.join(directory,'encrypted.pdf');try{fs.writeFileSync(file,encryptedPdf());const info=spawnSync('/usr/bin/pdfinfo',[file],{encoding:'utf8',timeout:5000});assert.equal(info.status,0,info.stderr);assert.match(info.stdout,/^Encrypted:\s+yes/m);
 const fd=fs.openSync(file,'r');let result;try{result=spawnSync('/usr/bin/python3',['-I','-B','-c',`import runpy,json,subprocess
m=runpy.run_path('/app/infra/venus/presentation-render.py');original=subprocess.Popen;calls=[]
def fixed(args,*a,**kw):
 calls.append(args);return original(args,*a,**kw)
subprocess.Popen=fixed
try:
 m['render_pdf'](3,1048576);raise SystemExit('UNEXPECTED_READY')
except m['Rejected'] as error:
 print(json.dumps({'code':str(error),'argv':calls,'password_supplied':False}))`],{stdio:['ignore','pipe','pipe',fd],encoding:'utf8',timeout:10000});}finally{fs.closeSync(fd);}assert.equal(result.status,0,result.stderr);const receipt=JSON.parse(result.stdout);assert.equal(receipt.code,'PDF_INVALID');assert.deepEqual(receipt.argv,[['/usr/bin/pdfinfo','/proc/self/fd/3']]);assert.equal(receipt.password_supplied,false);
 }finally{assert.equal(path.dirname(directory),os.tmpdir());assert(path.basename(directory).startsWith('venus-password-boundary-'));fs.rmSync(directory,{recursive:true,force:true});}
});
