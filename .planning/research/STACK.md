# Technology Stack for Testing & Stabilization

**Project:** Peacase - Spa/Salon SaaS Stabilization
**Focus:** Testing and debugging tools for existing codebase audit
**Researched:** 2026-01-25
**Confidence:** HIGH

## Executive Summary

This stack focuses on **systematic testing and debugging** of an existing multi-tenant SaaS application, not building new features. The developer doesn't own a spa and can't QA like a real user, so we need automated testing to simulate real workflows and catch bugs systematically.

Key issues to address: Online booking unreliable, SMS broken, settings may not apply, email reminders may not work. The stack prioritizes tools that help **find bugs, reproduce issues, and verify fixes**.

---

## Core Testing Framework

### End-to-End Testing: Playwright

| Technology | Version | Purpose | Why Playwright over Cypress |
|------------|---------|---------|---------------------------|
| **@playwright/test** | ^1.49.0 | E2E testing, user workflow simulation | Native parallelization (15 workers vs Cypress paid plans), multi-browser support (including WebKit for Safari), API testing without browser, codegen tool for recording workflows, better for complex multi-tenant scenarios |

**Why Playwright for stabilization:**
- **Codegen feature** - Record real user workflows (booking appointment, editing settings) and auto-generate test code. Critical when you can't manually QA like a spa owner.
- **Native parallelization** - Run 15+ tests simultaneously without paid plans. One team reduced suite runtime from 90 minutes to 14 minutes.
- **API + UI testing** - Test API endpoints directly without browser overhead. Perfect for verifying backend fixes.
- **Multi-domain testing** - Seamlessly test across different domains in single test flow (main app, booking widget, admin portal).
- **Cross-browser coverage** - Catch Safari/WebKit-specific bugs that Cypress misses.

**When to use:**
- Testing critical user workflows (book appointment, receive SMS confirmation, get email reminder)
- Verifying multi-tenant isolation (tenant A can't see tenant B's data)
- Reproducing bug reports systematically
- CI/CD integration for regression prevention

**Installation:**
```bash
pnpm add -D @playwright/test
npx playwright install
```

