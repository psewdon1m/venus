import js from '@eslint/js';
export default [js.configs.recommended,{files:['**/*.mjs'],languageOptions:{ecmaVersion:'latest',sourceType:'module',globals:{process:'readonly',console:'readonly',fetch:'readonly',AbortSignal:'readonly',setTimeout:'readonly',clearTimeout:'readonly',URL:'readonly',Buffer:'readonly',structuredClone:'readonly'}}}];
