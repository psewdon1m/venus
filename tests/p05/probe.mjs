import {chromium,firefox,webkit} from 'playwright';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const report={node:process.version,npm:execFileSync('npm',['--version'],{encoding:'utf8'}).trim(),package_manager:require('../../package.json').packageManager,playwright:require('playwright/package.json').version,browsers:[],status:'FAIL'};
try {
  if(report.node!=='v24.22.0'||report.npm!=='11.19.1'||report.playwright!=='1.64.1') throw new Error('Pinned toolchain mismatch');
  for(const engine of [chromium,firefox,webkit]) {
    const browser=await engine.launch({headless:true});
    try {const page=await browser.newPage();await page.setContent('<title>Venus local engine probe</title>');if(await page.title()!=='Venus local engine probe') throw new Error('Browser execution failed');report.browsers.push({engine:engine.name(),version:browser.version(),executed:true});}
    finally {await browser.close();}
  }
  report.status='PASS';
} finally {console.log(JSON.stringify(report,null,2));}
