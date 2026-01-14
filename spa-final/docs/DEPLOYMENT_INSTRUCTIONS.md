# Peacase Deployment Instructions

## Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free)

## Step 1: Deploy Backend to Railway (5 minutes)

1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your peacase repository
5. Railway will detect the monorepo
6. Click on "apps/api" service
7. Add these environment variables in the Variables tab:

```
DATABASE_URL=postgresql://postgres:Lambo5@bears@db.ubvgvbobnmlzsedtupuw.supabase.co:5432/postgres
NODE_ENV=production
PORT=3001
JWT_SECRET=2a409182e99fc4b72ee7c8400d61a3c176e09b3c72ddad55cfe9292031eb4284
JWT_REFRESH_SECRET=f56756542957de79d4fc12941f1a26065ec6af986f95d210f2f51b3cf8b060d4
JWT_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d
CORS_ORIGIN=https://peacase.vercel.app
FRONTEND_URL=https://peacase.vercel.app
```

8. Click "Deploy"
9. Wait 3-5 minutes for build
10. Copy your Railway API URL (e.g., `https://peacase-api-production.up.railway.app`)

## Step 2: Deploy Frontend to Vercel (3 minutes)

1. Go to https://vercel.com
2. Click "Login" → "Continue with GitHub"
3. Click "Add New..." → "Project"
4. Find and select your peacase repository
5. Click "Import"
6. Framework Preset: Next.js (auto-detected)
7. Root Directory: Click "Edit" → Select "apps/web"
8. Add environment variable:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: Your Railway API URL from Step 1
9. Click "Deploy"
10. Wait 5-7 minutes for build

## Step 3: Update CORS Settings

After frontend deploys, Vercel gives you a URL like `peacase-xyz123.vercel.app`

Go back to Railway:
1. Click on your API service
2. Go to Variables tab
3. Update:
   - `CORS_ORIGIN=https://peacase-xyz123.vercel.app` (your actual Vercel URL)
   - `FRONTEND_URL=https://peacase-xyz123.vercel.app`
4. Click "Redeploy"

## Step 4: Test Deployment

1. Open your Vercel URL: `https://peacase-xyz123.vercel.app`
2. Try signing up for a new account
3. Verify you can log in
4. Check that dashboard loads

## When Namecheap Unlocks

### Add Custom Domain to Vercel:
1. Vercel Dashboard → Settings → Domains
2. Add domain: `peacase.com`
3. Add DNS records at Namecheap (Vercel provides instructions)

### Add Custom Domain to Railway:
1. Railway Dashboard → Settings → Domains
2. Add domain: `api.peacase.com`
3. Add DNS CNAME at Namecheap

### Update Environment Variables:
1. Railway: Update `CORS_ORIGIN=https://peacase.com` and `FRONTEND_URL=https://peacase.com`
2. Vercel: Update `NEXT_PUBLIC_API_URL=https://api.peacase.com`

Done!
