import js from '@eslint/js';
import ts from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
export default ts.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '.artifacts/**'] },
  js.configs.recommended, ts.configs.recommended,
  { files: ['**/*.mjs'], languageOptions: {globals: {process: 'readonly', console: 'readonly', fetch: 'readonly', AbortSignal: 'readonly', setTimeout: 'readonly', clearTimeout:'readonly',setInterval:'readonly',clearInterval:'readonly',URL: 'readonly', Buffer: 'readonly'}} },
  { files: ['tools/venus-operator/ui/*.js'],languageOptions:{globals:{document:'readonly',location:'readonly',history:'readonly',fetch:'readonly',btoa:'readonly',TextEncoder:'readonly',Uint8Array:'readonly',setInterval:'readonly',clearInterval:'readonly'}}},
  { files: ['**/*.tsx'], plugins: {'react-hooks': hooks}, rules: hooks.configs.recommended.rules }
);
