import {execFileSync} from 'node:child_process';
import {requireValue} from './files.mjs';
const tag=process.env.RELEASE_TAG,sha=process.env.RELEASE_SHA;
requireValue(/^venus-v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(tag??'')&&/^[a-f0-9]{40}$/.test(sha??''),'QUALIFIED_RELEASE_ONLY');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();requireValue(git('rev-parse','HEAD')===sha&&git('rev-parse',tag+'^{commit}')===sha&&git('rev-parse','origin/main')===sha,'EXACT_MAIN_TAG_REQUIRED');requireValue(!git('status','--porcelain'),'CLEAN_RELEASE_SOURCE_REQUIRED');process.stdout.write(JSON.stringify({tag,main_sha:sha,version:tag.slice(7),status:'EXACT_MAIN_TAG_BOUND'})+'\n');
