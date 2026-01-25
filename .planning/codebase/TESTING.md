# Testing Patterns

**Analysis Date:** 2026-01-25

## Test Framework

**Runner - Backend:**
- Vitest [version in package.json]
- Config: `apps/api/vitest.config.ts`
- Environment: Node.js
- Isolation: `pool: 'forks'` with `isolate: true`
- Global test functions enabled (`globals: true`)

**Runner - Frontend:**
- Jest [version in package.json]
- Config: `apps/web/jest.config.js`
- Environment: `jest-environment-jsdom` for React component testing
- Uses Next.js Jest plugin (`nextJest`)

**Assertion Library:**
- Backend: Vitest built-in assertions + `expect()` syntax
- Frontend: Jest built-in assertions + `@testing-library/jest-dom`

**Run Commands:**
```bash
pnpm test                  # Run all tests (turbo)
pnpm test:watch            # Watch mode (turbo)
pnpm test:coverage         # Coverage report (turbo)
pnpm test:api              # Run API tests only
pnpm test:web              # Run web tests only
```

## Test File Organization

**Location:**
- Backend: co-located in `src/__tests__/` directory (same package as source)
- Frontend: co-located in `src/__tests__/` directory (same package as source)

**Naming:**
- Backend: `[feature].test.ts` (e.g., `auth.test.ts`, `appointments.test.ts`, `clients.test.ts`)
- Frontend: `[feature].test.tsx` (e.g., `login.test.tsx`, `signup.test.tsx`)

**Structure:**
```
apps/api/src/
├── __tests__/
│   ├── setup.ts              # Global test setup
│   ├── mocks/
│   │   ├── prisma.ts         # Database mocks
│   │   └── ...
│   ├── auth.test.ts
│   ├── appointments.test.ts
│   └── ...
└── [source files]

apps/web/src/
├── __tests__/
│   ├── setup.tsx             # Global Jest setup
│   ├── login.test.tsx
│   └── signup.test.tsx
└── [source components]
```

## Test Structure

