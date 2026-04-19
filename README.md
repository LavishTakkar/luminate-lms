# AI-Powered LMS

Personal learning platform with AI quiz generation, note summarization, and an AI tutor — powered by Google Gemini.

## Stack

- **Monorepo:** pnpm workspaces
- **Backend:** Node 20, Express, TypeScript, Mongoose, JWT auth, Zod validation
- **Frontend:** Vite, React 18, TypeScript, React Router, TanStack Query
- **AI:** Google Gemini 1.5 Flash (free tier)
- **Database:** MongoDB Atlas (free M0 shared cluster)
- **Hosting:** Render (API) + Vercel (web) + Cloudinary (files) — all free tier

## Setup

```bash
pnpm install
cp .env.example .env
# Edit .env: paste your MongoDB Atlas URI, a long random JWT_SECRET, and GEMINI_API_KEY
```

## Dev

```bash
pnpm --filter api dev   # API on http://localhost:5000
pnpm --filter web dev   # Web on http://localhost:5173
```

## Test

```bash
pnpm --filter api test
```

## Project structure

```
apps/api      — Express + Mongoose backend
apps/web      — Vite + React frontend
packages/shared — Cross-package TypeScript types
```

## Phase status

- [x] Phase 1 — Foundation: auth, CRUD, scaffolding
- [ ] Phase 2 — AI integration (Gemini)
- [ ] Phase 3 — Premium UI (Shadcn + Aceternity)
- [ ] Phase 4 — Progress tracking + certificates
- [ ] Phase 5 — Polish + deploy
