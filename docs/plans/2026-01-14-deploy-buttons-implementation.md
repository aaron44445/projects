# Automated Deploy Buttons Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create one-click deploy buttons that eliminate manual deployment configuration work.

**Architecture:** Infrastructure-as-Code configuration files (render.yaml, vercel.json) with pre-filled environment variables, plus comprehensive documentation with screenshots for non-technical users.

**Tech Stack:** Render.com Blueprint API, Vercel Deploy Button API, Markdown documentation

---

## Task 1: Create Render Blueprint Configuration

**Files:**
- Create: `render.yaml`

**Step 1: Create render.yaml with API service definition**

Create `render.yaml` in project root:

```yaml
services:
  - type: web
    name: peacase-api
    runtime: node
    region: oregon
    plan: free
    branch: main
    rootDir: apps/api
    buildCommand: cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @peacase/api build
    startCommand: cd ../.. && pnpm --filter @peacase/api start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: JWT_EXPIRY
        value: 7d
      - key: JWT_REFRESH_EXPIRY
        value: 30d
      - key: CORS_ORIGIN
        sync: false
      - key: FRONTEND_URL
        sync: false
```

**Step 2: Verify YAML syntax**

Run: `cd .worktrees/automated-deployment-buttons && cat render.yaml`
Expected: File displays correctly with proper indentation

**Step 3: Commit render.yaml**

```bash
cd .worktrees/automated-deployment-buttons
git add render.yaml
git commit -m "feat: add Render blueprint for one-click API deployment

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Update Vercel Configuration

**Files:**
- Modify: `vercel.json`

**Step 1: Read existing vercel.json**

Run: `cd .worktrees/automated-deployment-buttons && cat vercel.json`
Expected: See existing Vercel configuration

**Step 2: Update vercel.json with deploy button parameters**

Replace entire `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/web/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "apps/web/$1"
    }
  ],
  "build": {
    "env": {
      "NEXT_PUBLIC_API_URL": "@next-public-api-url"
    }
  },
  "env": {
    "NEXT_PUBLIC_API_URL": "@next-public-api-url"
  },
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm --filter @peacase/web build",
  "outputDirectory": "apps/web/.next"
}
```

**Step 3: Verify JSON syntax**

Run: `cd .worktrees/automated-deployment-buttons && node -e "console.log(JSON.parse(require('fs').readFileSync('vercel.json', 'utf8')))"`
Expected: JSON parses without errors

**Step 4: Commit vercel.json update**

```bash
cd .worktrees/automated-deployment-buttons
git add vercel.json
git commit -m "feat: update Vercel config for one-click frontend deployment

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Add Deploy Buttons to README

**Files:**
- Modify: `README.md`

**Step 1: Read existing README**

Run: `cd .worktrees/automated-deployment-buttons && head -20 README.md`
Expected: See current README structure

**Step 2: Add deployment section with buttons**

Add after the description section (around line 10-15):

```markdown
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
```

**Step 3: Verify markdown formatting**

Run: `cd .worktrees/automated-deployment-buttons && grep -A 5 "Quick Deploy" README.md`
Expected: Section appears correctly formatted

**Step 4: Commit README update**

```bash
cd .worktrees/automated-deployment-buttons
git add README.md
git commit -m "docs: add one-click deploy buttons to README

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create Detailed Deployment Guide

**Files:**
- Create: `docs/DEPLOYMENT.md`

**Step 1: Create comprehensive deployment guide**

Create `docs/DEPLOYMENT.md`:

```markdown
# Peacase Deployment Guide