**Suite Organization - Backend:**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Auth Routes - Comprehensive Unit Tests', () => {
  // Setup per test
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  // Group by endpoint
  describe('POST /api/v1/auth/register', () => {
    // Group by scenario
    describe('Success Cases', () => {
      it('should register new user with valid data', async () => {
        // Arrange
        const mockSalon = mockData.salon({ id: 'new-salon-123' });
        configureMockReturn('user', 'findFirst', null);

        // Act
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({ /* data */ });

        // Assert
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    // Group by error scenario
    describe('Error Cases', () => {
      it('should reject duplicate email', async () => {
        // test
      });
    });
  });
});
```

**Suite Organization - Frontend:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('LoginPage', () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  describe('Rendering', () => {
    it('should render the login form', () => {
      render(<LoginPage />);
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require email field', async () => {
      render(<LoginPage />);
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('required');
    });
  });

  describe('User Interactions', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
    });
  });
});
```

**Patterns:**
- `describe()` for grouping related tests
- `beforeEach()` for per-test setup/reset (not shared between tests)
- `it()` or `test()` for individual assertions
- Arrange-Act-Assert pattern within each test
- Group tests by endpoint/feature, then by scenario type

## Mocking

**Framework - Backend:**
- `vi.mock()` (Vitest native)
- Placed at top of test file, before imports of modules being tested
- Mocks are set up BEFORE the code under test is imported

**Framework - Frontend:**
- `jest.mock()` (Jest native)
- Placed at top of test file, before component imports
- Can override in individual tests with `jest.spyOn()`

**Patterns - Backend:**

```typescript
// Mock external library
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async (password: string) => `hashed_${password}`),
    compare: vi.fn(async (password: string, hash: string) => {
      return hash === `hashed_${password}`;
    }),
  },
}));

// Mock internal module
vi.mock('../services/email.js', () => ({
  sendEmail: vi.fn(async () => true),
  passwordResetEmail: vi.fn(() => '<html>Reset email</html>'),
}));

// Mock Prisma with custom helpers
vi.mock('@peacase/database', () => ({
  prisma: mockPrisma,
}));

// Usage in test
configureMockReturn('user', 'findFirst', null);
configureMockReturn('salon', 'create', mockSalon);
```

**Patterns - Frontend:**

```typescript
// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock icon library
jest.mock('lucide-react', () => {
  const createMockIcon = (name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <span data-testid={`icon-${name}`} className={className} />
    );
    return MockIcon;
  };
  return { Sparkles: createMockIcon('sparkles') };
});

// Mock context with exported helpers
export const mockLogin = jest.fn();
export const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  login: mockLogin,
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Usage in test
mockAuthContext.isAuthenticated = true;
```

**What to Mock:**
- External APIs (email, SMS, payments) - always mock to prevent side effects
- Database queries - use mock data factory
- Navigation/routing - mock `useRouter`
- Third-party libraries - mock to control behavior
- Context providers - mock to control auth state

**What NOT to Mock:**
- Core utilities like date operations, math
- Helper functions being tested directly
- Internal module dependencies (test them through the public interface)
- File system operations in unit tests (but can mock in integration tests)

## Fixtures and Factories

**Test Data - Backend:**

```typescript
// File: apps/api/src/__tests__/mocks/prisma.ts
export const mockData = {
  user: (salonId: string, overrides?: Partial<User>) => ({
    id: 'test-user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    salonId,
    role: 'admin',
    ...overrides,
  }),

  salon: (overrides?: Partial<Salon>) => ({
    id: 'test-salon-123',
    name: 'Test Salon',
    slug: 'test-salon',
    ...overrides,
  }),

  appointment: (salonId: string, overrides?: Partial<Appointment>) => ({
    id: 'test-apt-123',
    salonId,
    clientId: 'test-client-123',
    staffId: 'test-staff-123',
    serviceId: 'test-service-123',
    startTime: new Date().toISOString(),
    durationMinutes: 60,
    status: 'confirmed',
    ...overrides,
  }),
};

// Usage in test
const mockSalon = mockData.salon({ id: 'new-salon-123' });
const mockUser = mockData.user(mockSalon.id);
```

**Test Data - Frontend:**

```typescript
// Use setup.tsx mocks for context state
mockAuthContext.user = {
  id: 'test-user-123',
  email: 'test@example.com',
};

// Or create component props directly
const props = {
  user: { id: '123', name: 'Test' },
  onClose: jest.fn(),
};
```

**Location:**
- Backend: `apps/api/src/__tests__/mocks/` directory
- Frontend: Inline in setup file or individual test files
- Factories provide default data with optional overrides

## Coverage

**Requirements:**
- Backend (Vitest): 50% minimum for lines, functions, branches, statements
- Frontend (Jest): 50% minimum for lines, functions, branches, statements
- Config in `vitest.config.ts` and `jest.config.js` with `coverageThreshold`
- Excludes: `node_modules`, `dist`, test files, types, service integrations

**View Coverage:**
```bash
pnpm test:coverage       # Generate coverage reports
# Reports saved in coverage/ directory
# Open coverage/index.html in browser for HTML report
```

**Thresholds (apps/api/vitest.config.ts):**
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: [
    'node_modules/**',
    'dist/**',
    'src/__tests__/**',
    '**/*.d.ts',
    'src/cron/**',           // Excluded: background jobs
    'src/services/email.ts', // Excluded: external integrations
    'src/services/sms.ts',
    'src/services/payments.ts',
  ],
  thresholds: {
    lines: 50,
    functions: 50,
    branches: 50,
    statements: 50,
  },
}
```

## Test Types

**Unit Tests:**
- Scope: Single function or small module
- Approach: Mock all external dependencies (database, APIs, services)
- Example: Testing input normalization, error handling, helper functions
- Files: `*.test.ts` files testing utility functions directly

**Integration Tests:**
- Scope: Multiple modules working together (e.g., route + middleware + database mock)
- Approach: Real Express app with mocked Prisma, test full request/response cycle
- Example: `apps/api/src/__tests__/auth.test.ts` tests full auth flow
- Tools: Supertest for HTTP requests to Express app

**E2E Tests:**
- Framework: Not implemented in codebase
- Note: Project uses integration tests at API level instead
- Would test: Full user flows from frontend to database

**Test Coverage by Package:**
- **API (`apps/api`)**: Integration tests with mocked database (Vitest)
- **Web (`apps/web`)**: Component unit tests with mocked context (Jest)
- **Database (`packages/database`)**: No tests (schema/client only)
- **Types (`packages/types`)**: No tests (type definitions only)

## Common Patterns

**Async Testing - Backend:**

```typescript
it('should register new user with valid data', async () => {
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ /* ... */ });

  expect(response.status).toBe(201);
  // Vitest automatically waits for Promise
});

