# Page API Connections Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect all frontend pages to the backend API, replacing mock data with real API calls.

**Architecture:** Each page will use existing hooks (useClients, useServices, etc.) and the AuthContext. Pages will show loading states while fetching and handle errors gracefully.

**Tech Stack:** React hooks, AuthContext, existing API client, Lucide icons for loading states.

---

## Task 1: Connect Login Page to API

**Files:**
- Modify: `apps/web/src/app/login/page.tsx:18-31`

**Step 1: Import useAuth hook**

Add at the top of the file after existing imports:

```tsx
import { useAuth } from '@/contexts/AuthContext';
```

**Step 2: Use the login function from useAuth**

Replace the handleSubmit function (lines 18-31) with:

```tsx
const { login, isLoading: authLoading } = useAuth();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    await login(formData.email, formData.password);
    router.push('/dashboard');
  } catch (err) {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('Invalid email or password. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
};
```

**Step 3: Test manually**

Run: `cd apps/web && npm run dev`
Test: Navigate to /login, enter credentials, verify API is called (check network tab)

**Step 4: Commit**

```bash
git add apps/web/src/app/login/page.tsx
git commit -m "feat: connect login page to auth API"
```

---

## Task 2: Connect Signup Page to API

**Files:**
- Modify: `apps/web/src/app/signup/page.tsx`

**Step 1: Import useAuth hook**

Add after existing imports:

```tsx
import { useAuth } from '@/contexts/AuthContext';
```

**Step 2: Update the form submission**

Find the handleSubmit function and update to use register:

```tsx
const { register } = useAuth();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    await register(
      formData.salonName,
      formData.email,
      formData.password,
      formData.phone,
      'America/Chicago'
    );
    router.push('/dashboard');
  } catch (err) {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('Registration failed. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
};
```

**Step 3: Commit**

```bash
git add apps/web/src/app/signup/page.tsx
git commit -m "feat: connect signup page to auth API"
```

---

## Task 3: Create Dashboard Data Hook

**Files:**
- Create: `apps/web/src/hooks/useDashboard.ts`

**Step 1: Create the dashboard hook**

```ts
import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

export interface DashboardStats {
  todayRevenue: number;
  revenueChange: number;
  appointmentsToday: number;
  appointmentsChange: number;
  newClients: number;
  newClientsChange: number;
  avgServiceTime: number;
  serviceTimeChange: number;
}

export interface TodayAppointment {
  id: string;
  time: string;
  client: { firstName: string; lastName: string };
  service: { name: string };
  staff: { firstName: string; lastName: string };
  status: string;
  duration: number;
}

interface DashboardData {
  stats: DashboardStats;
  todayAppointments: TodayAppointment[];
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statsResponse, appointmentsResponse] = await Promise.all([
        api.get<DashboardStats>('/dashboard/stats'),
        api.get<TodayAppointment[]>('/dashboard/today'),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
      if (appointmentsResponse.success && appointmentsResponse.data) {
        setTodayAppointments(appointmentsResponse.data);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    stats,
    todayAppointments,
    isLoading,
    error,
    refresh: fetchDashboard,
  };
}
```

**Step 2: Export from hooks index**

Add to `apps/web/src/hooks/index.ts`:

```ts
export { useDashboard } from './useDashboard';
export type { DashboardStats, TodayAppointment } from './useDashboard';
```

**Step 3: Commit**

```bash
git add apps/web/src/hooks/useDashboard.ts apps/web/src/hooks/index.ts
git commit -m "feat: add useDashboard hook for dashboard API"
```

---

