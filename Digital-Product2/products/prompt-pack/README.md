# The AI Prompt Vault

50+ battle-tested prompts to 10x your output with ChatGPT, Claude, and any AI assistant.

## What's Included

60 ready-to-use prompts across 5 categories:

| Category | Prompts | What You'll Do |
|----------|---------|----------------|
| Business Strategy | 12 | Analyze markets, validate ideas, price products, build pitches |
| Content Creation | 12 | Write blogs, newsletters, emails, landing pages, video scripts |
| Coding Assistant | 12 | Debug faster, review code, design APIs, write tests, audit security |
| Productivity | 12 | Plan days, set goals, make decisions, run meetings, design habits |
| Social Media | 12 | Create TikToks, threads, carousels, grow followers, build brand voice |

## How to Use

1. Find a prompt that matches what you're working on
2. Copy the prompt text (the blockquoted section)
3. Replace the `[bracketed placeholders]` with your specifics
4. Paste into ChatGPT, Claude, or any AI assistant
5. Read the "Pro tip" for each prompt to get even better results

## File Structure

```
products/prompt-pack/
  prompts/
    business-strategy.md    # 12 prompts
    content-creation.md     # 12 prompts
    coding-assistant.md     # 12 prompts
    productivity.md         # 12 prompts
    social-media.md         # 12 prompts
  build-pdf.js              # PDF generator (run with: node build-pdf.js)
  output/
    ai-prompt-vault.pdf     # Generated PDF (not in git)
  package.json
  .gitignore
```

## Building the PDF

```bash
npm install
node build-pdf.js
```

Output: `output/ai-prompt-vault.pdf`

The PDF features a dark premium design with styled prompt cards, chapter pages, and a table of contents.