// With explicit await
await expect(
  withDatabaseRetry(async () => {
    return await operation();
  })
).resolves.toEqual(expectedResult);
```

**Async Testing - Frontend:**

```typescript
it('should toggle password visibility', async () => {
  const user = userEvent.setup();
  render(<LoginPage />);

  const toggleButton = screen.getByRole('button');
  await user.click(toggleButton); // userEvent is async

  const passwordInput = screen.getByLabelText(/password/i);
  expect(passwordInput).toHaveAttribute('type', 'text');
});

// With waitFor for async state changes
await waitFor(() => {
  expect(screen.getByText('Error message')).toBeInTheDocument();
});
```

**Error Testing - Backend:**

```typescript
it('should reject invalid email', async () => {
  configureMockReturn('user', 'findFirst', null);

  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'invalid', password: 'password123' });

  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
});

// Testing thrown errors
expect(() => {
  const schema = z.string().email();
  schema.parse('invalid');
}).toThrow();
```

**Error Testing - Frontend:**

```typescript
it('should show error message on failed login', async () => {
  mockLogin.mockRejectedValue(new Error('Invalid credentials'));

  render(<LoginPage />);
  const form = screen.getByRole('form');
  await userEvent.type(form, { /* data */ });

  await waitFor(() => {
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });
});
```

## Test Timeouts

**Configuration:**
- Backend (Vitest): 30 seconds default (`testTimeout: 30000`, `hookTimeout: 30000`)
- Frontend (Jest): 10 seconds default (`testTimeout: 10000`)
- Can override per test: `it('test', async () => { /* ... */ }, 60000)`

**Use longer timeouts for:**
- Database connection tests
- Retry logic tests (explicit waits with delays)
- External API integration tests (if not mocked)

## Setup and Teardown

**Backend Setup (apps/api/src/__tests__/setup.ts):**

```typescript
beforeAll(async () => {
  // Connect to test database once
  await prisma.$connect();
});

afterAll(async () => {
  // Disconnect after all tests
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Reset state between tests
  cleanupFunctions.length = 0;
});

afterEach(async () => {
  // Clean up test data
  for (const cleanup of cleanupFunctions) {
    await cleanup();
  }
  cleanupFunctions.length = 0;
});
```

**Frontend Setup (apps/web/src/__tests__/setup.tsx):**

```typescript
beforeAll(() => {
  // Suppress known console errors
  console.error = (...args) => {
    if (args[0]?.includes('Warning: ReactDOM.render')) return;
    originalError.call(console, ...args);
  };
});

beforeEach(() => {
  // Reset all mock implementations
  mockLogin.mockReset();
  mockRegister.mockReset();
  mockAuthContext.user = null;
});

afterAll(() => {
  // Restore console
  console.error = originalError;
});
```

**Cleanup Registration Pattern:**

```typescript
// Register cleanup after creating test data
registerCleanup(async () => {
  await prisma.user.delete({ where: { id: testUserId } });
});

// Cleanup runs automatically after each test
```

## Debugging Tests

**Backend (Vitest):**
```bash
# Run single test file
pnpm test auth.test.ts

# Run matching test name
pnpm test -t "should register new user"

# Watch mode with file
pnpm test:watch auth.test.ts

# Debug output
NODE_DEBUG=* pnpm test
```

**Frontend (Jest):**
```bash
# Run single test file
pnpm test login.test.tsx

# Run matching test name
pnpm test -t "should render login form"

# Watch mode
pnpm test:watch

# Coverage details
pnpm test:coverage -- --verbose
```

---

*Testing analysis: 2026-01-25*
