import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { buildAuthRouter } from "./routes/auth.routes.js";
import { buildCoursesRouter } from "./routes/courses.routes.js";
import { buildModulesRouter } from "./routes/modules.routes.js";
import { buildLessonsRouter } from "./routes/lessons.routes.js";
import { buildAiRouter } from "./routes/ai.routes.js";
import { buildProgressRouter } from "./routes/progress.routes.js";
import { buildQuizzesRouter } from "./routes/quizzes.routes.js";

export interface AppDeps {
  jwtSecret: string;
  jwtExpiresIn: string;
  geminiApiKey?: string;
  /** Whitelist of allowed origins. Empty/undefined ⇒ reflect every origin (dev). */
  corsOrigins?: string[];
  /** "development" | "test" | "production" */
  env?: string;
}

export function createApp(deps: AppDeps): Express {
  const app = express();

  // Trust the first proxy (Render / Vercel / Cloudflare sit in front).
  if (deps.env === "production") app.set("trust proxy", 1);

  // Security headers — relaxed CSP since our frontend is served elsewhere.
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }),
  );

  app.use(compression());

  // CORS
  const origins = deps.corsOrigins ?? [];
  app.use(
    cors({
      origin: origins.length === 0 ? true : origins,
      credentials: true,
    }),
  );

  // Request logging — skip during tests so vitest output stays clean.
  if (deps.env !== "test") {
    app.use(morgan(deps.env === "production" ? "combined" : "dev"));
  }

  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok", env: deps.env ?? "unknown" } });
  });

  app.use("/api/auth", buildAuthRouter(deps));
  app.use("/api/courses", buildCoursesRouter(deps));
  app.use("/api/modules", buildModulesRouter(deps));
  app.use("/api/lessons", buildLessonsRouter(deps));
  app.use("/api/ai", buildAiRouter(deps));
  app.use("/api/progress", buildProgressRouter(deps));
  app.use("/api/quizzes", buildQuizzesRouter(deps));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
