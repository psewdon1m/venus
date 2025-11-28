// API client for Venus Platform

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  }

  private clearAuthToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  }

  // Auth methods
  async register(data: { email: string; password: string; confirmPassword: string }) {
    const response = await this.request<{ data: { user: any; accessToken: string; refreshToken: string } }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    this.setAuthToken(response.data.accessToken);
    return response.data;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<{ data: { user: any; accessToken: string; refreshToken: string } }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    this.setAuthToken(response.data.accessToken);
    return response.data;
  }

  logout(): void {
    this.clearAuthToken();
  }

  // Project methods
  async getProjects() {
    return this.request<{ data: { projects: any[]; meta: any } }>('/api/projects');
  }

  async createProject(data: { name: string; description?: string }) {
    return this.request<{ data: { project: any } }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProject(id: string) {
    return this.request<{ data: { project: any } }>(`/api/projects/${id}`);
  }

  async updateProject(id: string, data: Partial<{ name: string; description: string }>) {
    return this.request<{ data: { project: any } }>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string) {
    return this.request<{ data: { message: string } }>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Persona methods
  async getPersonas() {
    return this.request<{ data: { personas: any[]; meta: any } }>('/api/personas');
  }

  async createPersona(data: { name: string; description?: string }) {
    return this.request<{ data: { persona: any } }>('/api/personas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPersona(id: string) {
    return this.request<{ data: { persona: any } }>(`/api/personas/${id}`);
  }

  async updatePersona(id: string, data: Partial<{ name: string; description: string }>) {
    return this.request<{ data: { persona: any } }>(`/api/personas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePersona(id: string) {
    return this.request<{ data: { message: string } }>(`/api/personas/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();
