// API client for Venus Platform

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface PlaceholderContent {
  image?: string;
  subtitle?: string;
  [key: string]: unknown;
}

export interface Placeholder {
  id: string;
  type: string;
  order: number;
  content: PlaceholderContent;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  content?: {
    placeholders: Placeholder[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Persona {
  id: string;
  slug: string;
  displayName: string;
  manifest?: string | null;
  createdAt: string;
  updatedAt: string;
  isPublic?: boolean;
  publicSlug?: string | null;
  projects?: Project[];
}

export interface PersonaProjectAssignment extends Project {
  personaProjectId?: string;
  displayOrder?: number;
  isVisible?: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total?: number;
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

type ApiResponse<T> = { data: T };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const extractErrorMessage = (value: unknown): string | null => {
  if (!isRecord(value)) {
    return null;
  }

  const message = value.message;
  return typeof message === 'string' ? message : null;
};

const hasSerializableBody = (response: Response): boolean => {
  if (response.status === 204) {
    return false;
  }

  const contentLength = response.headers.get('content-length');
  return contentLength !== '0';
};

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include httpOnly cookies
      ...options,
    };

    const response = await fetch(url, config);
    let payload: unknown = undefined;

    if (hasSerializableBody(response)) {
      try {
        payload = await response.json();
      } catch {
        payload = undefined;
      }
    }

    if (!response.ok) {
      const message = extractErrorMessage(payload) ?? `HTTP ${response.status}`;
      throw new Error(message);
    }

    return payload as T;
  }

  // Auth methods
  async register(data: {
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ user: UserAccount }> {
    const response = await this.request<ApiResponse<{ user: UserAccount }>>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.data;
  }

  async login(data: { email: string; password: string }): Promise<{ user: UserAccount }> {
    const response = await this.request<ApiResponse<{ user: UserAccount }>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.data;
  }

  async logout(): Promise<void> {
    await this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<{ user: UserAccount }> {
    const response = await this.request<ApiResponse<{ user: UserAccount }>>('/api/auth/me');
    return response.data;
  }

  // Project methods
  async getProjects(): Promise<{ projects: Project[]; meta: PaginationMeta }> {
    const response =
      await this.request<ApiResponse<{ projects: Project[]; meta: PaginationMeta }>>(
        '/api/projects'
      );
    return response.data;
  }

  async createProject(data: { name: string; description?: string }): Promise<{ project: Project }> {
    const response = await this.request<ApiResponse<{ project: Project }>>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getProject(id: string): Promise<{ project: Project }> {
    const response = await this.request<ApiResponse<{ project: Project }>>(`/api/projects/${id}`);
    return response.data;
  }

  async updateProject(
    id: string,
    data: Partial<{ name: string; description: string }>
  ): Promise<{ project: Project }> {
    const response = await this.request<ApiResponse<{ project: Project }>>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    const response = await this.request<ApiResponse<{ message: string }>>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
    return response.data;
  }

  // Persona methods
  async getPersonas(): Promise<{ personas: Persona[]; meta: PaginationMeta }> {
    const response =
      await this.request<ApiResponse<{ personas: Persona[]; meta: PaginationMeta }>>(
        '/api/personas'
      );
    return response.data;
  }

  async createPersona(data: {
    displayName: string;
    manifest?: string;
    slug?: string;
  }): Promise<{ persona: Persona }> {
    const response = await this.request<ApiResponse<{ persona: Persona }>>('/api/personas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getPersona(id: string): Promise<{ persona: Persona }> {
    const response = await this.request<ApiResponse<{ persona: Persona }>>(`/api/personas/${id}`);
    return response.data;
  }

  async updatePersona(
    id: string,
    data: Partial<{
      displayName: string;
      manifest?: string;
      settings?: Record<string, unknown>;
    }>
  ): Promise<{ persona: Persona }> {
    const response = await this.request<ApiResponse<{ persona: Persona }>>(`/api/personas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deletePersona(id: string): Promise<{ message: string }> {
    const response = await this.request<ApiResponse<{ message: string }>>(`/api/personas/${id}`, {
      method: 'DELETE',
    });
    return response.data;
  }

  // Persona-Project assignment methods
  async getPersonaProjects(
    personaId: string
  ): Promise<{ projects: PersonaProjectAssignment[]; meta: PaginationMeta }> {
    const response = await this.request<
      ApiResponse<{ projects: PersonaProjectAssignment[]; meta: PaginationMeta }>
    >(`/api/personas/${personaId}/projects`);

    return response.data;
  }

  async assignProjectToPersona(
    personaId: string,
    data: { projectId: string; displayOrder?: number; isVisible?: boolean }
  ): Promise<{ assignment: PersonaProjectAssignment }> {
    const response = await this.request<ApiResponse<{ assignment: PersonaProjectAssignment }>>(
      `/api/personas/${personaId}/projects`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    return response.data;
  }

  async updateProjectAssignment(
    personaId: string,
    projectId: string,
    data: Partial<{ displayOrder: number; isVisible: boolean }>
  ): Promise<{ assignment: PersonaProjectAssignment }> {
    const response = await this.request<ApiResponse<{ assignment: PersonaProjectAssignment }>>(
      `/api/personas/${personaId}/projects/${projectId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  async removeProjectFromPersona(
    personaId: string,
    projectId: string
  ): Promise<{ message: string }> {
    const response = await this.request<ApiResponse<{ message: string }>>(
      `/api/personas/${personaId}/projects/${projectId}`,
      {
        method: 'DELETE',
      }
    );
    return response.data;
  }

  // Persona public methods
  async getPublicPersona(slug: string): Promise<{ persona: Persona }> {
    const response = await this.request<ApiResponse<{ persona: Persona }>>(`/api/public/${slug}`);
    return response.data;
  }

  async publishPersona(personaId: string): Promise<{ persona: Persona }> {
    const response = await this.request<ApiResponse<{ persona: Persona }>>(
      `/api/personas/${personaId}/publish`,
      {
        method: 'POST',
      }
    );
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/health');
  }
}

export const apiClient = new ApiClient();
