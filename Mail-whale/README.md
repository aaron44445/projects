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
