import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { RequestHandler } from "express";

/**
 * AI endpoints are the most expensive requests in the system (token spend
 * + Gemini quota). Cap per-user bursts so a runaway client can't eat the
 * free-tier quota.
 *
 * Window + max are deliberately generous for a personal LMS — tune down
 * before opening registration publicly.
 */
export function aiRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 60_000, // 1 minute
    limit: 20, // 20 AI calls per user per minute
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.userId ?? ipKeyGenerator(req.ip ?? "0.0.0.0", false),
    message: {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many AI requests — slow down for a minute.",
      },
    },
  });
}
