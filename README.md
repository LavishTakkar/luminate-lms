# Luminate — AI-Powered LMS

![CI](https://github.com/LavishTakkar/luminate-lms/actions/workflows/ci.yml/badge.svg)

Personal learning platform with AI quiz generation, note summarization, and an AI tutor — powered by Google Gemini, inspired by NotebookLM.

## Stack

| Layer | Tech |
|---|---|
| Monorepo | pnpm workspaces |
| Backend | Node 20 · Express · TypeScript · Mongoose · JWT · Zod · Helmet · Morgan |
| Frontend | Vite · React 18 · TypeScript · React Router · TanStack Query · Tailwind · Framer Motion |
| AI | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| Database | MongoDB Atlas (free M0 cluster) |
| Hosting | Render (API) · Vercel (web) — both free tier |

## Local setup

```bash
cp .env.example .env
# Paste MONGODB_URI (Atlas M0), JWT_SECRET, and optionally GEMINI_API_KEY.

pnpm install
pnpm --filter api seed         # creates admin@lms.local / admin1234 + sample courses
pnpm --filter api dev          # :5000
pnpm --filter web dev          # :5173
```

Open http://localhost:5173, log in as `admin@lms.local` / `admin1234`, and click into a course.

## Test

```bash
pnpm --filter api test         # vitest + mongodb-memory-server (14 tests)
pnpm -r typecheck              # strict TS across shared, api, web
pnpm --filter web build        # production build (code-split)
```

## Project layout

```
apps/api            Express + Mongoose backend
  src/
    config/         env loader (zod-validated), mongo connection
    middleware/     auth (JWT), error envelope, rate limiting
    models/         Mongoose schemas
    routes/         auth, courses, modules, lessons, ai, progress
    services/       AiService — Gemini + stub fallback
    scripts/        seed.ts

apps/web            Vite + React frontend
  src/
    components/     AppShell, ErrorBoundary, ui primitives, ai widgets
    lib/            api client, auth context, theme context, cn util
    pages/          Login, Register, Dashboard, CourseList,
                    CourseDetail, LessonViewer

packages/shared     Cross-package TS types
```

## Deploying

### Database — MongoDB Atlas (free M0)
1. Create an M0 cluster at https://mongodb.com/cloud/atlas (takes ~2 minutes).
2. Add a database user and whitelist `0.0.0.0/0` (or your Render egress range).
3. Copy the connection string — it goes into `MONGODB_URI`.

### API — Render
This repo ships a `render.yaml` blueprint.
1. Push to GitHub.
2. In Render, **New → Blueprint** and point at the repo.
3. Fill in `MONGODB_URI`, `GEMINI_API_KEY`, `CORS_ORIGINS` (the Vercel URL you'll get in the next step). `JWT_SECRET` is auto-generated.
4. Render builds, runs `pnpm --filter @lms/api start`, and hits `/health` to confirm.

### Web — Vercel
This repo ships `apps/web/vercel.json`.
1. In Vercel, **Add New → Project**, import from GitHub, set root directory to `apps/web`.
2. Set `VITE_API_URL` to your Render URL (e.g. `https://lms-api.onrender.com`).
3. Deploy.
4. Copy the Vercel URL back into Render's `CORS_ORIGINS` and redeploy the API.

### Gemini API key — free tier
Get a key at https://aistudio.google.com/app/apikey. Paste into Render's `GEMINI_API_KEY`. Without a key, the API silently uses stub responses so the app still works.

## Phase status

- [x] Phase 1 — Foundation (auth, CRUD, monorepo)
- [x] Phase 2 — AI integration (Gemini + stub fallback, rate limiting, chat persistence)
- [x] Phase 3 — Premium UI (mesh gradients, glassmorphism, dark mode)
- [x] Phase 4 — Lesson viewer, AI panels, progress tracking
- [x] Phase 5 — Polish + deploy (code splitting, helmet, deploy configs)
- [x] Phase 6 — Quiz taking flow (admin save → student take → server grading)
- [x] Phase 7 — Admin course authoring UI
- [x] CI — GitHub Actions runs typecheck, tests, and build on every push/PR
- [ ] Post-MVP — certificates, file upload, password reset, video player, Playwright E2E

## License

MIT.
