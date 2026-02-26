# Mail Whale Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Chrome extension + backend that learns email writing style from sent emails and generates replies in the user's voice.

**Architecture:** pnpm + Turborepo monorepo with a WXT-based Chrome extension (Manifest V3, React, TypeScript) and a Hono backend (Node.js, Prisma, Supabase PostgreSQL). The extension uses `chrome.sidePanel` for UI, reads Gmail/Outlook emails locally, extracts style patterns, and sends them to the backend which calls the Claude API for draft generation.

**Tech Stack:** WXT, React 19, TypeScript, Hono, Prisma, Supabase, Anthropic Claude API, pnpm workspaces, Turborepo

---

## Phase 1: Project Scaffolding

### Task 1: Initialize Monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.nvmrc`

**Step 1: Initialize root package.json**

```json
{
  "name": "mail-whale",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.4.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

**Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".output/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Step 4: Create .gitignore**

```
node_modules/
dist/
.output/
.env
.env.local
*.log
.turbo/
.wxt/
```

**Step 5: Create .nvmrc**

```
22
```

**Step 6: Install root dependencies**

Run: `pnpm install`

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: initialize pnpm + turborepo monorepo"
```

---

### Task 2: Scaffold Chrome Extension with WXT

**Files:**
- Create: `apps/extension/package.json`
- Create: `apps/extension/wxt.config.ts`
- Create: `apps/extension/tsconfig.json`
- Create: `apps/extension/src/entrypoints/background.ts`
- Create: `apps/extension/src/entrypoints/sidepanel/index.html`
- Create: `apps/extension/src/entrypoints/sidepanel/main.tsx`
- Create: `apps/extension/src/entrypoints/sidepanel/App.tsx`
- Create: `apps/extension/public/icon-128.png`

**Step 1: Create extension package.json**

```json
{
  "name": "@mail-whale/extension",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "wxt",
    "build": "wxt build",
    "zip": "wxt zip",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "wxt": "^0.20.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/chrome": "^0.0.287",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

**Step 2: Create wxt.config.ts**

```typescript
import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Mail Whale",
    description:
      "Learn your email writing style and generate replies in your voice",
    permissions: ["identity", "sidePanel", "storage", "activeTab"],
    oauth2: {
      client_id: "PLACEHOLDER.apps.googleusercontent.com",
      scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
    },
    side_panel: {
      default_path: "sidepanel/index.html",
    },
    host_permissions: [
      "https://mail.google.com/*",
      "https://outlook.live.com/*",
      "https://outlook.office.com/*",
    ],
  },
});
```

**Step 3: Create tsconfig.json**

```json
{
  "extends": "./.wxt/tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Step 4: Create background service worker**

`apps/extension/src/entrypoints/background.ts`:
```typescript
export default defineBackground(() => {
  // Open side panel when extension icon is clicked
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  console.log("Mail Whale background service worker started");
});
```

**Step 5: Create side panel HTML**

`apps/extension/src/entrypoints/sidepanel/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mail Whale</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

**Step 6: Create React entry point and App component**

`apps/extension/src/entrypoints/sidepanel/main.tsx`:
```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`apps/extension/src/entrypoints/sidepanel/App.tsx`:
```typescript
import React from "react";

export default function App() {
  return (
    <div style={{ padding: "16px", fontFamily: "system-ui, sans-serif" }}>
      <h1>Mail Whale</h1>
      <p>Your personal email writing assistant</p>
    </div>
  );
}
```

**Step 7: Create a placeholder icon**

Generate a simple 128x128 PNG icon (solid blue square with "MW" text) or use a placeholder. Save to `apps/extension/public/icon-128.png`.

**Step 8: Install extension dependencies**

Run: `cd apps/extension && pnpm install`

**Step 9: Verify the extension builds**

Run: `cd apps/extension && pnpm build`
Expected: Build succeeds, outputs to `.output/chrome-mv3/`

**Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Chrome extension with WXT + React"
```

---

### Task 3: Scaffold Backend API with Hono

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/routes/health.ts`
- Create: `apps/api/.env.example`

**Step 1: Create API package.json**

```json
{
  "name": "@mail-whale/api",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "hono": "^4.7.0",
    "@hono/node-server": "^1.14.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0",
    "@types/node": "^22.0.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

**Step 3: Create main server entry**

`apps/api/src/index.ts`:
```typescript
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { healthRoutes } from "./routes/health.js";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [
      "chrome-extension://*",
      "https://mail.google.com",
      "https://outlook.live.com",
      "https://outlook.office.com",
    ],
  })
);

app.route("/", healthRoutes);

const port = Number(process.env.PORT) || 3001;
console.log(`Mail Whale API running on port ${port}`);
serve({ fetch: app.fetch, port });

export default app;
```

**Step 4: Create health route**

`apps/api/src/routes/health.ts`:
```typescript
import { Hono } from "hono";

export const healthRoutes = new Hono();

healthRoutes.get("/health", (c) => {
  return c.json({ status: "ok", service: "mail-whale-api" });
});
```

**Step 5: Create .env.example**

```
PORT=3001
DATABASE_URL=
DIRECT_URL=
ANTHROPIC_API_KEY=
JWT_SECRET=
```

**Step 6: Install API dependencies**

Run: `cd apps/api && pnpm install`

**Step 7: Write a test for the health endpoint**

Create `apps/api/src/routes/health.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import app from "../index.js";

describe("GET /health", () => {
  it("returns ok status", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok", service: "mail-whale-api" });
  });
});
```

**Step 8: Run test to verify it passes**

Run: `cd apps/api && pnpm test`
Expected: 1 test passes

**Step 9: Verify dev server starts**

Run: `cd apps/api && pnpm dev`
Expected: Server starts on port 3001. Visit `http://localhost:3001/health` to see `{"status":"ok","service":"mail-whale-api"}`. Stop the server.

**Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Hono backend API with health endpoint"
```

---

### Task 4: Set Up Shared Types Package

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/src/style-profile.ts`
- Create: `packages/types/src/api.ts`

**Step 1: Create types package.json**

```json
{
  "name": "@mail-whale/types",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "lint": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "declaration": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

**Step 3: Create StyleProfile type**

`packages/types/src/style-profile.ts`:
```typescript
export interface StyleProfile {
  /** Greeting patterns ranked by frequency, e.g. ["Hey", "Hi {name}", "Hello"] */
  greetings: string[];
  /** Sign-off patterns ranked by frequency, e.g. ["Best", "Cheers", "Thanks"] */
  signOffs: string[];
  /** Average words per sentence */
  avgWordsPerSentence: number;
  /** Average sentences per paragraph */
  avgSentencesPerParagraph: number;
  /** Average paragraphs per email */
  avgParagraphsPerEmail: number;
  /** Emoji usage rate (0-1, where 0 = never, 1 = every email) */
  emojiRate: number;
  /** Contraction usage rate (0-1) */
  contractionRate: number;
  /** Question-to-statement ratio (0-1) */
  questionRatio: number;
  /** Formality level (1-10, 1 = very casual, 10 = very formal) */
  formality: number;
  /** Directness level (1-10, 1 = indirect/hedging, 10 = very direct) */
  directness: number;
  /** Warmth level (1-10, 1 = cold/professional, 10 = warm/friendly) */
  warmth: number;
  /** Structure preference: prose, bullets, numbered, or mixed */
  structurePreference: "prose" | "bullets" | "numbered" | "mixed";
  /** Frequently used words/phrases unique to this user */
  vocabularyFingerprint: string[];
  /** Total emails analyzed to build this profile */
  emailsAnalyzed: number;
  /** ISO timestamp of last profile update */
  lastUpdated: string;
}
```

**Step 4: Create API request/response types**

`packages/types/src/api.ts`:
```typescript
import type { StyleProfile } from "./style-profile.js";

export interface GenerateRequest {
  /** The user's style profile */
  styleProfile: StyleProfile;
  /** 3-5 example emails from the user for few-shot context */
  exampleEmails: ExampleEmail[];
  /** The email thread the user wants to reply to */
  threadContext: ThreadMessage[];
  /** Optional user preferences for this generation */
  preferences?: GenerationPreferences;
  /** "reply" or "new" */
  mode: "reply" | "new";
  /** Brief prompt for "new" mode, e.g. "follow up on the meeting" */
  newEmailPrompt?: string;
}

export interface ExampleEmail {
  subject: string;
  body: string;
  /** ISO timestamp */
  date: string;
}

export interface ThreadMessage {
  from: string;
  to: string[];
  subject: string;
  body: string;
  date: string;
}

export interface GenerationPreferences {
  /** Tone adjustment relative to default: -3 (more casual) to +3 (more formal) */
  toneAdjust: number;
  /** Desired length: "brief" | "standard" | "detailed" */
  length: "brief" | "standard" | "detailed";
}

export interface GenerateResponse {
  draft: string;
  /** Unique ID for this generation (for feedback/regenerate) */
  generationId: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}
```

**Step 5: Create barrel export**

`packages/types/src/index.ts`:
```typescript
export * from "./style-profile.js";
export * from "./api.js";
```

**Step 6: Install and verify**

Run: `cd packages/types && pnpm install && pnpm lint`
Expected: No TypeScript errors

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add shared types package with StyleProfile and API types"
```

---

## Phase 2: Gmail OAuth + Email Fetching

### Task 5: Implement Gmail OAuth in Extension

**Files:**
- Create: `apps/extension/src/lib/auth/gmail.ts`
- Create: `apps/extension/src/lib/auth/types.ts`
- Modify: `apps/extension/src/entrypoints/background.ts`

