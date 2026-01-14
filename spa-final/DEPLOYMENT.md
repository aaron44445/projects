# Peacase Deployment Guide

## Architecture
- **Frontend**: Next.js app deployed to Vercel
- **API**: Express.js app deployed to Railway
- **Database**: PostgreSQL on Supabase

---

## Step 1: Set Up Supabase Database

1. Go to https://supabase.com and sign in
2. Click **"New project"**
3. Name: `peacase-production`
4. Database Password: (save this securely)
5. Region: Choose closest to your users
6. Click **"Create new project"** (takes ~2 minutes)

7. Once ready, go to **Settings → Database → Connection string → URI**
8. Copy the connection string (starts with `postgresql://`)
9. Save it for later - you'll need it for Railway

---

## Step 2: Deploy API to Railway

1. Go to https://railway.app and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `spa-final` repository
4. Railway will detect it's a monorepo

5. **Configure the API service:**
   - Root Directory: `/apps/api`
   - Build Command: `cd ../.. && pnpm install && pnpm --filter=@peacase/api build`
   - Start Command: `node dist/index.js`

6. **Add Environment Variables** (Settings → Variables):
   ```
   DATABASE_URL=<paste your Supabase connection string>
   JWT_SECRET=<generate with: openssl rand -base64 32>
   JWT_REFRESH_SECRET=<generate with: openssl rand -base64 32>
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://yourdomain.com
   FRONTEND_URL=https://yourdomain.com

   # Add these later after getting API keys:
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PROFESSIONAL_PRICE_ID=price_...
   STRIPE_ENTERPRISE_PRICE_ID=price_...
   SENDGRID_API_KEY=SG...
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1...
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

7. Click **"Deploy"**
8. Once deployed, copy your API URL: `https://your-app.railway.app`

9. **Run Database Migrations:**
   - In Railway dashboard, click your API service
   - Go to **"Settings" → "Deploy Triggers"**
   - Add one-time command: `pnpm db:push`
   - This creates all database tables

---

## Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com and sign in
2. Click **"Add New..." → "Project"**
3. Import your `spa-final` GitHub repository

4. **Configure Project:**
   - Framework Preset: **Next.js**
   - Root Directory: **apps/web**
   - Build Command: `cd ../.. && pnpm install && pnpm --filter=@peacase/web build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

5. **Add Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://your-app.railway.app
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

6. Click **"Deploy"**

7. Once deployed, you'll get a URL like `https://your-app.vercel.app`

---

## Step 4: Connect Your Custom Domain

### On Vercel (Frontend):
1. Go to your project → **Settings → Domains**
2. Add your domain: `peacase.com` or `yourdomain.com`
3. Vercel will show you DNS records to add

### Configure DNS:
Add these records at your domain registrar:

**For root domain (peacase.com):**
```
Type: A
Name: @
Value: 76.76.19.19
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**For API subdomain (api.peacase.com):**
1. In Railway, go to your API service → **Settings → Public Networking**
2. Click **"Generate Domain"** or add custom domain
3. Add CNAME record:
```
Type: CNAME
Name: api
Value: <railway-domain-from-dashboard>
```

### Update Environment Variables:
1. **Railway** - Update CORS_ORIGIN and FRONTEND_URL:
   ```
   CORS_ORIGIN=https://peacase.com
   FRONTEND_URL=https://peacase.com
   ```

2. **Vercel** - Update API URL:
   ```
   NEXT_PUBLIC_API_URL=https://api.peacase.com
   ```

3. Redeploy both services for changes to take effect

---

## Step 5: Set Up Service Integrations

### Stripe (Payment Processing)

1. Go to https://stripe.com → Sign in → Switch to **Live Mode** (toggle in sidebar)
2. Go to **Developers → API Keys**
   - Copy **Secret key** (starts with `sk_live_`)
   - Copy **Publishable key** (starts with `pk_live_`)

3. Create subscription products:
   - **Dashboard → Products → Add Product**
   - **Professional Plan**: $49/month recurring
   - **Enterprise Plan**: $149/month recurring
   - Copy the **Price IDs** (starts with `price_`)

4. Set up webhook:
   - **Developers → Webhooks → Add endpoint**
   - Endpoint URL: `https://api.peacase.com/api/v1/webhooks/stripe`
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy **Signing secret** (starts with `whsec_`)

