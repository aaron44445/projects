# Coding Assistant Prompts

## 1. Rubber Duck Debugger

**The Prompt:**

> You are a senior debugging partner who thinks out loud. I'm stuck on something. Walk me through the problem step-by-step like you're debugging it yourself — check my assumptions, spot logic errors, and trace the actual vs expected behavior. Then show me the fix with working code. Don't ask me questions — investigate the code and tell me what you find. [paste code + error/unexpected behavior]

**When to use it:** When you've been staring at a bug for 20+ minutes and need fresh eyes to spot what you're missing.

**Pro tip:** Include any error messages, logs, or "this is what I expected vs what actually happened" context right after your code paste.

---

## 2. Code Review Partner

**The Prompt:**

> Review this code like a senior engineer who's mass-approving PRs on a Friday. Flag only what actually matters — bugs, security holes, performance killers, and things that'll break in production. Skip style nitpicks. Show me the fixed code with inline comments explaining what you changed and why. Be direct. [paste code]

**When to use it:** Before merging anything that touches auth, payments, data handling, or user-facing features.

**Pro tip:** If the AI suggests changes you don't understand, reply with "Explain the [specific concern] like I'm competent but not an expert in this area."

---

## 3. Architecture Decision Helper

**The Prompt:**

> I'm deciding how to build [describe feature in 1 sentence]. Give me 3 concrete approaches with actual code examples (not pseudocode). For each: show the implementation, list the real tradeoffs (performance, maintenance, complexity), and tell me which you'd pick and why. Assume I'm competent but not a system design expert. Ask me about my stack, scale, and constraints only if it genuinely changes your recommendation.

**When to use it:** When you're about to start a feature and aren't sure if you should reach for a library, roll your own, or take a completely different approach.

**Pro tip:** The AI will ask about your tech stack and scale — answer honestly so it doesn't over-engineer a solution for 10 users or under-engineer for 10,000.

---

## 4. Refactoring Guide

**The Prompt:**

> This code works but it's a mess. Refactor it like you're preparing it for a code review with your tech lead. Show me the cleaned-up version with: better naming, extracted functions, reduced duplication, and clearer logic flow. Include before/after comparison and explain the 3 biggest improvements. Keep the same functionality — no feature changes. [paste code]

**When to use it:** When you hacked something together to make it work and now need to make it maintainable before moving on.

**Pro tip:** If the refactored version looks wildly different, ask "What's the risk of breaking something with these changes?" to gauge safety.

---

## 5. API Design Workshop

**The Prompt:**

> I need to build an API for [describe what it does in 1 sentence]. Design the endpoints with: HTTP methods, URL structure, request/response examples (actual JSON), error handling, and auth approach. Make it RESTful and intuitive — optimize for developer experience. Then give me the implementation starter code for [your framework/language]. Ask me about my stack and requirements before designing.

**When to use it:** Before writing any API code — designing first prevents the "I have to refactor 8 endpoints now" problem.

**Pro tip:** After getting the design, ask "What mistakes do developers commonly make implementing this pattern?" to avoid landmines.

---

## 6. Database Schema Designer

**The Prompt:**

> I'm building [describe feature in 1 sentence]. Design the database schema with: table definitions, column types, indexes, foreign keys, and relationships. Show me the SQL CREATE statements and explain your indexing decisions. Flag any potential N+1 queries or scale issues. Then ask me about my database (Postgres/MySQL/etc.) and expected data volume to refine the design.

**When to use it:** Before running any migrations — bad schema decisions are expensive to fix later.

**Pro tip:** Always ask "What happens when I need to add [related feature]?" to test if the schema is flexible enough.

---

## 7. Test Suite Architect

**The Prompt:**

> Write a comprehensive test suite for this code. Give me: unit tests for core logic, integration tests for critical paths, edge cases I probably missed, and mocks for external dependencies. Use [testing framework] and show actual runnable test code with clear assertions. Prioritize tests that catch bugs in production, not tests that just hit 100% coverage. [paste code]

**When to use it:** When you know you should write tests but aren't sure what scenarios actually matter or how to structure them.

**Pro tip:** Add "Focus on tests that would have caught bugs I've actually shipped before" if you're aware of your blind spots.

---

## 8. Documentation Generator

**The Prompt:**

> Write developer documentation for this code as if you're onboarding a new teammate who's competent but unfamiliar with this codebase. Include: what it does, why it exists, how to use it (with examples), gotchas, and what to watch out for when modifying it. Write for developers, not end users. Be concise and skip obvious stuff. [paste code]

**When to use it:** When you're finishing a complex feature and need docs before you forget how it works.

**Pro tip:** If you're documenting an API or library, add "Include a quick-start example that covers the most common use case."

---

## 9. Performance Optimization Advisor

**The Prompt:**

> Audit this code for performance issues. Find: unnecessary loops, N+1 queries, missing indexes, redundant calculations, memory leaks, and blocking operations. Show me the optimized version with benchmarks or explanations of expected improvements. Only suggest changes that materially improve performance — skip micro-optimizations that don't matter. [paste code]

**When to use it:** When something feels slow, when you're about to hit scale, or before launching a performance-critical feature.

**Pro tip:** Include context like "This runs 10,000 times per request" or "This processes 50MB files" so the AI prioritizes the right optimizations.

---

## 10. Security Audit Checklist

**The Prompt:**

> Audit this code for security vulnerabilities like you're doing a pre-launch security review. Check for: SQL injection, XSS, CSRF, authentication bypasses, authorization holes, exposed secrets, insecure dependencies, and data leaks. Flag everything suspicious with severity (critical/high/medium) and show me the secure version. Be paranoid. [paste code]

**When to use it:** Before shipping anything that touches user data, auth, payments, or external APIs.

**Pro tip:** If the AI finds something, ask "Show me an exploit example" to understand the actual risk — sometimes "vulnerabilities" are theoretical.

---

## 11. Git Commit Message Crafter

**The Prompt:**

> Write a git commit message for these changes. Use conventional commits format (feat/fix/refactor/etc). Start with a clear, specific subject line (50 chars max), then a body that explains what changed and why (not how — the diff shows how). Make it useful for someone reviewing git history 6 months from now. [paste git diff or describe changes]

**When to use it:** When you've made complex changes and "updated stuff" isn't going to cut it.

**Pro tip:** If you have multiple unrelated changes, ask "Should I split this into multiple commits?" to keep history clean.

---

## 12. Codebase Onboarding Guide

**The Prompt:**

> I'm new to this codebase. Generate an onboarding guide that explains: what this project does, how the code is organized (folder structure + what lives where), key files and their purposes, where to start reading, common patterns used, and gotchas. Write it for a developer who can read code but doesn't know this project. Be specific — link to actual files and functions. [paste repo structure or key files]

**When to use it:** When joining a new project, or when your own project has grown complex enough that you forget how it's organized.

**Pro tip:** After getting the overview, ask "What's the flow for [specific feature]?" to trace through a real user action end-to-end.
