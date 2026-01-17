# Integration Guide for Environment Scripts

This guide shows how to integrate the environment verification scripts into your development workflow.

## Add to package.json Scripts

### Basic Integration

Add to your root `package.json`:

```json
{
  "scripts": {
    "verify-env": "tsx scripts/verify-env.ts",
    "generate-secrets": "tsx scripts/generate-jwt-secrets.ts"
  }
}
```

### Pre-Hook Integration

Automatically verify environment before critical operations:

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "start": "turbo start",
    "predev": "pnpm verify-env --skip-optional",
    "prebuild": "pnpm verify-env",
    "prestart": "pnpm verify-env",
    "verify-env": "tsx scripts/verify-env.ts",
    "generate-secrets": "tsx scripts/generate-jwt-secrets.ts"
  }
}
```

### Environment-Specific Verification

```json
{
  "scripts": {
    "verify-env:dev": "tsx scripts/verify-env.ts --env-file apps/api/.env --skip-optional",
    "verify-env:staging": "tsx scripts/verify-env.ts --env-file .env.staging",
    "verify-env:prod": "tsx scripts/verify-env.ts --env-file .env.production"
  }
}
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/verify-env.yml`:

```yaml
name: Verify Environment

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - uses: pnpm/action-setup@v2
        with:
          version: 8.15.0
      - run: pnpm install
      - run: pnpm db:generate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      - run: pnpm verify-env --skip-optional
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}
          # ... other env vars
```

See [github-actions-example.yml](./github-actions-example.yml) for complete example.

### GitLab CI

Add to `.gitlab-ci.yml`:

```yaml
verify-environment:
  stage: test
  image: node:18
  before_script:
    - npm install -g pnpm@8.15.0
    - pnpm install
  script:
    - pnpm db:generate
    - pnpm verify-env --skip-optional
  variables:
    DATABASE_URL: $DATABASE_URL
    JWT_SECRET: $JWT_SECRET
    JWT_REFRESH_SECRET: $JWT_REFRESH_SECRET
```

### Docker Integration

Add to your Dockerfile:

```dockerfile
FROM node:18-alpine AS base

# ... other build steps ...

# Verify environment before starting
RUN pnpm verify-env --skip-optional

CMD ["pnpm", "start"]
```

Or use a multi-stage build:

```dockerfile
FROM node:18-alpine AS verify
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY scripts ./scripts
RUN npm install -g pnpm@8.15.0
RUN pnpm install
RUN pnpm verify-env --skip-optional

FROM node:18-alpine AS production
# ... production build ...
```

## Deployment Platform Integration

### Vercel

Add to `vercel.json`:

```json
{
  "buildCommand": "pnpm verify-env && pnpm build",
  "env": {
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret",
    "JWT_REFRESH_SECRET": "@jwt-refresh-secret"
  }
}
```

### Railway

Add to railway.json or use CLI:

```bash
# Set environment variables
railway variables set DATABASE_URL=...
railway variables set JWT_SECRET=...
railway variables set JWT_REFRESH_SECRET=...

# Add to build command
railway run pnpm verify-env && pnpm build
```

### Heroku

Add to `Procfile`:

```
release: pnpm verify-env
web: pnpm start
```

### Render

In render.yaml:

```yaml
services:
  - type: web
    name: api
    buildCommand: pnpm install && pnpm verify-env && pnpm build
    startCommand: pnpm start
```

## Pre-commit Hook Integration

Use Husky to verify environment before commits:

### Install Husky

```bash
pnpm add -D husky
npx husky init
```

### Add Pre-commit Hook

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Verify environment configuration
pnpm verify-env --skip-optional || {
  echo "❌ Environment verification failed!"
  echo "Run: pnpm verify-env to see details"
  exit 1
}
```

## IDE Integration

### VS Code Tasks

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Verify Environment",
      "type": "shell",
      "command": "pnpm verify-env",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Generate JWT Secrets",
      "type": "shell",
      "command": "pnpm generate-secrets",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

### VS Code Snippets

Add to `.vscode/peacase.code-snippets`:

```json
{
  "Verify Environment": {
    "prefix": "verify-env",
    "body": ["pnpm verify-env"],
    "description": "Verify environment configuration"
  },
  "Generate Secrets": {
    "prefix": "generate-secrets",
    "body": ["pnpm generate-secrets --env"],
    "description": "Generate JWT secrets"
  }
}
```

## Makefile Integration

Create a `Makefile`:

```makefile
.PHONY: verify-env generate-secrets setup

setup:
	@echo "Setting up development environment..."
	pnpm install
	@echo "\nGenerating JWT secrets..."
	pnpm generate-secrets
	@echo "\nPlease update apps/api/.env with the secrets above"
	@echo "Then run: make verify-env"

verify-env:
	@echo "Verifying environment configuration..."
	pnpm verify-env

verify-env-skip-optional:
	@echo "Verifying required environment configuration..."
	pnpm verify-env --skip-optional

generate-secrets:
	@echo "Generating new JWT secrets..."
	pnpm generate-secrets --env

dev: verify-env-skip-optional
	@echo "Starting development server..."
	pnpm dev

build: verify-env
	@echo "Building application..."
	pnpm build
```