## Table of Contents
1. [Quick Deploy (Recommended)](#quick-deploy)
2. [Manual Deployment](#manual-deployment)
3. [Environment Variables Reference](#environment-variables)
4. [Troubleshooting](#troubleshooting)

---

## Quick Deploy

The fastest way to deploy Peacase using our pre-configured deploy buttons.

### Prerequisites
- GitHub account
- Supabase account (free tier) with PostgreSQL database
- 10 minutes

### Step-by-Step Instructions

#### Step 1: Deploy Backend API to Render

1. **Click the Deploy to Render button** in the [README](../README.md#quick-deploy)

2. **Login to Render**
   - Click "Login with GitHub"
   - Authorize Render to access your repositories

3. **Blueprint Auto-Detection**
   - Render automatically detects `render.yaml`
   - Service name: `peacase-api`
   - Region: Oregon (US West)
   - Plan: Free

4. **Add Environment Variables**

   You'll see a form with most variables pre-filled. Add these 3:

   | Variable | Value | Where to Get It |
   |----------|-------|-----------------|
   | `DATABASE_URL` | `postgresql://postgres:PASSWORD@HOST:5432/postgres` | Supabase Dashboard → Project Settings → Database → Connection String |
   | `CORS_ORIGIN` | `https://your-app.vercel.app` | Leave as placeholder, update in Step 3 |
   | `FRONTEND_URL` | `https://your-app.vercel.app` | Same as CORS_ORIGIN |

5. **Click "Create Web Service"**
   - Build takes 3-5 minutes
   - Watch logs in real-time
   - Look for "Server running on port 3001"

6. **Copy Your API URL**
   - Top of dashboard shows URL: `https://peacase-api-xyz.onrender.com`
   - Copy this - you'll need it in Step 2

**Screenshot placeholders:**
- [ ] TODO: Screenshot of Render blueprint page
- [ ] TODO: Screenshot of environment variables form
- [ ] TODO: Screenshot of successful deployment

---

#### Step 2: Deploy Frontend to Vercel

1. **Click the Deploy with Vercel button** in the [README](../README.md#quick-deploy)

2. **Login to Vercel**
   - Click "Continue with GitHub"
   - Authorize Vercel

3. **Configure Project**
   - Repository Name: `peacase` (or keep default)
   - Framework Preset: Next.js (auto-detected)
   - **Root Directory:** Click "Edit" → Type `apps/web` → Click "Continue"

4. **Add Environment Variable**

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | Paste the Render URL from Step 1 (e.g., `https://peacase-api-xyz.onrender.com`) |

5. **Click "Deploy"**
   - Build takes 5-7 minutes
   - Vercel optimizes for production
   - Look for "Congratulations!"

6. **Copy Your Frontend URL**
   - Vercel shows URL: `https://peacase-abc123.vercel.app`
   - Copy this - you'll need it in Step 3

**Screenshot placeholders:**
- [ ] TODO: Screenshot of Vercel root directory selection
- [ ] TODO: Screenshot of environment variable setup
- [ ] TODO: Screenshot of successful deployment

---

#### Step 3: Update Backend CORS Settings

Your backend needs to know which frontend can connect to it.

1. **Go back to Render Dashboard**
   - Open your `peacase-api` service

2. **Navigate to Environment Tab**
   - Left sidebar → Environment

3. **Update These Variables**

   | Variable | New Value |
   |----------|-----------|
   | `CORS_ORIGIN` | Your Vercel URL (e.g., `https://peacase-abc123.vercel.app`) |
   | `FRONTEND_URL` | Same as CORS_ORIGIN |

4. **Save Changes**
   - Click "Save Changes"
   - Render automatically redeploys (takes 2-3 minutes)

5. **Wait for Redeploy**
   - Watch for "Live" status
   - Green checkmark means ready

**Screenshot placeholders:**
- [ ] TODO: Screenshot of Render environment variables page
- [ ] TODO: Screenshot of save confirmation

---

#### Step 4: Test Your Deployment

1. **Open Your Vercel URL**
   - Go to `https://peacase-abc123.vercel.app`

2. **Try Signing Up**
   - Click "Sign Up"
   - Enter email, password, salon name
   - Click "Create Account"
   - Should redirect to onboarding wizard

3. **Verify Database Connection**
   - Check Supabase dashboard
   - Tables → `users` table should have 1 row

4. **Test Login**
   - Logout
   - Login with credentials
   - Should see dashboard

**If anything fails:** See [Troubleshooting](#troubleshooting)

---

## Manual Deployment

For advanced users who want more control.

### Render Manual Setup

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** `peacase-api`
   - **Region:** Oregon
   - **Branch:** `main`
   - **Root Directory:** `apps/api`
   - **Runtime:** Node
   - **Build Command:** `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @peacase/api build`
   - **Start Command:** `cd ../.. && pnpm --filter @peacase/api start`
   - **Plan:** Free
5. Add all environment variables from [reference](#environment-variables)
6. Click "Create Web Service"

### Vercel Manual Setup

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** Leave default (auto-detected)
   - **Output Directory:** Leave default
   - **Install Command:** `cd ../.. && pnpm install --frozen-lockfile`
4. Add environment variable: `NEXT_PUBLIC_API_URL`
5. Click "Deploy"

---

## Environment Variables

### Backend (Render)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NODE_ENV` | ✅ Yes | Environment mode | `production` |
| `PORT` | ✅ Yes | Server port | `3001` |
| `JWT_SECRET` | ✅ Yes | JWT signing secret (32+ chars) | Auto-generated by Render |
| `JWT_REFRESH_SECRET` | ✅ Yes | Refresh token secret (32+ chars) | Auto-generated by Render |
| `JWT_EXPIRY` | ✅ Yes | Access token lifetime | `7d` |
| `JWT_REFRESH_EXPIRY` | ✅ Yes | Refresh token lifetime | `30d` |
| `CORS_ORIGIN` | ✅ Yes | Allowed frontend origin | `https://peacase.vercel.app` |
| `FRONTEND_URL` | ✅ Yes | Frontend URL for links | Same as CORS_ORIGIN |
| `STRIPE_SECRET_KEY` | ❌ No | Stripe API key (when ready) | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | ❌ No | Stripe webhook secret | `whsec_...` |
| `SENDGRID_API_KEY` | ❌ No | SendGrid for emails | `SG....` |
| `SENDGRID_FROM_EMAIL` | ❌ No | Sender email address | `noreply@peacase.com` |

### Frontend (Vercel)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Backend API URL | `https://peacase-api.onrender.com` |

---

## Troubleshooting

### "Failed to fetch" on signup/login

**Problem:** Frontend can't connect to backend

**Solutions:**
1. Check CORS settings in Render
   - Verify `CORS_ORIGIN` matches your Vercel URL exactly
   - No trailing slash
2. Check API is running
   - Open `https://your-api.onrender.com/health`
   - Should see `{"status":"ok"}`
3. Check browser console
   - F12 → Console tab
   - Look for CORS errors

### Backend returns 500 errors

**Problem:** Database connection or server error

**Solutions:**
1. Check Render logs
   - Render Dashboard → Logs tab
   - Look for database connection errors
2. Verify DATABASE_URL
   - Should start with `postgresql://`
   - Check password is correct
   - Test connection from Render shell
3. Check environment variables
   - All required variables set?
   - No typos?

### Build fails on Render

**Problem:** Build command errors

**Solutions:**
1. Check build logs
   - Look for "command not found" errors
   - Look for missing dependencies
2. Verify root directory is `apps/api`
3. Verify build command uses monorepo structure:
   ```bash
   cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @peacase/api build
   ```

### Build fails on Vercel

**Problem:** Next.js build errors

**Solutions:**
1. Check build logs
   - Look for TypeScript errors
   - Look for missing environment variables
2. Verify root directory is `apps/web`
3. Verify `NEXT_PUBLIC_API_URL` is set

### Render service goes to sleep

**Problem:** Free tier sleeps after 15 minutes of inactivity

**Solutions:**
1. Upgrade to paid plan ($7/month) for always-on
2. Use a cron job to ping every 10 minutes (not recommended)
3. Migrate to CapRover self-hosted (see [CapRover Migration Guide](./CAPROVER_MIGRATION.md))

### Domain setup (when Namecheap unlocks)

**Problem:** Want to use peacase.com instead of vercel.app

**Solutions:**
1. Vercel Dashboard → Project Settings → Domains
2. Add domain: `peacase.com`
3. Follow Vercel's DNS instructions
4. Add CNAME records in Namecheap
5. Update `CORS_ORIGIN` in Render to `https://peacase.com`

---

## Next Steps

- **When profitable:** Migrate to [CapRover self-hosted](./CAPROVER_MIGRATION.md)
- **Add Stripe:** Get API keys, add to Render environment
- **Custom domain:** Configure when Namecheap unlocks
- **Monitoring:** Set up error tracking (Sentry, LogRocket)
```

**Step 2: Verify markdown syntax**

Run: `cd .worktrees/automated-deployment-buttons && head -50 docs/DEPLOYMENT.md`
Expected: Well-formatted markdown document

**Step 3: Commit deployment guide**

```bash
cd .worktrees/automated-deployment-buttons
git add docs/DEPLOYMENT.md
git commit -m "docs: add comprehensive deployment guide with troubleshooting

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create CapRover Migration Guide

**Files:**
- Create: `docs/CAPROVER_MIGRATION.md`

**Step 1: Create CapRover migration documentation**

Create `docs/CAPROVER_MIGRATION.md`:

```markdown
# CapRover Self-Hosted Migration Guide

## When to Migrate

Migrate from Render/Vercel to CapRover when:

- ✅ You have 10-20 active salon clients
- ✅ Monthly revenue exceeds $100
- ✅ Backend cold starts are annoying users
- ✅ Database approaching 500MB limit
- ✅ Need staging environment
- ✅ Want full control

**Cost comparison:**

| Platform | Monthly Cost | Limits |
|----------|--------------|--------|
| Render Free | $0 | Sleeps after 15min, 512MB RAM |
| Vercel Free | $0 | 100GB bandwidth |
| Supabase Free | $0 | 500MB database |
| **CapRover** | **$6** | **No limits** (VPS resources) |

---

## Overview

CapRover creates your own Heroku-like platform on a VPS you rent.

**What you get:**
- Beautiful web dashboard for deployments
- One-click PostgreSQL, Redis, monitoring tools
- Automatic SSL certificates
- No cold starts
- Unlimited apps

**Time:** 30 minutes one-time setup, then 10 seconds to deploy forever

---

## Prerequisites

- $6/month budget for VPS
- Domain name (optional but recommended)
- 30 minutes

---

## Step 1: Rent a VPS

### Option A: Hetzner (Cheapest - €4.15/month)

1. Go to https://www.hetzner.com/cloud
2. Click "Sign Up"
3. Complete registration
4. Click "Add Server"
5. Select:
   - Location: Any (Ashburn, VA is closest to US)
   - Image: Ubuntu 22.04
   - Type: CX11 (2GB RAM, 1 vCPU)
   - Networking: IPv4 + IPv6
6. Server name: `peacase-production`
7. Click "Create & Buy Now"
8. **Save your server IP address** (e.g., `123.45.67.89`)

### Option B: DigitalOcean (Easiest - $6/month)

1. Go to https://www.digitalocean.com
2. Sign up (get $200 credit with student/startup programs)
3. Click "Create" → "Droplets"
4. Select:
   - Region: New York or San Francisco
   - Image: Ubuntu 22.04 LTS
   - Plan: Basic ($6/month, 1GB RAM)
   - Authentication: SSH Key (recommended) or Password
5. Hostname: `peacase-production`
6. Click "Create Droplet"
7. **Save your droplet IP address**

### Option C: Vultr (Middle Ground - $6/month)

Similar process to DigitalOcean

---

## Step 2: Install CapRover

### 2.1: SSH into Your Server

**Mac/Linux:**
```bash
ssh root@YOUR_SERVER_IP
```

**Windows:**
- Use PuTTY or Windows Terminal
- Enter IP address, click Connect

### 2.2: Run CapRover Installer

Copy-paste this ONE command:

```bash
docker run -p 80:80 -p 443:443 -p 3000:3000 -v /var/run/docker.sock:/var/run/docker.sock -v /captain:/captain caprover/caprover
```

**Wait 2-3 minutes** for:
- Docker installation
- CapRover setup
- Certificate configuration

**Expected output:**
```
>>> CapRover is installed and running!
>>> Access your dashboard at: http://YOUR_SERVER_IP:3000
>>> Default password: captain42
```

### 2.3: Access CapRover Dashboard

1. Open browser: `http://YOUR_SERVER_IP:3000`
2. Login with password: `captain42`
3. **Change password immediately**
4. Enable HTTPS (CapRover guides you through this)

---

## Step 3: Install Database

### 3.1: Install PostgreSQL

1. CapRover Dashboard → Apps → One-Click Apps/Databases
2. Search for "PostgreSQL"
3. Click "PostgreSQL"
4. Configure:
   - App Name: `peacase-db`
   - PostgreSQL Version: 16
   - Database Name: `peacase`
   - Database User: `peacase`
   - Database Password: Generate strong password (save it!)
5. Click "Deploy"
6. Wait 1-2 minutes

### 3.2: Get Database Connection String

1. CapRover → Apps → `peacase-db`
2. Connection string format:
   ```
   postgresql://peacase:YOUR_PASSWORD@srv-captain--peacase-db:5432/peacase
   ```
3. **Save this connection string**

---

## Step 4: Export Data from Supabase

### 4.1: Export Database

1. Go to Supabase Dashboard
2. Project Settings → Database
3. Connection String → Copy URI
4. On your local machine, run:
   ```bash
   pg_dump "YOUR_SUPABASE_CONNECTION_STRING" > peacase_backup.sql
   ```

### 4.2: Import to CapRover

1. CapRover → Apps → `peacase-db` → Connect
2. Opens psql terminal
3. Copy-paste contents of `peacase_backup.sql`
4. Press Enter
5. Wait for import (30 seconds)

**Verify:**
```sql
\dt
SELECT COUNT(*) FROM users;
```

---

## Step 5: Deploy Backend API

### 5.1: Create App

1. CapRover → Apps → Click "Create New App"
2. App Name: `peacase-api`
3. Click "Create"

### 5.2: Configure App

1. Click `peacase-api`
2. App Configs tab:
   - Method: Deploy from GitHub/Bitbucket
   - Repository: `https://github.com/aaron44445/projects`
   - Branch: `main`
   - Dockerfile Path: `apps/api/Dockerfile`

### 5.3: Add Environment Variables

Click "App Configs" → "Environment Variables":

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DATABASE_URL` | Connection string from Step 3.2 |
| `JWT_SECRET` | Copy from Render |
| `JWT_REFRESH_SECRET` | Copy from Render |
| `JWT_EXPIRY` | `7d` |
| `JWT_REFRESH_EXPIRY` | `30d` |
| `CORS_ORIGIN` | `https://peacase-api.YOUR_DOMAIN` |
| `FRONTEND_URL` | `https://peacase.YOUR_DOMAIN` |

### 5.4: Enable HTTPS

1. HTTP Settings tab
2. Check "Enable HTTPS"
3. Check "Force HTTPS"
4. Click "Save & Restart"

### 5.5: Deploy

1. Deployment tab
2. Click "Deploy Now"
3. Watch logs (3-5 minutes)
4. Look for "Server running on port 3001"

---

## Step 6: Deploy Frontend

### 6.1: Create App

1. CapRover → Apps → Click "Create New App"
2. App Name: `peacase-web`
3. Click "Create"

### 6.2: Configure App

1. Click `peacase-web`
2. App Configs tab:
   - Repository: `https://github.com/aaron44445/projects`
   - Branch: `main`
   - Dockerfile Path: `apps/web/Dockerfile`

### 6.3: Add Environment Variables

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://peacase-api.YOUR_DOMAIN` |

### 6.4: Enable HTTPS

Same as Step 5.4

### 6.5: Deploy

1. Deployment tab
2. Click "Deploy Now"
3. Wait 5-7 minutes

---

## Step 7: Configure Domain

### 7.1: Add Custom Domains in CapRover

**API:**
1. CapRover → Apps → `peacase-api`
2. HTTP Settings → Custom Domain
3. Enter: `api.peacase.com`
4. Click "Connect New Domain"

**Frontend:**
1. CapRover → Apps → `peacase-web`
2. HTTP Settings → Custom Domain
3. Enter: `peacase.com`
4. Click "Connect New Domain"

### 7.2: Update DNS (Namecheap)

1. Namecheap → Domain List → peacase.com → Manage
2. Advanced DNS tab
3. Add records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | YOUR_SERVER_IP | Automatic |
| A Record | api | YOUR_SERVER_IP | Automatic |
| A Record | www | YOUR_SERVER_IP | Automatic |

4. Save changes
5. Wait 10-30 minutes for DNS propagation

---

## Step 8: Test Migration

1. Open `https://peacase.com`
2. Login with existing credentials
3. Verify data appears (clients, services, etc.)
4. Create test appointment
5. Check CapRover logs for errors

---

## Step 9: Cleanup Old Services

### Render
1. Render Dashboard → peacase-api
2. Settings → Delete Service

### Vercel
1. Vercel Dashboard → peacase
2. Settings → Delete Project

### Supabase
Keep it as backup for 7 days, then delete if CapRover stable

---

## Maintenance

### Backups

**Automated database backups:**
1. CapRover → Apps → peacase-db
2. Click "Enable Backup"
3. Schedule: Daily at 3am
4. Retention: 7 days

**Manual backup:**
```bash
ssh root@YOUR_SERVER_IP
docker exec peacase-db pg_dump -U peacase peacase > /backup/peacase_$(date +%Y%m%d).sql
```

### Updates

**Update CapRover:**
```bash
ssh root@YOUR_SERVER_IP
docker pull caprover/caprover
docker service update captain-captain --image caprover/caprover
```

**Update Apps:**
1. CapRover Dashboard → Apps → peacase-api
2. Deployment tab → Deploy Now

### Monitoring

**Built-in CapRover metrics:**
- Apps → peacase-api → Monitoring
- Shows CPU, RAM, network usage

**Install monitoring tools:**
1. One-Click Apps → Grafana
2. One-Click Apps → Prometheus
3. Connect to CapRover metrics

---

## Rollback Plan

If something goes wrong:

1. **DNS Rollback (immediate)**
   - Namecheap → Update A records back to Vercel/Render IPs
   - Takes 5-10 minutes

2. **Database Rollback**
   - Import backup to Supabase
   - Update Render DATABASE_URL

3. **Full Rollback**
   - Re-enable Render + Vercel services
   - Update DNS back to old setup
   - Delete CapRover server (get refund)

---

## Cost Breakdown

| Item | Monthly Cost |
|------|--------------|
| VPS (Hetzner CX11) | €4.15 ($4.50) |
| Domain (peacase.com) | $1.00 (paid annually) |
| **Total** | **~$6/month** |

**vs. Scaling on free tiers:**
- Render Pro (no sleep): $7/month
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- **Total without CapRover: $52/month**

**Savings: $46/month** when you scale up

---

## FAQ

**Q: Is this secure?**
A: Yes. CapRover handles SSL certificates automatically via Let's Encrypt. Keep server updated.

**Q: What if server goes down?**
A: VPS providers have 99.9% uptime. CapRover auto-restarts crashed apps. Set up monitoring.

**Q: Can I scale to multiple servers?**
A: Yes, CapRover supports multi-server clusters. Add workers as you grow.

**Q: What about Redis?**
A: CapRover → One-Click Apps → Redis. Takes 1 minute.

**Q: Can I install other apps?**
A: Yes! WordPress, analytics, admin tools - all via one-click apps.

---

## Support

- CapRover Docs: https://caprover.com/docs
- CapRover GitHub: https://github.com/caprover/caprover
- Community: CapRover Discord

---

## Summary

**Migration checklist:**
- [ ] Rent VPS ($6/month)
- [ ] Install CapRover (1 command)
- [ ] Install PostgreSQL via one-click
- [ ] Export/import database
- [ ] Deploy API
- [ ] Deploy frontend
- [ ] Configure domain
- [ ] Test thoroughly
- [ ] Delete old services
- [ ] Set up backups

**Total time:** 30 minutes
**Total cost:** $6/month
**Benefits:** Full control, no limits, no cold starts
```

**Step 2: Verify markdown syntax**

Run: `cd .worktrees/automated-deployment-buttons && head -100 docs/CAPROVER_MIGRATION.md`
Expected: Well-structured migration guide

**Step 3: Commit CapRover guide**

```bash
cd .worktrees/automated-deployment-buttons
git add docs/CAPROVER_MIGRATION.md
git commit -m "docs: add CapRover self-hosted migration guide

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Update Root README with Quick Start

**Files:**
- Modify: `README.md` (if not already updated in Task 3)

**Step 1: Verify deploy section exists**

Run: `cd .worktrees/automated-deployment-buttons && grep -n "Quick Deploy" README.md`
Expected: Line number of Quick Deploy section (or empty if Task 3 skipped)

**Step 2: If section doesn't exist, add it**

(Already covered in Task 3, this is a verification step)

**Step 3: Add link to detailed docs**

After the Quick Deploy section, ensure there's a link to comprehensive docs:

```markdown
📖 **Need help?** See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed step-by-step guide with screenshots.

💰 **Planning to scale?** See [CapRover Migration Guide](./docs/CAPROVER_MIGRATION.md) for self-hosted option ($6/month).
```

**Step 4: Commit if changes made**

```bash
cd .worktrees/automated-deployment-buttons
git add README.md
git commit -m "docs: add links to comprehensive deployment guides

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Test Configuration Files

**Files:**
- Test: `render.yaml`
- Test: `vercel.json`

**Step 1: Validate render.yaml syntax**

Run: `cd .worktrees/automated-deployment-buttons && python3 -c "import yaml; yaml.safe_load(open('render.yaml'))"`
Expected: No errors (Python parses YAML successfully)

**Step 2: Validate vercel.json syntax**

Run: `cd .worktrees/automated-deployment-buttons && node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf8'))"`
Expected: No errors (Node parses JSON successfully)

**Step 3: Verify all required fields present in render.yaml**

Run: `cd .worktrees/automated-deployment-buttons && grep -E "(type|name|runtime|buildCommand|startCommand|envVars)" render.yaml`
Expected: All key fields present

**Step 4: Verify all required fields present in vercel.json**

Run: `cd .worktrees/automated-deployment-buttons && grep -E "(builds|routes|buildCommand|outputDirectory)" vercel.json`
Expected: All key fields present

**Step 5: Document test results**

No commit needed - validation tests only

---

## Task 8: Create Deployment Checklist

**Files:**
- Create: `docs/DEPLOYMENT_CHECKLIST.md`

**Step 1: Create pre-deployment checklist**

Create `docs/DEPLOYMENT_CHECKLIST.md`:

```markdown
# Deployment Checklist

Use this checklist every time you deploy to ensure nothing is missed.

---

## Pre-Deployment

### Code Readiness
- [ ] All tests passing locally
- [ ] No console.log statements in production code
- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings resolved
- [ ] Environment variables documented in `.env.example`

### Database
- [ ] Database schema matches code expectations
- [ ] Migrations ready (if using Prisma migrate)
- [ ] Database connection string tested
- [ ] Database has required extensions (if any)

### Configuration
- [ ] `render.yaml` syntax validated
- [ ] `vercel.json` syntax validated
- [ ] CORS origins configured correctly
- [ ] JWT secrets are strong (32+ characters)
- [ ] No sensitive data in git repository

### Documentation
- [ ] README.md updated with any new features
- [ ] Environment variables documented
- [ ] Deployment guide reflects current process

---

## Deployment Steps

### Backend (Render)
- [ ] Click "Deploy to Render" button
- [ ] Verify service name: `peacase-api`
- [ ] Add DATABASE_URL environment variable
- [ ] Add CORS_ORIGIN (placeholder OK, update later)
- [ ] Add FRONTEND_URL (placeholder OK, update later)
- [ ] Click "Create Web Service"
- [ ] Wait for build (3-5 minutes)
- [ ] Verify build logs show no errors
- [ ] Copy API URL
- [ ] Test health endpoint: `https://your-api.onrender.com/health`
- [ ] Response should be: `{"status":"ok"}`

### Frontend (Vercel)
- [ ] Click "Deploy with Vercel" button
- [ ] Set root directory: `apps/web`
- [ ] Add NEXT_PUBLIC_API_URL (from Render)
- [ ] Click "Deploy"
- [ ] Wait for build (5-7 minutes)
- [ ] Verify build logs show no errors
- [ ] Copy Vercel URL
- [ ] Open URL in browser
- [ ] Homepage loads correctly

### CORS Update
- [ ] Go back to Render dashboard
- [ ] Navigate to Environment tab
- [ ] Update CORS_ORIGIN with Vercel URL
- [ ] Update FRONTEND_URL with Vercel URL
- [ ] Click "Save Changes"
- [ ] Wait for automatic redeploy (2-3 minutes)

---

## Post-Deployment Testing

### Smoke Tests
- [ ] Homepage loads without errors
- [ ] Signup page loads
- [ ] Login page loads
- [ ] Browser console shows no errors
- [ ] Browser network tab shows API calls succeeding

### Authentication
- [ ] Create new account (signup)
- [ ] Verify email/password validation works
- [ ] Verify account created (check database or Render logs)
- [ ] Logout
- [ ] Login with new account
- [ ] Dashboard loads after login
- [ ] Profile page shows correct user data

### Core Features (Quick Test)
- [ ] Create a test client
- [ ] Create a test service
- [ ] View clients list
- [ ] View services list

### Database Verification
- [ ] Supabase dashboard shows new user
- [ ] Supabase dashboard shows test client
- [ ] Supabase dashboard shows test service

### Error Handling
- [ ] Try login with wrong password (should show error)
- [ ] Try signup with invalid email (should show validation)
- [ ] Try accessing protected route while logged out (should redirect)

---

## Monitoring Setup

### Render
- [ ] Set up email notifications for build failures
- [ ] Bookmark logs URL for quick access
- [ ] Note sleep/wake behavior on free tier

### Vercel
- [ ] Set up email notifications for build failures
- [ ] Check analytics dashboard (optional)
- [ ] Note bandwidth usage on free tier

### Database (Supabase)
- [ ] Check storage usage
- [ ] Review connection pooling settings
- [ ] Enable daily backups (if not already enabled)

---

## Rollback Plan

If deployment fails:

### Immediate Actions
- [ ] Document error messages
- [ ] Check Render logs for backend errors
- [ ] Check Vercel logs for frontend errors
- [ ] Check browser console for client-side errors

### Backend Rollback
- [ ] Render → Services → peacase-api → Manual Deploy → Previous Version
- [ ] Wait 2-3 minutes
- [ ] Verify health endpoint

### Frontend Rollback
- [ ] Vercel → Project → Deployments → Find previous deployment
- [ ] Click "..." → "Promote to Production"
- [ ] Wait 1-2 minutes
- [ ] Verify homepage loads

### Database Rollback (if needed)
- [ ] Restore from Supabase backup
- [ ] Or restore from local backup: `peacase_backup.sql`

---

## Common Issues

### "Failed to fetch" errors
**Symptom:** Frontend can't connect to backend
**Fix:**
- Verify CORS_ORIGIN matches Vercel URL exactly
- No trailing slashes
- Check API health endpoint directly

### 500 Internal Server Error
**Symptom:** API returns 500 on requests
**Fix:**
- Check Render logs for stack traces
- Verify DATABASE_URL is correct
- Verify all required env vars are set

### Build failures
**Symptom:** Render or Vercel build fails
**Fix:**
- Read build logs carefully
- Check for missing dependencies
- Verify root directory settings
- Ensure build commands are correct for monorepo

### Cold start delays (Render free tier)
**Symptom:** First request after inactivity takes 30+ seconds
**Fix:**
- Upgrade to Render paid plan ($7/month)
- Or migrate to CapRover ($6/month, no cold starts)

---

## Post-Launch

### Week 1
- [ ] Monitor Render logs daily for errors
- [ ] Monitor Supabase for unusual activity
- [ ] Test all major features work
- [ ] Get feedback from test users

### Ongoing
- [ ] Check Supabase database size weekly
- [ ] Review Render/Vercel usage monthly
- [ ] Plan migration to CapRover when approaching limits
- [ ] Set up proper monitoring (Sentry, LogRocket, etc.)

---

## Notes

Use this space for deployment-specific notes:

**Last Deployment:** [Date]
**Deployed By:** [Name]
**Version:** [Git SHA or tag]
**Issues:** [Any problems encountered]
**Notes:** [Anything unusual or worth remembering]
```

**Step 2: Commit checklist**

```bash
cd .worktrees/automated-deployment-buttons
git add docs/DEPLOYMENT_CHECKLIST.md
git commit -m "docs: add comprehensive deployment checklist

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Final Review and Merge Preparation

**Files:**
- Review: All created/modified files
- Test: Git status clean

**Step 1: Review all changes**

Run: `cd .worktrees/automated-deployment-buttons && git log --oneline main..HEAD`
Expected: List of all commits made in this worktree

**Step 2: Verify no uncommitted changes**

Run: `cd .worktrees/automated-deployment-buttons && git status`
Expected: "nothing to commit, working tree clean"

**Step 3: Push feature branch to GitHub**

```bash
cd .worktrees/automated-deployment-buttons
git push -u origin feature/automated-deployment-buttons
```

**Step 4: Verify files on GitHub**

Open browser to: `https://github.com/aaron44445/projects/tree/feature/automated-deployment-buttons`
Expected: All new files visible on GitHub

**Step 5: Document completion**

No commit needed - preparation for merge

---

## Success Criteria

- [ ] `render.yaml` exists with complete API configuration
- [ ] `vercel.json` updated with deploy button parameters
- [ ] README.md has deploy buttons and quick instructions
- [ ] `docs/DEPLOYMENT.md` has comprehensive guide with screenshot placeholders
- [ ] `docs/CAPROVER_MIGRATION.md` has full self-hosted migration guide
- [ ] `docs/DEPLOYMENT_CHECKLIST.md` has pre/post deployment checklists
- [ ] All YAML/JSON files validated successfully
- [ ] All commits follow conventional commit format
- [ ] Feature branch pushed to GitHub
- [ ] Zero uncommitted changes in worktree

---

## Execution Handoff

After completing all tasks, use **superpowers:finishing-a-development-branch** to:
1. Review all changes
2. Create PR or merge to main
3. Clean up worktree
4. Deploy to production
