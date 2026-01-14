# Peacase - Premium Spa & Salon Management Platform

[![CI](https://github.com/YOUR_USERNAME/peacase/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/peacase/actions/workflows/ci.yml)
[![Deploy](https://github.com/YOUR_USERNAME/peacase/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/peacase/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8.15.0-orange.svg)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

A modern, full-featured spa and salon management platform built with Next.js, Express, and Prisma.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Monorepo**: Turborepo + pnpm workspaces
- **Payments**: Stripe
- **Email**: SendGrid
- **SMS**: Twilio

## Project Structure

```
peacase/
├── apps/
│   ├── api/          # Express.js API server
│   └── web/          # Next.js frontend
├── packages/
│   ├── database/     # Prisma schema & client
│   ├── types/        # Shared TypeScript types
│   └── ui/           # Shared UI components
└── docs/
    └── plans/        # Implementation plans
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8.15.0+
- PostgreSQL (or SQLite for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/peacase.git
cd peacase

# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Push database schema (development)
pnpm db:push

# Start development servers
pnpm dev
```

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://localhost:5432/peacase_dev"

# Auth
JWT_SECRET="your-jwt-secret-min-32-characters"

# API URL
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

See [.github/SECRETS.md](.github/SECRETS.md) for complete environment variables documentation.

## Development

```bash
# Start all apps in development mode
pnpm dev

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Build all packages
pnpm build

# Format code
pnpm format
```

### Database Commands

```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes (development)
pnpm db:push

# Run migrations (production)
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

## Deployment

### CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

- **CI**: Runs on every push and pull request
  - Linting
  - Type checking
  - Tests (when configured)
  - Build verification

- **Deploy**: Automatic deployments
  - Staging: Push to `main` branch
  - Production: Create a release tag

See [.github/workflows/](.github/workflows/) for workflow configurations.

### Manual Deployment

```bash
# Build for production
pnpm build

# Start production servers
pnpm start
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure all CI checks pass before requesting a review.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with care for the spa and wellness industry.
