/** Validate captured inputs, never paths that an editor can change between reads. */
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
export function validateBatchSnapshot(requestBytes,manifestBytes,existingCards) {
  const parent=resolve(tmpdir()),directory=mkdtempSync(join(parent,'venus-p04-request-'));
  const cleanup=()=>{
    if(dirname(resolve(directory))!==parent||!directory.startsWith(join(parent,'venus-p04-request-'))) throw new Error('Unsafe owned request cleanup path');
    rmSync(directory,{recursive:true,force:true});
  };
  try {
    const request=join(directory,'request.json'),manifest=join(directory,'manifest.json');
    writeFileSync(request,requestBytes,{flag:'wx'});writeFileSync(manifest,manifestBytes,{flag:'wx'});
    const args=['-B','tools/validate_card_batch.py',request,'--catalog-manifest',manifest];
    if(existingCards) {
      const cards=join(directory,'cards');mkdirSync(cards);
      for(const card of existingCards) {
        if(!/^(Q|TD|YB)-\d{4}$/.test(card.id)) throw new Error('CATALOG_CARD_ID_INVALID');
        writeFileSync(join(cards,card.id+'.json'),JSON.stringify(card),{flag:'wx'});
      }
      args.push('--existing-cards',cards);
    }
    execFileSync(process.env.PYTHON??'python',args,{stdio:'inherit'});
  } finally {
    cleanup();
  }
}