Usage:
```bash
make setup          # First time setup
make verify-env     # Verify environment
make dev           # Verify then start dev server
make build         # Verify then build
```

## Environment File Management

### Development

Create `.env.development`:
```bash
# Development environment
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/peacase_dev
CORS_ORIGIN=http://localhost:3000
# ... dev-specific vars
```

### Staging

Create `.env.staging`:
```bash
# Staging environment
NODE_ENV=staging
DATABASE_URL=postgresql://staging-host/peacase_staging
CORS_ORIGIN=https://staging.yourapp.com
# ... staging-specific vars
```

### Production

Create `.env.production`:
```bash
# Production environment
NODE_ENV=production
DATABASE_URL=postgresql://prod-host/peacase_production
CORS_ORIGIN=https://yourapp.com
# ... production-specific vars
```

### Verification Commands

```bash
# Verify each environment
pnpm verify-env --env-file .env.development --skip-optional
pnpm verify-env --env-file .env.staging
pnpm verify-env --env-file .env.production
```

## Secret Rotation Workflow

### Monthly Rotation Script

Create `scripts/rotate-secrets.sh`:

```bash
#!/bin/bash

echo "🔄 Rotating JWT Secrets..."

# Generate new secrets
echo "\n📝 Generating new secrets..."
NEW_SECRETS=$(pnpm tsx scripts/generate-jwt-secrets.ts --env)

# Save to temporary file
echo "$NEW_SECRETS" > .env.new

echo "\n✅ New secrets generated and saved to .env.new"
echo "\n⚠️  IMPORTANT:"
echo "1. Update your production environment with these new secrets"
echo "2. Implement grace period for old tokens"
echo "3. Monitor for authentication errors"
echo "4. Remove .env.new after deployment"
echo "\n📋 New secrets:"
cat .env.new
```

Usage:
```bash
chmod +x scripts/rotate-secrets.sh
./scripts/rotate-secrets.sh
```

## Documentation Integration

### Add to Main README

Add this section to your main `README.md`:

```markdown
## Environment Configuration

This project includes automated environment verification scripts.

### Quick Setup

1. Generate JWT secrets:
   \`\`\`bash
   pnpm generate-secrets
   \`\`\`

2. Configure `.env` file:
   \`\`\`bash
   cp apps/api/.env.example apps/api/.env
   # Edit apps/api/.env with your values
   \`\`\`

3. Verify configuration:
   \`\`\`bash
   pnpm verify-env
   \`\`\`

For detailed instructions, see [scripts/QUICKSTART.md](./scripts/QUICKSTART.md).

### Available Scripts

- `pnpm verify-env` - Verify environment configuration
- `pnpm generate-secrets` - Generate secure JWT secrets

Full documentation: [scripts/README.md](./scripts/README.md)
```

## Testing Integration

Add environment verification to your test setup:

### Vitest

Add to `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

export default defineConfig({
  test: {
    setupFiles: ['./test/setup.ts'],
  },
});
```

Create `test/setup.ts`:

```typescript
import { config } from 'dotenv';
import { execSync } from 'child_process';

// Load test environment
config({ path: '.env.test' });

// Verify test environment
try {
  execSync('pnpm verify-env --env-file .env.test --skip-optional', {
    stdio: 'inherit',
  });
} catch (error) {
  console.error('❌ Test environment verification failed');
  process.exit(1);
}
```

## Monitoring Integration

### Health Check Endpoint

Add to your API:

```typescript
import { Router } from 'express';

const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  const checks = {
    database: checkDatabaseConnection(),
    jwt: checkJWTConfig(),
    env: checkRequiredEnvVars(),
  };

  const allHealthy = Object.values(checks).every(c => c.healthy);

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
  });
});
```

### Startup Verification

Add to your main entry point:

```typescript
import { execSync } from 'child_process';

async function startServer() {
  console.log('Verifying environment...');

  try {
    execSync('pnpm verify-env', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Environment verification failed');
    process.exit(1);
  }

  // Start server
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

startServer();
```

## Summary

The environment verification scripts can be integrated into:

- ✅ Package.json scripts
- ✅ CI/CD pipelines (GitHub Actions, GitLab, etc.)
- ✅ Docker builds
- ✅ Deployment platforms (Vercel, Railway, Heroku, Render)
- ✅ Pre-commit hooks (Husky)
- ✅ IDE tasks (VS Code)
- ✅ Makefiles
- ✅ Test setup
- ✅ Application health checks
- ✅ Server startup

Choose the integrations that best fit your workflow and team practices.
