import React from 'react';
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const createMockIcon = (name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <span data-testid={`icon-${name}`} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    Sparkles: createMockIcon('sparkles'),
    Mail: createMockIcon('mail'),
    Lock: createMockIcon('lock'),
    Eye: createMockIcon('eye'),
    EyeOff: createMockIcon('eye-off'),
    ArrowRight: createMockIcon('arrow-right'),
    Loader2: createMockIcon('loader2'),
    Building2: createMockIcon('building2'),
    Phone: createMockIcon('phone'),
    Globe: createMockIcon('globe'),
    Check: createMockIcon('check'),
    Shield: createMockIcon('shield'),
    Zap: createMockIcon('zap'),
    Clock: createMockIcon('clock'),
    CheckCircle2: createMockIcon('check-circle-2'),
    RefreshCw: createMockIcon('refresh-cw'),
  };
});

// Mock the AuthContext
export const mockLogin = jest.fn();
export const mockRegister = jest.fn();
export const mockLogout = jest.fn();
export const mockRefreshAuth = jest.fn();
export const mockResendVerificationEmail = jest.fn();

export const mockAuthContext = {
  user: null,
  salon: null,
  isAuthenticated: false,
  isLoading: false,
  login: mockLogin,
  register: mockRegister,
  logout: mockLogout,
  refreshAuth: mockRefreshAuth,
  resendVerificationEmail: mockResendVerificationEmail,
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Reset mocks between tests
beforeEach(() => {
  mockLogin.mockReset();
  mockRegister.mockReset();
  mockLogout.mockReset();
  mockRefreshAuth.mockReset();
  mockResendVerificationEmail.mockReset();

  // Reset auth context to default
  mockAuthContext.user = null;
  mockAuthContext.salon = null;
  mockAuthContext.isAuthenticated = false;
  mockAuthContext.isLoading = false;
});