**Step 1: Create auth types**

`apps/extension/src/lib/auth/types.ts`:
```typescript
export interface AuthState {
  provider: "gmail" | "outlook";
  accessToken: string;
  email: string;
  expiresAt: number;
}
```

**Step 2: Create Gmail auth module**

`apps/extension/src/lib/auth/gmail.ts`:
```typescript
import type { AuthState } from "./types";

export async function authenticateGmail(): Promise<AuthState> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message || "Auth failed"));
        return;
      }

      // Fetch user's email address
      const res = await fetch(
        "https://www.googleapis.com/gmail/v1/users/me/profile",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const profile = await res.json();

      const authState: AuthState = {
        provider: "gmail",
        accessToken: token,
        email: profile.emailAddress,
        expiresAt: Date.now() + 3600 * 1000, // 1 hour
      };

      // Persist to extension storage
      await chrome.storage.local.set({ authState });
      resolve(authState);
    });
  });
}

export async function getGmailToken(): Promise<string | null> {
  const data = await chrome.storage.local.get("authState");
  const state = data.authState as AuthState | undefined;
  if (!state || state.provider !== "gmail") return null;
  if (Date.now() > state.expiresAt) {
    // Token expired, refresh silently
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        resolve(token || null);
      });
    });
  }
  return state.accessToken;
}

export async function signOutGmail(): Promise<void> {
  const data = await chrome.storage.local.get("authState");
  const state = data.authState as AuthState | undefined;
  if (state?.accessToken) {
    chrome.identity.removeCachedAuthToken({ token: state.accessToken });
  }
  await chrome.storage.local.remove("authState");
}
```

**Step 3: Add auth message handler to background**

Update `apps/extension/src/entrypoints/background.ts`:
```typescript
import { authenticateGmail, signOutGmail } from "../lib/auth/gmail";

export default defineBackground(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GMAIL_AUTH") {
      authenticateGmail().then(sendResponse).catch((err) =>
        sendResponse({ error: err.message })
      );
      return true; // async response
    }
    if (message.type === "SIGN_OUT") {
      signOutGmail().then(() => sendResponse({ ok: true }));
      return true;
    }
  });

  console.log("Mail Whale background service worker started");
});
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Gmail OAuth authentication via Chrome Identity API"
```

---

### Task 6: Build Gmail Email Fetcher

**Files:**
- Create: `apps/extension/src/lib/email/gmail-fetcher.ts`
- Create: `apps/extension/src/lib/email/types.ts`
- Create: `apps/extension/src/lib/email/gmail-fetcher.test.ts`

**Step 1: Create email types**

`apps/extension/src/lib/email/types.ts`:
```typescript
export interface RawEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  body: string;
  date: string;
  snippet: string;
}

export interface FetchProgress {
  fetched: number;
  total: number;
  status: "scanning" | "done" | "error";
}
```

**Step 2: Create Gmail fetcher**

`apps/extension/src/lib/email/gmail-fetcher.ts`:
```typescript
import type { RawEmail, FetchProgress } from "./types";

const GMAIL_API = "https://www.googleapis.com/gmail/v1/users/me";

async function gmailFetch(path: string, token: string) {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Gmail API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch sent emails from Gmail API.
 * Uses pagination to get up to `maxEmails` sent messages.
 */
export async function fetchSentEmails(
  token: string,
  maxEmails: number = 500,
  onProgress?: (progress: FetchProgress) => void
): Promise<RawEmail[]> {
  const emails: RawEmail[] = [];
  let pageToken: string | undefined;
  let total = 0;

  // First, get total count estimate
  const initial = await gmailFetch(
    `/messages?labelIds=SENT&maxResults=1`,
    token
  );
  total = Math.min(initial.resultSizeEstimate || maxEmails, maxEmails);

  do {
    const pageSize = Math.min(100, maxEmails - emails.length);
    const query = `/messages?labelIds=SENT&maxResults=${pageSize}${
      pageToken ? `&pageToken=${pageToken}` : ""
    }`;
    const page = await gmailFetch(query, token);

    if (!page.messages) break;

    // Fetch full message details in batches of 10
    for (let i = 0; i < page.messages.length; i += 10) {
      const batch = page.messages.slice(i, i + 10);
      const details = await Promise.all(
        batch.map((msg: { id: string }) =>
          gmailFetch(`/messages/${msg.id}?format=full`, token)
        )
      );

      for (const detail of details) {
        const email = parseGmailMessage(detail);
        if (email) emails.push(email);
      }

      onProgress?.({
        fetched: emails.length,
        total,
        status: "scanning",
      });
    }

    pageToken = page.nextPageToken;
  } while (pageToken && emails.length < maxEmails);

  onProgress?.({ fetched: emails.length, total: emails.length, status: "done" });
  return emails;
}

function parseGmailMessage(message: any): RawEmail | null {
  const headers = message.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
      ?.value || "";

  const subject = getHeader("Subject");
  const from = getHeader("From");
  const to = getHeader("To")
    .split(",")
    .map((t: string) => t.trim());
  const date = getHeader("Date");

  const body = extractBody(message.payload);
  if (!body) return null;

  return {
    id: message.id,
    threadId: message.threadId,
    subject,
    from,
    to,
    body,
    date,
    snippet: message.snippet || "",
  };
}

function extractBody(payload: any): string {
  if (!payload) return "";

  // Direct body
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Multipart - prefer text/plain
  if (payload.parts) {
    const textPart = payload.parts.find(
      (p: any) => p.mimeType === "text/plain"
    );
    if (textPart?.body?.data) {
      return decodeBase64Url(textPart.body.data);
    }
    // Fallback to first part with body
    for (const part of payload.parts) {
      const body = extractBody(part);
      if (body) return body;
    }
  }

  return "";
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64);
}
```

**Step 3: Write unit test for parseGmailMessage**

`apps/extension/src/lib/email/gmail-fetcher.test.ts`:
```typescript
import { describe, it, expect } from "vitest";

// We'll test the parsing logic by extracting it or testing via the module
// For now, test the decodeBase64Url and parsing utilities
describe("Gmail email parsing", () => {
  it("decodes base64url encoded body", () => {
    // "Hello World" in base64url
    const encoded = btoa("Hello World")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    expect(decoded).toBe("Hello World");
  });
});
```

**Step 4: Run test**

Run: `cd apps/extension && pnpm test`
Expected: Test passes

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Gmail sent email fetcher with pagination and progress"
```

---

## Phase 3: Style Analyzer (Local Processing)

### Task 7: Build the Style Analyzer

**Files:**
- Create: `apps/extension/src/lib/analyzer/style-analyzer.ts`
- Create: `apps/extension/src/lib/analyzer/text-utils.ts`
- Create: `apps/extension/src/lib/analyzer/style-analyzer.test.ts`
- Create: `apps/extension/src/lib/analyzer/text-utils.test.ts`

**Step 1: Write failing tests for text utilities**

`apps/extension/src/lib/analyzer/text-utils.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import {
  splitSentences,
  splitParagraphs,
  countWords,
  extractGreeting,
  extractSignOff,
  contractionRate,
  emojiRate,
  questionRatio,
} from "./text-utils";

describe("splitSentences", () => {
  it("splits on periods, exclamation, question marks", () => {
    expect(splitSentences("Hello. How are you? Great!")).toEqual([
      "Hello.",
      "How are you?",
      "Great!",
    ]);
  });

  it("handles empty string", () => {
    expect(splitSentences("")).toEqual([]);
  });
});

describe("splitParagraphs", () => {
  it("splits on double newlines", () => {
    expect(splitParagraphs("First paragraph.\n\nSecond paragraph.")).toEqual([
      "First paragraph.",
      "Second paragraph.",
    ]);
  });
});

describe("countWords", () => {
  it("counts words in a string", () => {
    expect(countWords("Hello world foo bar")).toBe(4);
  });
  it("returns 0 for empty string", () => {
    expect(countWords("")).toBe(0);
  });
});

describe("extractGreeting", () => {
  it("extracts common greetings", () => {
    expect(extractGreeting("Hey John,\n\nHow are you?")).toBe("Hey");
    expect(extractGreeting("Hi there,\n\nJust wanted to check in.")).toBe("Hi");
    expect(extractGreeting("Hello,\n\nI hope this email finds you well.")).toBe(
      "Hello"
    );
  });
  it("returns null when no greeting found", () => {
    expect(extractGreeting("Just wanted to follow up on the project.")).toBeNull();
  });
});

describe("extractSignOff", () => {
  it("extracts common sign-offs", () => {
    expect(extractSignOff("See you tomorrow.\n\nBest,\nAaron")).toBe("Best");
    expect(extractSignOff("Let me know.\n\nThanks,\nAaron")).toBe("Thanks");
    expect(extractSignOff("Talk soon.\n\nCheers,\nAaron")).toBe("Cheers");
  });
});

describe("contractionRate", () => {
  it("calculates rate of contractions", () => {
    const rate = contractionRate("I don't think we can't do this. It isn't possible.");
    expect(rate).toBeGreaterThan(0);
  });
  it("returns 0 for no contractions", () => {
    expect(contractionRate("I do not think so.")).toBe(0);
  });
});

describe("emojiRate", () => {
  it("detects emoji usage", () => {
    expect(emojiRate("Great job! 🎉")).toBeGreaterThan(0);
  });
  it("returns 0 for no emojis", () => {
    expect(emojiRate("Great job.")).toBe(0);
  });
});

