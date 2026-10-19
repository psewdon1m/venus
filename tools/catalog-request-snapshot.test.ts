import {it,expect} from 'vitest';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
// @ts-expect-error This offline CLI module is intentionally native JavaScript.
import {validateBatchSnapshot} from './catalog-request-snapshot.mjs';
it('validates the captured request even when its original file changes',()=>{
  const directory=mkdtempSync(join(tmpdir(),'venus-request-race-test-'));
  try {
    const path=join(directory,'request.json'),original=readFileSync('.docs/examples/card-batch-request.json');
    writeFileSync(path,original);const captured=readFileSync(path);writeFileSync(path,'{}');
    const manifest=readFileSync('.docs/examples/pack-candidate-manifest.json');
    expect(()=>validateBatchSnapshot(captured,manifest,undefined)).not.toThrow();
    expect(()=>validateBatchSnapshot(readFileSync(path),manifest,undefined)).toThrow();
  } finally {rmSync(directory,{recursive:true,force:true});}
});
