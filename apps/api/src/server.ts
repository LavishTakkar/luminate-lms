import { loadEnv } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { createApp } from "./app.js";

async function main(): Promise<void> {
  const env = loadEnv();
  await connectDb(env.MONGODB_URI);
  console.log(`[api] connected to MongoDB`);

  const app = createApp({
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    geminiApiKey: env.GEMINI_API_KEY,
  });

  app.listen(env.PORT, () => {
    console.log(`[api] listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("[api] fatal startup error:", err);
  process.exit(1);
});
