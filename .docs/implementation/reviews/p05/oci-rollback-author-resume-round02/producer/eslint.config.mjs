import js from '../../node_modules/@eslint/js/src/index.js';
export default [js.configs.recommended,{files:['**/*.mjs'],languageOptions:{ecmaVersion:'latest',sourceType:'module',globals:{process:'readonly',console:'readonly',Buffer:'readonly',setTimeout:'readonly',URL:'readonly'}}}];