**Sources:**
- [Cypress vs Playwright: I Ran 500 E2E Tests in Both (Medium, Jan 2026)](https://medium.com/lets-code-future/cypress-vs-playwright-i-ran-500-e2e-tests-in-both-heres-what-broke-2afc448470ee)
- [Playwright vs Cypress: The 2026 Enterprise Testing Guide (Medium, Dec 2025)](https://devin-rosario.medium.com/playwright-vs-cypress-the-2026-enterprise-testing-guide-ade8b56d3478)

---

## API & Integration Testing

### 1. Vitest (Primary Test Runner)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **vitest** | ^3.0.0 | Unit/integration test runner | 10-20x faster than Jest on large codebases, native ESM support (Peacase uses ESM), built-in TypeScript support, modern API, growing ecosystem |

**Why Vitest for stabilization:**
- **Speed** - Fast test feedback loop critical for debugging. Vitest runs tests 10-20x faster than Jest on large codebases.
- **ESM-first** - Peacase already uses ESM (loadEnv.ts pattern). Vitest handles ESM natively without config hell.
- **TypeScript native** - No separate ts-jest setup. Works with strict mode enabled.
- **Watch mode** - Instant re-run on file changes. Essential for iterative debugging.
- **Compatible API** - Similar to Jest, easy learning curve.

**When to use:**
- Unit testing API routes (appointments, auth, locations)
- Integration testing service layer (SMS, email, Stripe)
- Testing database queries for tenant isolation
- Verifying business logic (pricing, scheduling, availability)

### 2. SuperTest (HTTP Assertions)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **supertest** | ^7.0.0 | HTTP API testing library | Industry standard for Express testing, chainable assertions, automatic server lifecycle, works seamlessly with Vitest |

**Why SuperTest for stabilization:**
- **Express-first design** - Built specifically for testing Express apps like Peacase API.
- **No server management** - Pass app object, SuperTest starts/stops test server automatically.
- **Readable assertions** - `.expect(200).expect('Content-Type', /json/)` reads like documentation.
- **Request chaining** - Test entire workflows in single test (login → create appointment → verify).

**When to use:**
- Testing API endpoints return correct status codes
- Verifying authentication/authorization logic
- Testing CORS configuration
- Validating request/response payloads

**Installation:**
```bash
pnpm add -D vitest supertest @vitest/ui
pnpm add -D @types/supertest # TypeScript types
```

**Example test structure:**
```typescript
// apps/api/src/routes/__tests__/appointments.test.ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../app'

describe('POST /api/appointments', () => {
  it('should require authentication', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({ date: '2026-02-01', serviceId: '123' })

    expect(res.status).toBe(401)
  })

  it('should enforce tenant isolation', async () => {
    // Test that tenant A cannot book appointment for tenant B's location
  })
})
```

**Sources:**
- [Testing in 2026: Jest, React Testing Library, and Full Stack Testing Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies)
- [How to Test Your Node.js RESTful API with Vitest](https://danioshi.substack.com/p/how-to-test-your-nodejs-restful-api)
- [Supertest: How to Test APIs Like a Pro (Testim Blog)](https://www.testim.io/blog/supertest-how-to-test-apis-like-a-pro/)

---

## Database Testing

### Prisma Testing Strategy

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **prisma-mock** | ^1.0.0 | In-memory Prisma client mock | Type-safe mocking without database connection, fast unit tests, all data in memory |
| **@prisma/client** | (existing) | Integration testing with real DB | Test actual database behavior, verify tenant_id filtering works |

**Why this approach for stabilization:**
- **Unit tests with prisma-mock** - Fast, isolated tests for business logic without database. Type-safe against your actual schema.
- **Integration tests with real database** - Catch issues like missing tenant_id filters, incorrect queries, constraint violations.
- **Docker for test database** - Spin up PostgreSQL container for integration tests, tear down after. Prevents test pollution.

**Testing tenant isolation (critical for multi-tenant SaaS):**
```typescript
// Test that all queries filter by tenant_id
describe('Appointment queries', () => {
  it('should only return appointments for current tenant', async () => {
    // Setup: Create appointments for tenant A and tenant B
    // Test: Query as tenant A
    // Assert: Only tenant A's appointments returned
  })
})
```

**Installation:**
```bash
pnpm add -D prisma-mock
```

**Sources:**
- [The Ultimate Guide to Testing with Prisma: Mocking Prisma Client](https://www.prisma.io/blog/testing-series-1-8eRB5p0Y8o)
- [Unit testing with Prisma ORM (Prisma Docs)](https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing)
- [The Ultimate Guide to Testing with Prisma: Integration Testing](https://www.prisma.io/blog/testing-series-3-aBUyF8nxAn)

---

## Frontend Testing

### React Testing Library + Vitest

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **@testing-library/react** | ^16.0.0 | Component testing | Industry standard, encourages testing user behavior not implementation, works with Next.js 14 |
| **@testing-library/jest-dom** | ^6.6.0 | Custom matchers | Readable assertions (`.toBeInTheDocument()`), better error messages |
| **@vitejs/plugin-react** | ^4.3.0 | Vitest React support | Transform JSX/TSX for Vitest |

**Why this approach for stabilization:**
- **User-focused testing** - Test what users see/do, not internal state. Catches real UX bugs.
- **Next.js 14 compatible** - Works with Server Components (synchronous only) and Client Components.
- **Fast feedback** - Vitest's speed makes component testing painless.

**When to use:**
- Testing form validation (booking form, settings forms)
- Verifying UI state changes (loading states, error messages)
- Testing client-side logic (date picker, service selection)
- Accessibility testing (screen reader compatibility)

**Installation:**
```bash
pnpm add -D @testing-library/react @testing-library/jest-dom @vitejs/plugin-react happy-dom
```

**Note for Next.js:** For async Server Components, use Playwright E2E tests instead.

**Sources:**
- [Testing Next.js Applications: A Complete Guide (Medium, 2026)](https://trillionclues.medium.com/testing-next-js-applications-a-complete-guide-to-catching-bugs-before-qa-does-a1db8d1a0a3b)
- [Next.js Official Testing Docs](https://nextjs.org/docs/app/building-your-application/testing)
- [NextJs Unit Testing and End-to-End Testing (Strapi Blog)](https://strapi.io/blog/nextjs-testing-guide-unit-and-e2e-tests-with-vitest-and-playwright)

---

## Third-Party Service Testing

### Stripe Testing

| Tool | Purpose | Why |
|------|---------|-----|
| **Stripe CLI** | Mock webhooks locally | Trigger webhook events without real payments, test payment flows end-to-end |
| **Test mode API keys** | Safe testing | All test transactions free, predefined test cards for different scenarios |
| **stripe-mock** (optional) | Complete isolation | Mock entire Stripe API, no network calls, deterministic tests |

**Critical for stabilization:**
- **Webhook signature verification** - Ensure security best practices (HMAC with SHA-256)
- **Event replay protection** - Test that duplicate webhook events don't cause double-processing
- **Subscription lifecycle** - Test trial periods, cancellations, upgrades/downgrades
- **Failed payment handling** - Verify graceful failure modes

**Setup:**
```bash
# Install Stripe CLI
# Trigger webhook events locally
stripe trigger payment_intent.succeeded
```

**Testing pattern:**
```typescript
describe('Stripe webhook handler', () => {
  it('should verify webhook signatures', async () => {
    // Test with invalid signature -> expect 400
  })

  it('should not process duplicate events', async () => {
    // Send same event twice -> verify idempotency
  })
})
```

**Sources:**
- [Best practices for testing Stripe webhook event processing (LaunchDarkly)](https://launchdarkly.com/blog/best-practices-for-testing-stripe-webhook-event-processing/)
- [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks)
- [Testing Webhooks and Events Using Mock APIs (Zuplo)](https://zuplo.com/learning-center/testing-webhooks-and-events-using-mock-apis)

### Twilio Testing

| Tool | Purpose | Why |
|------|---------|-----|
| **Test credentials** | Mock SMS sending | Twilio provides magic phone numbers that simulate success/failure without sending real SMS |
| **Twilio Dev Phone** | Visual testing | Browser-based phone for receiving test SMS/calls |
| **twilio-mock** (Node.js) | Complete isolation | Mock Twilio API responses, no network calls |

**Critical for stabilization:**
- **SMS broken** - Top priority issue. Need to test SMS sending systematically.
- **Error handling** - Test Twilio API failures (invalid number, rate limits, network errors)
- **Cost control** - Use test credentials to avoid charges during testing

**Magic numbers for testing:**
```
Success: +15005550006 (as From number)
Invalid: +15005550001 (triggers validation error)
Full list: https://www.twilio.com/docs/iam/test-credentials
```

**Testing pattern:**
```typescript
describe('SMS service', () => {
  it('should send appointment confirmation', async () => {
    // Use test credentials
    // Verify SMS queued successfully
  })

  it('should handle invalid phone numbers', async () => {
    // Test with +15005550001
    // Verify error handled gracefully
  })
})
```

**Sources:**
- [Test your SMS Application (Twilio Docs)](https://www.twilio.com/docs/messaging/tutorials/automate-testing)
- [Introduction to Application Testing with Twilio](https://www.twilio.com/en-us/blog/introduction-to-application-testing-with-twilio)
- [Mock API Generation with Twilio's OpenAPI Spec](https://www.twilio.com/docs/openapi/mock-api-generation-with-twilio-openapi-spec)

### SendGrid Testing

| Tool | Purpose | Why |
|------|---------|-----|
| **Sandbox mode** | Test without sending | SendGrid's sandbox mode validates requests without delivering emails |
| **Mail Sink** (Ethereal/MailHog) | Capture test emails | Receive actual email output without sending to real addresses |

**Critical for stabilization:**
- **Email reminders may not work** - Need to verify email sending logic systematically.
- **Template rendering** - Test dynamic data injection in email templates.
- **Delivery failures** - Handle bounces, invalid emails gracefully.

**Testing pattern:**
```typescript
describe('Email service', () => {
  it('should send appointment reminder', async () => {
    // Use sandbox mode or Ethereal
    // Verify email queued with correct data
  })
})
```

---

## Debugging Tools

### Production Debugging

| Tool | Purpose | Why for Stabilization |
|------|---------|---------------------|
| **Winston** | Structured logging | Centralized, searchable logs. Essential for debugging production issues remotely. |
| **Node.js Inspector** | Remote debugging | Attach Chrome DevTools to production (use cautiously on non-critical instances). |
| **VS Code Debugger** | Local debugging | Breakpoints, conditional breakpoints, watch variables. Best for development debugging. |

**Why structured logging for stabilization:**
- **You can't manually QA** - Logs are your eyes into what users are experiencing.
- **Multi-tenant context** - Every log needs tenant_id to trace issues per salon.
- **Centralized analysis** - Use ELK Stack or similar to search/filter logs across deployments.

**Logging best practices:**
```typescript
// Log with tenant context
logger.info('Appointment created', {
  tenantId: req.user.tenantId,
  appointmentId: appointment.id,
  userId: req.user.id,
  timestamp: new Date()
})

// Log errors with stack traces
logger.error('SMS send failed', {
  tenantId: req.user.tenantId,
  error: err.message,
  stack: err.stack,
  phoneNumber: phoneNumber // (sanitized)
})
```

**Installation:**
```bash
pnpm add winston
```

**Sources:**
- [Node.js Production Debugging (Fenil Sonani)](https://fenilsonani.com/articles/node-js-production-debugging)
- [Advanced Node.js debugging techniques (Merge Development)](https://merge.rocks/blog/advanced-node-js-debugging-techniques)
- [How to Debug Node.js Applications Efficiently](https://talent500.com/blog/how-to-debug-node-js-application-efficiently/)

### AI-Assisted Debugging (2026)

| Tool | Purpose | Why |
|------|---------|-----|
| **GitHub Copilot** | Code suggestions, test generation | 84% of developers use AI tools daily in 2026. Can generate test cases, suggest fixes. |
| **AI exception analysis** | Historical bug matching | AI can flag similar bugs and resolutions, cutting investigation time from hours to 30 minutes. |

**Usage for stabilization:**
- Generate test cases for untested code paths
- Suggest fixes based on error messages
- Identify patterns in bug reports

**Note:** AI is an augmentation tool, not a replacement for systematic debugging. Always verify AI suggestions.

**Sources:**
- [10 debugging techniques we rely on (and how AI is changing the game in 2026) - WeAreBrain](https://wearebrain.com/blog/10-effective-debugging-techniques-for-developers/)

---

## Multi-Tenant Testing Specifics

### Critical Testing Areas

| Test Type | Purpose | Implementation |
|-----------|---------|----------------|
| **Tenant isolation** | Verify tenant A can't access tenant B's data | Test all API endpoints with cross-tenant IDs, expect 403/404 |
| **Token injection** | Simulate malicious tenant switching | Attempt to change tenant_id in JWT, verify rejection |
| **Noisy neighbor** | Ensure one tenant can't DoS others | Load test single tenant, verify other tenants unaffected |
| **Multi-tenant load** | Test system under concurrent tenant load | Simulate 100+ tenants booking simultaneously |

**Testing pattern for tenant isolation:**
```typescript
describe('Tenant isolation', () => {
  it('should prevent cross-tenant data access', async () => {
    // Create appointment for tenant A
    const apptA = await createAppointment({ tenantId: 'A' })

    // Try to access as tenant B
    const res = await request(app)
      .get(`/api/appointments/${apptA.id}`)
      .set('Authorization', `Bearer ${tenantBToken}`)

    expect(res.status).toBe(404) // Not 200, not 403 (don't leak existence)
  })
})
```

**Sources:**
- [How are you testing the multi-tenant capabilities of your SaaS application? (AWS SaaS Lens)](https://wa.aws.amazon.com/saas.question.REL_3.en.html)
- [Multi-Tenancy in SaaS: What It Is and How to Test It Effectively (DEV Community)](https://dev.to/jamescantor38/multi-tenancy-in-saas-what-it-is-and-how-to-test-it-effectively-2dio)
- [Designing a Multi-Tenant SaaS Application: Data Isolation Strategies (Medium, Jan 2026)](https://medium.com/@niteshthakur498/designing-a-multi-tenant-saas-application-data-isolation-strategies-dea298a1309b)

---

## Test Infrastructure

### CI/CD Testing

| Tool | Purpose | Current Usage |
|------|---------|---------------|
| **GitHub Actions** | Run tests on every commit | Already in use for Peacase (Vercel, Render auto-deploy) |
| **Turbo** | Monorepo task running | Already in package.json (`turbo test`) |

**CI/CD test strategy:**
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - name: Install dependencies
        run: pnpm install
      - name: Run unit tests
        run: pnpm test
      - name: Run E2E tests
        run: pnpm test:e2e
      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

**Test database strategy:**
```bash
# Use Docker for isolated test database
docker run -d \
  -e POSTGRES_PASSWORD=test \
  -p 5433:5432 \
  postgres:15

# Run tests against test database
DATABASE_URL=postgresql://postgres:test@localhost:5433/test pnpm test
```

---

## Recommended Testing Pyramid

For stabilization of existing codebase:

```
     /\
    /E2E\      <- 5-10 critical user flows (Playwright)
   /------\       Login, book appointment, receive notifications
  /  API  \    <- 50-100 API endpoint tests (Vitest + SuperTest)
 /--------\       All routes, auth, validation, business logic
/   Unit   \  <- 200+ unit tests (Vitest)
/----------\     Service layer, utilities, helpers
```

**Why this distribution for stabilization:**

1. **Few E2E tests** - Expensive to write/maintain. Focus on critical paths: booking flow, payment flow, notification flow.

2. **Many API tests** - Most bugs in Peacase are API-related (SMS broken, settings not applying). API tests are fast and catch integration issues.

3. **Lots of unit tests** - Fast feedback, easy to debug, high coverage of business logic.

**Start with:**
1. API tests for broken features (SMS, email, booking)
2. E2E test for one critical flow (book appointment end-to-end)
3. Add unit tests as you fix bugs

---

## Installation Summary

```bash
# Core testing framework
pnpm add -D vitest @vitest/ui @vitest/coverage-v8

# E2E testing
pnpm add -D @playwright/test
npx playwright install

# API testing
pnpm add -D supertest @types/supertest

# Database testing
pnpm add -D prisma-mock

# Frontend testing
pnpm add -D @testing-library/react @testing-library/jest-dom @vitejs/plugin-react happy-dom

# Logging
pnpm add winston
```

**Vitest configuration (vitest.config.ts in monorepo root):**
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // or 'happy-dom' for frontend tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

**Playwright configuration (playwright.config.ts in monorepo root):**
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './apps/web/e2e',
  fullyParallel: true,
  workers: process.env.CI ? 5 : 15, // Max parallelization locally
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
})
```

---

## Systematic Bug Hunting Methodology

### 1. Reproduce First

**Never fix bugs you can't reproduce.**

Tools:
- Playwright Codegen to record user actions
- Production logs to understand failure conditions
- Test database to isolate data-related issues

Process:
1. Get exact reproduction steps from bug report
2. Record with Playwright Codegen if UI bug
3. Write failing test that reproduces bug
4. Fix code until test passes
5. Commit test + fix together (prevents regression)

### 2. Binary Search Debugging

**Narrow down bug location efficiently.**

Process:
1. Divide code into halves
2. Add logging/breakpoints at midpoint
3. Determine which half contains bug
4. Repeat until isolated

This is 40-60% faster than trial-and-error debugging.

### 3. Systematic Testing by Feature

For each broken feature:

**SMS broken:**
- [ ] Unit test: SMS service sends correct payload to Twilio
- [ ] Integration test: API route calls SMS service correctly
- [ ] E2E test: User booking triggers SMS

**Email reminders may not work:**
- [ ] Unit test: Email service formats reminder correctly
- [ ] Integration test: Scheduled job triggers email send
- [ ] E2E test: User receives email after booking

**Settings may not apply:**
- [ ] Unit test: Settings update logic
- [ ] Integration test: API saves settings to database
- [ ] E2E test: User changes setting, sees effect

### 4. AI-Assisted Debugging

Use AI (GitHub Copilot, ChatGPT) to:
- Generate test cases for untested paths
- Suggest possible causes from error messages
- Find similar bugs in codebase history

**But always:**
- Verify AI suggestions with tests
- Understand the fix before applying
- Don't blindly copy AI code

**Sources:**
- [A systematic approach to debugging (nicole@web)](https://ntietz.com/blog/how-i-debug-2023/)
- [10 debugging techniques we rely on (WeAreBrain 2026)](https://wearebrain.com/blog/10-effective-debugging-techniques-for-developers/)

---

## Success Metrics

Track these to measure stabilization progress:

| Metric | Target | Why |
|--------|--------|-----|
| **Test coverage** | 70%+ API routes, 60%+ overall | Catch regressions before production |
| **E2E test suite runtime** | <15 minutes | Fast feedback in CI |
| **Bug reproduction rate** | 90%+ of reported bugs | Can't fix what you can't reproduce |
| **Production error rate** | Decrease 80% over 3 months | Fewer bugs reaching users |
| **Time to fix bugs** | Average <2 hours | Faster debugging with good tests |

---

## Next Steps: Implementation Order

1. **Week 1: Setup infrastructure**
   - Install Vitest, Playwright, SuperTest
   - Configure CI/CD pipeline
   - Set up test database with Docker

2. **Week 2: High-priority bug fixes with tests**
   - SMS broken: Write tests, fix, verify
   - Email reminders: Write tests, fix, verify
   - Document findings in CLAUDE.md learnings

3. **Week 3: Critical user flows**
   - E2E test for booking flow (Playwright)
   - E2E test for payment flow
   - E2E test for settings changes

4. **Week 4: Expand coverage**
   - API tests for all routes
   - Unit tests for service layer
   - Integration tests for database queries

5. **Ongoing: Regression prevention**
   - Every new bug gets a test first
   - Run full suite in CI before deploy
   - Monitor production logs for new errors

---

## Confidence Assessment

| Area | Level | Reasoning |
|------|-------|-----------|
| **E2E Framework (Playwright)** | HIGH | Official 2026 comparison articles, clear advantages for this use case |
| **Test Runner (Vitest)** | HIGH | 2026 trend articles, proven performance gains, ESM compatibility |
| **API Testing (SuperTest)** | HIGH | Industry standard for Express, official recommendations |
| **Database Testing (Prisma)** | HIGH | Official Prisma testing guides, clear patterns |
| **Stripe Testing** | HIGH | Official Stripe documentation, security best practices |
| **Twilio Testing** | HIGH | Official Twilio testing documentation |
| **Multi-tenant Testing** | MEDIUM | AWS and community guides, but fewer 2026-specific sources |
| **Debugging Tools** | HIGH | Official Node.js and VS Code documentation |

---

## Summary

This stack prioritizes **finding and fixing bugs systematically** over building new features. The key principle: **write tests that simulate real user workflows**, since you can't manually QA like a spa owner.

**Core stack:**
- Playwright for E2E (record real workflows, test critical paths)
- Vitest + SuperTest for API testing (fast, comprehensive)
- Prisma-mock + real DB for database testing (tenant isolation critical)
- Winston for production logging (your eyes when you can't QA manually)

**Testing priority:**
1. High-impact bugs (SMS, email, booking)
2. Critical user flows (book → pay → confirm)
3. Multi-tenant isolation (security critical)
4. Regression prevention (test every fix)

All tools are current (2025-2026), well-documented, and proven for stabilization work. Start with high-priority bugs, write tests first, then fix systematically.
