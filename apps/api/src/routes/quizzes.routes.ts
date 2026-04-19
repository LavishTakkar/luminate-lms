import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { QuizModel } from "../models/Quiz.js";
import { LessonModel } from "../models/Lesson.js";
import { ModuleModel } from "../models/Module.js";
import { UserProgressModel } from "../models/UserProgress.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { HttpError, ok } from "../middleware/error.js";
import type { AppDeps } from "../app.js";

const questionSchema = z.object({
  questionText: z.string().min(1),
  questionType: z.enum(["multiple-choice", "true-false", "short-answer"]),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string().optional(),
  points: z.number().int().nonnegative().default(10),
});

const createQuizSchema = z.object({
  lessonId: z.string().refine(mongoose.isValidObjectId, "Invalid lessonId"),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  questions: z.array(questionSchema).min(1).max(50),
  passingScore: z.number().int().min(0).max(100).default(70),
  isAIGenerated: z.boolean().default(false),
  sourceContent: z.string().max(50_000).optional(),
});

const submitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionIndex: z.number().int().nonnegative(),
        answer: z.union([z.string(), z.array(z.string())]),
      }),
    )
    .min(1),
});

function normalize(value: unknown): string {
  if (Array.isArray(value)) return value.map(normalize).join("|");
  return String(value).trim().toLowerCase();
}

export function buildQuizzesRouter(deps: AppDeps): Router {
  const router = Router();

  // List quizzes attached to a lesson
  router.get("/by-lesson/:lessonId", requireAuth(deps.jwtSecret), async (req, res, next) => {
    try {
      const lessonId = req.params.lessonId ?? "";
      if (!mongoose.isValidObjectId(lessonId))
        throw new HttpError(400, "BAD_ID", "Invalid lesson id");
      const quizzes = await QuizModel.find({ lessonId })
        .select("-questions.correctAnswer -questions.explanation")
        .sort({ createdAt: 1 });
      res.json(ok(quizzes));
    } catch (err) {
      next(err);
    }
  });

  // Get a single quiz (without correct answers so students can take it)
  router.get("/:id", requireAuth(deps.jwtSecret), async (req, res, next) => {
    try {
      const id = req.params.id ?? "";
      if (!mongoose.isValidObjectId(id))
        throw new HttpError(400, "BAD_ID", "Invalid quiz id");
      const quiz = await QuizModel.findById(id).lean();
      if (!quiz) throw new HttpError(404, "QUIZ_NOT_FOUND", "Quiz not found");
      // Strip the correctAnswer + explanation for non-admins so students can't
      // cheat via DevTools. Admins see everything.
      const payload =
        req.user?.role === "admin"
          ? quiz
          : {
              ...quiz,
              questions: quiz.questions.map((q) => ({
                ...q,
                correctAnswer: "",
                explanation: undefined,
              })),
            };
      res.json(ok(payload));
    } catch (err) {
      next(err);
    }
  });

  // Admin — save a quiz (usually one generated via /api/ai/generate-quiz)
  router.post("/", requireAuth(deps.jwtSecret), requireAdmin(), async (req, res, next) => {
    try {
      const body = createQuizSchema.parse(req.body);
      const lesson = await LessonModel.findById(body.lessonId);
      if (!lesson) throw new HttpError(404, "LESSON_NOT_FOUND", "Lesson not found");
      const mod = await ModuleModel.findById(lesson.moduleId);

      const quiz = await QuizModel.create({
        ...body,
        courseId: mod?.courseId,
      });
      res.status(201).json(ok(quiz));
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", requireAuth(deps.jwtSecret), requireAdmin(), async (req, res, next) => {
    try {
      const id = req.params.id ?? "";
      if (!mongoose.isValidObjectId(id))
        throw new HttpError(400, "BAD_ID", "Invalid quiz id");
      const quiz = await QuizModel.findByIdAndDelete(id);
      if (!quiz) throw new HttpError(404, "QUIZ_NOT_FOUND", "Quiz not found");
      res.json(ok({ deleted: true }));
    } catch (err) {
      next(err);
    }
  });

  // Submit answers — server-side grading; persists attempt to UserProgress
  router.post("/:id/submit", requireAuth(deps.jwtSecret), async (req, res, next) => {
    try {
      const id = req.params.id ?? "";
      if (!mongoose.isValidObjectId(id))
        throw new HttpError(400, "BAD_ID", "Invalid quiz id");
      const userId = req.user?.userId;
      if (!userId) throw new HttpError(401, "UNAUTHORIZED", "Missing user");

      const { answers } = submitSchema.parse(req.body);
      const quiz = await QuizModel.findById(id);
      if (!quiz) throw new HttpError(404, "QUIZ_NOT_FOUND", "Quiz not found");

      const graded = quiz.questions.map((q, i) => {
        const submitted = answers.find((a) => a.questionIndex === i);
        const userAnswer = submitted?.answer ?? "";
        const isCorrect =
          submitted !== undefined && normalize(userAnswer) === normalize(q.correctAnswer);
        return {
          questionIndex: i,
          questionText: q.questionText,
          userAnswer,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          isCorrect,
          pointsEarned: isCorrect ? (q.points ?? 0) : 0,
          pointsPossible: q.points ?? 0,
        };
      });

      const totalPossible = graded.reduce((n, g) => n + g.pointsPossible, 0) || 1;
      const totalEarned = graded.reduce((n, g) => n + g.pointsEarned, 0);
      const scorePercent = Math.round((totalEarned / totalPossible) * 100);
      const passed = scorePercent >= (quiz.passingScore ?? 70);

      // Persist to UserProgress — best-effort, don't fail the request if it errors
      if (quiz.courseId) {
        try {
          await UserProgressModel.findOneAndUpdate(
            { userId, courseId: quiz.courseId },
            {
              $push: {
                quizAttempts: {
                  quizId: quiz._id,
                  score: scorePercent,
                  answers: graded.map((g) => ({
                    questionId: String(g.questionIndex),
                    userAnswer: Array.isArray(g.userAnswer)
                      ? g.userAnswer.join("|")
                      : String(g.userAnswer),
                    isCorrect: g.isCorrect,
                  })),
                  attemptDate: new Date(),
                },
              },
              $set: { lastAccessedAt: new Date() },
            },
            { upsert: true, new: true },
          );
        } catch (e) {
          console.error("[quiz] failed to persist attempt:", e);
        }
      }

      res.json(
        ok({
          scorePercent,
          totalEarned,
          totalPossible,
          passed,
          passingScore: quiz.passingScore ?? 70,
          graded,
        }),
      );
    } catch (err) {
      next(err);
    }
  });

  return router;
}
