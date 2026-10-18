import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: {alias: Object.fromEntries(['contracts','i18n','relationship-engine','card-catalog'].map(name => [`@venus/${name}`, fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url))]))},
  test: {include: ['apps/**/*.test.ts','packages/**/*.test.ts','tools/**/*.test.ts'], testTimeout: 10000}
});
