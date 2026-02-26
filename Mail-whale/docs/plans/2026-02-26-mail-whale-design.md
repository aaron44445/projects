# Mail Whale - Product Design Document

**Date:** 2026-02-26
**Status:** Approved

## Overview

Mail Whale is a Chrome extension that learns your personal email writing style from your sent emails and generates replies that sound like you. Style analysis happens locally in the browser (privacy-first), while draft generation uses the Claude API via a lightweight backend. Supports Gmail and Outlook web.

## Product Vision

Most AI email tools generate generic-sounding emails with superficial "tone" adjustments. Mail Whale captures the specific quirks that make your writing yours - greetings, sign-offs, sentence structure, vocabulary, formality patterns, and more - then generates drafts that are genuinely indistinguishable from emails you'd write yourself.

**Privacy promise:** Your raw emails never leave your device. The extension extracts style patterns locally and only sends those patterns (plus the specific thread you choose to reply to) to the generation API.

## Target Users

General consumers - anyone with a Gmail or Outlook email account who wants to save time writing emails while maintaining their personal voice.

## Architecture

### Approach: Chrome Extension + Backend (Hybrid Processing)

```
Chrome Extension (local)          Backend (cloud)
========================          ================
- Gmail/Outlook sidebar UI        - User accounts
- OAuth via Chrome Identity API   - Style profile storage
- Reads sent emails locally       - Claude API proxy
- Style Analyzer (local)          - Rate limiting
- Example email selection (RAG)   - Usage tracking
- Draft editing & insertion       - (Future: billing)
        |                                 |
        |--- Style Profile + Thread ----->|
        |<---- Generated Draft -----------|
```

### Data Flow

1. User clicks "Draft Reply" in sidebar
2. Extension reads current email thread (local)
3. Extension grabs stored Style Profile (local)
4. Extension selects 3-5 relevant example sent emails (local RAG)
5. Sends `{styleProfile, exampleEmails, threadContext, userPreferences}` to backend
6. Backend constructs prompt and calls Claude API
7. Generated draft returned to extension
8. Draft appears in sidebar for editing and one-click insertion

## Email Scanning Strategy

### Initial Scan (One-Time)

On first connection, the extension scans the user's last 500-1000 sent emails in the background. This builds the initial style profile and populates the local example email store. Takes approximately 3-5 minutes depending on email volume.

### Incremental Updates

After the initial scan, the extension checks for new sent emails periodically (e.g., daily or on extension open) and updates the style profile incrementally. Only new emails since the last scan are processed.

### No Re-Scanning

The style profile and example emails are cached locally in IndexedDB. The extension never re-scans the full history unless the user explicitly requests a refresh.

## Style Profile

The Style Analyzer runs locally in the extension and produces a structured JSON profile (~5-10KB):

### Quantitative Patterns
- Average words per sentence, sentences per paragraph, paragraphs per email
- Greeting frequency and patterns
- Sign-off frequency and patterns
- Emoji usage rate
- Question-to-statement ratio
- Contraction usage rate

### Qualitative Patterns (1-10 scales)
- Formality level
- Directness level
- Warmth level
- Structure preference (prose vs. bullets vs. mixed)

### RAG Component
- 20-50 representative sent emails stored locally in IndexedDB
- At generation time, 3-5 most relevant examples are selected based on topic/recipient similarity
- These examples are included in the prompt as few-shot demonstrations

## User Experience

### Onboarding
1. Install extension from Chrome Web Store
2. Welcome screen with plain-English explanation
3. "Connect Gmail" or "Connect Outlook" button (OAuth popup)
4. Progress bar: "Learning your writing style..." (background scan)
5. "Ready!" notification when profile is built

### Day-to-Day Usage
1. Open an email in Gmail or Outlook web
2. Click Mail Whale icon or see sidebar automatically
3. Sidebar shows:
   - **"Draft Reply"** - generates a full reply in your voice
   - **"Draft New"** - write a new email from a brief prompt
   - **Tone adjuster** - more formal <-> more casual than your default
   - **Length control** - brief / standard / detailed
4. Generated draft appears in sidebar
5. User can edit, regenerate, or insert into compose with one click
6. User sends email normally

### Settings
- View style profile summary
- Re-scan emails to update profile
- Connect additional email accounts
- Default preferences (tone, length)

## Tech Stack

### Chrome Extension
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Language | TypeScript | Type safety |
| UI Framework | React 19 | Sidebar components |
| Build Tool | Vite + CRXJS | Fast builds, HMR |
| Extension API | Manifest V3 | Chrome Web Store requirement |
| Email APIs | Gmail API, Microsoft Graph | Read sent emails, OAuth |
| Local Storage | Chrome Storage API + IndexedDB | Profiles, cached emails |

### Backend
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Runtime | Node.js | Shared language with extension |
| Framework | Express or Hono | Lightweight API server |
| Database | PostgreSQL via Supabase | Users, profiles, usage |
| AI Provider | Anthropic Claude API | Best instruction-following |
| Auth | JWT tokens | Secure API communication |
| Hosting | Railway or Render | Simple, affordable |

### Key Dependencies
- `@anthropic-ai/sdk` - Claude API
- `googleapis` - Gmail API (extension context)
- `@microsoft/microsoft-graph-client` - Outlook API
- Custom heuristics module - Local style extraction

### Estimated Costs (< 1000 users)
- Hosting: $5-20/month
- Database: Free tier (Supabase)
- AI API: ~$50-200/month (Claude)
- Chrome Web Store: $5 one-time
- Domain: ~$12/year

## Email Provider Support

### Gmail (Primary)
- OAuth via Chrome Identity API
- `gmail.readonly` scope for reading sent emails
- Requires Google OAuth app verification (4-6 week process)

### Outlook (Secondary)
- OAuth via Microsoft Identity (MSAL)
- `Mail.Read` delegated permission
- Microsoft Graph API for email access
- Admin consent may be required for enterprise accounts

## Privacy & Security

### Core Privacy Principles
1. Raw email content is only read locally in the browser
2. Style profiles contain patterns, not email content
3. Example emails are sent to the AI API only at generation time, for the specific thread the user chose
4. Users can delete their data at any time
5. No email content is used to train models for other users

### Security Measures
- OAuth tokens stored encrypted in Chrome storage
- Backend API key never exposed to client
- JWT authentication for extension-to-backend communication
- Read-only email access (no modify/delete scopes)
- Rate limiting on API endpoints

## v1 Scope

### In Scope
- Chrome extension with sidebar for Gmail and Outlook web
- OAuth connection for both providers
- One-time sent email scan + incremental updates
- Local style profile extraction
- "Draft Reply" generation
- "Draft New" generation
- Tone and length adjusters
- One-click insert into compose window
- Backend with Claude API integration
- User accounts and style profile storage

### Out of Scope (Future)
- Mobile app, Firefox/Safari extensions
- Team/shared voice profiles
- Email scheduling or auto-send
- Analytics dashboard
- Fine-tuned personal models
- Multiple style profiles (work vs. personal)
- Email templates library
- Slack/Teams integration
- Outlook desktop app support

## Success Criteria
1. User can install and connect email in under 2 minutes
2. Style profile generated within 5 minutes of connecting
3. Generated drafts sound noticeably like the user (not generic AI)
4. End-to-end flow (open email -> generate -> insert -> send) takes under 30 seconds

## Business Model

To be determined. Architecture supports future monetization via freemium/subscription model (free tier with limited generations, paid for unlimited).
