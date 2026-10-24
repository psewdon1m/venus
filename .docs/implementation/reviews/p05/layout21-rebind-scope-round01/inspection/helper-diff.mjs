import ts from 'typescript';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='.artifacts/p05-v2-layout-producer-resume03',next='.artifacts/p05-private-batch-browser-producer21/browser.mjs',text=readFileSync(next,'utf8'),ast=ts.createSourceFile(next,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),adapt=JSON.parse(readFileSync(root+'/driver-adaptation.json'));
if(ast.parseDiagnostics.length)throw Error('PARSE');
const sha=b=>createHash('sha256').update(b).digest('hex'),rows=adapt.extractions.map(r=>{const nodes=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text===r.name);if(nodes.length!==1)throw Error('HELPER_MISSING_OR_AMBIGUOUS');const value=text.slice(nodes[0].getStart(ast),nodes[0].end),hash=sha(Buffer.from(value));return {name:r.name,method18_sha256:r.exact_ast_text_sha256,method21_sha256:hash,changed:hash!==r.exact_ast_text_sha256};});
writeFileSync('.artifacts/p05-layout21-scope01/helper-diff.json',JSON.stringify({scope:'READONLY_AST_DIFF_NO_GENERATION',helpers:rows.length,changed:rows.filter(r=>r.changed).map(r=>r.name),rows},null,2)+'\n');console.log(JSON.stringify({helpers:rows.length,changed:rows.filter(r=>r.changed).map(r=>r.name)}));
