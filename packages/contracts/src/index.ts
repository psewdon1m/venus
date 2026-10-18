/** Foundation contracts mirror P00-2 OpenAPI; game/room implementation starts in P02. */
export interface Version {
  service: 'venus'; version: string; source_revision: string;
  image_digest: string; contract_revision: 'P00-2';
}
export interface HealthLive {status: 'alive'}
export interface HealthReady {
  status: 'ready' | 'unavailable'; database: 'ready' | 'unavailable'; schema_generation: number;
}
export type Locale = 'ru' | 'en' | 'tr';
export const contractRevision = 'P00-2' as const;
