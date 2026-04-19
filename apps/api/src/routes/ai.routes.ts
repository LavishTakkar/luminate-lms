import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import { aiRateLimiter } from "../middleware/rateLimit.js";
import { HttpError, ok } from "../middleware/error.js";
import { AiService } from "../services/ai.service.js";
import { AIConversationModel } from "../models/AIConversation.js";
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
  const limit = aiRateLimiter();

  router.get("/status", requireAuth(deps.jwtSecret), (_req, res) => {
    res.json(ok({ provider: "gemini", stubbed: ai.isStubbed }));
  });

  router.post(
    "/summarize",
    requireAuth(deps.jwtSecret),
    limit,
    async (req, res, next) => {
      try {
        const { content, summaryType } = summarizeSchema.parse(req.body);
        const summary = await ai.summarizeContent(content, summaryType);
        res.json(ok({ summary }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/generate-quiz",
    requireAuth(deps.jwtSecret),
    limit,
    async (req, res, next) => {
      try {
        const body = generateQuizSchema.parse(req.body);
        const quiz = await ai.generateQuiz(body);
        res.json(ok({ quiz }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/chat",
    requireAuth(deps.jwtSecret),
    limit,
    async (req, res, next) => {
      try {
        const { message, conversationId, lessonContext } = chatSchema.parse(req.body);
        const userId = req.user?.userId;
        if (!userId) throw new HttpError(401, "UNAUTHORIZED", "Missing user");

        // Load or create the conversation so chat history persists
        const convo =
          conversationId && mongoose.isValidObjectId(conversationId)
            ? await AIConversationModel.findOne({ _id: conversationId, userId })
            : null;

        const doc =
          convo ??
          (await AIConversationModel.create({
            userId,
            lessonId:
              lessonContext?.lessonId && mongoose.isValidObjectId(lessonContext.lessonId)
                ? lessonContext.lessonId
                : undefined,
            context: lessonContext?.content,
            messages: [],
          }));

        doc.messages.push({ role: "user", content: message, timestamp: new Date() });

        const response = await ai.chat({
          messages: doc.messages.map((m) => ({ role: m.role, content: m.content })),
          context: doc.context ?? lessonContext?.content,
        });

        doc.messages.push({ role: "assistant", content: response, timestamp: new Date() });
        await doc.save();

        res.json(ok({ response, conversationId: String(doc._id) }));
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