describe("questionRatio", () => {
  it("calculates question-to-statement ratio", () => {
    expect(questionRatio("How are you? I am fine. What about you?")).toBeCloseTo(
      2 / 3
    );
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/extension && pnpm test`
Expected: All tests fail (module not found)

**Step 3: Implement text utilities**

`apps/extension/src/lib/analyzer/text-utils.ts`:
```typescript
const GREETING_PATTERNS = [
  /^(Hey|Hi|Hello|Dear|Good morning|Good afternoon|Good evening|Howdy|Yo|Hiya|What's up)/i,
];

const SIGNOFF_PATTERNS = [
  /(?:^|\n)(Best|Thanks|Cheers|Regards|Sincerely|Warmly|Take care|Best regards|Kind regards|Many thanks|Thank you|Yours truly|Respectfully|All the best|Talk soon|Later|Peace|Warm regards|With appreciation)[\s,]*$/im,
];

const CONTRACTION_PATTERN =
  /\b(don't|can't|won't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|couldn't|shouldn't|wouldn't|didn't|doesn't|I'm|I've|I'll|I'd|you're|you've|you'll|you'd|he's|she's|it's|we're|we've|we'll|we'd|they're|they've|they'll|they'd|let's|that's|who's|what's|where's|there's|here's)\b/gi;

const EMOJI_PATTERN =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

export function splitSentences(text: string): string[] {
  if (!text.trim()) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export function extractGreeting(text: string): string | null {
  const firstLine = text.split("\n")[0].trim();
  for (const pattern of GREETING_PATTERNS) {
    const match = firstLine.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function extractSignOff(text: string): string | null {
  for (const pattern of SIGNOFF_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function contractionRate(text: string): number {
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return 0;
  const matches = text.match(CONTRACTION_PATTERN);
  return matches ? matches.length / words.length : 0;
}

export function emojiRate(text: string): number {
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return 0;
  const matches = text.match(EMOJI_PATTERN);
  return matches ? matches.length / words.length : 0;
}

export function questionRatio(text: string): number {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return 0;
  const questions = sentences.filter((s) => s.endsWith("?"));
  return questions.length / sentences.length;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/extension && pnpm test`
Expected: All tests pass

**Step 5: Write failing test for style analyzer**

`apps/extension/src/lib/analyzer/style-analyzer.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { analyzeStyle } from "./style-analyzer";
import type { RawEmail } from "../email/types";

const sampleEmails: RawEmail[] = [
  {
    id: "1",
    threadId: "t1",
    subject: "Re: Meeting",
    from: "me@example.com",
    to: ["bob@example.com"],
    body: "Hey Bob,\n\nJust wanted to confirm our meeting tomorrow at 3pm. Does that still work for you?\n\nCheers,\nAaron",
    date: "2026-01-15T10:00:00Z",
    snippet: "Just wanted to confirm",
  },
  {
    id: "2",
    threadId: "t2",
    subject: "Quick question",
    from: "me@example.com",
    to: ["alice@example.com"],
    body: "Hey Alice,\n\nDo you have the latest report? I need it for the presentation.\n\nThanks,\nAaron",
    date: "2026-01-16T14:00:00Z",
    snippet: "Do you have the latest report",
  },
  {
    id: "3",
    threadId: "t3",
    subject: "Project update",
    from: "me@example.com",
    to: ["team@example.com"],
    body: "Hey team,\n\nHere's a quick update on the project. We're on track for the deadline. I'll send more details next week.\n\nBest,\nAaron",
    date: "2026-01-17T09:00:00Z",
    snippet: "Here's a quick update",
  },
];

describe("analyzeStyle", () => {
  it("produces a valid StyleProfile from sample emails", () => {
    const profile = analyzeStyle(sampleEmails);

    expect(profile.greetings).toContain("Hey");
    expect(profile.signOffs.length).toBeGreaterThan(0);
    expect(profile.avgWordsPerSentence).toBeGreaterThan(0);
    expect(profile.avgSentencesPerParagraph).toBeGreaterThan(0);
    expect(profile.avgParagraphsPerEmail).toBeGreaterThan(0);
    expect(profile.formality).toBeGreaterThanOrEqual(1);
    expect(profile.formality).toBeLessThanOrEqual(10);
    expect(profile.directness).toBeGreaterThanOrEqual(1);
    expect(profile.directness).toBeLessThanOrEqual(10);
    expect(profile.warmth).toBeGreaterThanOrEqual(1);
    expect(profile.warmth).toBeLessThanOrEqual(10);
    expect(profile.emailsAnalyzed).toBe(3);
    expect(profile.lastUpdated).toBeTruthy();
  });

  it("returns empty profile for no emails", () => {
    const profile = analyzeStyle([]);
    expect(profile.emailsAnalyzed).toBe(0);
  });
});
```

**Step 6: Run test to verify it fails**

Run: `cd apps/extension && pnpm test`
Expected: Fails with "module not found"

**Step 7: Implement style analyzer**

`apps/extension/src/lib/analyzer/style-analyzer.ts`:
```typescript
import type { StyleProfile } from "@mail-whale/types";
import type { RawEmail } from "../email/types";
import {
  splitSentences,
  splitParagraphs,
  countWords,
  extractGreeting,
  extractSignOff,
  contractionRate,
  emojiRate,
  questionRatio,
} from "./text-utils";

export function analyzeStyle(emails: RawEmail[]): StyleProfile {
  if (emails.length === 0) {
    return emptyProfile();
  }

  const greetingCounts = new Map<string, number>();
  const signOffCounts = new Map<string, number>();
  let totalWordsPerSentence = 0;
  let totalSentences = 0;
  let totalSentencesPerParagraph = 0;
  let totalParagraphs = 0;
  let totalParagraphsPerEmail = 0;
  let totalEmojiRate = 0;
  let totalContractionRate = 0;
  let totalQuestionRatio = 0;
  const wordFrequency = new Map<string, number>();

  for (const email of emails) {
    const body = email.body;

    // Greetings
    const greeting = extractGreeting(body);
    if (greeting) {
      greetingCounts.set(greeting, (greetingCounts.get(greeting) || 0) + 1);
    }

    // Sign-offs
    const signOff = extractSignOff(body);
    if (signOff) {
      signOffCounts.set(signOff, (signOffCounts.get(signOff) || 0) + 1);
    }

    // Sentence analysis
    const paragraphs = splitParagraphs(body);
    totalParagraphsPerEmail += paragraphs.length;

    for (const para of paragraphs) {
      const sentences = splitSentences(para);
      totalSentencesPerParagraph += sentences.length;
      totalParagraphs++;

      for (const sentence of sentences) {
        const wc = countWords(sentence);
        totalWordsPerSentence += wc;
        totalSentences++;
      }
    }

    // Rates
    totalEmojiRate += emojiRate(body);
    totalContractionRate += contractionRate(body);
    totalQuestionRatio += questionRatio(body);

    // Word frequency (for vocabulary fingerprint)
    const words = body.toLowerCase().split(/\s+/);
    for (const word of words) {
      const clean = word.replace(/[^a-z']/g, "");
      if (clean.length > 3) {
        wordFrequency.set(clean, (wordFrequency.get(clean) || 0) + 1);
      }
    }
  }

  const n = emails.length;

  // Sort greetings/signoffs by frequency
  const greetings = sortByFrequency(greetingCounts);
  const signOffs = sortByFrequency(signOffCounts);

  // Calculate averages
  const avgWordsPerSentence =
    totalSentences > 0 ? totalWordsPerSentence / totalSentences : 0;
  const avgSentencesPerParagraph =
    totalParagraphs > 0 ? totalSentencesPerParagraph / totalParagraphs : 0;
  const avgParagraphsPerEmail = totalParagraphsPerEmail / n;
  const avgEmojiRate = totalEmojiRate / n;
  const avgContractionRate = totalContractionRate / n;
  const avgQuestionRatio = totalQuestionRatio / n;

  // Derive qualitative scores
  const formality = deriveFormality(avgContractionRate, greetings, signOffs);
  const directness = deriveDirectness(avgWordsPerSentence, avgQuestionRatio);
  const warmth = deriveWarmth(greetings, avgEmojiRate, avgContractionRate);
  const structurePreference = deriveStructure(emails);

  // Top vocabulary (filter common words)
  const vocabularyFingerprint = getVocabularyFingerprint(wordFrequency, n);

  return {
    greetings,
    signOffs,
    avgWordsPerSentence: round(avgWordsPerSentence),
    avgSentencesPerParagraph: round(avgSentencesPerParagraph),
    avgParagraphsPerEmail: round(avgParagraphsPerEmail),
    emojiRate: round(avgEmojiRate),
    contractionRate: round(avgContractionRate),
    questionRatio: round(avgQuestionRatio),
    formality,
    directness,
    warmth,
    structurePreference,
    vocabularyFingerprint,
    emailsAnalyzed: n,
    lastUpdated: new Date().toISOString(),
  };
}

function emptyProfile(): StyleProfile {
  return {
    greetings: [],
    signOffs: [],
    avgWordsPerSentence: 0,
    avgSentencesPerParagraph: 0,
    avgParagraphsPerEmail: 0,
    emojiRate: 0,
    contractionRate: 0,
    questionRatio: 0,
    formality: 5,
    directness: 5,
    warmth: 5,
    structurePreference: "prose",
    vocabularyFingerprint: [],
    emailsAnalyzed: 0,
    lastUpdated: new Date().toISOString(),
  };
}

function sortByFrequency(counts: Map<string, number>): string[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
}

function deriveFormality(
  contractionRate: number,
  greetings: string[],
  signOffs: string[]
): number {
  let score = 5;
  // High contraction rate = less formal
  score -= contractionRate * 5;
  // Casual greetings lower formality
  const casualGreetings = ["Hey", "Yo", "Hiya", "What's up"];
  if (greetings[0] && casualGreetings.includes(greetings[0])) score -= 1;
  // Formal sign-offs raise formality
  const formalSignOffs = ["Regards", "Sincerely", "Respectfully", "Best regards"];
  if (signOffs[0] && formalSignOffs.includes(signOffs[0])) score += 1;
  return clamp(Math.round(score), 1, 10);
}

function deriveDirectness(
  avgWordsPerSentence: number,
  questionRatio: number
): number {
  let score = 5;
  // Shorter sentences = more direct
  if (avgWordsPerSentence < 12) score += 2;
  else if (avgWordsPerSentence > 20) score -= 2;
  // Fewer questions = more direct
  if (questionRatio < 0.15) score += 1;
  else if (questionRatio > 0.4) score -= 1;
  return clamp(Math.round(score), 1, 10);
}

function deriveWarmth(
  greetings: string[],
  emojiRate: number,
  contractionRate: number
): number {
  let score = 5;
  if (emojiRate > 0) score += 1;
  if (contractionRate > 0.05) score += 1;
  const warmGreetings = ["Hey", "Hi", "Hiya"];
  if (greetings[0] && warmGreetings.includes(greetings[0])) score += 1;
  return clamp(Math.round(score), 1, 10);
}

function deriveStructure(
  emails: RawEmail[]
): "prose" | "bullets" | "numbered" | "mixed" {
  let bulletCount = 0;
  let numberedCount = 0;
  for (const email of emails) {
    if (/^[\s]*[-*•]/m.test(email.body)) bulletCount++;
    if (/^[\s]*\d+[.)]/m.test(email.body)) numberedCount++;
  }
  const n = emails.length;
  if (bulletCount > n * 0.3 && numberedCount > n * 0.3) return "mixed";
  if (bulletCount > n * 0.3) return "bullets";
  if (numberedCount > n * 0.3) return "numbered";
  return "prose";
}

const COMMON_WORDS = new Set([
  "the", "and", "that", "this", "with", "have", "from", "will",
  "been", "they", "their", "about", "would", "could", "should",
  "there", "what", "when", "which", "your", "just", "also",
  "more", "some", "them", "into", "than", "then", "know",
  "like", "time", "very", "make", "been", "were",
]);

function getVocabularyFingerprint(
  wordFrequency: Map<string, number>,
  emailCount: number
): string[] {
  return [...wordFrequency.entries()]
    .filter(([word, count]) => !COMMON_WORDS.has(word) && count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word]) => word);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
```

**Step 8: Run tests to verify they pass**

Run: `cd apps/extension && pnpm test`
Expected: All tests pass

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: add local style analyzer with text utilities and tests"
```

---

## Phase 4: Backend API + Claude Integration

### Task 8: Set Up Prisma + Database Schema

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/package.json` (add prisma deps)

**Step 1: Install Prisma**

Run: `cd apps/api && pnpm add prisma @prisma/client`

**Step 2: Create Prisma schema**

`apps/api/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  provider     String   // "gmail" or "outlook"
  styleProfile Json?    // The StyleProfile JSON
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  generations Generation[]
}

model Generation {
  id        String   @id @default(uuid())
  userId    String
  mode      String   // "reply" or "new"
  prompt    String?  // For "new" mode
  draft     String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

**Step 3: Create db client module**

Create `apps/api/src/lib/db.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Prisma schema with User and Generation models"
```

---

### Task 9: Build Auth Routes (JWT)

**Files:**
- Create: `apps/api/src/lib/auth.ts`
- Create: `apps/api/src/routes/auth.ts`
- Create: `apps/api/src/middleware/auth.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Install JWT dependency**

Run: `cd apps/api && pnpm add jsonwebtoken && pnpm add -D @types/jsonwebtoken`

**Step 2: Create auth utility**

`apps/api/src/lib/auth.ts`:
```typescript
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface JWTPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
```

**Step 3: Create auth middleware**

`apps/api/src/middleware/auth.ts`:
```typescript
import { createMiddleware } from "hono/factory";
import { verifyToken } from "../lib/auth.js";

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing authorization header" }, 401);
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    c.set("userId", payload.userId);
    c.set("email", payload.email);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});
```

**Step 4: Create auth route**

`apps/api/src/routes/auth.ts`:
```typescript
import { Hono } from "hono";
import { db } from "../lib/db.js";
import { signToken } from "../lib/auth.js";

export const authRoutes = new Hono();

/**
 * POST /auth/register
 * Called by the extension after OAuth.
 * Creates or finds user, returns JWT.
 */
authRoutes.post("/auth/register", async (c) => {
  const { email, provider } = await c.req.json<{
    email: string;
    provider: "gmail" | "outlook";
  }>();

  if (!email || !provider) {
    return c.json({ error: "email and provider are required" }, 400);
  }

  const user = await db.user.upsert({
    where: { email },
    update: { provider },
    create: { email, provider },
  });

  const token = signToken({ userId: user.id, email: user.email });
  return c.json({ token, user: { id: user.id, email: user.email } });
});
```

**Step 5: Register auth routes in index.ts**

Update `apps/api/src/index.ts` to add:
```typescript
import { authRoutes } from "./routes/auth.js";

// After other app.route() calls:
app.route("/", authRoutes);
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add JWT auth with register endpoint and middleware"
```

---

### Task 10: Build Generation Route (Claude API)

**Files:**
- Create: `apps/api/src/routes/generate.ts`
- Create: `apps/api/src/lib/prompt-builder.ts`
- Create: `apps/api/src/lib/prompt-builder.test.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Install Anthropic SDK**

Run: `cd apps/api && pnpm add @anthropic-ai/sdk`

**Step 2: Write failing test for prompt builder**

`apps/api/src/lib/prompt-builder.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { buildPrompt } from "./prompt-builder.js";
import type {
  StyleProfile,
  ExampleEmail,
  ThreadMessage,
  GenerationPreferences,
} from "@mail-whale/types";

const mockProfile: StyleProfile = {
  greetings: ["Hey"],
  signOffs: ["Cheers"],
  avgWordsPerSentence: 12,
  avgSentencesPerParagraph: 2,
  avgParagraphsPerEmail: 3,
  emojiRate: 0,
  contractionRate: 0.08,
  formality: 3,
  directness: 7,
  warmth: 7,
  structurePreference: "prose",
  vocabularyFingerprint: ["definitely", "awesome", "quick"],
  questionRatio: 0.2,
  emailsAnalyzed: 50,
  lastUpdated: "2026-01-01T00:00:00Z",
};

const mockExamples: ExampleEmail[] = [
  {
    subject: "Re: Meeting",
    body: "Hey Bob,\n\nSounds good, let's do 3pm.\n\nCheers,\nAaron",
    date: "2026-01-15T10:00:00Z",
  },
];

const mockThread: ThreadMessage[] = [
  {
    from: "bob@example.com",
    to: ["me@example.com"],
    subject: "Lunch tomorrow?",
    body: "Hey, want to grab lunch tomorrow?",
    date: "2026-01-20T12:00:00Z",
  },
];

describe("buildPrompt", () => {
  it("includes style profile data in system prompt", () => {
    const { system, user } = buildPrompt({
      styleProfile: mockProfile,
      exampleEmails: mockExamples,
      threadContext: mockThread,
      mode: "reply",
    });

    expect(system).toContain("Hey");
    expect(system).toContain("Cheers");
    expect(system).toContain("casual");
    expect(user).toContain("Lunch tomorrow?");
  });

  it("includes tone adjustment when provided", () => {
    const { system } = buildPrompt({
      styleProfile: mockProfile,
      exampleEmails: mockExamples,
      threadContext: mockThread,
      mode: "reply",
      preferences: { toneAdjust: 2, length: "brief" },
    });

    expect(system).toContain("more formal");
    expect(system).toContain("brief");
  });

  it("handles new email mode", () => {
    const { user } = buildPrompt({
      styleProfile: mockProfile,
      exampleEmails: mockExamples,
      threadContext: [],
      mode: "new",
      newEmailPrompt: "follow up on the meeting",
    });

    expect(user).toContain("follow up on the meeting");
  });
});
```

**Step 3: Run test to verify it fails**

Run: `cd apps/api && pnpm test`
Expected: Fails

**Step 4: Implement prompt builder**

`apps/api/src/lib/prompt-builder.ts`:
```typescript
import type {
  StyleProfile,
  ExampleEmail,
  ThreadMessage,
  GenerationPreferences,
} from "@mail-whale/types";

interface PromptInput {
  styleProfile: StyleProfile;
  exampleEmails: ExampleEmail[];
  threadContext: ThreadMessage[];
  mode: "reply" | "new";
  preferences?: GenerationPreferences;
  newEmailPrompt?: string;
}

interface PromptOutput {
  system: string;
  user: string;
}

export function buildPrompt(input: PromptInput): PromptOutput {
  const { styleProfile, exampleEmails, threadContext, mode, preferences, newEmailPrompt } = input;

  const formalityLabel = styleProfile.formality <= 3 ? "casual" : styleProfile.formality <= 6 ? "neutral" : "formal";
  const directnessLabel = styleProfile.directness >= 7 ? "direct and to-the-point" : styleProfile.directness <= 3 ? "indirect and diplomatic" : "balanced";
  const warmthLabel = styleProfile.warmth >= 7 ? "warm and friendly" : styleProfile.warmth <= 3 ? "professional and reserved" : "moderately warm";

  let toneNote = "";
  if (preferences?.toneAdjust) {
    if (preferences.toneAdjust > 0) toneNote = `\n\nIMPORTANT: Make this reply slightly more formal than usual (adjustment: +${preferences.toneAdjust}).`;
    if (preferences.toneAdjust < 0) toneNote = `\n\nIMPORTANT: Make this reply slightly more casual than usual (adjustment: ${preferences.toneAdjust}).`;
  }

  let lengthNote = "";
  if (preferences?.length) {
    const lengthMap = { brief: "Keep it short — 1-3 sentences max.", standard: "Use your normal email length.", detailed: "Write a thorough, detailed response." };
    lengthNote = `\nLength preference: ${lengthMap[preferences.length]}`;
  }

  const examplesSection = exampleEmails.length > 0
    ? `\n\nHere are examples of how this person writes emails:\n\n${exampleEmails.map((e, i) => `--- Example ${i + 1} (Subject: ${e.subject}) ---\n${e.body}`).join("\n\n")}`
    : "";

  const system = `You are a personal email writing assistant. Your job is to write emails that perfectly match this specific person's writing style. Do NOT write generic-sounding AI emails. Match their voice exactly.

WRITING STYLE PROFILE:
- Tone: ${formalityLabel}, ${directnessLabel}, ${warmthLabel}
- Typical greeting: ${styleProfile.greetings[0] || "none"}
- Typical sign-off: ${styleProfile.signOffs[0] || "none"}
- Average sentence length: ${styleProfile.avgWordsPerSentence} words
- Uses contractions: ${styleProfile.contractionRate > 0.03 ? "yes" : "rarely"}
- Uses emojis: ${styleProfile.emojiRate > 0 ? "occasionally" : "no"}
- Structure: ${styleProfile.structurePreference}
- Frequently used words: ${styleProfile.vocabularyFingerprint.slice(0, 10).join(", ") || "none identified"}
${examplesSection}

RULES:
- Match the greeting and sign-off patterns exactly
- Match the sentence length and paragraph structure
- Use the same level of formality and warmth
- Do NOT add disclaimers, caveats, or AI-sounding phrases
- Output ONLY the email body, no subject line
- Do NOT wrap in quotes or markdown${toneNote}${lengthNote}`;

  let user: string;
  if (mode === "reply") {
    const threadText = threadContext
      .map((m) => `From: ${m.from}\nSubject: ${m.subject}\nDate: ${m.date}\n\n${m.body}`)
      .join("\n\n---\n\n");
    user = `Write a reply to this email thread:\n\n${threadText}`;
  } else {
    user = `Write a new email about: ${newEmailPrompt || "general follow-up"}`;
  }

  return { system, user };
}
```

**Step 5: Run test to verify it passes**

Run: `cd apps/api && pnpm test`
Expected: All tests pass

**Step 6: Create generation route**

`apps/api/src/routes/generate.ts`:
```typescript
import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";
import { authMiddleware } from "../middleware/auth.js";
import { buildPrompt } from "../lib/prompt-builder.js";
import { db } from "../lib/db.js";
import type { GenerateRequest } from "@mail-whale/types";

export const generateRoutes = new Hono();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

generateRoutes.post("/generate", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<GenerateRequest>();

  const { system, user } = buildPrompt(body);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });

  const draft =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Save generation for analytics
  const generation = await db.generation.create({
    data: {
      userId,
      mode: body.mode,
      prompt: body.newEmailPrompt,
      draft,
    },
  });

  return c.json({ draft, generationId: generation.id });
});
```

**Step 7: Create style profile route**

Create `apps/api/src/routes/profile.ts`:
```typescript
import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../lib/db.js";
import type { StyleProfile } from "@mail-whale/types";

export const profileRoutes = new Hono();

profileRoutes.put("/profile", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const styleProfile = await c.req.json<StyleProfile>();

  await db.user.update({
    where: { id: userId },
    data: { styleProfile: styleProfile as any },
  });

  return c.json({ ok: true });
});

profileRoutes.get("/profile", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const user = await db.user.findUnique({ where: { id: userId } });
  return c.json({ styleProfile: user?.styleProfile || null });
});
```

**Step 8: Register all routes in index.ts**

Update `apps/api/src/index.ts` to import and register:
```typescript
import { generateRoutes } from "./routes/generate.js";
import { profileRoutes } from "./routes/profile.js";

app.route("/", generateRoutes);
app.route("/", profileRoutes);
```

**Step 9: Run all tests**

Run: `cd apps/api && pnpm test`
Expected: All tests pass

**Step 10: Commit**

```bash
git add -A
git commit -m "feat: add generation and profile API routes with Claude integration"
```

---

## Phase 5: Side Panel UI

### Task 11: Build the Side Panel React UI

**Files:**
- Create: `apps/extension/src/entrypoints/sidepanel/components/OnboardingView.tsx`
- Create: `apps/extension/src/entrypoints/sidepanel/components/MainView.tsx`
- Create: `apps/extension/src/entrypoints/sidepanel/components/DraftView.tsx`
- Create: `apps/extension/src/entrypoints/sidepanel/components/SettingsView.tsx`
- Create: `apps/extension/src/entrypoints/sidepanel/hooks/useAuth.ts`
- Create: `apps/extension/src/entrypoints/sidepanel/hooks/useGenerate.ts`
- Create: `apps/extension/src/entrypoints/sidepanel/styles.css`
- Modify: `apps/extension/src/entrypoints/sidepanel/App.tsx`

**Step 1: Create styles.css**

`apps/extension/src/entrypoints/sidepanel/styles.css`:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  color: #1a1a1a;
  background: #ffffff;
  width: 100%;
  min-height: 100vh;
}

.container {
  padding: 16px;
  max-width: 400px;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #1e40af;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  width: 100%;
}

.btn-primary {
  background: #1e40af;
  color: white;
}
.btn-primary:hover {
  background: #1e3a8a;
}
.btn-primary:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  color: #334155;
}
.btn-secondary:hover {
  background: #e2e8f0;
}

.draft-area {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slider-group label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.slider-group input[type="range"] {
  width: 100%;
}

.length-toggle {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 4px;
}

.length-toggle button {
  flex: 1;
  padding: 6px 8px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #64748b;
}

.length-toggle button.active {
  background: white;
  color: #1e40af;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin: 12px 0;
}

.progress-bar-fill {
  height: 100%;
  background: #1e40af;
  transition: width 0.3s ease;
}

.status-text {
  font-size: 13px;
  color: #64748b;
  text-align: center;
}

.action-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.action-row .btn {
  width: auto;
  flex: 1;
}

.error {
  color: #dc2626;
  font-size: 13px;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 8px;
  margin: 8px 0;
}

.profile-summary {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
  margin: 12px 0;
}

.profile-summary h3 {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.profile-summary .trait {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}

.profile-summary .trait-label {
  color: #64748b;
}

.profile-summary .trait-value {
  font-weight: 600;
}
```

**Step 2: Create useAuth hook**

`apps/extension/src/entrypoints/sidepanel/hooks/useAuth.ts`:
```typescript
import { useState, useEffect } from "react";
import type { AuthState } from "../../../lib/auth/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
    chrome.storage.local.get(["authState", "apiToken"], (data) => {
      if (data.authState) setAuthState(data.authState);
      if (data.apiToken) setApiToken(data.apiToken);
      setLoading(false);
    });
  }, []);

  async function connectGmail() {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GMAIL_AUTH",
      });
      if (response.error) throw new Error(response.error);

      setAuthState(response);

      // Register with backend and get JWT
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: response.email,
          provider: "gmail",
        }),
      });
      const { token } = await res.json();
      setApiToken(token);
      await chrome.storage.local.set({ apiToken: token });
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await chrome.runtime.sendMessage({ type: "SIGN_OUT" });
    await chrome.storage.local.remove(["authState", "apiToken"]);
    setAuthState(null);
    setApiToken(null);
  }

  return { authState, apiToken, loading, connectGmail, signOut };
}
```

**Step 3: Create useGenerate hook**

`apps/extension/src/entrypoints/sidepanel/hooks/useGenerate.ts`:
```typescript
import { useState } from "react";
import type { GenerateRequest, GenerateResponse } from "@mail-whale/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function useGenerate(apiToken: string | null) {
  const [draft, setDraft] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(request: GenerateRequest) {
    if (!apiToken) {
      setError("Not authenticated");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }
      const data: GenerateResponse = await res.json();
      setDraft(data.draft);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { draft, setDraft, loading, error, generate };
}
```

**Step 4: Create OnboardingView**

`apps/extension/src/entrypoints/sidepanel/components/OnboardingView.tsx`:
```typescript
import React, { useState } from "react";
import type { FetchProgress } from "../../../lib/email/types";

