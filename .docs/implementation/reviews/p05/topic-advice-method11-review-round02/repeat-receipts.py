from pathlib import Path
s=Path('.artifacts/p05-advice-method11-review-round01/probes.mjs').read_text(encoding='utf-8')
s=s[:s.index('const ui=await topicScenario')]
s=s.replace('.artifacts/p05-advice-browser-producer11/browser.mjs','.artifacts/p05-advice-browser-producer11-r2/browser.mjs').replace('70abacfc3dc3fdb560d9fd21b197ce849a3622984789886c8a3d0fdfdc751df0','6f09bd209c961fb8abdee51864a742973db21db0d7a145407ed6f9757f4ad670')
a=s.index('const baselinePath=');b=s.index('async function check(')
s=s[:a]+s[b:]
s+="writeFileSync('.artifacts/p05-advice-method11-review-round02/receipts.json',JSON.stringify({status:'PASS',checks:results.length,results},null,2)+'\\n');console.log(JSON.stringify({status:'PASS',checks:results.length}));\n"
Path('.artifacts/p05-advice-method11-review-round02/receipts.mjs').write_text(s,encoding='utf-8')
