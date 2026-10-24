import fs from 'node:fs';
import {setTimeout} from 'node:timers/promises';
for(let i=0;!fs.existsSync('/operator-config/config.json')&&i<200;i++)await setTimeout(50);
process.argv=[process.argv[0],'tools/venus-operator/cli.mjs','operator','/operator-config/config.json'];
await import('../../tools/venus-operator/cli.mjs');
