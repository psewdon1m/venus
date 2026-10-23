import base from '../eslint.config.mjs';
// The standalone observer executes under Node24, where URLSearchParams is a builtin.
export default [...base.filter(entry=>!entry.ignores),{files:['**/private-batch-observer.mjs'],languageOptions:{globals:{URLSearchParams:'readonly'}}}];
