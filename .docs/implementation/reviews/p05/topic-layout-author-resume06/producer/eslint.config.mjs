import base from '../../eslint.config.mjs';
// URLSearchParams is a real readonly Node24 builtin for the exact observer03 bytes.
export default [...base.filter(entry=>!entry.ignores),{files:['**/*.mjs'],languageOptions:{globals:{structuredClone:'readonly'}}},{files:['**/private-batch-observer.mjs'],languageOptions:{globals:{URLSearchParams:'readonly'}}}];