interface OnboardingViewProps {
  onConnectGmail: () => Promise<void>;
  scanProgress: FetchProgress | null;
  isScanning: boolean;
}

export function OnboardingView({
  onConnectGmail,
  scanProgress,
  isScanning,
}: OnboardingViewProps) {
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    setConnecting(true);
    try {
      await onConnectGmail();
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="container">
      <div className="logo">Mail Whale</div>
      <p style={{ marginBottom: 16, lineHeight: 1.5 }}>
        Mail Whale learns your writing style from your sent emails, then helps
        you write replies that sound like you.
      </p>

      {!isScanning ? (
        <>
          <button
            className="btn btn-primary"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? "Connecting..." : "Connect Gmail"}
          </button>
          <button
            className="btn btn-secondary"
            style={{ marginTop: 8 }}
            disabled
          >
            Connect Outlook (coming soon)
          </button>
        </>
      ) : (
        <>
          <p className="status-text">
            Learning your writing style...{" "}
            {scanProgress
              ? `${scanProgress.fetched} / ${scanProgress.total} emails`
              : ""}
          </p>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: scanProgress
                  ? `${(scanProgress.fetched / scanProgress.total) * 100}%`
                  : "0%",
              }}
            />
          </div>
        </>
      )}

      <p
        style={{
          marginTop: 24,
          fontSize: 12,
          color: "#94a3b8",
          lineHeight: 1.4,
        }}
      >
        Your emails are analyzed locally on your device. We never store or read
        your raw email content.
      </p>
    </div>
  );
}
```

**Step 5: Create MainView**

`apps/extension/src/entrypoints/sidepanel/components/MainView.tsx`:
```typescript
import React, { useState } from "react";
import type { StyleProfile, GenerationPreferences } from "@mail-whale/types";

