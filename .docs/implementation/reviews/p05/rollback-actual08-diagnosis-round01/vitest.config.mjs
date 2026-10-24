import {createRequire} from 'node:module';const req=createRequire('C:/.projects/venus/apps/api/package.json');
import base from '../../../../../vitest.config.ts';
export default {...base,resolve:{alias:[{find:'ajv/dist/2020.js',replacement:req.resolve('ajv/dist/2020.js')},{find:'ajv-formats',replacement:req.resolve('ajv-formats')},...base.resolve.alias]},test:{...base.test,include:['C:/.projects/venus/.docs/implementation/reviews/p05/rollback-actual08-diagnosis-round01/normal-projection.test.ts']}};
