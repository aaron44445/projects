# Peacase - Premium Spa & Salon Management Platform

[![CI](https://github.com/YOUR_USERNAME/peacase/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/peacase/actions/workflows/ci.yml)
[![Deploy](https://github.com/YOUR_USERNAME/peacase/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/peacase/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8.15.0-orange.svg)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

A modern, full-featured spa and salon management platform built with Next.js, Express, and Prisma.

## 🚀 Quick Deploy

Deploy Peacase to production in under 10 minutes with zero configuration:

### Step 1: Deploy Backend API

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/aaron44445/projects)

Click the button above, then:
1. Login with GitHub
2. Render auto-detects `render.yaml`
3. Add these 3 environment variables when prompted:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `CORS_ORIGIN`: `https://your-app.vercel.app` (you'll get this in Step 2)
   - `FRONTEND_URL`: Same as CORS_ORIGIN
4. Click "Create Web Service"
5. Wait 3-5 minutes
6. Copy your Render URL (e.g., `https://peacase-api.onrender.com`)

### Step 2: Deploy Frontend

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aaron44445/projects&project-name=peacase&repository-name=peacase&root-directory=apps/web&env=NEXT_PUBLIC_API_URL&envDescription=Backend%20API%20URL%20from%20Step%201&envLink=https://github.com/aaron44445/projects#deployment)

Click the button above, then:
1. Login with GitHub
2. Set Root Directory: `apps/web`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: Paste the Render URL from Step 1
4. Click "Deploy"
5. Wait 5-7 minutes
6. Copy your Vercel URL (e.g., `https://peacase.vercel.app`)

### Step 3: Update Backend CORS

Go back to Render:
1. Click your API service
2. Environment tab
3. Update `CORS_ORIGIN` and `FRONTEND_URL` with your Vercel URL
4. Click "Save Changes" (auto-redeploys)

**Done!** Your app is live. See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed screenshots.

---

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

Peacase is deployed on:
- **Frontend**: Vercel (Next.js)
- **Backend API**: Railway (Express.js)
- **Database**: Supabase (PostgreSQL)

See [DEPLOYMENT_INSTRUCTIONS.md](./docs/DEPLOYMENT_INSTRUCTIONS.md) for step-by-step deployment guide.

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
