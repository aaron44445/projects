# ============================================
# Peacase API - Multi-stage Docker Build
# ============================================

# Stage 1: Base with pnpm
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
RUN apk add --no-cache libc6-compat

# Stage 2: Dependencies
FROM base AS deps
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

# Copy package.json files for all packages
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules

# Copy source files
COPY pnpm-workspace.yaml package.json tsconfig.json ./
COPY apps/api ./apps/api
COPY packages/database ./packages/database
COPY packages/types ./packages/types

# Generate Prisma client
WORKDIR /app/packages/database
RUN pnpm db:generate

# Build the API
WORKDIR /app/apps/api
RUN pnpm build

# Stage 4: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 peacase

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./

# Copy Prisma schema and generated client
COPY --from=builder /app/packages/database/prisma ./prisma
COPY --from=builder /app/packages/database/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/packages/database/node_modules/@prisma ./node_modules/@prisma

# Copy workspace packages
COPY --from=builder /app/packages/types ./node_modules/@peacase/types

# Install production dependencies only
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
RUN pnpm install --prod --frozen-lockfile || npm install --omit=dev

# Set ownership
RUN chown -R peacase:nodejs /app

USER peacase

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
