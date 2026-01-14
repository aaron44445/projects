# Peacase Quick Deployment Checklist

Follow these steps in order. Each step takes 2-5 minutes.

## ☐ Step 1: Supabase Database (2 min)
1. Go to https://supabase.com → Sign in
2. Click "New project" → Name: `peacase-production`
3. Set password → Choose region → Create
4. Wait 2 minutes for provisioning
5. Settings → Database → Connection string → Copy URI
6. **Save this connection string** ← You'll need it next

## ☐ Step 2: Railway API Deployment (5 min)
1. Go to https://railway.app → Sign in with GitHub
2. New Project → Deploy from GitHub repo
3. Select `spa-final` repository
4. Configure service:
   - Root Directory: `/apps/api`
   - Build Command: `cd ../.. && pnpm install && pnpm --filter=@peacase/api build`
   - Start Command: `node dist/index.js`

5. Add Environment Variables (Settings → Variables):
   ```bash
   # Copy-paste this and fill in YOUR values:
   DATABASE_URL=<paste Supabase connection string from Step 1>
   JWT_SECRET=<run in terminal: openssl rand -base64 32>
   JWT_REFRESH_SECRET=<run in terminal: openssl rand -base64 32>
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

6. Click "Deploy"
7. **Copy your Railway API URL**: `https://your-app-name.railway.app`

8. Run migrations:
   - Settings → Deploy Triggers → Add one-time command: `pnpm db:push`

## ☐ Step 3: Vercel Frontend Deployment (3 min)
1. Go to https://vercel.com → Sign in
2. Add New → Project → Import `spa-final` repo
3. Configure:
   - Framework: **Next.js**
   - Root Directory: **apps/web**
   - Build Command: `cd ../.. && pnpm install && pnpm --filter=@peacase/web build`
   - Install Command: `pnpm install`

4. Add Environment Variables:
   ```bash
   NEXT_PUBLIC_API_URL=<paste Railway API URL from Step 2>
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
   ```

5. Click "Deploy"
6. **Copy your Vercel URL**: `https://your-app.vercel.app`

## ☐ Step 4: Connect Your Domain (5 min)
**What's your domain?** ____________________

### 4a. Add domain to Vercel:
1. Project Settings → Domains
2. Add: `yourdomain.com` and `www.yourdomain.com`
3. Vercel shows DNS records

### 4b. Add domain to Railway (for API):
1. Railway project → Settings → Public Networking
2. Add custom domain: `api.yourdomain.com`

### 4c. Update DNS at your registrar:
```
Type: A, Name: @, Value: 76.76.19.19
Type: CNAME, Name: www, Value: cname.vercel-dns.com
Type: CNAME, Name: api, Value: <from Railway dashboard>
```

### 4d. Update environment variables:
**Railway:**
```
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

**Vercel:**
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## ☐ Step 5: Stripe Setup (10 min)
1. https://stripe.com → Sign up → **Switch to LIVE mode**
2. Developers → API Keys:
   - Copy **Secret key** (sk_live_...)
   - Copy **Publishable key** (pk_live_...)

3. Create products:
   - Dashboard → Products → Add Product
   - **Professional**: $49/month recurring → Copy Price ID
   - **Enterprise**: $149/month recurring → Copy Price ID

4. Set up webhook:
   - Developers → Webhooks → Add endpoint
   - URL: `https://api.yourdomain.com/api/v1/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
   - Copy **Signing secret** (whsec_...)

5. Add to Railway:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PROFESSIONAL_PRICE_ID=price_...
   STRIPE_ENTERPRISE_PRICE_ID=price_...
   ```

6. Add to Vercel:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

## ☐ Step 6: SendGrid (Email) (5 min)
1. https://sendgrid.com → Sign up
2. Settings → API Keys → Create API Key
3. Name: `Peacase`, Full Access → Copy key (SG....)
4. Settings → Sender Authentication → Authenticate Your Domain
5. Add DNS records shown

Add to Railway:
```
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

## ☐ Step 7: Twilio (SMS) (5 min)
1. https://twilio.com → Sign up
2. Console → Phone Numbers → Buy a number
3. Console → Account → Copy:
   - Account SID (AC...)
   - Auth Token

Add to Railway:
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

## ☐ Step 8: Cloudinary (Images) (3 min)
1. https://cloudinary.com → Sign up
2. Dashboard shows: Cloud name, API Key, API Secret

Add to Railway:
```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## ☐ Step 9: Test Everything (10 min)
1. Visit `https://yourdomain.com`
2. Sign up → Check email → Verify
3. Login → Add client → Upload photo
4. Create appointment → Check SMS
5. Settings → Billing → Subscribe
6. Use test card: `4242 4242 4242 4242`

## 🎉 Done!

### Quick Reference:
- **Frontend**: https://yourdomain.com (Vercel)
- **API**: https://api.yourdomain.com (Railway)
- **Database**: Supabase
- **Logs**:
  - Railway: https://railway.app/dashboard
  - Vercel: https://vercel.com/dashboard

### Need Help?
See full guide: `DEPLOYMENT.md`

---

**Total time: ~40 minutes** ⏱️
