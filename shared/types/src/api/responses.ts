// API Response types

import type { AccountWithoutPassword } from '../entities/account';
import type { CVGenerationResponse } from '../entities/cv';
import type { MediaFile, MediaUploadResponse } from '../entities/media';
import type { Persona, PersonaPublic } from '../entities/persona';
import type { Project } from '../entities/project';

// Generic response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Auth responses
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AccountWithoutPassword;
  expiresIn: number;
}

export interface RegisterResponse {
  user: AccountWithoutPassword;
  message: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// Account responses
export interface AccountResponse {
  account: AccountWithoutPassword;
}

// Persona responses
export interface PersonaResponse {
  persona: Persona;
}

export interface PersonaPublicResponse {
  persona: PersonaPublic;
  projects: Project[];
}

export interface PersonaListResponse {
  personas: PersonaPublic[];
  meta: PaginationMeta;
}

// Project responses
export interface ProjectResponse {
  project: Project;
}

export interface ProjectListResponse {
  projects: Project[];
  meta: PaginationMeta;
}

// Media responses
export interface MediaResponse {
  media: MediaFile;
}

export interface MediaListResponse {
  media: MediaFile[];
  meta: PaginationMeta;
}

export type { MediaUploadResponse };

// CV responses
  export type { CVGenerationResponse };

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  checks?: Record<string, boolean>;
}
