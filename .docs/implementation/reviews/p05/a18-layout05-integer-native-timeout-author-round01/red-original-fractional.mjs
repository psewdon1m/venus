import {execFileSync} from 'node:child_process';
const budget={remaining:()=>14999.75};
execFileSync(process.execPath,['-e',"process.stdout.write('CHILD_STARTED')"],{timeout:Math.max(1,Math.min(15000,budget.remaining()))});
