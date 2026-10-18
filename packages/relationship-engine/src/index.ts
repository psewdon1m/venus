/** Server-only boundary. No production resolver or consent engine exists before P03. */
export const engineAvailability = {available: false, prerequisite: 'EXIT-P03'} as const;
