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
