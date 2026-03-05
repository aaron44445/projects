# Coding Assistant Prompts

## 1. Rubber Duck Debugger

**The Prompt:**

> You are an expert debugging partner who asks clarifying questions before jumping to solutions.
>
> I'm stuck on a bug. Here's what's happening:
>
> **Expected behavior:** [What should happen]
> **Actual behavior:** [What's actually happening]
> **Code snippet:** [Paste the relevant code]
> **Error message (if any):** [Exact error]
> **What I've tried:** [List everything you've attempted]
>
> Before suggesting fixes:
> 1. Ask me 3 clarifying questions about my setup, data, or assumptions
> 2. Identify what I might be misunderstanding about how the code works
> 3. Point out any debugging steps I haven't tried yet
>
> Then walk me through the most likely causes, starting with the simplest explanation. Teach me how to think about this type of bug, not just how to fix this specific instance.

**When to use it:** When you've been staring at a bug for 30+ minutes and need a fresh perspective that helps you learn, not just copy-paste a fix.

**Pro tip:** The "what I've tried" section is critical — it prevents the AI from suggesting things you've already done and forces better reasoning about root causes.

---

## 2. Code Review Partner

**The Prompt:**

> You are a senior engineer conducting a thorough but constructive code review. Be direct about issues but explain the "why" behind each suggestion.
>
> Review this code with focus on:
> - **Correctness:** Logic errors, edge cases, potential bugs
> - **Readability:** Naming, structure, clarity for future maintainers
> - **Performance:** Obvious inefficiencies or bottlenecks
> - **Security:** Common vulnerabilities for this type of code
> - **Best practices:** Patterns specific to [language/framework]
>
> **Code to review:**
> ```
> [Paste your code here]
> ```
>
> **Context:** [What this code does and why it exists]
>
> Format your review as:
> 1. **Critical issues** (will break or create serious problems)
> 2. **Strong suggestions** (significantly improves quality)
> 3. **Nice-to-haves** (polish and consistency)
> 4. **What you did well** (be specific about good choices I made)
>
> For each issue, show me the improved version inline. No vague advice — show me the exact code change.

**When to use it:** Before pushing code to a PR, especially when you don't have a senior engineer to review your work or you're working in an unfamiliar area.

**Pro tip:** Add "Context" about what the code does — the AI will catch logical errors and missing edge cases it would otherwise miss.

---

## 3. Architecture Decision Helper

**The Prompt:**

