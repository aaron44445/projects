# Pecase - Event and Booking Management Platform

A modern, full-stack event and booking management platform built with Next.js, Express, PostgreSQL, and Redis.

## Project Structure

This is a monorepo managed with pnpm and Turborepo.

```
pecase/
├── apps/
│   ├── web/           # Admin Dashboard (Next.js)
│   ├── booking/       # Public Booking Site (Next.js)
│   └── api/           # Backend API (Express.js)
├── packages/
│   ├── database/      # Prisma ORM & Database Models
│   ├── types/         # Shared TypeScript Types
│   ├── ui/            # Shared React Components
│   └── config/        # Shared Configurations (Tailwind, ESLint, etc.)
├── pnpm-workspace.yaml
├── turbo.json
├── docker-compose.yml
└── .env.example
```

## Prerequisites

- Node.js 18+
- pnpm 9.0+
- Docker & Docker Compose (for database and services)

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env.local
```

Update `.env.local` with your configuration values.

### 3. Start Services (Database & Redis)

```bash
docker-compose up -d
```

### 4. Run Development Servers

```bash
pnpm dev
```

This will start:
- Admin Dashboard: http://localhost:3000
- Booking Site: http://localhost:3002
- API Server: http://localhost:3001

## Available Scripts

### Root Level

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all packages and apps
- `pnpm test` - Run tests in all packages
- `pnpm lint` - Lint all code
- `pnpm type-check` - TypeScript type checking

### Individual Packages

Navigate to the specific app/package directory:

```bash
cd apps/web
pnpm dev       # Start Next.js dev server
pnpm build     # Build for production
pnpm lint      # Run linting
```

## Docker Services

### PostgreSQL Database

- **Container**: pecase_db
- **Image**: postgres:15-alpine
- **Port**: 5432
- **User**: postgres
- **Password**: postgres
- **Database**: pecase

### Redis Cache

- **Container**: pecase_redis
- **Image**: redis:7-alpine
- **Port**: 6379

Both services include health checks and persistent volumes.

## Environment Variables

See `.env.example` for all available configuration options including:

- Database connection string
- Redis URL
- JWT secrets
- Third-party API keys (Stripe, Twilio, SendGrid)
- Application ports

## Monorepo Management

### Adding Dependencies

```bash
# Add to root
pnpm add -w package-name

# Add to specific app/package
pnpm add package-name --filter @pecase/web

# Add dev dependency
pnpm add -D package-name --filter @pecase/api
```

### Monorepo Scripts

- `pnpm turbo run dev` - Run dev tasks across all packages
- `pnpm turbo run build` - Build all packages in dependency order
- `pnpm turbo run lint --parallel` - Lint all packages in parallel

## Technology Stack

### Applications

- **Admin Dashboard**: Next.js 14, React 18, TypeScript
- **Booking Site**: Next.js 14, React 18, TypeScript
- **Backend API**: Express.js, TypeScript

### Shared Packages

- **Database**: Prisma ORM
- **UI Components**: React components library
- **Types**: Shared TypeScript type definitions
- **Config**: Shared configurations

### Infrastructure

- **Package Manager**: pnpm
- **Build System**: Turborepo
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Containerization**: Docker

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting: `pnpm lint` and `pnpm type-check`
4. Submit a pull request

## License

MIT
