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

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async register(data: { email: string; password: string; confirmPassword: string }) {
    const response = await this.request<ApiResponse<{ user: UserAccount }>>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    return response.data;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<ApiResponse<{ user: UserAccount }>>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    return response.data;
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  // Project methods
  async getProjects() {
    return this.request<ApiResponse<{ projects: Project[]; meta: PaginationMeta }>>(
      '/api/projects'
    );
  }

  async createProject(data: { name: string; description?: string }) {
    return this.request<ApiResponse<{ project: Project }>>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProject(id: string) {
    return this.request<ApiResponse<{ project: Project }>>(`/api/projects/${id}`);
  }

  async updateProject(id: string, data: Partial<{ name: string; description: string }>) {
    return this.request<ApiResponse<{ project: Project }>>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string) {
    return this.request<ApiResponse<{ message: string }>>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Persona methods
  async getPersonas() {
    return this.request<ApiResponse<{ personas: Persona[]; meta: PaginationMeta }>>(
      '/api/personas'
    );
  }

  async createPersona(data: { displayName: string; manifest?: string; slug?: string }) {
    return this.request<ApiResponse<{ persona: Persona }>>('/api/personas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPersona(id: string) {
    return this.request<ApiResponse<{ persona: Persona }>>(`/api/personas/${id}`);
  }

  async updatePersona(
    id: string,
    data: Partial<{
      displayName: string;
      manifest?: string;
      settings?: Record<string, unknown>;
    }>
  ) {
    return this.request<ApiResponse<{ persona: Persona }>>(`/api/personas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePersona(id: string) {
    return this.request<ApiResponse<{ message: string }>>(`/api/personas/${id}`, {
      method: 'DELETE',
    });
  }

  // Persona-Project assignment methods
  async getPersonaProjects(personaId: string) {
    return this.request<ApiResponse<{ projects: PersonaProjectAssignment[]; meta: PaginationMeta }>>(
      `/api/personas/${personaId}/projects`
    );
  }

  async assignProjectToPersona(
    personaId: string,
    data: { projectId: string; displayOrder?: number; isVisible?: boolean }
  ) {
    return this.request<ApiResponse<{ assignment: PersonaProjectAssignment }>>(
      `/api/personas/${personaId}/projects`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async updateProjectAssignment(
    personaId: string,
    projectId: string,
    data: Partial<{ displayOrder: number; isVisible: boolean }>
  ) {
    return this.request<ApiResponse<{ assignment: PersonaProjectAssignment }>>(
      `/api/personas/${personaId}/projects/${projectId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async removeProjectFromPersona(personaId: string, projectId: string) {
    return this.request<ApiResponse<{ message: string }>>(
      `/api/personas/${personaId}/projects/${projectId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Persona public methods
  async getPublicPersona(slug: string) {
    return this.request<ApiResponse<{ persona: Persona }>>(`/api/public/${slug}`);
  }

  async publishPersona(personaId: string) {
    return this.request<ApiResponse<{ persona: Persona }>>(
      `/api/personas/${personaId}/publish`,
      {
        method: 'POST',
      }
    );
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();