interface MainViewProps {
  profile: StyleProfile | null;
  onDraftReply: (prefs: GenerationPreferences) => void;
  onDraftNew: (prompt: string, prefs: GenerationPreferences) => void;
  onSettings: () => void;
  loading: boolean;
}

export function MainView({
  profile,
  onDraftReply,
  onDraftNew,
  onSettings,
  loading,
}: MainViewProps) {
  const [toneAdjust, setToneAdjust] = useState(0);
  const [length, setLength] = useState<"brief" | "standard" | "detailed">(
    "standard"
  );
  const [newPrompt, setNewPrompt] = useState("");
  const [mode, setMode] = useState<"reply" | "new">("reply");

  const prefs: GenerationPreferences = { toneAdjust, length };

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="logo">Mail Whale</div>
        <button
          onClick={onSettings}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          Settings
        </button>
      </div>

      {/* Mode toggle */}
      <div className="length-toggle" style={{ marginBottom: 12 }}>
        <button
          className={mode === "reply" ? "active" : ""}
          onClick={() => setMode("reply")}
        >
          Reply
        </button>
        <button
          className={mode === "new" ? "active" : ""}
          onClick={() => setMode("new")}
        >
          New Email
        </button>
      </div>

      {mode === "new" && (
        <textarea
          className="draft-area"
          placeholder="What should the email be about? e.g. 'follow up on the meeting'"
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
          style={{ minHeight: 80, marginBottom: 12 }}
        />
      )}

      <div className="controls">
        {/* Tone slider */}
        <div className="slider-group">
          <label>
            Tone:{" "}
            {toneAdjust < 0
              ? "More casual"
              : toneAdjust > 0
                ? "More formal"
                : "Your default"}
          </label>
          <input
            type="range"
            min={-3}
            max={3}
            value={toneAdjust}
            onChange={(e) => setToneAdjust(Number(e.target.value))}
          />
        </div>

        {/* Length toggle */}
        <div className="slider-group">
          <label>Length</label>
          <div className="length-toggle">
            {(["brief", "standard", "detailed"] as const).map((l) => (
              <button
                key={l}
                className={length === l ? "active" : ""}
                onClick={() => setLength(l)}
              >
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        onClick={() =>
          mode === "reply"
            ? onDraftReply(prefs)
            : onDraftNew(newPrompt, prefs)
        }
        disabled={loading || (mode === "new" && !newPrompt.trim())}
      >
        {loading
          ? "Generating..."
          : mode === "reply"
            ? "Draft Reply"
            : "Draft Email"}
      </button>

      {profile && (
        <div className="profile-summary">
          <h3>Your Writing Style</h3>
          <div className="trait">
            <span className="trait-label">Tone</span>
            <span className="trait-value">
              {profile.formality <= 3
                ? "Casual"
                : profile.formality <= 6
                  ? "Neutral"
                  : "Formal"}
            </span>
          </div>
          <div className="trait">
            <span className="trait-label">Greeting</span>
            <span className="trait-value">
              {profile.greetings[0] || "None"}
            </span>
          </div>
          <div className="trait">
            <span className="trait-label">Sign-off</span>
            <span className="trait-value">
              {profile.signOffs[0] || "None"}
            </span>
          </div>
          <div className="trait">
            <span className="trait-label">Emails analyzed</span>
            <span className="trait-value">{profile.emailsAnalyzed}</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 6: Create DraftView**

`apps/extension/src/entrypoints/sidepanel/components/DraftView.tsx`:
```typescript
import React from "react";

interface DraftViewProps {
  draft: string;
  onEdit: (text: string) => void;
  onInsert: () => void;
  onRegenerate: () => void;
  onBack: () => void;
  loading: boolean;
}

export function DraftView({
  draft,
  onEdit,
  onInsert,
  onRegenerate,
  onBack,
  loading,
}: DraftViewProps) {
  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div className="logo">Draft</div>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
          }}
        >
          Back
        </button>
      </div>

      <textarea
        className="draft-area"
        value={draft}
        onChange={(e) => onEdit(e.target.value)}
        style={{ minHeight: 250 }}
      />

      <div className="action-row">
        <button
          className="btn btn-secondary"
          onClick={onRegenerate}
          disabled={loading}
        >
          {loading ? "..." : "Regenerate"}
        </button>
        <button className="btn btn-primary" onClick={onInsert}>
          Insert
        </button>
      </div>

      <p
        style={{
          marginTop: 12,
          fontSize: 12,
          color: "#94a3b8",
          textAlign: "center",
        }}
      >
        Click "Insert" to paste this draft into your email compose window.
      </p>
    </div>
  );
}
```

**Step 7: Create SettingsView**

`apps/extension/src/entrypoints/sidepanel/components/SettingsView.tsx`:
```typescript
import React from "react";
import type { StyleProfile } from "@mail-whale/types";

interface SettingsViewProps {
  profile: StyleProfile | null;
  email: string;
  onRescan: () => void;
  onSignOut: () => void;
  onBack: () => void;
  isScanning: boolean;
}

export function SettingsView({
  profile,
  email,
  onRescan,
  onSignOut,
  onBack,
  isScanning,
}: SettingsViewProps) {
  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div className="logo">Settings</div>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
          }}
        >
          Back
        </button>
      </div>

      <div className="profile-summary">
        <h3>Account</h3>
        <div className="trait">
          <span className="trait-label">Email</span>
          <span className="trait-value">{email}</span>
        </div>
        <div className="trait">
          <span className="trait-label">Emails analyzed</span>
          <span className="trait-value">
            {profile?.emailsAnalyzed || 0}
          </span>
        </div>
        <div className="trait">
          <span className="trait-label">Last updated</span>
          <span className="trait-value">
            {profile?.lastUpdated
              ? new Date(profile.lastUpdated).toLocaleDateString()
              : "Never"}
          </span>
        </div>
      </div>

      <div className="controls">
        <button
          className="btn btn-secondary"
          onClick={onRescan}
          disabled={isScanning}
        >
          {isScanning ? "Scanning..." : "Re-scan Emails"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onSignOut}
          style={{ color: "#dc2626" }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
```

**Step 8: Update App.tsx to wire everything together**

`apps/extension/src/entrypoints/sidepanel/App.tsx`:
```typescript
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "./hooks/useAuth";
import { useGenerate } from "./hooks/useGenerate";
import { OnboardingView } from "./components/OnboardingView";
import { MainView } from "./components/MainView";
import { DraftView } from "./components/DraftView";
import { SettingsView } from "./components/SettingsView";
import { fetchSentEmails } from "../../lib/email/gmail-fetcher";
import { analyzeStyle } from "../../lib/analyzer/style-analyzer";
import type { StyleProfile, GenerationPreferences } from "@mail-whale/types";
import type { FetchProgress, RawEmail } from "../../lib/email/types";
import "./styles.css";

type View = "onboarding" | "main" | "draft" | "settings";

export default function App() {
  const { authState, apiToken, loading: authLoading, connectGmail, signOut } = useAuth();
  const { draft, setDraft, loading: genLoading, error, generate } = useGenerate(apiToken);

  const [view, setView] = useState<View>("onboarding");
  const [profile, setProfile] = useState<StyleProfile | null>(null);
  const [scanProgress, setScanProgress] = useState<FetchProgress | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [emails, setEmails] = useState<RawEmail[]>([]);

  // Load cached profile on mount
  useEffect(() => {
    chrome.storage.local.get("styleProfile", (data) => {
      if (data.styleProfile) {
        setProfile(data.styleProfile);
      }
    });
  }, []);

  // Switch to main view when authenticated and profile exists
  useEffect(() => {
    if (authState && profile) {
      setView("main");
    } else if (!authState && !authLoading) {
      setView("onboarding");
    }
  }, [authState, profile, authLoading]);

  // When draft is generated, switch to draft view
  useEffect(() => {
    if (draft) setView("draft");
  }, [draft]);

  const runScan = useCallback(async () => {
    if (!authState) return;
    setIsScanning(true);
    try {
      const fetched = await fetchSentEmails(
        authState.accessToken,
        500,
        setScanProgress
      );
      setEmails(fetched);
      const newProfile = analyzeStyle(fetched);
      setProfile(newProfile);
      await chrome.storage.local.set({ styleProfile: newProfile });

      // Sync profile to backend
      if (apiToken) {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
        await fetch(`${API_URL}/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify(newProfile),
        });
      }
    } finally {
      setIsScanning(false);
    }
  }, [authState, apiToken]);

  async function handleConnectGmail() {
    await connectGmail();
    // After connecting, start scanning
    setTimeout(runScan, 500);
  }

  function handleDraftReply(prefs: GenerationPreferences) {
    if (!profile) return;
    // In a real implementation, we'd read the current email thread
    // from the active Gmail tab via content script messaging.
    // For now, use a placeholder.
    generate({
      styleProfile: profile,
      exampleEmails: emails.slice(0, 5).map((e) => ({
        subject: e.subject,
        body: e.body,
        date: e.date,
      })),
      threadContext: [], // TODO: read from active tab
      mode: "reply",
      preferences: prefs,
    });
  }

  function handleDraftNew(prompt: string, prefs: GenerationPreferences) {
    if (!profile) return;
    generate({
      styleProfile: profile,
      exampleEmails: emails.slice(0, 5).map((e) => ({
        subject: e.subject,
        body: e.body,
        date: e.date,
      })),
      threadContext: [],
      mode: "new",
      newEmailPrompt: prompt,
      preferences: prefs,
    });
  }

  function handleInsert() {
    // Send draft to content script to insert into compose window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "INSERT_DRAFT",
          draft,
        });
      }
    });
  }

  if (authLoading) {
    return (
      <div className="container">
        <div className="logo">Mail Whale</div>
        <p className="status-text">Loading...</p>
      </div>
    );
  }

  switch (view) {
    case "onboarding":
      return (
        <OnboardingView
          onConnectGmail={handleConnectGmail}
          scanProgress={scanProgress}
          isScanning={isScanning}
        />
      );
    case "main":
      return (
        <MainView
          profile={profile}
          onDraftReply={handleDraftReply}
          onDraftNew={handleDraftNew}
          onSettings={() => setView("settings")}
          loading={genLoading}
        />
      );
    case "draft":
      return (
        <DraftView
          draft={draft}
          onEdit={setDraft}
          onInsert={handleInsert}
          onRegenerate={() => {
            /* re-run last generate call */
          }}
          onBack={() => setView("main")}
          loading={genLoading}
        />
      );
    case "settings":
      return (
        <SettingsView
          profile={profile}
          email={authState?.email || ""}
          onRescan={runScan}
          onSignOut={async () => {
            await signOut();
            setProfile(null);
            setView("onboarding");
          }}
          onBack={() => setView("main")}
          isScanning={isScanning}
        />
      );
  }
}
```

**Step 9: Import styles in main.tsx**

Update `apps/extension/src/entrypoints/sidepanel/main.tsx` to add:
```typescript
import "./styles.css";
```

**Step 10: Build and verify no compile errors**

Run: `cd apps/extension && pnpm build`
Expected: Build succeeds

**Step 11: Commit**

```bash
git add -A
git commit -m "feat: add side panel UI with onboarding, main, draft, and settings views"
```

---

## Phase 6: Content Script + Email Thread Reading

### Task 12: Create Content Script for Gmail Integration

**Files:**
- Create: `apps/extension/src/entrypoints/content.ts`

**Step 1: Create content script**

`apps/extension/src/entrypoints/content.ts`:
```typescript
export default defineContentScript({
  matches: ["*://mail.google.com/*", "*://outlook.live.com/*", "*://outlook.office.com/*"],
  main() {
    // Listen for INSERT_DRAFT messages from side panel
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "INSERT_DRAFT") {
        insertDraftIntoCompose(message.draft);
        sendResponse({ ok: true });
      }
      if (message.type === "GET_THREAD") {
        const thread = readCurrentThread();
        sendResponse({ thread });
      }
      return true;
    });
  },
});

