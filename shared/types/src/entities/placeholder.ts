// Placeholder types for project albums

export type PlaceholderType =
  | 'cover'
  | 'meta'
  | 'context'
  | 'role'
  | 'process'
  | 'gallery'
  | 'technical'
  | 'results'
  | 'credits';

// Base placeholder content interface
export interface BasePlaceholderContent {
  [key: string]: unknown;
}

// Cover placeholder
export interface CoverContent {
  image: string; // media file ID
  title: string;
  subtitle?: string;
  videoUrl?: string;
}

// Meta placeholder
export interface MetaContent {
  role?: string;
  year?: number;
  duration?: string;
  industry?: string;
  client?: string;
  type?: 'commercial' | 'personal' | 'educational';
}

// Context placeholder
export interface ContextContent {
  problem?: string;
  brief?: string;
  constraints?: string[];
  goals?: string[];
}

// Role placeholder
export interface RoleContent {
  title: string;
  description: string;
  responsibilities?: string[];
}

// Process placeholder
export interface ProcessContent {
  description: string;
  images?: string[]; // media file IDs
  stages?: ProcessStage[];
}

export interface ProcessStage {
  title: string;
  description?: string;
  images?: string[];
}

// Gallery placeholder
export interface GalleryContent {
  images: string[]; // media file IDs
  layout?: 'grid' | 'masonry' | 'slider';
  captions?: Record<string, string>; // imageId -> caption
}

// Technical placeholder
export interface TechnicalContent {
  tools?: string[];
  stack?: string[];
  technologies?: string[];
  standards?: string[];
  formats?: string[];
}

// Results placeholder
export interface ResultsContent {
  description?: string;
  metrics?: Metric[];
  feedback?: string;
  impact?: string;
}

export interface Metric {
  label: string;
  value: string | number;
  unit?: string;
}

// Credits placeholder
export interface CreditsContent {
  team?: TeamMember[];
  acknowledgments?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  link?: string;
}

// Union type for all placeholder content
export type PlaceholderContent =
  | CoverContent
  | MetaContent
  | ContextContent
  | RoleContent
  | ProcessContent
  | GalleryContent
  | TechnicalContent
  | ResultsContent
  | CreditsContent;
