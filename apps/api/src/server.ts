import { loadEnv } from "./config/env.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { createApp } from "./app.js";

async function main(): Promise<void> {
  const env = loadEnv();
  await connectDb(env.MONGODB_URI);
  console.log(`[api] connected to MongoDB (${env.NODE_ENV})`);

  const corsOrigins = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const app = createApp({
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    geminiApiKey: env.GEMINI_API_KEY,
    corsOrigins,
    env: env.NODE_ENV,
  });

  const server = app.listen(env.PORT, () => {
    console.log(`[api] listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[api] ${signal} received, shutting down gracefully`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    // Force exit after 10s so Render/Railway doesn't hang.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[api] fatal startup error:", err);
  process.exit(1);
});
