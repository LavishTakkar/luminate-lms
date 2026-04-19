import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { LessonModel } from "../models/Lesson.js";
import { ModuleModel } from "../models/Module.js";
import { UserProgressModel } from "../models/UserProgress.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { HttpError, ok } from "../middleware/error.js";
import type { AppDeps } from "../app.js";

const createSchema = z.object({
  moduleId: z.string().refine(mongoose.isValidObjectId, "Invalid moduleId"),
  title: z.string().min(1).max(300),
  content: z.string().optional(),
  contentType: z.enum(["video", "text", "pdf", "mixed"]).optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().int().nonnegative().optional(),
  order: z.number().int().nonnegative().optional(),
});

const updateSchema = createSchema.partial().omit({ moduleId: true });

export function buildLessonsRouter(deps: AppDeps): Router {
  const router = Router();

  router.get("/:id", async (req, res, next) => {
    try {
      const id = req.params.id ?? "";
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "BAD_ID", "Invalid lesson id");
      const lesson = await LessonModel.findById(id);
      if (!lesson) throw new HttpError(404, "LESSON_NOT_FOUND", "Lesson not found");
      res.json(ok(lesson));
    } catch (err) {
      next(err);
    }
  });

  router.post("/", requireAuth(deps.jwtSecret), requireAdmin(), async (req, res, next) => {
    try {
      const body = createSchema.parse(req.body);
      const mod = await ModuleModel.findById(body.moduleId);
      if (!mod) throw new HttpError(404, "MODULE_NOT_FOUND", "Module not found");

      const lesson = await LessonModel.create(body);
      await ModuleModel.findByIdAndUpdate(body.moduleId, { $addToSet: { lessons: lesson._id } });
      res.status(201).json(ok(lesson));
    } catch (err) {
      next(err);
    }
  });

  router.put(
    "/:id",
    requireAuth(deps.jwtSecret),
    requireAdmin(),
    async (req, res, next) => {
      try {
        const id = req.params.id ?? "";
        if (!mongoose.isValidObjectId(id))
          throw new HttpError(400, "BAD_ID", "Invalid lesson id");
        const body = updateSchema.parse(req.body);
        const lesson = await LessonModel.findByIdAndUpdate(id, body, { new: true });
        if (!lesson) throw new HttpError(404, "LESSON_NOT_FOUND", "Lesson not found");
        res.json(ok(lesson));
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/:id",
    requireAuth(deps.jwtSecret),
    requireAdmin(),
    async (req, res, next) => {
      try {
        const id = req.params.id ?? "";
        if (!mongoose.isValidObjectId(id))
          throw new HttpError(400, "BAD_ID", "Invalid lesson id");
        const lesson = await LessonModel.findByIdAndDelete(id);
        if (!lesson) throw new HttpError(404, "LESSON_NOT_FOUND", "Lesson not found");
        await ModuleModel.findByIdAndUpdate(lesson.moduleId, { $pull: { lessons: lesson._id } });
        res.json(ok({ deleted: true }));
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /api/lessons/:id/complete — mark lesson complete for the current user
  router.post(
    "/:id/complete",
    requireAuth(deps.jwtSecret),
    async (req, res, next) => {
      try {
        const id = req.params.id ?? "";
        if (!mongoose.isValidObjectId(id))
          throw new HttpError(400, "BAD_ID", "Invalid lesson id");
        const lesson = await LessonModel.findById(id);
        if (!lesson) throw new HttpError(404, "LESSON_NOT_FOUND", "Lesson not found");
        const mod = await ModuleModel.findById(lesson.moduleId);
        if (!mod) throw new HttpError(404, "MODULE_NOT_FOUND", "Parent module missing");

        const userId = req.user?.userId;
        if (!userId) throw new HttpError(401, "UNAUTHORIZED", "Missing user");

        const progress = await UserProgressModel.findOneAndUpdate(
          { userId, courseId: mod.courseId },
          {
            $addToSet: { completedLessons: lesson._id },
            $set: { lastAccessedAt: new Date(), currentLesson: lesson._id },
          },
          { new: true, upsert: true },
        );
        res.json(ok(progress));
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
