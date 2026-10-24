import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {verifyTerminal} from './p05-topic-measurements-method10/verify-terminal.mjs';
const root='.artifacts/p05-recovery-source1274-01/.artifacts/p05/r100-v3-44fbc47d2d5b',json=p=>JSON.parse(readFileSync(p,'utf8'));
const exitCode=Number(readFileSync('.artifacts/p05-recovery-method10-run01-exit.txt','utf8').trim());assert.equal(exitCode,0);
const report=verifyTerminal(readFileSync('.artifacts/p05-recovery-method10-run01.txt','utf8'),{exitCode,prep:json(root+'/preparation.json'),supervisor:json(root+'/control/live/watchdog-terminal.json'),ownedAfter:json(root+'/control/receipts/owned-after-cleanup.json')});
writeFileSync('.artifacts/p05-recovery-method10-terminal-audit01.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