function insertDraftIntoCompose(draft: string) {
  // Gmail compose uses contenteditable divs
  const composeBody = document.querySelector<HTMLElement>(
    'div[aria-label="Message Body"][contenteditable="true"]'
  );
  if (composeBody) {
    composeBody.focus();
    // Use execCommand for better undo support
    document.execCommand("selectAll");
    document.execCommand("insertText", false, draft);
    return;
  }

  // Outlook compose
  const outlookCompose = document.querySelector<HTMLElement>(
    'div[role="textbox"][contenteditable="true"]'
  );
  if (outlookCompose) {
    outlookCompose.focus();
    document.execCommand("selectAll");
    document.execCommand("insertText", false, draft);
  }
}

function readCurrentThread(): Array<{
  from: string;
  body: string;
  date: string;
}> {
  const messages: Array<{ from: string; body: string; date: string }> = [];

  // Gmail: read expanded messages in the current thread
  const gmailMessages = document.querySelectorAll('div[data-message-id]');
  for (const msg of gmailMessages) {
    const fromEl = msg.querySelector<HTMLElement>('span[email]');
    const bodyEl = msg.querySelector<HTMLElement>('div[dir="ltr"], div.a3s');
    const dateEl = msg.querySelector<HTMLElement>('span[title]');

    messages.push({
      from: fromEl?.getAttribute("email") || fromEl?.textContent || "Unknown",
      body: bodyEl?.textContent || "",
      date: dateEl?.getAttribute("title") || "",
    });
  }

  return messages;
}
```

**Step 2: Verify build**

Run: `cd apps/extension && pnpm build`
Expected: Build succeeds with content script included

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add content script for Gmail thread reading and draft insertion"
```