## Task 4: Connect Dashboard Page to API

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`

**Step 1: Import the dashboard hook and add loading state**

Add imports:

```tsx
import { useDashboard } from '@/hooks';
import { Loader2 } from 'lucide-react';
```

**Step 2: Use the hook and add loading/error UI**

Inside the component, add:

```tsx
const { stats, todayAppointments, isLoading, error, refresh } = useDashboard();
const { user } = useAuth();
```

Add import for useAuth:

```tsx
import { useAuth } from '@/contexts/AuthContext';
```

**Step 3: Replace hardcoded stats with dynamic data**

Replace the stats array with a function that uses real data:

```tsx
const dashboardStats = stats ? [
  {
    label: "Today's Revenue",
    value: `$${stats.todayRevenue.toLocaleString()}`,
    change: `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange}%`,
    trend: stats.revenueChange >= 0 ? 'up' : 'down',
    icon: DollarSign,
    bgColor: 'bg-sage',
  },
  {
    label: 'Appointments Today',
    value: stats.appointmentsToday.toString(),
    change: `${stats.appointmentsChange >= 0 ? '+' : ''}${stats.appointmentsChange}`,
    trend: stats.appointmentsChange >= 0 ? 'up' : 'down',
    icon: CalendarCheck,
    bgColor: 'bg-lavender',
  },
  {
    label: 'New Clients',
    value: stats.newClients.toString(),
    change: `${stats.newClientsChange >= 0 ? '+' : ''}${stats.newClientsChange}`,
    trend: stats.newClientsChange >= 0 ? 'up' : 'down',
    icon: UserCheck,
    bgColor: 'bg-peach',
  },
  {
    label: 'Avg. Service Time',
    value: `${stats.avgServiceTime}m`,
    change: `${stats.serviceTimeChange >= 0 ? '+' : ''}${stats.serviceTimeChange}m`,
    trend: stats.serviceTimeChange <= 0 ? 'up' : 'down',
    icon: Clock,
    bgColor: 'bg-mint',
  },
] : [];
```

**Step 4: Add loading state in render**

Wrap the dashboard content with loading check:

```tsx
{isLoading ? (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 text-sage animate-spin" />
  </div>
) : error ? (
  <div className="bg-error/10 border border-error/20 rounded-xl p-6 text-center">
    <p className="text-error font-medium">{error}</p>
    <button onClick={refresh} className="mt-4 text-sage hover:underline">
      Try again
    </button>
  </div>
) : (
  // existing dashboard content using dashboardStats instead of stats
)}
```

**Step 5: Update welcome message to use real user name**

```tsx
<p className="text-sm text-charcoal/60">Welcome back, {user?.firstName || 'there'}</p>
```

**Step 6: Commit**

```bash
git add apps/web/src/app/dashboard/page.tsx
git commit -m "feat: connect dashboard page to API with loading states"
```

---

## Task 5: Connect Clients Page to API

**Files:**
- Modify: `apps/web/src/app/clients/page.tsx`

**Step 1: Import hooks**

```tsx
import { useClients, Client } from '@/hooks';
import { Loader2 } from 'lucide-react';
```

**Step 2: Use the hook**

Inside the component:

```tsx
const {
  clients,
  isLoading,
  error,
  createClient,
  updateClient,
  deleteClient,
  refresh
} = useClients();
```

**Step 3: Replace mock clients with real data**

Remove the hardcoded `clients` array and use the data from the hook.

**Step 4: Add loading state**

```tsx
{isLoading ? (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 text-sage animate-spin" />
  </div>
) : (
  // existing clients list
)}
```

**Step 5: Wire up create/edit/delete handlers**

```tsx
const handleCreateClient = async (data: CreateClientInput) => {
  try {
    await createClient(data);
    setShowAddModal(false);
  } catch (err) {
    // handle error
  }
};
```

**Step 6: Commit**

```bash
git add apps/web/src/app/clients/page.tsx
git commit -m "feat: connect clients page to API"
```

---

## Task 6: Connect Services Page to API

**Files:**
- Modify: `apps/web/src/app/services/page.tsx`

**Step 1: Import hooks**

```tsx
import { useServices, Service, ServiceCategory } from '@/hooks';
import { Loader2 } from 'lucide-react';
```

**Step 2: Use the hook and replace mock data**

```tsx
const {
  services,
  categories,
  isLoading,
  error,
  createService,
  updateService,
  deleteService,
  createCategory,
  refresh
} = useServices();
```

**Step 3: Add loading state and wire up handlers**

Same pattern as clients page.

**Step 4: Commit**

```bash
git add apps/web/src/app/services/page.tsx
git commit -m "feat: connect services page to API"
```

---

## Task 7: Connect Staff Page to API

**Files:**
- Modify: `apps/web/src/app/staff/page.tsx`

**Step 1: Import hooks**

```tsx
import { useStaff, StaffMember } from '@/hooks';
import { Loader2 } from 'lucide-react';
```

**Step 2: Use the hook**

```tsx
const {
  staff,
  isLoading,
  error,
  createStaff,
  updateStaff,
  deleteStaff,
  setAvailability,
  setStaffServices,
  refresh
} = useStaff();
```

**Step 3: Replace mock data and add loading state**

**Step 4: Commit**

```bash
git add apps/web/src/app/staff/page.tsx
git commit -m "feat: connect staff page to API"
```

---

## Task 8: Connect Calendar Page to API

**Files:**
- Modify: `apps/web/src/app/calendar/page.tsx`

**Step 1: Import hooks**

```tsx
import { useAppointments, useClients, useServices, useStaff } from '@/hooks';
import { Loader2 } from 'lucide-react';
```

**Step 2: Use hooks**

```tsx
const { appointments, isLoading, createAppointment, updateAppointment, cancelAppointment } = useAppointments();
const { clients } = useClients();
const { services } = useServices();
const { staff } = useStaff();
```

**Step 3: Replace mock data, add loading state, wire up CRUD**

**Step 4: Commit**

```bash
git add apps/web/src/app/calendar/page.tsx
git commit -m "feat: connect calendar page to API"
```

---

## Task 9: Create Marketing Hook

**Files:**
- Create: `apps/web/src/hooks/useMarketing.ts`

**Step 1: Create the marketing hook**

```ts
import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent';
  sentAt?: string;
  scheduledFor?: string;
  recipientCount: number;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
}

