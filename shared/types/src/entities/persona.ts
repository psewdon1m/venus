// Persona entity types

export interface Persona {
  id: string;
  accountId: string;
  slug: string;
  displayName: string;
  manifest: string | null;
  settings: PersonaSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonaSettings {
  avatarUrl?: string;
  contactMethod?: 'email' | 'form' | 'messenger';
  contactValue?: string;
  theme?: 'light' | 'dark';
  visibility?: 'public' | 'unlisted' | 'private';
}

export interface CreatePersonaInput {
  slug: string;
  displayName: string;
  manifest?: string;
  settings?: PersonaSettings;
}

export interface UpdatePersonaInput {
  slug?: string;
  displayName?: string;
  manifest?: string;
  settings?: PersonaSettings;
}

export type PersonaPublic = Omit<Persona, 'accountId' | 'settings'> & {
  settings: Omit<PersonaSettings, 'contactValue'>;
};
