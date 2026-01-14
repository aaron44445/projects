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
