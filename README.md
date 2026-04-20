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
| Hosting | Fly.io (API) + GitHub Pages (web) · or Render + Vercel · or self-hosted |

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

Three mutually exclusive paths below — pick whichever matches your preferences. All three use MongoDB Atlas for the database and Google Gemini for AI.

### Database — MongoDB Atlas (free M0) — required for all paths

1. Create an M0 cluster at https://mongodb.com/cloud/atlas (~2 minutes).
2. Add a database user and whitelist `0.0.0.0/0` (or your API's egress range).
3. Copy the connection string — it becomes `MONGODB_URI`.

### Gemini API key (optional, all paths)

Without it, the AI endpoints silently fall back to stub responses so the app still runs. Get a free key at https://aistudio.google.com/app/apikey.

---

### Path A — GitHub Pages (web) + Fly.io (API)

**Zero-cost-ish, everything on GitHub-aligned infra.** Pages is free and unlimited; Fly's Hobby plan gives a small monthly credit that covers a scale-to-zero 256MB VM.

#### 1. API on Fly.io

```bash
brew install flyctl                      # or the platform-specific installer
fly auth signup                          # or `fly auth login` if you have an account

fly launch --no-deploy --copy-config --config fly.toml
# Accept the defaults except:
#   - App name: choose something unique (e.g. luminate-lms-api-<yourname>)
#   - Region:   pick the closest to your users

fly secrets set \
  MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/lms" \
  JWT_SECRET="$(openssl rand -base64 48)" \
  GEMINI_API_KEY="your-gemini-key-or-leave-unset" \
  CORS_ORIGINS="https://lavishtakkar.github.io"

fly deploy
fly status                               # confirm the machine is "suspended" or "started"
```

The `/health` endpoint should return `{"success":true,"data":{"status":"ok"}}`. Note the URL (e.g. `https://luminate-lms-api.fly.dev`) — you'll paste it into GitHub secrets next.

#### 2. Web on GitHub Pages

1. In the repo on GitHub → **Settings → Pages → Source**: set to **GitHub Actions**.
2. In **Settings → Secrets and variables → Actions → Secrets**: add `VITE_API_URL` with your Fly URL from step 1 (no trailing slash).
3. Push any commit to `main` — `deploy-pages.yml` runs automatically. Or trigger manually via **Actions → Deploy web to GitHub Pages → Run workflow**.
4. The site goes live at `https://lavishtakkar.github.io/luminate-lms/`.

#### 3. CORS round-trip

Once you know the final Pages URL, update `CORS_ORIGINS` on Fly to match:
```bash
fly secrets set CORS_ORIGINS="https://lavishtakkar.github.io"
```

This path uses [`fly.toml`](fly.toml), [`apps/api/Dockerfile`](apps/api/Dockerfile), and [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) — all committed.

---

### Path B — Render (API) + Vercel (web)

Simpler OAuth-driven setup, no CLI. See [`render.yaml`](render.yaml) and [`apps/web/vercel.json`](apps/web/vercel.json).

1. **Render**: New → Blueprint → point at the repo. Fill in `MONGODB_URI`, `GEMINI_API_KEY`, `CORS_ORIGINS`.
2. **Vercel**: Add New → Project → root directory `apps/web` → set `VITE_API_URL` to the Render URL.
3. Paste the Vercel URL back into Render's `CORS_ORIGINS` and redeploy.

Trade-off vs Path A: Render's free web service spins down after 15 minutes idle (cold start ~30s) vs Fly's ~500ms suspend-wake. Vercel has stricter free-tier bandwidth limits than Pages.

---

### Path C — Self-hosted VPS

Any $5/month Docker host. Run:

```bash
docker build -t luminate-api -f apps/api/Dockerfile .
docker run -d -p 8080:8080 \
  -e MONGODB_URI=... -e JWT_SECRET=... -e GEMINI_API_KEY=... -e CORS_ORIGINS=... \
  --restart unless-stopped luminate-api
```

Serve `apps/web/dist` (after `pnpm --filter web build`) via nginx or Caddy.

## Phase status

- [x] Phase 1 — Foundation (auth, CRUD, monorepo)
- [x] Phase 2 — AI integration (Gemini + stub fallback, rate limiting, chat persistence)
- [x] Phase 3 — Premium UI (mesh gradients, glassmorphism, dark mode)
- [x] Phase 4 — Lesson viewer, AI panels, progress tracking
- [x] Phase 5 — Polish + deploy (code splitting, helmet, deploy configs)
- [x] Phase 6 — Quiz taking flow (admin save → student take → server grading)
- [x] Phase 7 — Admin course authoring UI
- [x] CI — GitHub Actions runs typecheck, tests, and build on every push/PR
- [x] Phase 8 — Password reset flow with dev-mode console reset URL
- [x] Phase 9 — Certificates awarded on 100% course completion
- [x] Phase 10 — Video player via react-player in lesson viewer
- [x] Phase 11 — Playwright E2E smoke suite (auth + courses)
- [x] Deploy path A — Fly.io (API) + GitHub Pages (web) with SPA 404 fallback
- [ ] Post-MVP — file upload (Cloudinary), learning path suggestions, richer analytics

## License

MIT.
