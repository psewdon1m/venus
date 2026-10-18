import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const args=['node_modules/playwright/cli.js','install','chromium',...(process.platform==='linux'?['--with-deps']:[])];
const result=spawnSync(process.execPath,args,{stdio:'inherit',env:{...process.env,PLAYWRIGHT_BROWSERS_PATH:resolve('.artifacts/playwright-browsers'),PLAYWRIGHT_SKIP_BROWSER_GC:'1'}});
if(result.error) throw result.error;process.exitCode=result.status??1;
