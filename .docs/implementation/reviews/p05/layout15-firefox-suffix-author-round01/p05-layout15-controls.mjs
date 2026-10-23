import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const base='C:/.projects/venus/.artifacts/p05-pilot-bundle-source13/.artifacts/',old=await import(pathToFileURL(base+'p05-v2-layout-producer-resume14/x11.mjs')),next=await import(pathToFileURL(base+'p05-v2-layout-producer-resume15/x11.mjs'));
const nonce='Venus layout 12345678-1234-4123-8123-123456789abc',suffix=' \u2014 Nightly',rows=[];
function check(name,operation){operation();rows.push({name,status:'PASS'});}
check('Firefox_measured_exact_em_dash_Nightly_suffix',()=>{const regex=new RegExp(next.windowTitlePattern(nonce,'firefox'));for(const title of [nonce,nonce+suffix]){assert(regex.test(title));assert(next.ownWindowTitle(nonce,'firefox',title));}assert(!new RegExp(old.windowTitlePattern(nonce,'firefox')).test(nonce+suffix));});
check('wrong_vendor_dash_nonce_suffix_and_private_tail_rejected',()=>{const regex=new RegExp(next.windowTitlePattern(nonce,'firefox'));for(const title of [nonce+' - Nightly',nonce+' \u2014 Mozilla Firefox','other'+nonce+suffix,nonce+suffix+' PRIVATE_CANARY',nonce.replace('12345678','87654321')+suffix]){assert(!regex.test(title));assert(!next.ownWindowTitle(nonce,'firefox',title));}});
check('Chromium_WebKit_unknown_policies_exact_parent14',()=>{for(const engine of ['chromium','webkit','unknown']){assert.equal(next.windowTitlePattern(nonce,engine),old.windowTitlePattern(nonce,engine));for(const title of [nonce,nonce+' - Google Chrome for Testing',nonce+suffix])assert.equal(next.ownWindowTitle(nonce,engine,title),old.ownWindowTitle(nonce,engine,title));}});
check('same_readiness_and_focus_native_implementation',()=>{const before=readFileSync(base+'p05-v2-layout-producer-resume14/x11.mjs','utf8'),after=readFileSync(base+'p05-v2-layout-producer-resume15/x11.mjs','utf8');assert.equal(after.slice(after.indexOf('export async function readyOwnedWindow')),before.slice(before.indexOf('export async function readyOwnedWindow')));});
console.log(JSON.stringify({status:'PASS_FOUR_NEW_SCOPE_CONTROLS_NOT_NATIVE',controls:rows.length,rows},null,2));
