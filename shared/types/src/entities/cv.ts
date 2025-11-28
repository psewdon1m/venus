// CV Generation entity types

export interface CVGeneration {
  id: string;
  accountId: string;
  personaId: string;
  content: CVContent;
  pdfUrl: string;
  createdAt: Date;
}

export interface CVContent {
  summary?: string;
  skills?: string[];
  experience?: CVExperience[];
  education?: CVEducation[];
  contact?: CVContact;
  languages?: string[];
  certifications?: string[];
}

export interface CVExperience {
  role: string;
  company?: string;
  period: string;
  description?: string;
  achievements?: string[];
  tools?: string[];
}

export interface CVEducation {
  degree: string;
  institution: string;
  year: number;
  description?: string;
}

export interface CVContact {
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
}

export interface GenerateCVInput {
  personaId?: string; // If not provided, use all personas
  template?: 'minimalist' | 'modern' | 'creative';
  includePhoto?: boolean;
}

export interface CVGenerationResponse {
  id: string;
  pdfUrl: string;
  expiresAt: Date;
}
