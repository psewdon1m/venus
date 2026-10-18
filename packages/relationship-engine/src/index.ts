/** Server-only implementation. Exposure still depends on reviewed pack and accepted later gates. */
export * from './types.js';
export * from './pack.js';
export * from './engine.js';
export * from './consent.js';
export {policyDigest} from './policy-identity.js';
export const engineAvailability={available:false,prerequisite:'EXIT-P03/P04/P05'} as const;
