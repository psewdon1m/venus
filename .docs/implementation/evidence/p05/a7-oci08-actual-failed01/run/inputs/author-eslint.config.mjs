import js from '@eslint/js';
export default [{files:['**/*.mjs'],...js.configs.recommended,languageOptions:{globals:{process:'readonly',console:'readonly',fetch:'readonly',AbortSignal:'readonly',setTimeout:'readonly',clearTimeout:'readonly',URL:'readonly',Buffer:'readonly'}}}];