export interface CreateCampaignInput {
  name: string;
  subject: string;
  body: string;
  segment?: string;
}

export function useMarketing() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Campaign[]>('/marketing/campaigns');
      if (response.success && response.data) {
        setCampaigns(response.data);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load campaigns');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = async (data: CreateCampaignInput) => {
    const response = await api.post<Campaign>('/marketing/campaigns', data);
    if (response.success && response.data) {
      setCampaigns(prev => [...prev, response.data!]);
      return response.data;
    }
    throw new Error('Failed to create campaign');
  };

  const sendCampaign = async (id: string) => {
    const response = await api.post<Campaign>(`/marketing/campaigns/${id}/send`);
    if (response.success && response.data) {
      setCampaigns(prev => prev.map(c => c.id === id ? response.data! : c));
    }
  };

  const deleteCampaign = async (id: string) => {
    await api.delete(`/marketing/campaigns/${id}`);
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  return {
    campaigns,
    isLoading,
    error,
    createCampaign,
    sendCampaign,
    deleteCampaign,
    refresh: fetchCampaigns,
  };
}
```

**Step 2: Export from index**

**Step 3: Commit**

```bash
git add apps/web/src/hooks/useMarketing.ts apps/web/src/hooks/index.ts
git commit -m "feat: add useMarketing hook"
```

---

## Task 10: Connect Marketing Page to API

**Files:**
- Modify: `apps/web/src/app/marketing/page.tsx`

**Step 1: Import and use the hook**

**Step 2: Replace mock data with real campaigns**

**Step 3: Add loading state**

**Step 4: Commit**

```bash
git add apps/web/src/app/marketing/page.tsx
git commit -m "feat: connect marketing page to API"
```

---

## Task 11: Create Reviews Hook

**Files:**
- Create: `apps/web/src/hooks/useReviews.ts`

**Step 1: Create the reviews hook**

```ts
import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