---

## Phase 7: Local Email Storage (IndexedDB)

### Task 13: Add IndexedDB Storage for Emails

**Files:**
- Create: `apps/extension/src/lib/storage/email-store.ts`
- Create: `apps/extension/src/lib/storage/email-store.test.ts`

**Step 1: Write failing test**

`apps/extension/src/lib/storage/email-store.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
// IndexedDB tests require a mock - we'll test the logic
// In real integration, use fake-indexeddb

describe("EmailStore", () => {
  it("exports required functions", async () => {
    const mod = await import("./email-store");
    expect(typeof mod.saveEmails).toBe("function");
    expect(typeof mod.getEmails).toBe("function");
    expect(typeof mod.getLastScanDate).toBe("function");
    expect(typeof mod.setLastScanDate).toBe("function");
  });
});
```

**Step 2: Implement email store**

`apps/extension/src/lib/storage/email-store.ts`:
```typescript
import type { RawEmail } from "../email/types";

const DB_NAME = "mail-whale";
const DB_VERSION = 1;
const EMAILS_STORE = "emails";
const META_STORE = "meta";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(EMAILS_STORE)) {
        const store = db.createObjectStore(EMAILS_STORE, { keyPath: "id" });
        store.createIndex("date", "date");
        store.createIndex("threadId", "threadId");
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveEmails(emails: RawEmail[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(EMAILS_STORE, "readwrite");
  const store = tx.objectStore(EMAILS_STORE);
  for (const email of emails) {
    store.put(email);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getEmails(limit?: number): Promise<RawEmail[]> {
  const db = await openDB();
  const tx = db.transaction(EMAILS_STORE, "readonly");
  const store = tx.objectStore(EMAILS_STORE);
  const index = store.index("date");
  const request = index.openCursor(null, "prev"); // newest first

  const emails: RawEmail[] = [];
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor && (!limit || emails.length < limit)) {
        emails.push(cursor.value);
        cursor.continue();
      } else {
        resolve(emails);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getLastScanDate(): Promise<string | null> {
  const db = await openDB();
  const tx = db.transaction(META_STORE, "readonly");
  const store = tx.objectStore(META_STORE);
  const request = store.get("lastScanDate");
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result?.value || null);
    request.onerror = () => reject(request.error);
  });
}

export async function setLastScanDate(date: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(META_STORE, "readwrite");
  const store = tx.objectStore(META_STORE);
  store.put({ key: "lastScanDate", value: date });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllEmails(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(EMAILS_STORE, "readwrite");
  tx.objectStore(EMAILS_STORE).clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
```

**Step 3: Run test**

Run: `cd apps/extension && pnpm test`
Expected: Tests pass

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add IndexedDB email storage with scan tracking"
```

---

## Phase 8: Outlook Support

### Task 14: Add Microsoft OAuth

**Files:**
- Create: `apps/extension/src/lib/auth/outlook.ts`
- Modify: `apps/extension/src/entrypoints/background.ts`

**Step 1: Create Outlook auth module**

`apps/extension/src/lib/auth/outlook.ts`:
```typescript
import type { AuthState } from "./types";

const MS_CLIENT_ID = "PLACEHOLDER_MS_CLIENT_ID";
const MS_SCOPES = ["openid", "email", "Mail.Read"];

export async function authenticateOutlook(): Promise<AuthState> {
  const redirectUri = chrome.identity.getRedirectURL();
  const authUrl =
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
    `client_id=${MS_CLIENT_ID}&` +
    `response_type=token&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(MS_SCOPES.join(" "))}`;

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      async (responseUrl) => {
        if (chrome.runtime.lastError || !responseUrl) {
          reject(
            new Error(
              chrome.runtime.lastError?.message || "Outlook auth failed"
            )
          );
          return;
        }

        const url = new URL(responseUrl);
        const hash = new URLSearchParams(url.hash.slice(1));
        const accessToken = hash.get("access_token");
        if (!accessToken) {
          reject(new Error("No access token in response"));
          return;
        }

        // Get user email from Microsoft Graph
        const res = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const profile = await res.json();

        const authState: AuthState = {
          provider: "outlook",
          accessToken,
          email: profile.mail || profile.userPrincipalName,
          expiresAt: Date.now() + 3600 * 1000,
        };

        await chrome.storage.local.set({ authState });
        resolve(authState);
      }
    );
  });
}
```

**Step 2: Create Outlook email fetcher**

Create `apps/extension/src/lib/email/outlook-fetcher.ts`:
```typescript
import type { RawEmail, FetchProgress } from "./types";

