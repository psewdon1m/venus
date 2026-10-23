export {producerMap,verifyIncluded} from './proof.mjs';
export async function run(){console.log('AUTHORITY_STUB_PASSED_NO_DOCKER');const{executePlan}=await import('./host-runner.mjs');return executePlan();}
if(process.argv[1]&&new URL(import.meta.url).pathname.endsWith('/driver.mjs'))await run();
