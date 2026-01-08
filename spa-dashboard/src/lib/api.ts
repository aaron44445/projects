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

  // Appointment endpoints
  async getAppointments(params?: {
    page?: number;
    limit?: number;
    staffId?: string;
    clientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.staffId) searchParams.set('staffId', params.staffId);
    if (params?.clientId) searchParams.set('clientId', params.clientId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);

    const query = searchParams.toString();
    const result = await this.request<{
      data: AppointmentWithRelations[];
      meta: PaginationMeta;
    }>(`/appointments${query ? `?${query}` : ''}`);
    return result;
  }

  async getAppointment(id: string) {
    const result = await this.request<{ data: AppointmentWithRelations }>(`/appointments/${id}`);
    return result.data;
  }

  async createAppointment(data: CreateAppointmentInput) {
    const result = await this.request<{ data: AppointmentWithRelations }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async updateAppointment(id: string, data: UpdateAppointmentInput) {
    const result = await this.request<{ data: AppointmentWithRelations }>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus) {
    const result = await this.request<{ data: AppointmentWithRelations }>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return result.data;
  }

  async deleteAppointment(id: string) {
    await this.request(`/appointments/${id}`, { method: 'DELETE' });
  }

  // Service endpoints
  async getServices(params?: { page?: number; limit?: number; active?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.active) searchParams.set('active', 'true');

    const query = searchParams.toString();
    const result = await this.request<{
      data: Service[];
      meta: PaginationMeta;
    }>(`/services${query ? `?${query}` : ''}`);
    return result;
  }

  async getService(id: string) {
    const result = await this.request<{ data: ServiceWithRelations }>(`/services/${id}`);
    return result.data;
  }

  async createService(data: CreateServiceInput) {
    const result = await this.request<{ data: Service }>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async updateService(id: string, data: UpdateServiceInput) {
    const result = await this.request<{ data: Service }>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async deleteService(id: string) {
    await this.request(`/services/${id}`, { method: 'DELETE' });
  }

  // Staff endpoints
  async getStaff(params?: { page?: number; limit?: number; active?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.active) searchParams.set('active', 'true');

    const query = searchParams.toString();
    const result = await this.request<{
      data: StaffWithRelations[];
      meta: PaginationMeta;
    }>(`/staff${query ? `?${query}` : ''}`);
    return result;
  }

  async getStaffMember(id: string) {
    const result = await this.request<{ data: StaffWithRelations }>(`/staff/${id}`);
    return result.data;
  }

  async createStaff(data: CreateStaffInput) {
    const result = await this.request<{ data: StaffWithRelations }>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async updateStaff(id: string, data: UpdateStaffInput) {
    const result = await this.request<{ data: StaffWithRelations }>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async deleteStaff(id: string) {
    await this.request(`/staff/${id}`, { method: 'DELETE' });
  }

  // Product endpoints
  async getProducts(params?: { page?: number; limit?: number; active?: boolean; lowStock?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.active) searchParams.set('active', 'true');
    if (params?.lowStock) searchParams.set('lowStock', 'true');

    const query = searchParams.toString();
    const result = await this.request<{
      data: Product[];
      meta: PaginationMeta;
    }>(`/products${query ? `?${query}` : ''}`);
    return result;
  }

  async getProduct(id: string) {
    const result = await this.request<{ data: Product }>(`/products/${id}`);
    return result.data;
  }

  async createProduct(data: CreateProductInput) {
    const result = await this.request<{ data: Product }>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async updateProduct(id: string, data: UpdateProductInput) {
    const result = await this.request<{ data: Product }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async adjustProductQuantity(id: string, adjustment: number, reason?: string) {
    const result = await this.request<{ data: Product }>(`/products/${id}/quantity`, {
      method: 'PATCH',
      body: JSON.stringify({ adjustment, reason }),
    });
    return result.data;
  }

  async deleteProduct(id: string) {
    await this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // Transaction endpoints
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    clientId?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.clientId) searchParams.set('clientId', params.clientId);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);

    const query = searchParams.toString();
    const result = await this.request<{
      data: TransactionWithRelations[];
      meta: PaginationMeta;
    }>(`/transactions${query ? `?${query}` : ''}`);
    return result;
  }

  async getTransaction(id: string) {
    const result = await this.request<{ data: TransactionWithRelations }>(`/transactions/${id}`);
    return result.data;
  }

  async createTransaction(data: CreateTransactionInput) {
    const result = await this.request<{ data: TransactionWithRelations }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async getDailySummary(date?: string) {
    const query = date ? `?date=${date}` : '';
    const result = await this.request<{ data: DailySummary }>(`/transactions/summary${query}`);
    return result.data;
  }

  // Marketplace Profile endpoints
  async getMarketplaceProfile() {
    const result = await this.request<MarketplaceProfile>('/marketplace/profile');
    return result;
  }

  async updateMarketplaceProfile(data: UpdateMarketplaceProfileInput) {
    const result = await this.request<MarketplaceProfileData>('/marketplace/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result;
  }

  async publishToMarketplace() {
    const result = await this.request<{
      message: string;
      profileUrl: string;
      id: string;
      name: string;
      isPublished: boolean;
      profileSlug: string;
    }>('/marketplace/publish', {
      method: 'POST',
    });
    return result;
  }

  async unpublishFromMarketplace() {
    const result = await this.request<{
      message: string;
      id: string;
      name: string;
      isPublished: boolean;
      profileSlug: string;
    }>('/marketplace/unpublish', {
      method: 'POST',
    });
    return result;
  }

  async getMarketplaceStats() {
    const result = await this.request<MarketplaceStats>('/marketplace/stats');
    return result;
  }

  // Marketplace Bookings
  async getMarketplaceBookings(params?: { status?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    const result = await this.request<{
      bookings: MarketplaceBooking[];
      pagination: PaginationMeta;
    }>(`/marketplace/bookings${query ? `?${query}` : ''}`);
    return result;
  }

  async updateMarketplaceBookingStatus(id: string, status: string) {
    const result = await this.request<{ id: string; status: string; confirmationNumber: string }>(
      `/marketplace/bookings/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
    return result;
  }

  // Marketplace Reviews
  async getMarketplaceReviews(params?: { status?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    const result = await this.request<{
      reviews: MarketplaceReview[];
      pagination: PaginationMeta;
    }>(`/marketplace/reviews${query ? `?${query}` : ''}`);
    return result;
  }

  async updateMarketplaceReviewStatus(id: string, status: string) {
    const result = await this.request<{ id: string; status: string }>(
      `/marketplace/reviews/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
    return result;
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

// Appointment types
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface AppointmentWithRelations {
  id: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: string; name: string; email: string | null; phone: string | null };
  staff: { id: string; name: string; title: string | null };
  service: { id: string; name: string; durationMinutes: number; price: number };
}

export interface CreateAppointmentInput {
  clientId: string;
  staffId: string;
  serviceId: string;
  startTime: string;
  notes?: string | null;
}

export interface UpdateAppointmentInput {
  clientId?: string;
  staffId?: string;
  serviceId?: string;
  startTime?: string;
  notes?: string | null;
}

// Service types
export interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { appointments: number };
}

export interface ServiceWithRelations extends Service {
  staffServices: { staff: { id: string; name: string } }[];
}

export interface CreateServiceInput {
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  isActive?: boolean;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string | null;
  durationMinutes?: number;
  price?: number;
  isActive?: boolean;
}

// Staff types
export interface Staff {
  id: string;
  name: string;
  title: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffWithRelations extends Staff {
  user: { id: string; email: string; name: string } | null;
  staffServices: { service: { id: string; name: string } }[];
  appointments?: AppointmentWithRelations[];
}

export interface CreateStaffInput {
  name: string;
  title?: string | null;
  isActive?: boolean;
  userId?: string | null;
  serviceIds?: string[];
}

export interface UpdateStaffInput {
  name?: string;
  title?: string | null;
  isActive?: boolean;
  userId?: string | null;
  serviceIds?: string[];
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  cost: number | null;
  quantity: number;
  reorderLevel: number;
  isActive: boolean;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description?: string | null;
  sku?: string | null;
  price: number;
  cost?: number | null;
  quantity?: number;
  reorderLevel?: number;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string | null;
  sku?: string | null;
  price?: number;
  cost?: number | null;
  quantity?: number;
  reorderLevel?: number;
  isActive?: boolean;
}

// Transaction types
export type TransactionType = 'SERVICE' | 'PRODUCT' | 'REFUND';
export type PaymentMethod = 'CASH' | 'CARD' | 'OTHER';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REFUNDED';

export interface TransactionItem {
  type: 'service' | 'product';
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface TransactionWithRelations {
  id: string;
  type: TransactionType;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  createdAt: string;
  client: { id: string; name: string; email: string | null } | null;
  appointment: { id: string; startTime: string } | null;
}

export interface CreateTransactionInput {
  clientId?: string | null;
  appointmentId?: string | null;
  type: TransactionType;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status?: TransactionStatus;
}

export interface DailySummary {
  date: string;
  transactionCount: number;
  totalRevenue: number;
  totalTax: number;
  byType: {
    SERVICE: { count: number; total: number };
    PRODUCT: { count: number; total: number };
    REFUND: { count: number; total: number };
  };
  byPaymentMethod: {
    CASH: { count: number; total: number };
    CARD: { count: number; total: number };
    OTHER: { count: number; total: number };
  };
}

// Marketplace types
export interface MarketplaceProfileData {
  id: string;
  name: string;
  isPublished: boolean;
  profileSlug: string | null;
  description: string | null;
  shortDescription: string | null;
  phone: string | null;
  address: string | null;
  businessHours: Record<string, { open: string; close: string } | null> | null;
  logo: string | null;
  coverImage: string | null;
  galleryImages: string[];
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  amenities: string[];
  priceRange: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  averageRating: number;
  reviewCount: number;
}

export interface MarketplaceProfile extends MarketplaceProfileData {
  requirements: {
    profileSlug: boolean;
    description: boolean;
    hasImage: boolean;
    hasService: boolean;
    hasBusinessHours: boolean;
  };
  isReady: boolean;
  marketplaceBookings: number;
  activeServices: number;
}

export interface UpdateMarketplaceProfileInput {
  profileSlug?: string;
  description?: string;
  shortDescription?: string;
  phone?: string;
  address?: string;
  businessHours?: Record<string, { open: string; close: string } | null>;
  logo?: string | null;
  coverImage?: string | null;
  galleryImages?: string[];
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  amenities?: string[];
  priceRange?: string | null;
  metaTitle?: string;
  metaDescription?: string;
}

export interface MarketplaceStats {
  bookings: {
    total: number;
    pending: number;
    recent: {
      id: string;
      customerName: string;
      dateTime: string;
      status: string;
      totalPrice: number;
      service: { name: string };
      createdAt: string;
    }[];
  };
  reviews: {
    average: number;
    count: number;
  };
  revenue: {
    total: number;
  };
}

export interface MarketplaceBooking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  dateTime: string;
  duration: number;
  totalPrice: number;
  status: string;
  confirmationNumber: string;
  notes: string | null;
  createdAt: string;
  service: { id: string; name: string };
  staff: { id: string; name: string } | null;
}

export interface MarketplaceReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  reviewerName: string;
  reviewerEmail: string | null;
  isVerified: boolean;
  status: string;
  createdAt: string;
}

export const api = new ApiClient();
