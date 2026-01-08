const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiError {
  message: string;
  errors?: { field: string; message: string }[];
}

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.message || 'Request failed');
    }

    return data;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const result = await this.request<{
      data: {
        user: User;
        organization: Organization;
        accessToken: string;
        refreshToken: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return result.data;
  }

  async register(email: string, password: string, name: string, businessName: string) {
    const result = await this.request<{
      data: {
        user: User;
        organization: Organization;
        accessToken: string;
        refreshToken: string;
      };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, businessName }),
    });
    return result.data;
  }

  async refreshToken(refreshToken: string) {
    const result = await this.request<{
      data: { accessToken: string; refreshToken: string };
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    return result.data;
  }

  async logout(refreshToken: string) {
    await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getMe() {
    const result = await this.request<{
      data: { user: User; organization: Organization };
    }>('/auth/me');
    return result.data;
  }

  // Client endpoints
  async getClients(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    const result = await this.request<{
      data: Client[];
      meta: PaginationMeta;
    }>(`/clients${query ? `?${query}` : ''}`);
    return result;
  }

  async getClient(id: string) {
    const result = await this.request<{ data: ClientWithRelations }>(`/clients/${id}`);
    return result.data;
  }

  async createClient(data: CreateClientInput) {
    const result = await this.request<{ data: Client }>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async updateClient(id: string, data: UpdateClientInput) {
    const result = await this.request<{ data: Client }>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async deleteClient(id: string) {
    await this.request(`/clients/${id}`, { method: 'DELETE' });
  }
}

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  emailVerified: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientWithRelations extends Client {
  appointments: Appointment[];
  transactions: Transaction[];
}

export interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  service: { id: string; name: string };
  staff: { id: string; name: string };
}

export interface Transaction {
  id: string;
  type: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateClientInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface UpdateClientInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export const api = new ApiClient();