export interface Review {
  id: string;
  clientId: string;
  client: { firstName: string; lastName: string };
  rating: number;
  comment: string;
  response?: string;
  createdAt: string;
  isPublic: boolean;
}

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Review[]>('/reviews');
      if (response.success && response.data) {
        setReviews(response.data);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load reviews');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const respondToReview = async (id: string, response: string) => {
    const result = await api.patch<Review>(`/reviews/${id}/respond`, { response });
    if (result.success && result.data) {
      setReviews(prev => prev.map(r => r.id === id ? result.data! : r));
    }
  };

  const togglePublic = async (id: string, isPublic: boolean) => {
    const result = await api.patch<Review>(`/reviews/${id}`, { isPublic });
    if (result.success && result.data) {
      setReviews(prev => prev.map(r => r.id === id ? result.data! : r));
    }
  };

  return {
    reviews,
    isLoading,
    error,
    respondToReview,
    togglePublic,
    refresh: fetchReviews,
  };
}
```

**Step 2: Export from index**

**Step 3: Commit**

```bash
git add apps/web/src/hooks/useReviews.ts apps/web/src/hooks/index.ts
git commit -m "feat: add useReviews hook"
```

---

## Task 12: Connect Reviews Page to API

**Files:**
- Modify: `apps/web/src/app/reviews/page.tsx`

Follow same pattern: import hook, replace mock data, add loading state.

**Commit:**

```bash
git add apps/web/src/app/reviews/page.tsx
git commit -m "feat: connect reviews page to API"
```

---

## Task 13: Create Gift Cards Hook

**Files:**
- Create: `apps/web/src/hooks/useGiftCards.ts`

**Step 1: Create the hook**

```ts
import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

export interface GiftCard {
  id: string;
  code: string;
  amount: number;
  balance: number;
  purchaserEmail: string;
  recipientEmail: string;
  recipientName?: string;
  message?: string;
  status: 'active' | 'redeemed' | 'expired';
  purchasedAt: string;
  expiresAt?: string;
}

export interface CreateGiftCardInput {
  amount: number;
  purchaserEmail: string;
  recipientEmail: string;
  recipientName?: string;
  message?: string;
}

export function useGiftCards() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGiftCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<GiftCard[]>('/gift-cards');
      if (response.success && response.data) {
        setGiftCards(response.data);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load gift cards');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGiftCards();
  }, [fetchGiftCards]);

  const createGiftCard = async (data: CreateGiftCardInput) => {
    const response = await api.post<GiftCard>('/gift-cards', data);
    if (response.success && response.data) {
      setGiftCards(prev => [...prev, response.data!]);
      return response.data;
    }
    throw new Error('Failed to create gift card');
  };

  const redeemGiftCard = async (code: string, amount: number) => {
    const response = await api.post<GiftCard>(`/gift-cards/redeem`, { code, amount });
    if (response.success && response.data) {
      setGiftCards(prev => prev.map(gc => gc.code === code ? response.data! : gc));
      return response.data;
    }
    throw new Error('Failed to redeem gift card');
  };

  return {
    giftCards,
    isLoading,
    error,
    createGiftCard,
    redeemGiftCard,
    refresh: fetchGiftCards,
  };
}
```

**Step 2: Export from index**

**Step 3: Commit**

```bash
git add apps/web/src/hooks/useGiftCards.ts apps/web/src/hooks/index.ts
git commit -m "feat: add useGiftCards hook"
```

---

## Task 14: Connect Gift Cards Page to API

**Files:**
- Modify: `apps/web/src/app/gift-cards/page.tsx`

Follow same pattern.

**Commit:**

```bash
git add apps/web/src/app/gift-cards/page.tsx
git commit -m "feat: connect gift cards page to API"
```

---

## Task 15: Create Packages Hook

**Files:**
- Create: `apps/web/src/hooks/usePackages.ts`

**Step 1: Create the hook**

```ts
import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

