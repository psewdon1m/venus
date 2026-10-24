import {ESLint} from 'eslint';
import js from '@eslint/js';
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const paths=['.artifacts/p05-v2-layout-producer/private-batch-observer.mjs','.artifacts/p05-v2-layout-producer/private-batch-controls.mjs'];
const syntax=paths.map(path=>{const r=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});return {path,exit_code:r.status,stdout:r.stdout,stderr:r.stderr};});
const eslint=new ESLint({overrideConfigFile:true,overrideConfig:[{files:['**/*.mjs'],...js.configs.recommended,languageOptions:{ecmaVersion:2024,sourceType:'module',globals:{process:'readonly',console:'readonly',Buffer:'readonly',URL:'readonly',URLSearchParams:'readonly',Date:'readonly',performance:'readonly'}}}]});
const lint=await eslint.lintFiles(paths),result={scope:'STATIC_ONLY_NO_DOCKER_BROWSER',syntax,lint};writeFileSync('.artifacts/p05-v2-layout-producer/private-batch-static01.json',JSON.stringify(result,null,2)+'\n');if(syntax.some(r=>r.exit_code!==0)||lint.some(r=>r.errorCount||r.warningCount))process.exitCode=1;console.log(JSON.stringify({syntax:syntax.map(r=>r.exit_code),errors:lint.reduce((n,r)=>n+r.errorCount,0),warnings:lint.reduce((n,r)=>n+r.warningCount,0)}));
