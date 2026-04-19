import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { ok } from "../middleware/error.js";
import { AiService } from "../services/ai.service.js";
import type { AppDeps } from "../app.js";

const summarizeSchema = z.object({
  content: z.string().min(1).max(50_000),
  summaryType: z.enum(["brief", "detailed", "bullet-points"]).default("detailed"),
});

const generateQuizSchema = z.object({
  content: z.string().min(1).max(50_000),
  questionCount: z.number().int().min(1).max(20).optional(),
  difficulty: z.enum(["beginner", "medium", "advanced"]).optional(),
  questionTypes: z
    .array(z.enum(["multiple-choice", "true-false", "short-answer"]))
    .optional(),
  lessonId: z.string().optional(),
});

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
  lessonContext: z
    .object({
      content: z.string().optional(),
      title: z.string().optional(),
      lessonId: z.string().optional(),
    })
    .optional(),
});

export function buildAiRouter(deps: AppDeps): Router {
  const router = Router();
  const ai = new AiService(deps.geminiApiKey);

  router.post("/summarize", requireAuth(deps.jwtSecret), async (req, res, next) => {
    try {
      const { content, summaryType } = summarizeSchema.parse(req.body);
      const summary = await ai.summarizeContent(content, summaryType);
      res.json(ok({ summary }));
    } catch (err) {
      next(err);
    }
  });

  router.post("/generate-quiz", requireAuth(deps.jwtSecret), async (req, res, next) => {
    try {
      const body = generateQuizSchema.parse(req.body);
      const quiz = await ai.generateQuiz(body);
      res.json(ok({ quiz }));
    } catch (err) {
      next(err);
    }
  });

  router.post("/chat", requireAuth(deps.jwtSecret), async (req, res, next) => {
    try {
      const { message, conversationId, lessonContext } = chatSchema.parse(req.body);
      const response = await ai.chat({
        messages: [{ role: "user", content: message }],
        context: lessonContext?.content,
      });
      res.json(ok({ response, conversationId: conversationId ?? null }));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
