// Project entity types

import { ProjectStatus, ProjectType } from '../common/enums';
import type { PlaceholderContent, PlaceholderType } from './placeholder';

export interface Project {
  id: string;
  accountId: string;
  title: string;
  slug: string;
  type: ProjectType;
  content: ProjectContent;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface ProjectContent {
  placeholders: Placeholder[];
  metadata?: ProjectMetadata;
}

export interface Placeholder {
  id: string;
  type: PlaceholderType;
  order: number;
  enabled: boolean;
  content: PlaceholderContent;
}

export interface ProjectMetadata {
  role?: string;
  year?: number;
  duration?: string;
  industry?: string;
  client?: string;
  tools?: string[];
  collaborators?: string[];
}

export interface CreateProjectInput {
  title: string;
  slug: string;
  type: ProjectType;
  content?: ProjectContent;
}

export interface UpdateProjectInput {
  title?: string;
  slug?: string;
  content?: ProjectContent;
  status?: ProjectStatus;
}

export interface PersonaProject {
  id: string;
  personaId: string;
  projectId: string;
  displayOrder: number;
  isVisible: boolean;
}