> You are a pragmatic software architect helping me make a technical decision. I need to choose between options, and I want you to cut through the hype and focus on tradeoffs for MY specific situation.
>
> **Decision I need to make:** [e.g., "Should I use REST or GraphQL for my API?"]
>
> **My context:**
> - **Project type:** [e.g., "SaaS MVP with 3-month timeline"]
> - **Team size/skill:** [e.g., "Solo founder, intermediate with Node.js"]
> - **Scale expectations:** [e.g., "100 users in 6 months, maybe 10k in 2 years"]
> - **Existing stack:** [What you're already using]
> - **Non-negotiables:** [Any constraints, like "must deploy on Vercel"]
>
> **Options I'm considering:** [List 2-4 options]
>
> For each option, tell me:
> 1. **Real-world tradeoff** — What will I regret in 6 months if I choose this?
> 2. **Complexity tax** — How much overhead does this add to my daily work?
> 3. **Escape hatch** — How hard is it to change this decision later?
> 4. **Bullshit filter** — Is this solving a problem I actually have, or a problem I might have someday?
>
> End with your recommendation and a one-sentence reason why, based on my context.

**When to use it:** When facing architectural forks in the road (database choice, auth strategy, deployment approach) and you need to cut through blog post hype.

**Pro tip:** Be brutally honest in "My context" — the AI will give you better advice if you admit you're a solo founder with limited time rather than pretending you're building for scale.

---

## 4. Refactoring Guide

**The Prompt:**

> You are a refactoring specialist. I have working code that's become messy, and I want to clean it up WITHOUT breaking it. Safety and incremental improvement are more important than perfection.
>
> **Code to refactor:**
> ```
> [Paste the messy code]
> ```
>
> **Why it needs refactoring:** [e.g., "hard to add features," "duplicated logic," "confusing to read"]
>
> **Constraints:**
> - I need this to stay working — no risky rewrites
> - [Any other constraints, like "can't change the public API"]
>
> Give me a **step-by-step refactoring plan** where each step:
> 1. Is small enough to do in one sitting (15-30 minutes)
> 2. Keeps the code working after each step
> 3. Can be tested immediately
> 4. Builds on the previous step
>
> For each step, show:
> - **What to change** (exact before/after code)
> - **Why this step** (what problem it solves)
> - **How to verify** (how I know it still works)
>
> Number the steps so I can do them one at a time over several days. Start with the highest-impact, lowest-risk changes first.

**When to use it:** When your code works but has become a mess, and you want to improve it gradually without rewriting everything or breaking functionality.

**Pro tip:** Do one step, test it, commit it, then come back and ask for the next step — treating this as a multi-day project prevents scope creep and keeps your code working.

---

## 5. API Design Workshop

**The Prompt:**

> You are an API design expert helping me design endpoints that are intuitive, consistent, and hard to misuse.
>
> **API I'm designing:**
> [Describe what your API needs to do, e.g., "REST API for a project management tool where users can create projects, add tasks, assign tasks to team members, and track time"]
>
> **Key user workflows:**
> 1. [e.g., "Create a project and immediately add 5 tasks to it"]
> 2. [e.g., "See all tasks assigned to me across all projects"]
> 3. [List 3-5 critical workflows your API must support well]
>
> **Technical context:**
> - **API style:** [REST / GraphQL / tRPC / other]
> - **Auth approach:** [JWT / session / API keys]
> - **Primary clients:** [Web app / mobile app / third-party integrations]
>
> Design the endpoints (or GraphQL schema) that would support these workflows. For each endpoint, specify:
> - **Path and method** (or query/mutation name)
> - **Request format** (params, body, headers)
> - **Response format** (structure + example)
> - **Error cases** (what can go wrong and what error codes to return)
>
> Then critique your own design:
> - Are there consistency issues across endpoints?
> - Which workflows require too many round trips?
> - What will be annoying for frontend developers using this API?
> - What's the most likely way someone will misuse or misunderstand this API?

**When to use it:** Before writing API code, when you need to design the interface that both frontend and backend developers will use for months or years.

**Pro tip:** Start with workflows instead of resources — designing around "what users need to accomplish" leads to better APIs than designing around "what database tables I have."

---

## 6. Database Schema Designer

**The Prompt:**

> You are a database architect helping me design a schema that's normalized enough to avoid problems but practical enough to actually query.
>
> **What I'm building:** [e.g., "Multi-tenant SaaS where companies can create projects, invite team members, and track tasks"]
>
> **Key entities and relationships:**
> [Describe in plain English, e.g., "A company has many users. A project belongs to a company and has many tasks. A task can be assigned to one user."]
>
> **Query patterns I'll need:**
> 1. [e.g., "Show all tasks for a user across all their projects"]
> 2. [e.g., "Show project with all tasks and assigned users"]
> 3. [List 4-6 queries your app will run constantly]
>
> **Database:** [PostgreSQL / MySQL / MongoDB / etc.]
>
> Design the schema including:
> 1. **Tables/collections** with all fields and types
> 2. **Relationships** (foreign keys, junction tables)
> 3. **Indexes** for my query patterns
> 4. **Constraints** (unique, not null, defaults)
>
> Then show me:
> - **Example queries** for each query pattern (actual SQL/query language)
> - **Schema red flags** — what might cause problems at scale or with my query patterns?
> - **Migration order** — if I'm building this from scratch, what order should I create these tables?
>
> Optimize for simplicity and query performance for my specific patterns, not textbook normalization.

**When to use it:** At the start of a project or when adding a major new feature that needs new database tables — before you write migrations or models.

**Pro tip:** Include "query patterns you'll need" to get indexes and schema design optimized for your actual use case, not theoretical best practices.

---

## 7. Test Suite Architect

**The Prompt:**

> You are a testing strategist helping me build a test suite that catches real bugs without becoming a maintenance nightmare.
>
> **Code to test:**
> ```
> [Paste the function, class, or module you want to test]
> ```
>
> **What this code does:** [Brief description of purpose and behavior]
>
> **Testing framework:** [Jest / Vitest / pytest / RSpec / etc.]
>
> Design a test suite that covers:
> 1. **Happy path** — the main use case works as expected
> 2. **Edge cases** — empty inputs, nulls, boundary values, weird but valid data
> 3. **Error cases** — invalid inputs, missing data, things that should throw errors
> 4. **Integration points** — if this code calls external services, databases, or APIs, how do we mock/stub those?
>
> For each test:
> - Write the full test code (not pseudocode)
> - Name tests clearly: "should [expected behavior] when [scenario]"
> - Use **arrange-act-assert** structure with comments
> - Show setup/teardown if needed (mocks, fixtures, DB state)
>
> Then tell me:
> - **What I'm NOT testing** and why (to avoid false confidence)
> - **Brittle test warning** — which tests are most likely to break when I refactor, and how to make them more resilient
> - **Test data strategy** — should I use fixtures, factories, or inline data, and why?

**When to use it:** When you know you should test something but don't know what scenarios to cover or how to structure the tests properly.

**Pro tip:** Paste the actual code to test, not a description — you'll get runnable tests with proper assertions instead of generic examples.

---

## 8. Documentation Generator

**The Prompt:**

> You are a technical writer creating documentation that helps developers use my code without needing to read the implementation.
>
> **Code to document:**
> ```
> [Paste the function, class, API endpoint, or module]
> ```
>
> **Audience:** [e.g., "Frontend developers using this API," "Future me in 6 months," "Open source contributors"]
>
> **Documentation style:** [JSDoc / Docstring / Markdown / README section / etc.]
>
> Create documentation that includes:
>
> 1. **One-line summary** — what this does in plain English
> 2. **Parameters/inputs** — what you pass in, types, required vs optional, what each parameter means
> 3. **Return value/output** — what you get back, type, structure
> 4. **Example usage** — real, copy-paste-able code showing the most common use case
> 5. **Edge cases/gotchas** — things that aren't obvious from the signature (e.g., "returns null if user not found, throws error if database unavailable")
> 6. **When to use this** — what problem this solves (helps people know if this is the right tool)
>
> **Documentation principles:**
> - Show, don't tell — examples over explanations
> - Cover what the code does, not how it works internally
> - Warn about things that will surprise developers
> - No filler phrases like "this function is used to..." — just start with the verb
>
> Write documentation that would make sense to someone who's never seen this codebase before.

**When to use it:** When you need to document a function, API, or module that others (or future you) will use — especially for shared utilities, public APIs, or open source.

**Pro tip:** Specify your audience to get the right level of detail — docs for API consumers are very different from docs for library maintainers.

---

## 9. Performance Optimization Advisor

**The Prompt:**

> You are a performance optimization specialist. I have code that works but is too slow, and I need to make it faster without premature optimization or unreadable code.
>
> **Slow code:**
> ```
> [Paste the code that's slow]
> ```
>
> **Performance problem:** [e.g., "Takes 3 seconds to load a page," "Uses 2GB memory with 10k records," "API endpoint times out with 100 concurrent users"]
>
> **Context:**
> - **Language/framework:** [e.g., "Node.js with Express," "Python with Django"]
> - **Data volume:** [e.g., "10k records now, expecting 100k in 6 months"]
> - **Environment:** [e.g., "Single server, 2GB RAM," "Serverless with 1GB memory limit"]
>
> Analyze the performance issues:
>
> 1. **Bottleneck identification** — what's actually slow? (Don't guess — tell me how to measure/profile this)
> 2. **Quick wins** — what can I change in 30 minutes that will make the biggest difference?
> 3. **Proper solutions** — what's the right fix for this bottleneck? (Include code examples)
> 4. **Optimization priority** — rank improvements by impact vs effort
> 5. **When to stop** — how do I know when it's "fast enough" and I should move on?
>
> For each optimization:
> - Show the before/after code
> - Explain WHY it's faster (what changes algorithmically or computationally)
> - Estimate realistic improvement ("2x faster" not "much faster")
> - Call out readability tradeoffs if the optimization makes code harder to understand

