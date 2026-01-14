# Automated Deployment System Design

## Goal
Eliminate manual deployment work by creating a web-based, no-code deployment system that requires zero technical knowledge.

## Problem Statement
Current deployment requires:
- Manually clicking through Render, Vercel, Supabase dashboards
- Hunting for and copying API keys and environment variables
- Coordinating URLs between frontend and backend (CORS, API endpoints)
- Understanding technical concepts like environment variables, build commands, etc.

**User requirement:** "I don't know anything about coding" - needs web UI, not CLI

## Solution Architecture

### Three-Tier Approach

**Tier 1: Deploy Buttons (Immediate - $0/month)**
- One-click deploy buttons in GitHub README
- Pre-configured templates for Render + Vercel
- 5 minutes to deploy, 30 seconds to update
- Use existing Supabase database

**Tier 2: GitHub Actions Button (Future - $0/month)**
- One-button deploy from GitHub Actions tab
- Full automation via Render + Vercel APIs
- Auto-syncing environment variables
- Skip this tier - not worth the complexity

**Tier 3: Self-Hosted Dashboard (When profitable - $6/month)**
- CapRover - open-source PaaS
- Own PostgreSQL, Redis, everything
- Beautiful web dashboard for all operations
- One-click updates, built-in monitoring

### Recommended Path
1. **Start:** Deploy Buttons (today)
2. **Upgrade:** CapRover (when 10-20 active clients)

## Technical Design

### Approach #1: Deploy Buttons

**Components:**

1. **render.yaml** - Infrastructure as Code
   - Defines API service configuration
   - Pre-configured environment variables
   - Build commands for monorepo
   - Health check endpoints

2. **vercel.json** - Frontend configuration
   - Root directory: apps/web
   - Build settings for Next.js
   - Environment variable template
   - Framework preset

3. **Deploy buttons** in README.md
   - Render: `[![Deploy to Render](badge)](link-with-params)`
   - Vercel: `[![Deploy to Vercel](badge)](link-with-params)`
   - Both pre-fill all configuration

**User Flow:**
1. User clicks "Deploy to Render" button in README
2. Browser opens Render with pre-filled form
3. User clicks "Create Web Service" (no editing needed)
4. API deploys automatically (3-5 minutes)
5. User copies API URL from Render
6. User clicks "Deploy to Vercel" button in README
7. Browser opens Vercel with pre-filled form
8. User pastes API URL into one field
9. User clicks "Deploy" (no other changes needed)
10. Frontend deploys automatically (5-7 minutes)
11. Done - app is live

**Environment Variables Handling:**
- Render: Pre-filled in render.yaml (except DATABASE_URL - must be secure)
- Vercel: Pre-filled in vercel.json (except NEXT_PUBLIC_API_URL - comes from Render)
- User only enters 2 values total

**Cost:**
- Render Free: 750 hours/month, 512MB RAM, sleeps after inactivity
- Vercel Free: 100GB bandwidth, unlimited requests, hobby projects
- Supabase Free: 500MB database, 2GB file storage
- **Total: $0/month**

**Limitations:**
- Backend sleeps after 15 minutes inactivity (30s cold start)
- Need to manually update CORS when URLs change
- Database limited to 500MB

### Approach #3: CapRover Self-Hosted

**Components:**

1. **CapRover installation** on VPS
   - One-command install script
   - Automatic Docker setup
   - Automatic Nginx reverse proxy
   - Automatic Let's Encrypt SSL

2. **Captain Definition file** - App configuration
   - Dockerfile location
   - Port mapping
   - Environment variables template

3. **Web Dashboard**
   - One-click deploy from GitHub
   - Built-in PostgreSQL one-click app
   - Built-in Redis one-click app
   - Log viewer, monitoring, scaling

**User Flow (One-time setup):**
1. Rent $6/month VPS (DigitalOcean, Hetzner, Vultr)
2. Run: `docker run ... caprover/caprover`
3. Open CapRover dashboard in browser
4. Click "One-Click Apps" → Install PostgreSQL
5. Click "One-Click Apps" → Install Redis
6. Click "Apps" → "Create New App" → Connect GitHub
7. Click "Deploy"

**User Flow (Every deploy after):**
1. Open CapRover dashboard
2. Click "Apps" → "peacase-api" → "Deploy"
3. Done (auto-updates frontend too)

**Cost:**
- VPS: $4-6/month (Hetzner cheapest, DigitalOcean easiest)
- CapRover: Free
- **Total: $6/month** (but includes database, Redis, unlimited apps)

**Benefits over Approach #1:**
- No cold starts (always on)
- No 500MB database limit
- Own Redis cache (faster performance)
- One dashboard for everything
- Can add other apps (analytics, admin tools, etc.)

## Migration Path

**When to migrate from Approach #1 to #3:**

Trigger points:
- Database approaching 500MB
- Backend cold starts annoying users
- 10-20 active salon clients (revenue > $100/month)
- Need Redis for session management
- Want staging environment

**Migration process:**
1. Rent VPS and install CapRover (30 minutes)
2. Export Supabase database (one SQL dump)
3. Import to CapRover PostgreSQL (one command)
4. Deploy apps to CapRover (click buttons)
5. Update DNS to point to new server (5 minutes)
6. Delete Render + Vercel services
7. Cancel Supabase subscription

**Downtime:** ~5 minutes (just DNS propagation)

## Implementation Plan

### Phase 1: Deploy Buttons (This PR)
1. Create render.yaml with pre-configured API service
2. Update vercel.json with deploy button params
3. Add deploy buttons to README.md
4. Create DEPLOYMENT.md guide with screenshots
5. Test end-to-end deployment flow
6. Document troubleshooting steps

### Phase 2: CapRover Documentation (This PR)
1. Create docs/CAPROVER_MIGRATION.md
2. Document VPS provider selection
3. Step-by-step CapRover installation guide
4. Screenshot every step (for non-technical users)
5. Database migration script
6. Rollback procedure

## Success Criteria

**Approach #1 (Deploy Buttons):**
- [ ] Non-technical user can deploy in under 10 minutes
- [ ] Only 2 values need manual entry (DATABASE_URL, API_URL)
- [ ] App is live and functional after deploy
- [ ] README has clear button-based instructions
- [ ] Screenshots show every click needed

**Approach #3 (CapRover Migration):**
- [ ] Migration guide is screenshot-heavy
- [ ] Every terminal command is copy-paste ready
- [ ] Database export/import is scripted
- [ ] Zero coding knowledge required
- [ ] Rollback plan if something goes wrong

## Tech Stack

**Approach #1:**
- Render.com (API hosting)
- Vercel (Frontend hosting)
- Supabase (PostgreSQL database)
- GitHub (Code repository)

**Approach #3:**
- DigitalOcean/Hetzner VPS (Server)
- CapRover (Platform)
- Docker (Containerization - hidden from user)
- PostgreSQL (Database - CapRover one-click app)
- Redis (Cache - CapRover one-click app)
- Nginx (Reverse proxy - automatic)
- Let's Encrypt (SSL - automatic)

## Open Questions

None - design is complete and validated with user.
