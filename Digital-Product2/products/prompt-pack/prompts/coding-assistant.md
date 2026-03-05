# Coding Assistant Prompts

## 1. Rubber Duck Debugger

**The Prompt:**

> I have a bug I can't figure out. Here's the situation:
>
> **What should happen:** [describe expected behavior]
> **What actually happens:** [describe actual behavior]
> **Error message (if any):** [paste the error]
> **Relevant code:**
> ```
> [paste the code that's causing the issue]
> ```
> **What I've already tried:** [list your attempts]
>
> Walk me through this systematically:
> 1. What are the 3 most likely causes of this bug, ranked by probability?
> 2. For each likely cause, what's the specific line or logic that would produce this behavior?
> 3. Give me a diagnostic step for each — a `console.log`, test case, or check that would confirm or rule out each cause.
> 4. Once we identify the cause, give me the fix and explain WHY it works, not just what to change.
>
> Don't guess a fix. Help me understand the bug first.

**When to use it:** When you've been staring at a bug for more than 15 minutes and can't see what's wrong.

**Pro tip:** Include the full error stack trace, not just the message — the path through the code often reveals the cause faster than the error description.

---

## 2. Code Review Partner

**The Prompt:**

> Review this code as if you're a senior engineer on my team. Be direct, specific, and constructive.
>
> ```
> [paste your code]
> ```
>
> Review for:
> 1. **Bugs and logic errors:** Anything that will break in production
> 2. **Edge cases:** Inputs or scenarios this code doesn't handle
> 3. **Security issues:** SQL injection, XSS, auth bypasses, data exposure, secrets in code
> 4. **Performance:** N+1 queries, unnecessary re-renders, missing indexes, memory leaks
> 5. **Readability:** Naming, structure, comments (or lack of). Could a new team member understand this?
> 6. **DRY violations:** Repeated patterns that should be abstracted
> 7. **Error handling:** What happens when things go wrong? Are errors swallowed?
>
> For each issue:
> - Severity: 🔴 Must fix, 🟡 Should fix, 🟢 Nice to have
> - The specific line(s)
> - What's wrong
> - How to fix it (show the code)
>
> End with: "If I could only fix 3 things before shipping, they should be..." and list them.

**When to use it:** Before merging any PR, deploying to production, or when you want a second pair of eyes on critical code.

**Pro tip:** Include the context of what the code does and the file path — review quality improves dramatically when the reviewer understands the bigger picture.

---

## 3. Architecture Decision Helper

**The Prompt:**

