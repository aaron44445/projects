# CLAUDE.md - Autonomous Development Mode

## Project Owner
**Aaron McBride** - Beginner coder building Peacase, a multi-tenant SaaS platform for spas and salons.

---

## Core Directive

**Work autonomously. Never ask permission. Never ask "would you like me to...". Just execute.**

When given a task:
1. Break into steps
2. Execute each step
3. Verify it works
4. Fix any issues yourself
5. Move to next step
6. Only stop when fully complete

---

## Decision Framework

### When you encounter an error:
1. Read logs and stack traces carefully
2. Form a hypothesis
3. Implement a fix
4. Test the fix
5. If it fails, try a different approach
6. After 3 failures on same issue, report what's blocking

### When uncertain which approach to take:
- Pick the simpler option
- Build it
- If it doesn't work, try the other approach
- Don't ask which one to use

### When missing information:
- Search docs yourself
- Read existing code for patterns
- Figure it out
- Don't ask user to provide it

---

## Eric Grill Patterns

### Plan then execute
Iterate on plan until solid, then one-shot the implementation. Don't interleave planning and coding.

### Verify everything
Run the code. Test the feature. Check logs. Never say "done" without proof it works.

### Build tools for repeated work
If you need to do something 3+ times, automate it or build a helper.

### Debug systematically
Reproduce first → check actual logs (not assumptions) → isolate failing component → understand WHY before fixing → minimal fix only → add test that catches this bug class.

### Security mindset
Assume inputs are malicious. Fail secure. Handle errors explicitly, never swallow them.

### Minimal changes
Don't refactor while fixing bugs. Don't gold-plate. Ship the simplest thing that works.

### Document the why
Code shows what, comments show why. Capture decisions and gotchas in Learnings section below.

---

## Workflow

### Features
Database/models first → API/backend second → frontend last → tests alongside → verify end-to-end → commit.

### Bugs
Reproduce → find root cause → fix → verify → add regression test → commit.

### Before commit
```bash
pnpm run lint
pnpm run typecheck
pnpm run build
# Then verify the feature actually works
```

---

## Never Do
- Ask "would you like me to continue/implement/proceed?"
- Stop to summarize progress mid-task
- Wait for approval between steps
- Explain at length before acting
- Commit broken code
- Swallow errors silently
- Ask Aaron to run commands, edit files, or debug errors

---

## Always Do
- Verify code works before saying done
- Handle errors explicitly with user-friendly messages
- Filter by tenant_id on all database queries (multi-tenant)
- Test edge cases not just happy paths
- Commit after each completed piece
- Keep going until the task is fully complete
- Write clean, readable code with clear variable names (Aaron learns by reading)

---

## Stop Only When
- Missing API keys/credentials you don't have
- Business logic ambiguity with multiple valid paths
- 3+ fix attempts failed on same issue
- Need access to external systems you can't reach

Everything else: figure it out and keep going.

---

## Project Architecture

### Monorepo Structure
```
spa-final/
├── apps/
│   ├── api/          # Express.js backend (Render)
│   └── web/          # Next.js 14 frontend (Vercel)
├── packages/
│   ├── database/     # Prisma schema & client
│   ├── types/        # Shared TypeScript types
│   └── ui/           # Shared UI components
```

### Tech Stack
- **Frontend:** Next.js 14, React, TailwindCSS, shadcn/ui
- **Backend:** Express.js, Prisma, PostgreSQL (Supabase)
- **Payments:** Stripe
- **Email:** SendGrid
- **SMS:** Twilio

### Key URLs
- **Production:** peacase.com
- **API:** Render (peacase-api)
- **Database:** Supabase PostgreSQL
- **GitHub:** github.com/aaron44445/projects

---

## Code Standards

### TypeScript
- Strict mode enabled - fix all type errors
- No `any` types unless absolutely necessary
- Explicit error handling

### API Responses
```typescript
{ success: boolean, data?: any, error?: { code: string, message: string } }
```

### Git
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- Never commit secrets or .env files
- Push after completing logical units

### Security
- Validate all user inputs
- Never log sensitive data
- HTTPS only in production
- Parameterized queries (Prisma handles this)

---

## Learnings (update as you go)

### Mistakes to avoid
- Auth rate limit was set to 5 req/15min - too restrictive for testing
- API port fallback was 4001 but API runs on 3001
- Missing /users/me endpoint caused "user undefined" errors after login
- No timeout on fetch calls caused infinite hangs

### Patterns that work
- Add request timeouts (30s) to prevent infinite hangs
- Use in-memory rate limiting (resets on deploy) for dev/staging
- Wrap email sending in try/catch so registration doesn't block
- Place specific routes (like /me) before parameterized routes (/:id)

### Project-specific gotchas
- Workspace packages need `pnpm install` to create symlinks
- Database package must be built before API can import it
- Vercel auto-deploys on push to main
- Render auto-deploys on push to main (API restarts, rate limits reset)
