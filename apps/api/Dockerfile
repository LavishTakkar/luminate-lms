# syntax=docker/dockerfile:1.7
#
# Fly.io / any container host image for the Luminate LMS API.
# Multi-stage: deps cached separately from source so rebuilds are fast.

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

# ─── deps ────────────────────────────────────────────────────────────────────
# Copy only manifests so this layer is reused whenever source changes but
# dependencies don't.
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

# Installing all deps (including devDeps) because tsx lives in deps already
# and nothing else is needed to run. `--prod=false` is explicit in case
# NODE_ENV=production is set during docker build.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod=false

# ─── runtime ─────────────────────────────────────────────────────────────────
FROM base AS runtime
ENV NODE_ENV=production
# Fly.io's default internal port; override via env if needed
ENV PORT=8080
# Ensure unhandled-rejection crashes are loud, not silent
ENV NODE_OPTIONS=--unhandled-rejections=strict

COPY --from=deps /app /app
COPY packages/shared packages/shared
COPY apps/api apps/api

EXPOSE 8080

# Drop to a non-root user for least-privilege at runtime
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

# `pnpm --filter @lms/api start` runs `tsx src/server.ts` from apps/api
CMD ["pnpm", "--filter", "@lms/api", "start"]