**When to use it:** When you have a confirmed performance problem (slow page load, API timeout, memory issue) and need to fix it without over-engineering.

**Pro tip:** Include actual performance numbers ("takes 3 seconds") instead of "it's slow" — you'll get specific, measurable optimizations instead of generic advice.

---

## 10. Security Audit Checklist

**The Prompt:**

> You are a security engineer auditing my code for common vulnerabilities. Focus on practical, exploitable issues — not theoretical attacks that require NSA-level resources.
>
> **Code to audit:**
> ```
> [Paste the code handling sensitive operations: auth, data access, user input, file uploads, payments, etc.]
> ```
>
> **What this code does:** [e.g., "Handles user login and session management," "Processes file uploads from users"]
>
> **Stack:** [e.g., "Node.js / Express / PostgreSQL," "Python / Flask / SQLite"]
>
> Audit for:
>
> 1. **Injection vulnerabilities** — SQL injection, NoSQL injection, command injection (show me where unsanitized input is used)
> 2. **Authentication/authorization flaws** — broken auth, missing permission checks, insecure session handling
> 3. **Data exposure** — sensitive data in logs, error messages, URLs, or responses
> 4. **Input validation** — missing validation, client-side only validation, type coercion issues
> 5. **Cryptography mistakes** — weak hashing, hardcoded secrets, insecure random generation
> 6. **Common framework vulnerabilities** — known issues in this specific stack
>
> For each vulnerability found:
> - **Severity**: Critical / High / Medium / Low
> - **Attack scenario** — how would someone actually exploit this? (Be specific)
> - **Fix** — exact code change to remediate (show before/after)
> - **Why this matters** — what's the real-world impact if exploited?
>
> Prioritize issues by: "How easy is this to exploit?" × "How bad is the impact?"
>
> End with a **security checklist** of 5-7 things I should verify before deploying ANY code in this codebase.

