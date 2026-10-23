import {setTimeout as delay} from 'node:timers/promises';
/** X_QueryTree can race with window destruction. Failed queries never mean an empty baseline. */
export async function windowInventory(query,observe=()=>{},{attempts=5,wait=delay}={}){
  for(let attempt=1;attempt<=attempts;attempt++){
    try{const output=query().trim(),ids=output?output.split('\n').map(value=>value.trim()):[];if(ids.some(id=>!/^\d+$/.test(id))||new Set(ids).size!==ids.length)throw new Error('Invalid X11 window inventory');return ids;}
    catch(error){
      const stderr=String(error.stderr??'').trim(),stdout=String(error.stdout??'').trim();
      if(error.status===1&&!stderr&&!stdout)return [];
      const transient=error.status===1&&/BadWindow/.test(stderr)&&/X_QueryTree/.test(stderr);
      observe({attempt,status:'FAIL',transient_bad_window:transient,stderr:stderr.slice(0,2048)});
      if(!transient||attempt===attempts)throw error;await wait(50);
    }
  }
  throw new Error('X11 inventory retry exhausted');
}
