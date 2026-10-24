/* global document, localStorage, sessionStorage */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1024,height:768}});const errors=[];page.on('pageerror',error=>errors.push(error.name));
async function login(){await page.locator('#credential-file').setInputFiles('/credentials/key');await page.locator('#login button').click();await page.locator('#controls').waitFor({state:'visible'});}
try{
 await page.goto(process.env.OPERATOR_ORIGIN);await login();await page.locator('#release').selectOption(process.env.RELEASE_ID);await page.locator('#create').click();
 await page.waitForFunction(()=>document.getElementById('job').textContent.includes('CREATED'));const jobId=new URL(page.url()).hash.slice(1);assert.ok(/^[a-f0-9-]{36}$/.test(jobId));
 let confirmedServerSide=false;
 await page.route('**/api/operator/jobs/'+jobId+'/confirm',async route=>{const answer=await route.fetch();assert.equal(answer.status(),200);confirmedServerSide=true;await route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({code:'FIXTURE_UPSTREAM_502_AFTER_CONFIRM'})});},{times:1});
 await page.locator('#confirm').click();await page.waitForFunction(()=>document.getElementById('error').textContent.includes('FIXTURE_UPSTREAM_502_AFTER_CONFIRM'));assert.equal(confirmedServerSide,true);
 await page.reload();assert.equal(new URL(page.url()).hash.slice(1),jobId);assert.equal(await page.locator('#controls').isHidden(),true);await login();
 await page.waitForFunction(()=>document.getElementById('job').textContent.includes('CONFIRMED'));assert.equal(new URL(page.url()).hash.slice(1),jobId);assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
 await page.locator('#cancel').click();await page.waitForFunction(()=>document.getElementById('job').textContent.includes('CANCELLED'));assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',browser:'Chromium',version:browser.version(),job_id:jobId,actual_UI_create_confirm_reload_reauth_cancel:true,injected_browser_edge_502_after_real_confirm:true,confirmed_server_side:true,same_job_recovered_after_lost_ack:true,no_browser_credential_storage:true,page_errors:0}));
}finally{await browser.close();}