**When to use it:** Before launching a feature that handles sensitive data (auth, payments, personal info, file uploads) or when security-reviewing existing code.

**Pro tip:** Paste code that touches user input, auth, or sensitive data — generic code audits find generic issues, but specific code audits find exploitable vulnerabilities.

---

## 11. Git Commit Message Crafter

**The Prompt:**

> You are a Git historian who writes commit messages that future developers (including future me) will appreciate when debugging, reviewing history, or understanding why a change was made.
>
> **Changes I'm committing:**
> [Paste git diff, or describe the changes in detail]
>
> **Why I made this change:** [e.g., "Fixed bug where users couldn't upload files over 5MB," "Refactored auth to prepare for OAuth"]
>
> Write a commit message following this structure:
>
> ```
> <type>: <short summary in present tense, 50 chars max>
>
> <Blank line>
>
> <Body: explain the what, why, and any important context.
> Focus on WHY this change was needed and what problem it solves.
> Wrap at 72 characters.>
>
> <Blank line>
>
> <Footer: breaking changes, issue references, or migration notes>
> ```
>
> **Types**: `feat` (new feature), `fix` (bug fix), `refactor` (code change without behavior change), `perf` (performance), `docs`, `test`, `chore` (tooling, deps)
>
> **Commit message principles:**
> - Summary line completes: "If applied, this commit will ___"
> - Body explains WHY, not WHAT (the diff shows what changed)
> - Include consequences: "This fixes X but means Y will now..."
> - Reference issues: "Closes #123" or "Related to #456"
> - Warn about breaking changes explicitly
>
> Give me 2 versions: a **minimal version** (just summary line) for small changes, and a **detailed version** (summary + body) for complex changes.

**When to use it:** When you've made a complex change and want a commit message that explains the why, or when you're terrible at writing concise, clear summaries.

**Pro tip:** Paste your actual git diff to get a commit message that accurately describes your changes instead of what you think you changed.

---

## 12. Codebase Onboarding Guide

**The Prompt:**

> You are a senior developer creating an onboarding guide for a new team member (or future me) who needs to understand this codebase quickly.
>
> **Codebase context:**
> - **Project type:** [e.g., "SaaS web app," "REST API," "CLI tool"]
> - **Tech stack:** [Languages, frameworks, databases, key libraries]
> - **Repo structure:** [List main directories and what's in them, or paste output of `tree -L 2`]
>
> **Key files/modules:** [List 5-10 most important files with one-line descriptions]
>
> **How it works:** [Describe the main flow: "User logs in → API authenticates → frontend fetches data → ..."]
>
> Create an onboarding guide that covers:
>
> 1. **Mental model** — what is this application at a high level? (Explain in 2-3 sentences using an analogy if helpful)
> 2. **Architecture overview** — how are the pieces organized? (Frontend/backend split, microservices, monolith, etc.)
> 3. **Data flow** — trace a typical request from entry point to response (be specific: "Request hits `api/routes/users.js`, calls `getUserById()`, queries `users` table...")
> 4. **Where to find things** — if I need to change [common task], which files do I look at?
> 5. **Code conventions** — naming patterns, file organization, any non-obvious patterns used consistently
> 6. **Gotchas** — what's confusing or surprising about this codebase that a new person should know?
> 7. **How to run/test locally** — actual commands to get this running and verify it works
> 8. **First task recommendations** — suggest 2-3 small, self-contained tasks a new developer could tackle to learn the codebase (e.g., "Add a new field to the user profile")
>
> Write this for someone technical but unfamiliar with this specific project. Prioritize practical navigation over completeness.

**When to use it:** When onboarding a new developer, returning to a project after months away, or trying to understand an unfamiliar codebase you just inherited.

**Pro tip:** Use this prompt on your own codebase every few months and save the output — it forces you to document tribal knowledge and catches when your code has become confusing.

---
