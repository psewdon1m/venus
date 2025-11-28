// Common enums used across the platform

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum ProjectStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export enum ProjectType {
  ALBUM = 'album',
  MAIN_PROJECT = 'main-project',
}

export enum PersonaVisibility {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private',
}

export enum ContactMethod {
  EMAIL = 'email',
  FORM = 'form',
  MESSENGER = 'messenger',
}

export enum PlaceholderType {
  COVER = 'cover',
  META = 'meta',
  CONTEXT = 'context',
  ROLE = 'role',
  PROCESS = 'process',
  GALLERY = 'gallery',
  TECHNICAL = 'technical',
  RESULTS = 'results',
  CREDITS = 'credits',
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

export enum CVTemplate {
  MINIMALIST = 'minimalist',
  MODERN = 'modern',
  CREATIVE = 'creative',
}

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}
