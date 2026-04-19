import express, { type Express } from "express";
import cors from "cors";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { buildAuthRouter } from "./routes/auth.routes.js";
import { buildCoursesRouter } from "./routes/courses.routes.js";
import { buildModulesRouter } from "./routes/modules.routes.js";
import { buildLessonsRouter } from "./routes/lessons.routes.js";
import { buildAiRouter } from "./routes/ai.routes.js";

export interface AppDeps {
  jwtSecret: string;
  jwtExpiresIn: string;
  geminiApiKey?: string;
}

export function createApp(deps: AppDeps): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });

  app.use("/api/auth", buildAuthRouter(deps));
  app.use("/api/courses", buildCoursesRouter(deps));
  app.use("/api/modules", buildModulesRouter(deps));
  app.use("/api/lessons", buildLessonsRouter(deps));
  app.use("/api/ai", buildAiRouter(deps));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