export interface Package {
  id: string;
  name: string;
  description?: string;
  services: { serviceId: string; quantity: number }[];
  price: number;
  validityDays: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePackageInput {
  name: string;
  description?: string;
  services: { serviceId: string; quantity: number }[];
  price: number;
  validityDays: number;
}

export function usePackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Package[]>('/packages');
      if (response.success && response.data) {
        setPackages(response.data);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load packages');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const createPackage = async (data: CreatePackageInput) => {
    const response = await api.post<Package>('/packages', data);
    if (response.success && response.data) {
      setPackages(prev => [...prev, response.data!]);
      return response.data;
    }
    throw new Error('Failed to create package');
  };

  const updatePackage = async (id: string, data: Partial<CreatePackageInput>) => {
    const response = await api.patch<Package>(`/packages/${id}`, data);
    if (response.success && response.data) {
      setPackages(prev => prev.map(p => p.id === id ? response.data! : p));
      return response.data;
    }
    throw new Error('Failed to update package');
  };

  const deletePackage = async (id: string) => {
    await api.delete(`/packages/${id}`);
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  return {
    packages,
    isLoading,
    error,
    createPackage,
    updatePackage,
    deletePackage,
    refresh: fetchPackages,
  };
}
```

**Step 2: Export from index**

**Step 3: Commit**

```bash
git add apps/web/src/hooks/usePackages.ts apps/web/src/hooks/index.ts
git commit -m "feat: add usePackages hook"
```

---

## Task 16: Connect Packages Page to API

**Files:**
- Modify: `apps/web/src/app/packages/page.tsx`

Follow same pattern.

**Commit:**

```bash
git add apps/web/src/app/packages/page.tsx
git commit -m "feat: connect packages page to API"
```

---

## Task 17: Create Settings/Salon Hook

**Files:**
- Create: `apps/web/src/hooks/useSalon.ts`

**Step 1: Create the hook**

```ts
import { useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface SalonSettings {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  timezone: string;
  website?: string;
  description?: string;
}

export interface SalonFeatures {
  plan: string;
  features: string[];
}

export function useSalon() {
  const { salon } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSalon = useCallback(async (data: Partial<SalonSettings>) => {
    setIsUpdating(true);
    setError(null);
    try {
      const response = await api.patch('/salon', data);
      if (response.success) {
        // The AuthContext will need to refresh to get updated salon data
        return response.data;
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update salon settings');
      }
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const getFeatures = useCallback(async () => {
    const response = await api.get<SalonFeatures>('/salon/features');
    return response.data;
  }, []);

  return {
    salon,
    isUpdating,
    error,
    updateSalon,
    getFeatures,
  };
}
```

**Step 2: Export from index**

**Step 3: Commit**

```bash
git add apps/web/src/hooks/useSalon.ts apps/web/src/hooks/index.ts
git commit -m "feat: add useSalon hook"
```

---

## Task 18: Connect Settings Page to API

**Files:**
- Modify: `apps/web/src/app/settings/page.tsx`

**Step 1: Import hooks**

```tsx
import { useSalon } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
```

**Step 2: Use the hooks and wire up save handlers**

**Step 3: Commit**

```bash
git add apps/web/src/app/settings/page.tsx
git commit -m "feat: connect settings page to API"
```

---

## Task 19: Add Auth Guard Component

**Files:**
- Create: `apps/web/src/components/AuthGuard.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-8 h-8 text-sage animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/AuthGuard.tsx
git commit -m "feat: add AuthGuard component for protected routes"
```

---

## Task 20: Wrap Protected Pages with AuthGuard

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/app/calendar/page.tsx`
- Modify: `apps/web/src/app/clients/page.tsx`
- Modify: `apps/web/src/app/services/page.tsx`
- Modify: `apps/web/src/app/staff/page.tsx`
- Modify: `apps/web/src/app/settings/page.tsx`
- Modify: `apps/web/src/app/marketing/page.tsx`
- Modify: `apps/web/src/app/reviews/page.tsx`
- Modify: `apps/web/src/app/gift-cards/page.tsx`
- Modify: `apps/web/src/app/packages/page.tsx`

**Step 1: For each page, wrap the return with AuthGuard**

```tsx
import { AuthGuard } from '@/components/AuthGuard';

export default function DashboardPage() {
  // ... existing code

  return (
    <AuthGuard>
      {/* existing JSX */}
    </AuthGuard>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/app/dashboard/page.tsx apps/web/src/app/calendar/page.tsx apps/web/src/app/clients/page.tsx apps/web/src/app/services/page.tsx apps/web/src/app/staff/page.tsx apps/web/src/app/settings/page.tsx apps/web/src/app/marketing/page.tsx apps/web/src/app/reviews/page.tsx apps/web/src/app/gift-cards/page.tsx apps/web/src/app/packages/page.tsx
git commit -m "feat: protect all dashboard pages with AuthGuard"
```

---

## Task 21: Create Reusable Loading Skeleton Components

**Files:**
- Create: `apps/web/src/components/LoadingSkeleton.tsx`

**Step 1: Create skeleton components**

```tsx
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-border animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-charcoal/10 rounded-xl" />
        <div className="w-12 h-4 bg-charcoal/10 rounded" />
      </div>
      <div className="w-20 h-8 bg-charcoal/10 rounded mb-2" />
      <div className="w-24 h-4 bg-charcoal/10 rounded" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="p-4 flex items-center gap-4 animate-pulse">
      <div className="w-10 h-10 bg-charcoal/10 rounded-full" />
      <div className="flex-1">
        <div className="w-32 h-4 bg-charcoal/10 rounded mb-2" />
        <div className="w-48 h-3 bg-charcoal/10 rounded" />
      </div>
      <div className="w-20 h-6 bg-charcoal/10 rounded-full" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="w-48 h-8 bg-charcoal/10 rounded" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
      </div>
      <div className="bg-white rounded-2xl border border-border">
        {[1, 2, 3, 4, 5].map(i => <TableRowSkeleton key={i} />)}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/LoadingSkeleton.tsx
git commit -m "feat: add reusable loading skeleton components"
```

---

## Task 22: Create Error Boundary Component

**Files:**
- Create: `apps/web/src/components/ErrorBoundary.tsx`

**Step 1: Create error boundary**

```tsx
'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6">
          <AlertTriangle className="w-12 h-12 text-error mb-4" />
          <h2 className="text-xl font-semibold text-charcoal mb-2">Something went wrong</h2>
          <p className="text-charcoal/60 mb-4 text-center max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/ErrorBoundary.tsx
git commit -m "feat: add ErrorBoundary component"
```

---

## Task 23: Fix Footer Links

**Files:**
- Modify: `apps/web/src/components/Footer.tsx` (or wherever footer is)

**Step 1: Find and update dead links**

Ensure all footer links point to valid pages:
- /help/getting-started
- /help/contact
- /terms
- /privacy

**Step 2: Create placeholder pages if needed**

**Step 3: Commit**

```bash
git add apps/web/src/components/Footer.tsx
git commit -m "fix: update footer with valid navigation links"
```

---

## Task 24: Final Integration Test

**Files:** None (manual testing)

**Step 1: Start both servers**

```bash
# Terminal 1
cd apps/api && npm run dev

# Terminal 2
cd apps/web && npm run dev
```

**Step 2: Test each page**

1. Visit /login - verify login works
2. Visit /signup - verify registration works
3. Visit /dashboard - verify stats load
4. Visit /clients - verify CRUD works
5. Visit /services - verify CRUD works
6. Visit /staff - verify CRUD works
7. Visit /calendar - verify appointments load
8. Visit /settings - verify save works
9. Test logout - verify redirect to login

**Step 3: Document any issues found**

---

## Task 25: Final Commit and Summary

**Step 1: Final commit with all remaining changes**

```bash
git add -A
git commit -m "feat: complete frontend-backend integration

- Connected all pages to real API endpoints
- Added loading states and error handling
- Created AuthGuard for protected routes
- Added reusable skeleton components
- Fixed footer navigation links"
```
