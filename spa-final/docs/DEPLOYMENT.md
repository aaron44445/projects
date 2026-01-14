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
