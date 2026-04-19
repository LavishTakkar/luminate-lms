import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { ModuleModel } from "../models/Module.js";
import { CourseModel } from "../models/Course.js";
import { LessonModel } from "../models/Lesson.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { HttpError, ok } from "../middleware/error.js";
import type { AppDeps } from "../app.js";

const createSchema = z.object({
  courseId: z.string().refine(mongoose.isValidObjectId, "Invalid courseId"),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  order: z.number().int().nonnegative().optional(),
});

const updateSchema = createSchema.partial().omit({ courseId: true });

export function buildModulesRouter(deps: AppDeps): Router {
  const router = Router();

  router.get("/:id", async (req, res, next) => {
    try {
      const id = req.params.id ?? "";
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "BAD_ID", "Invalid module id");
      const mod = await ModuleModel.findById(id).populate("lessons");
      if (!mod) throw new HttpError(404, "MODULE_NOT_FOUND", "Module not found");
      res.json(ok(mod));
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id/lessons", async (req, res, next) => {
    try {
      const id = req.params.id ?? "";
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "BAD_ID", "Invalid module id");
      const lessons = await LessonModel.find({ moduleId: id }).sort({ order: 1 });
      res.json(ok(lessons));
    } catch (err) {
      next(err);
    }
  });

  router.post("/", requireAuth(deps.jwtSecret), requireAdmin(), async (req, res, next) => {
    try {
      const body = createSchema.parse(req.body);
      const course = await CourseModel.findById(body.courseId);
      if (!course) throw new HttpError(404, "COURSE_NOT_FOUND", "Course not found");

      const mod = await ModuleModel.create(body);
      await CourseModel.findByIdAndUpdate(body.courseId, { $addToSet: { modules: mod._id } });
      res.status(201).json(ok(mod));
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
          throw new HttpError(400, "BAD_ID", "Invalid module id");
        const body = updateSchema.parse(req.body);
        const mod = await ModuleModel.findByIdAndUpdate(id, body, { new: true });
        if (!mod) throw new HttpError(404, "MODULE_NOT_FOUND", "Module not found");
        res.json(ok(mod));
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
          throw new HttpError(400, "BAD_ID", "Invalid module id");
        const mod = await ModuleModel.findByIdAndDelete(id);
        if (!mod) throw new HttpError(404, "MODULE_NOT_FOUND", "Module not found");
        await CourseModel.findByIdAndUpdate(mod.courseId, { $pull: { modules: mod._id } });
        res.json(ok({ deleted: true }));
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
