/** Capability experiment only. It never labels renderer zoom or a failed shortcut as native zoom. */
/* global innerWidth, outerWidth, devicePixelRatio, getComputedStyle, document */
import {chromium,firefox,webkit} from 'playwright';
import {spawn,execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
import {once} from 'node:events';
const display=':99',xvfb=spawn('Xvfb',[display,'-screen','0','1600x1200x24','-nolisten','tcp','-ac'],{stdio:'ignore'});
const x11Input=process.env.P05_X11_INPUT==='1',report={capability_experiment:true,native_zoom_claim:false,x11_input:x11Input,records:[]};
const xdo=(...args)=>execFileSync('xdotool',args,{env:{...process.env,DISPLAY:display},encoding:'utf8'}).trim();
try{
  for(let index=0;index<100&&!existsSync('/tmp/.X11-unix/X99');index++)await delay(30);
  if(!existsSync('/tmp/.X11-unix/X99'))throw new Error('Xvfb did not start');
  for(const engine of [chromium,firefox,webkit]){
    const browser=await engine.launch({headless:false,env:{...process.env,DISPLAY:display}});
    try{
      const context=await browser.newContext({viewport:null}),page=await context.newPage();
      await page.setContent('<title>Native browser capability probe</title><a href="#one" id="a">Link</a><input id="input"><button id="button">Button</button><select id="select"><option>One</option></select>');
      const measure=()=>page.evaluate(()=>({innerWidth:innerWidth,outerWidth:outerWidth,dpr:devicePixelRatio,cssZoom:getComputedStyle(document.documentElement).zoom,font:getComputedStyle(document.body).fontSize}));
      const before=await measure(),steps=[],focus=[];
      for(let index=0;index<12;index++){await page.keyboard.press('Tab');focus.push(await page.evaluate(()=>document.activeElement.id||document.activeElement.tagName));}
      let windowMetadata;
      if(x11Input){await page.bringToFront();await delay(200);const windows=xdo('search','--onlyvisible','--class','.').split('\n');windowMetadata=windows.map(id=>({id,name:xdo('getwindowname',id)}));const window=windows[0];xdo('windowfocus','--sync',window);xdo('key','--clearmodifiers','ctrl+0');}else await page.keyboard.press('Control+Digit0');
      for(let index=0;index<8;index++){if(x11Input)xdo('key','--clearmodifiers','ctrl+equal');else await page.keyboard.press('Control+Equal');await delay(100);steps.push(await measure());}
      const native=steps.some(step=>step.cssZoom==='1'&&step.font===before.font&&step.dpr>=before.dpr*1.99&&step.innerWidth<=before.innerWidth/1.9);
      report.records.push({engine:engine.name(),version:browser.version(),before,steps,window_metadata:windowMetadata,keyboard_focus_order:focus,native_zoom_200_observed:native});
      await context.close();
    }catch(error){report.records.push({engine:engine.name(),error:error.message,native_zoom_200_observed:false});}finally{await browser.close();}
  }
}finally{const exited=once(xvfb,'exit');xvfb.kill('SIGTERM');await exited;console.log(JSON.stringify(report,null,2));}
