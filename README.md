# 🔎 AuditLens — UX Evaluation Engine

Senior-grade UX audits powered by Claude. Upload screenshots, configure evaluation frameworks, get actionable findings with metrics.

## Features

- **Screenshot upload** — Drag & drop, paste from clipboard, multi-file support
- **4 evaluation frameworks** — Nielsen's 10 (with Gestalt), Cognitive Walkthrough, State Stress Test, Accessibility
- **Audience calibration** — Consumer, Enterprise B2B, Developer Tool, SaaS, E-commerce
- **Streaming output** — Watch the audit build in real-time
- **Grade summary** — Letter grade with critical/minor/pass counts

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url>
cd auditlens
npm install
```

### 2. Add your Anthropic API key

```bash
cp .env.local.example .env.local
# Edit .env.local and add your key from https://console.anthropic.com/
```

Or just create `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
```

### 3. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Next.js 15** — App Router
- **TypeScript** — Full type safety
- **Tailwind CSS v4** — Styling with custom design tokens
- **Claude Sonnet 4** — Evaluation engine via streaming API
- **Vercel** — Deploy target (optional)

## Project Structure

```
auditlens/
├── app/
│   ├── api/evaluate/route.ts   ← Claude API proxy with streaming
│   ├── globals.css              ← Tailwind + design tokens
│   ├── layout.tsx               ← Root layout
│   └── page.tsx                 ← Main app page
├── components/
│   ├── audience-selector.tsx    ← Audience context picker
│   ├── drop-zone.tsx            ← Screenshot upload (drag/drop/paste)
│   ├── framework-toggles.tsx    ← Evaluation framework toggles
│   ├── grade-card.tsx           ← Grade summary + streaming indicator
│   └── report-renderer.tsx      ← Markdown-to-React report display
├── lib/
│   └── types.ts                 ← Shared types and constants
└── package.json
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel
# Add ANTHROPIC_API_KEY as an environment variable in Vercel dashboard
```

## Roadmap

See the [Feature Map](./FEATURE_MAP.md) for the full prioritized backlog.

**Phase 2**: JSON export, radar charts, PDF export, sidebar navigation, Content/UX Writing module
**Phase 3**: Screenshot annotations, audit history, Persuasive/Ethical Design module, IA module

---

Built by [ACP](https://popescuportfolio.ch) as part of the AuditLens project.