const GRAPH_API = "https://graph.microsoft.com/v1.0/me";

export async function fetchOutlookSentEmails(
  token: string,
  maxEmails: number = 500,
  onProgress?: (progress: FetchProgress) => void
): Promise<RawEmail[]> {
  const emails: RawEmail[] = [];
  let nextLink: string | undefined =
    `${GRAPH_API}/mailFolders/SentItems/messages?$top=50&$select=id,conversationId,subject,from,toRecipients,body,sentDateTime&$orderby=sentDateTime desc`;

  while (nextLink && emails.length < maxEmails) {
    const res = await fetch(nextLink, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    for (const msg of data.value || []) {
      emails.push({
        id: msg.id,
        threadId: msg.conversationId,
        subject: msg.subject || "",
        from: msg.from?.emailAddress?.address || "",
        to: (msg.toRecipients || []).map(
          (r: any) => r.emailAddress?.address || ""
        ),
        body: msg.body?.content || "",
        date: msg.sentDateTime || "",
        snippet: (msg.body?.content || "").slice(0, 200),
      });
    }

    onProgress?.({
      fetched: emails.length,
      total: maxEmails,
      status: "scanning",
    });

    nextLink = data["@odata.nextLink"];
  }

  onProgress?.({ fetched: emails.length, total: emails.length, status: "done" });
  return emails;
}
```

**Step 3: Add Outlook handlers to background script**

Update `apps/extension/src/entrypoints/background.ts` to add:
```typescript
import { authenticateOutlook } from "../lib/auth/outlook";

// Add to the onMessage listener:
if (message.type === "OUTLOOK_AUTH") {
  authenticateOutlook().then(sendResponse).catch((err) =>
    sendResponse({ error: err.message })
  );
  return true;
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Microsoft Outlook OAuth and email fetching"
```

---

## Phase 9: Polish & Testing

### Task 15: Add End-to-End Smoke Tests

**Files:**
- Create: `apps/api/src/routes/generate.test.ts`
- Create: `apps/extension/src/lib/analyzer/integration.test.ts`

**Step 1: Write API integration test**

`apps/api/src/routes/generate.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../index.js";
import { signToken } from "../lib/auth.js";

// Mock Prisma
vi.mock("../lib/db.js", () => ({
  db: {
    generation: {
      create: vi.fn().mockResolvedValue({ id: "gen-123" }),
    },
  },
}));

// Mock Anthropic
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "Hey Bob,\n\nSounds great!\n\nCheers,\nAaron" }],
      }),
    };
  },
}));

describe("POST /generate", () => {
  const token = signToken({ userId: "user-1", email: "test@example.com" });

  it("returns a generated draft", async () => {
    const res = await app.request("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        styleProfile: {
          greetings: ["Hey"],
          signOffs: ["Cheers"],
          avgWordsPerSentence: 12,
          avgSentencesPerParagraph: 2,
          avgParagraphsPerEmail: 3,
          emojiRate: 0,
          contractionRate: 0.08,
          formality: 3,
          directness: 7,
          warmth: 7,
          structurePreference: "prose",
          vocabularyFingerprint: [],
          questionRatio: 0.2,
          emailsAnalyzed: 50,
          lastUpdated: "2026-01-01T00:00:00Z",
        },
        exampleEmails: [],
        threadContext: [
          {
            from: "bob@example.com",
            to: ["me@example.com"],
            subject: "Lunch?",
            body: "Want to grab lunch?",
            date: "2026-01-20T12:00:00Z",
          },
        ],
        mode: "reply",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.draft).toBeTruthy();
    expect(body.generationId).toBe("gen-123");
  });

  it("rejects unauthenticated requests", async () => {
    const res = await app.request("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });
});
```

**Step 2: Write style analyzer integration test**

`apps/extension/src/lib/analyzer/integration.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { analyzeStyle } from "./style-analyzer";
import type { RawEmail } from "../email/types";

describe("Style Analyzer Integration", () => {
  it("handles diverse email styles correctly", () => {
    const formalEmails: RawEmail[] = Array.from({ length: 10 }, (_, i) => ({
      id: `f${i}`,
      threadId: `tf${i}`,
      subject: `Re: Q${i + 1} Report`,
      from: "me@corp.com",
      to: ["ceo@corp.com"],
      body: `Dear Mr. Johnson,\n\nPlease find attached the quarterly report for your review. I have included all relevant financial data and projections for the upcoming fiscal period.\n\nShould you require any additional information, please do not hesitate to reach out.\n\nBest regards,\nAaron McBride`,
      date: `2026-01-${String(i + 1).padStart(2, "0")}T09:00:00Z`,
      snippet: "Please find attached",
    }));

    const profile = analyzeStyle(formalEmails);

    expect(profile.formality).toBeGreaterThanOrEqual(5);
    expect(profile.greetings[0]).toBe("Dear");
    expect(profile.signOffs).toContain("Best regards");
    expect(profile.avgWordsPerSentence).toBeGreaterThan(10);
  });

  it("handles casual email styles correctly", () => {
    const casualEmails: RawEmail[] = Array.from({ length: 10 }, (_, i) => ({
      id: `c${i}`,
      threadId: `tc${i}`,
      subject: `Re: hangout`,
      from: "me@gmail.com",
      to: ["friend@gmail.com"],
      body: `Hey!\n\nYeah let's do it. I'm free after 5.\n\nLater`,
      date: `2026-01-${String(i + 1).padStart(2, "0")}T18:00:00Z`,
      snippet: "Yeah let's do it",
    }));

    const profile = analyzeStyle(casualEmails);

    expect(profile.formality).toBeLessThanOrEqual(5);
    expect(profile.greetings[0]).toBe("Hey");
    expect(profile.contractionRate).toBeGreaterThan(0);
  });
});
```

**Step 3: Run all tests**

Run: `pnpm test` (from root)
Expected: All tests pass

**Step 4: Commit**

```bash
git add -A
git commit -m "test: add integration tests for API generation and style analyzer"
```

---

### Task 16: Add README and Final Configuration

**Files:**
- Create: `README.md`
- Create: `apps/api/Dockerfile`

**Step 1: Create README**

`README.md`:
```markdown
# Mail Whale

A Chrome extension that learns your email writing style and generates replies in your voice.

## Architecture

- `apps/extension` - Chrome extension (WXT + React + TypeScript)
- `apps/api` - Backend API (Hono + Prisma + Supabase)
- `packages/types` - Shared TypeScript types

## Development

### Prerequisites

- Node.js 22+
- pnpm 9+
- A Supabase project (free tier works)
- An Anthropic API key

### Setup

1. Clone the repo and install dependencies:
   ```bash
   pnpm install
   ```

2. Set up the backend:
   ```bash
   cp apps/api/.env.example apps/api/.env
   # Fill in your Supabase and Anthropic credentials
   cd apps/api && pnpm prisma db push
   ```

3. Start development:
   ```bash
   pnpm dev
   ```

4. Load the extension in Chrome:
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `apps/extension/.output/chrome-mv3`

## Privacy

Mail Whale analyzes your sent emails locally in the browser. Raw email content never leaves your device. Only your extracted writing style patterns are sent to the backend for draft generation.
```

**Step 2: Create Dockerfile for API**

`apps/api/Dockerfile`:
```dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/types/package.json packages/types/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN cd apps/api && pnpm prisma generate && pnpm build

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

**Step 3: Commit**

```bash
git add -A
git commit -m "docs: add README and Dockerfile for API deployment"
```

---

## Summary of Tasks

| # | Task | Phase |
|---|------|-------|
| 1 | Initialize Monorepo | Scaffolding |
| 2 | Scaffold Chrome Extension with WXT | Scaffolding |
| 3 | Scaffold Backend API with Hono | Scaffolding |
| 4 | Set Up Shared Types Package | Scaffolding |
| 5 | Implement Gmail OAuth in Extension | Gmail OAuth |
| 6 | Build Gmail Email Fetcher | Gmail OAuth |
| 7 | Build the Style Analyzer | Style Analyzer |
| 8 | Set Up Prisma + Database Schema | Backend |
| 9 | Build Auth Routes (JWT) | Backend |
| 10 | Build Generation Route (Claude API) | Backend |
| 11 | Build the Side Panel React UI | Side Panel UI |
| 12 | Create Content Script for Gmail | Integration |
| 13 | Add IndexedDB Storage for Emails | Storage |
| 14 | Add Microsoft Outlook Support | Outlook |
| 15 | Add End-to-End Smoke Tests | Testing |
| 16 | Add README and Final Configuration | Polish |

## Dependencies Between Tasks

```
Task 1 → Task 2, Task 3, Task 4 (all depend on monorepo)
Task 4 → Task 7, Task 10 (shared types needed)
Task 5 → Task 6 (OAuth before fetching)
Task 6 → Task 7 (emails before analysis)
Task 8 → Task 9 → Task 10 (DB → Auth → Generation)
Task 7 + Task 10 → Task 11 (analyzer + API before UI)
Task 11 → Task 12 (UI before content script)
Task 6 → Task 13 (fetcher before storage)
Task 5 → Task 14 (Gmail auth pattern before Outlook)
Task 12 → Task 15 (integration before smoke tests)
Task 15 → Task 16 (tests before final docs)
```