> I need to make an architecture decision and I want to think through it properly before committing.
>
> **The decision:** [describe what you're trying to decide — e.g., "monolith vs microservices", "SQL vs NoSQL", "REST vs GraphQL"]
> **Context:**
> - Project type: [what you're building]
> - Team size: [number of developers]
> - Scale expectations: [users, data volume, traffic patterns]
> - Timeline: [how soon this needs to ship]
> - Current stack: [what you're already using]
>
> Analyze this decision:
> 1. **Option A vs Option B** (and Option C if applicable): Pros and cons for MY specific situation, not in general
> 2. **Total cost of ownership:** Consider not just the build cost but the maintenance, scaling, hiring, and migration costs over 2 years
> 3. **Reversibility:** How hard is it to change my mind in 6 months? What would that migration look like?
> 4. **What teams my size typically choose:** Based on real-world patterns, what do similar projects usually go with?
> 5. **The decision matrix:** Score each option on: simplicity, scalability, team familiarity, ecosystem/tooling, and time to ship
>
> Give me your recommendation and the #1 thing I'd regret about each option if I chose it.

**When to use it:** Before any major technical decision that would be expensive to reverse — database choices, framework selections, hosting strategies, or API designs.

**Pro tip:** Add "What would a staff engineer at a FAANG company tell me I'm overthinking?" to get a reality check on whether you're over-engineering.

---

## 4. Refactoring Guide

**The Prompt:**

> This code works, but it's messy and I need to clean it up. Refactor it with these priorities:
>
> ```
> [paste your code]
> ```
>
> **Refactoring goals (in order of importance):**
> 1. Don't break anything — preserve exact behavior
> 2. Improve readability — someone new should understand this in 5 minutes
> 3. Reduce complexity — simplify nested logic, long functions, tangled conditionals
> 4. Improve testability — make it easier to unit test
> 5. Follow [language/framework] conventions and idioms
>
> **Deliver:**
> 1. The refactored code with comments explaining each significant change
> 2. A "before/after" comparison of the most improved section
> 3. A list of the specific refactoring patterns you applied (Extract Method, Replace Conditional with Polymorphism, etc.)
> 4. Any tests I should write to verify the refactoring didn't break behavior
> 5. Remaining code smells you intentionally left alone and why
>
> If any change is risky (behavior might change), flag it explicitly.

**When to use it:** When you've inherited legacy code, when a file has grown too large, or when you're about to add features to messy code and want to clean it first.

**Pro tip:** Refactor in small, verifiable steps — ask for the changes in order of independence so you can test each change before moving to the next.

---

## 5. API Design Workshop

**The Prompt:**

> I'm designing a REST API for [describe the domain — e.g., "a task management app", "an e-commerce platform"]. Help me design it properly:
>
> **Core entities:** [list the main objects — e.g., Users, Tasks, Projects]
> **Key operations:** [what users need to do — e.g., create tasks, assign tasks, filter by status]
> **Authentication:** [what you're using or planning — JWT, API keys, OAuth]
>
> **Design the API:**
> 1. **Resource naming:** List all endpoints following REST conventions. Use plural nouns, proper nesting, consistent patterns.
> 2. **For each endpoint:** HTTP method, URL, request body (if applicable), response body, status codes (success AND error cases)
> 3. **Pagination strategy:** How to handle listing endpoints with many results
> 4. **Filtering and sorting:** Query parameter conventions for search/filter/sort
> 5. **Error response format:** A consistent error schema with error codes, messages, and field-level validation errors
> 6. **Versioning strategy:** How to version the API without breaking existing clients
> 7. **Rate limiting:** Suggested limits and how to communicate them via headers
>
> Follow these principles: predictable URLs, consistent response shapes, meaningful status codes, and documentation-friendly design.

**When to use it:** Before writing any API code, or when you're inheriting an inconsistent API and need to plan a cleanup.

**Pro tip:** After getting the design, ask "A frontend developer is using this API for the first time with no documentation. Where will they get confused?" to find UX issues in your API.

---

## 6. Database Schema Designer

**The Prompt:**

> Design a database schema for [describe your application].
>
> **Requirements:**
> - Core features: [list what the app does]
> - Key relationships: [what connects to what — e.g., "users have many orders, orders have many items"]
> - Expected scale: [number of users, records, read/write ratio]
> - Database: [PostgreSQL/MySQL/MongoDB/other]
>
> **Deliver:**
> 1. **Entity list:** Every table/collection with its purpose in one sentence
> 2. **Schema definition:** For each table, list columns with:
>    - Column name, data type, constraints (NOT NULL, UNIQUE, etc.)
>    - Default values where appropriate
>    - Why you chose this data type (especially for non-obvious choices)
> 3. **Relationships:** All foreign keys and the type of relationship (one-to-one, one-to-many, many-to-many with join tables)
> 4. **Indexes:** Which columns to index and why (including composite indexes)
> 5. **Common queries:** The 5 most frequent queries this schema will handle, and confirm they're efficient with the proposed indexes
> 6. **Migration strategy:** The order to create tables (respecting foreign key dependencies)
> 7. **Future-proofing:** What changes are likely in v2, and is the schema flexible enough to handle them without a painful migration?
>
> Flag any denormalization decisions and explain the tradeoff.

**When to use it:** At the start of any project, before writing models or migrations, or when you're restructuring an existing database.

**Pro tip:** Include "What data will I wish I had been storing in 6 months?" to catch tracking and analytics fields you'd otherwise forget.

---

## 7. Test Suite Architect

**The Prompt:**

> Write a comprehensive test suite for this code:
>
> ```
> [paste your code — function, class, or module]
> ```
>
> **Testing framework:** [Jest/pytest/RSpec/Go testing/etc.]
>
> **Generate tests in these categories:**
> 1. **Happy path tests:** The normal, expected use cases that must always work
> 2. **Edge cases:** Empty inputs, null/undefined, boundary values, maximum lengths, unicode, special characters
> 3. **Error cases:** Invalid inputs, missing required fields, unauthorized access, network failures
> 4. **Integration points:** If this code calls external services or databases, test the contract
> 5. **Regression traps:** Scenarios where a "simple" code change would break things — name these tests clearly (e.g., "should NOT allow negative quantities even though the type allows it")
>
> **For each test:**
> - Descriptive name following "should [expected behavior] when [condition]" pattern
> - Arrange-Act-Assert structure
> - Only test one thing per test
> - Include comments on why this test matters if the name doesn't make it obvious
>
> After the tests, tell me: what's the approximate code coverage? What important scenarios are still untested and why?

**When to use it:** When writing tests for new code, or when you've inherited code with no tests and need to add safety nets before refactoring.

**Pro tip:** Ask "If this code has a bug that makes it to production, which test from this suite would have caught it?" to evaluate whether your tests are actually protective.

---

## 8. Documentation Generator

**The Prompt:**

> Generate documentation for this code:
>
> ```
> [paste your code — module, class, API, or library]
> ```
>
> **Create these documentation layers:**
>
> 1. **Quick start:** 5 lines of code that show the most common use case. Someone should be able to copy-paste this and have something working.
> 2. **API reference:** Every public function/method with:
>    - Description (one sentence)
>    - Parameters (name, type, required/optional, default value, description)
>    - Return type and description
>    - Example usage
>    - Throws/errors (what can go wrong)
> 3. **Conceptual guide:** A 2-3 paragraph explanation of the overall design philosophy and how the pieces fit together
> 4. **Common recipes:** 5-7 real-world usage patterns beyond the basic example
> 5. **Migration guide:** If this is a v2, what changed from v1 and how to update
> 6. **Troubleshooting:** The 5 most common mistakes someone will make and how to fix them
>
> Write for a developer who is competent but has never seen this code before. Avoid jargon specific to your codebase.

**When to use it:** When you've built something others will use (library, API, internal tool) and need docs that actually help people.

**Pro tip:** After generating docs, ask "A junior developer just read this documentation. What question do they still have?" to find gaps.

---

## 9. Performance Optimization Advisor

**The Prompt:**

> Analyze this code for performance issues and optimization opportunities:
>
> ```
> [paste your code]
> ```
>
> **Context:**
> - This runs [how often — per request, in a cron job, on user interaction]
> - Typical data size: [how much data is processed]
> - Current performance: [any metrics — response time, memory usage, CPU]
> - Performance target: [what you need it to be]
>
> **Analyze:**
> 1. **Time complexity:** What's the Big O? Is there a more efficient algorithm?
> 2. **Space complexity:** Is memory usage reasonable? Any unnecessary allocations?
> 3. **I/O bottlenecks:** Database queries in loops? Unparallelized async calls? Missing caching?
> 4. **Framework-specific issues:** [React re-renders / Django query optimization / Node event loop blocking / etc.] based on the stack
> 5. **Quick wins:** Changes that take < 30 minutes and give measurable improvement
> 6. **Structural improvements:** Larger changes that would fundamentally improve performance
>
> **For each optimization:**
> - The before code
> - The after code
> - Expected improvement (rough estimate)
> - Any tradeoffs (readability, memory, complexity)
>
> Rank all optimizations by impact-to-effort ratio. Start with the biggest wins.

**When to use it:** When something is slow, when you're about to scale, or during regular performance audits of critical paths.

**Pro tip:** Include real performance measurements (response times, query counts) rather than just the code — "this endpoint takes 3.2s" gives much better advice than "optimize this."

---

## 10. Security Audit Checklist

**The Prompt:**

> Perform a security review on this code:
>
> ```
> [paste your code]
> ```
>
> **Context:**
> - This handles: [user input/payments/authentication/file uploads/etc.]
> - Stack: [language, framework, database]
> - Deployment: [how and where this runs]
>
> **Check for these vulnerability categories:**
> 1. **Injection attacks:** SQL injection, XSS, command injection, LDAP injection — show me the specific vulnerable lines
> 2. **Authentication/authorization:** Missing auth checks, broken access control, privilege escalation paths
> 3. **Data exposure:** Sensitive data in logs, error messages, API responses, or URLs
> 4. **Input validation:** Missing validation, insufficient sanitization, type confusion
> 5. **Configuration:** Hardcoded secrets, debug mode in production, permissive CORS, missing security headers
> 6. **Dependencies:** Known vulnerable patterns with the framework/libraries being used
> 7. **Cryptography:** Weak hashing, missing encryption, insecure random number generation
>
> **For each finding:**
> - Severity: Critical / High / Medium / Low
> - The vulnerable code
> - Attack scenario (how would someone exploit this?)
> - The fix (show the secure version)
> - Reference (OWASP category or CVE if applicable)
>
> End with a security score (A-F) and the top 3 things to fix before this code touches production.

**When to use it:** Before deploying any code that handles user data, authentication, payments, or file uploads.

**Pro tip:** Run this on your authentication flow first — it's the highest-value target and where bugs have the most impact.

---

## 11. Git Commit Message Crafter

**The Prompt:**

> Here's a diff of my code changes:
>
> ```
> [paste your git diff or describe the changes]
> ```
>
> Write a git commit message following these conventions:
>
> 1. **Type prefix:** `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, or `style:`
> 2. **Subject line:** Under 72 characters, imperative mood ("Add feature" not "Added feature"), no period at the end
> 3. **Body (if the change is non-trivial):** Explain WHAT changed and WHY (not HOW — the diff shows how). Wrap at 72 characters.
> 4. **Breaking changes:** If any, add `BREAKING CHANGE:` footer
> 5. **Related issues:** Reference tickets or issues if applicable
>
> Give me 3 options:
> - **Concise:** Just the subject line
> - **Detailed:** Subject + body
> - **Verbose:** Subject + body + context about the decision
>
> If the diff contains multiple logical changes, suggest splitting into multiple commits and provide a message for each.

**When to use it:** When you want your git history to be clean and useful, not a graveyard of "fix stuff" and "update things" messages.

**Pro tip:** If the commit message is hard to write, the commit is probably too big. Use the "suggest splitting" feature to keep commits atomic.

---

## 12. Codebase Onboarding Guide

**The Prompt:**

> I'm joining a project and need to understand the codebase quickly. Here's what I know:
>
> **Repo structure:**
> ```
> [paste the output of your file tree, or describe the main directories]
> ```
>
> **Stack:** [language, framework, database, hosting]
> **Key files I've looked at:** [paste snippets or file names]
>
> Help me build a mental model:
>
> 1. **Architecture overview:** What pattern is this project using? (MVC, microservices, monolith, serverless, etc.) Draw me a text-based diagram of how data flows through the system.
> 2. **Entry points:** Where does a request enter the system? Trace a typical user action (e.g., "user logs in") through the code.
> 3. **Key abstractions:** What are the most important classes/modules/functions? What does each one own?
> 4. **Configuration:** Where are environment variables, feature flags, and secrets managed?
> 5. **Data model:** What are the core database tables/models and how do they relate?
> 6. **Testing strategy:** Where are tests? How do I run them? What's the coverage situation?
> 7. **Deployment:** How does code get from a PR to production?
> 8. **Gotchas:** Based on the code patterns, what are the likely "trap doors" that would bite a new developer?
>
> Prioritize what I should read first to become productive fastest.

**When to use it:** First day on a new project, or when onboarding someone onto your team and want to create an onboarding doc.

**Pro tip:** Paste the README, main config file, and one key route/controller — those three files usually reveal 80% of the project's structure.