5. Add to Railway environment variables:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PROFESSIONAL_PRICE_ID=price_...
   STRIPE_ENTERPRISE_PRICE_ID=price_...
   ```

6. Add to Vercel environment variables:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

### SendGrid (Email Service)

1. Go to https://sendgrid.com → Sign up/Sign in
2. **Settings → API Keys → Create API Key**
3. Name: `Peacase Production`
4. Permissions: **Full Access**
5. Copy the key (starts with `SG.`)

6. **Verify sender domain:**
   - **Settings → Sender Authentication → Authenticate Your Domain**
   - Add DNS records to your domain registrar

7. Add to Railway:
   ```
   SENDGRID_API_KEY=SG...
   SENDGRID_FROM_EMAIL=noreply@peacase.com
   ```

### Twilio (SMS Service)

1. Go to https://twilio.com → Sign up/Sign in
2. Buy a phone number: **Console → Phone Numbers → Buy a number**
3. Get credentials: **Console → Account → API Keys & Tokens**
   - Account SID (starts with `AC`)
   - Auth Token

4. Add to Railway:
   ```
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1...
   ```

### Cloudinary (Image Uploads)

1. Go to https://cloudinary.com → Sign up/Sign in
2. Dashboard shows: **Cloud name**, **API Key**, **API Secret**
3. Add to Railway:
   ```
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

### Sentry (Error Tracking - Optional)

1. Go to https://sentry.io → Sign up/Sign in
2. Create two projects:
   - `peacase-frontend` (platform: Next.js)
   - `peacase-api` (platform: Node.js)
3. Copy DSNs from each project settings

4. Add to Railway:
   ```
   SENTRY_DSN=https://...@sentry.io/...
   ```

5. Add to Vercel:
   ```
   SENTRY_DSN=https://...@sentry.io/...
   ```

---

## Step 6: Test Production Deployment

1. **Visit your domain**: https://peacase.com
2. **Test signup flow**:
   - Create new account
   - Check email for verification
   - Verify email
   - Login

3. **Test core features**:
   - Add a client
   - Upload profile photo (tests Cloudinary)
   - Create an appointment (tests SMS via Twilio)
   - Go to Settings → Billing
   - Subscribe to Professional plan (tests Stripe)
   - Use test card: 4242 4242 4242 4242

4. **Monitor errors**:
   - Check Sentry for any errors
   - Check Railway logs: `railway logs`
   - Check Vercel logs in dashboard

---

## Troubleshooting

### API won't start
- Check Railway logs for errors
- Verify DATABASE_URL is correct
- Ensure all required env vars are set

### Frontend can't reach API
- Check NEXT_PUBLIC_API_URL points to Railway domain
- Verify CORS_ORIGIN in Railway matches your frontend domain
- Check Railway service is running

### Database connection fails
- Verify Supabase connection string is correct
- Check if database is paused (Supabase free tier pauses after inactivity)
- Run migrations: Railway dashboard → One-time command: `pnpm db:push`

### Stripe webhook not working
- Verify webhook URL is correct: `https://api.peacase.com/api/v1/webhooks/stripe`
- Check webhook signing secret is correct
- View webhook attempts in Stripe dashboard

### Emails not sending
- Verify SendGrid domain authentication is complete
- Check SendGrid activity feed for errors
- Ensure SENDGRID_FROM_EMAIL matches verified domain

### SMS not sending
- Check Twilio phone number is active
- Verify account is not in trial mode (trial mode requires verified recipient numbers)
- Check Twilio logs for delivery status

---

## Environment Variables Checklist

### Railway (API) - Required:
- ✅ DATABASE_URL
- ✅ JWT_SECRET
- ✅ JWT_REFRESH_SECRET
- ✅ NODE_ENV=production
- ✅ CORS_ORIGIN
- ✅ FRONTEND_URL
- ✅ STRIPE_SECRET_KEY
- ✅ STRIPE_WEBHOOK_SECRET
- ✅ STRIPE_PROFESSIONAL_PRICE_ID
- ✅ STRIPE_ENTERPRISE_PRICE_ID
- ✅ SENDGRID_API_KEY
- ✅ SENDGRID_FROM_EMAIL
- ✅ TWILIO_ACCOUNT_SID
- ✅ TWILIO_AUTH_TOKEN
- ✅ TWILIO_PHONE_NUMBER
- ✅ CLOUDINARY_CLOUD_NAME
- ✅ CLOUDINARY_API_KEY
- ✅ CLOUDINARY_API_SECRET

### Vercel (Frontend) - Required:
- ✅ NEXT_PUBLIC_API_URL
- ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

---

## Quick Commands

### Redeploy after environment variable changes:
```bash
# Railway will auto-redeploy when you change env vars
# Vercel: trigger new deployment
vercel --prod
```

### View logs:
```bash
# Railway
railway logs

# Vercel
vercel logs
```

### Run database migrations:
```bash
# In Railway dashboard
pnpm db:push
```

---

## Support

- Railway: https://railway.app/help
- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/docs

Your Peacase app is now live at https://peacase.com! 🎉
