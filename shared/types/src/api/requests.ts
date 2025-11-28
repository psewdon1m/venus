// API Request types

// Auth requests
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Project requests
export interface CreateProjectRequest {
  title: string;
  slug?: string; // Auto-generated if not provided
  type: 'album' | 'main-project';
}

export interface UpdateProjectRequest {
  title?: string;
  slug?: string;
  content?: unknown; // ProjectContent from entities
  status?: 'draft' | 'published';
}

// Persona requests
export interface CreatePersonaRequest {
  slug: string;
  displayName: string;
  manifest?: string;
}

export interface UpdatePersonaRequest {
  slug?: string;
  displayName?: string;
  manifest?: string;
  settings?: unknown; // PersonaSettings from entities
}

// Media requests
export interface UploadMediaRequest {
  file: File | Buffer;
  alt?: string;
  caption?: string;
}

// CV requests
export interface GenerateCVRequest {
  personaId?: string;
  template?: 'minimalist' | 'modern' | 'creative';
  includePhoto?: boolean;
}
