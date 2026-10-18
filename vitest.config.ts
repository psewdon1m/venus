import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: {alias: [{find:'@venus/contracts/schemas',replacement:fileURLToPath(new URL('./packages/contracts/src/schemas.json',import.meta.url))},...['contracts','i18n','relationship-engine','card-catalog'].map(name => ({find:new RegExp(`^@venus/${name}$`),replacement:fileURLToPath(new URL(`./packages/${name}/src/index.ts`,import.meta.url))}))]},
  test: {include: ['apps/**/*.test.ts','packages/**/*.test.ts','tools/**/*.test.ts'],exclude:process.env.VENUS_P02_INTEGRATION==='1'?[]:['**/*.integration.test.ts'],testTimeout:120000,hookTimeout:120000}
});
