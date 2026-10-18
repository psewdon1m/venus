/** Corrupt a disposable source copy, prove positive control then expected failure. */
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, symlinkSync, rmSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname, resolve} from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root = process.cwd();
const scratch = mkdtempSync(join(tmpdir(), 'venus-negative-'));
const paths = [...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(p => p && existsSync(p)))];
const hash = () => createHash('sha256').update(paths.map(p => p+':'+createHash('sha256').update(readFileSync(p)).digest('hex')).join('\n')).digest('hex');
const before = hash();
const sourceIdentity = execFileSync('python',['-B','tools/p01_gate.py','identity'],{encoding:'utf8'}).trim();
const sourceDirty = Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim());
const records = [];
let sourceChanged;
function run(command, args) {
  const result = spawnSync(command,args,{cwd:scratch,encoding:'utf8',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'},maxBuffer:8*1024*1024});
  if (result.error) throw result.error;
  return {exit:result.status, output:(result.stdout ?? '')+(result.stderr ?? '')};
}
try {
  for (const path of paths) {mkdirSync(dirname(join(scratch,path)),{recursive:true});cpSync(path,join(scratch,path));}
  symlinkSync(resolve(root,'node_modules'),join(scratch,'node_modules'),process.platform === 'win32' ? 'junction' : 'dir');
  const node = process.execPath;
  const cases = [
    {id:'schema',file:'.docs/contracts/projections.v1.schema.json',command:'python',args:['-B','tools/check_schemas.py'],mutate:text=>{const s=JSON.parse(text);s.type='INVALID_NEGATIVE_SCHEMA';return JSON.stringify(s);},diagnostic:/INVALID_NEGATIVE_SCHEMA/},
    {id:'locale',file:'packages/i18n/src/tr.json',command:node,args:['tools/check-i18n.mjs'],mutate:text=>{const s=JSON.parse(text);delete s.title;return JSON.stringify(s);},diagnostic:/Locale keys/},
    {id:'type',file:'packages/contracts/src/index.ts',command:node,args:['node_modules/typescript/bin/tsc','-b','--force'],mutate:text=>text+'\nexport const negativeType: number = "NEGATIVE_TYPE";\n',diagnostic:/not assignable to type 'number'/},
    {id:'unit',file:'apps/api/src/app.test.ts',command:node,args:['node_modules/vitest/vitest.mjs','run','apps/api/src/app.test.ts'],mutate:text=>text.replace("toEqual({status:'alive'})","toEqual({status:'NEGATIVE_UNIT'})"),diagnostic:/NEGATIVE_UNIT/}
  ];
  for (const test of cases) {
    const path = join(scratch,test.file);const original=readFileSync(path,'utf8');
    const control=run(test.command,test.args);
    if(control.exit!==0) throw new Error(`${test.id} positive control failed:\n${control.output}`);
    try {
      writeFileSync(path,test.mutate(original));
      const result=run(test.command,test.args);
      const pass=result.exit!==0 && test.diagnostic.test(result.output);
      records.push({id:test.id,status:pass?'PASS':'FAIL',positive_exit:control.exit,negative_exit:result.exit,diagnostic:result.output});
      if(!pass) throw new Error(`${test.id} corruption was not rejected correctly: ${result.output}`);
    } finally {writeFileSync(path,original);}
  }
} finally {
  // Remove the junction first; never traverse or remove its shared target.
  if(existsSync(join(scratch,'node_modules'))) rmSync(join(scratch,'node_modules'));
  rmSync(scratch,{recursive:true,force:true});
  const after=hash();mkdirSync('.artifacts',{recursive:true});
  writeFileSync('.artifacts/negative-gates.json',JSON.stringify({source_sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),source_identity_sha256:sourceIdentity,source_dirty:sourceDirty,source_before:before,source_after:after,status:records.length===4&&records.every(r=>r.status==='PASS')&&before===after?'PASS':'FAIL',cases:records},null,2));
  sourceChanged = before !== after;
}
if(sourceChanged) throw new Error('Negative checks modified source');
console.log('PASS: schema, locale, type and unit corruption rejected; source unchanged');
