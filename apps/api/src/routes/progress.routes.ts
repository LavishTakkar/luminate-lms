import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import { HttpError, ok } from "../middleware/error.js";
import { UserProgressModel } from "../models/UserProgress.js";
import { CourseModel } from "../models/Course.js";
import { ModuleModel } from "../models/Module.js";
import { LessonModel } from "../models/Lesson.js";
import type { AppDeps } from "../app.js";

interface CourseProgressSummary {
  courseId: string;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lastAccessedAt: string;
  currentLessonId: string | null;
}

export function buildProgressRouter(deps: AppDeps): Router {
  const router = Router();

  router.use(requireAuth(deps.jwtSecret));

  // GET /api/progress/overview — summary across every enrolled course
  router.get("/overview", async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new HttpError(401, "UNAUTHORIZED", "Missing user");

      const progressDocs = await UserProgressModel.find({ userId }).lean();
      const summaries: CourseProgressSummary[] = [];

      for (const p of progressDocs) {
        const course = await CourseModel.findById(p.courseId).lean();
        if (!course) continue;

        const modules = await ModuleModel.find({ courseId: p.courseId }).select("_id").lean();
        const moduleIds = modules.map((m) => m._id);
        const totalLessons = await LessonModel.countDocuments({
          moduleId: { $in: moduleIds },
        });
        const completedLessons = p.completedLessons?.length ?? 0;
        const pct =
          totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        summaries.push({
          courseId: String(p.courseId),
          courseTitle: course.title,
          totalLessons,
          completedLessons,
          progressPercentage: pct,
          lastAccessedAt: (p.lastAccessedAt ?? p.updatedAt ?? new Date()).toISOString(),
          currentLessonId: p.currentLesson ? String(p.currentLesson) : null,
        });
      }

      // Most-recent first
      summaries.sort((a, b) => b.lastAccessedAt.localeCompare(a.lastAccessedAt));

      res.json(
        ok({
          courses: summaries,
          totals: {
            enrolledCount: summaries.length,
            completedCourses: summaries.filter((s) => s.progressPercentage === 100).length,
            totalLessonsCompleted: summaries.reduce((n, s) => n + s.completedLessons, 0),
          },
        }),
      );
    } catch (err) {
      next(err);
    }
  });

  // GET /api/progress/course/:id — detailed progress for a single course
  router.get("/course/:id", async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new HttpError(401, "UNAUTHORIZED", "Missing user");

      const id = req.params.id ?? "";
      if (!mongoose.isValidObjectId(id))
        throw new HttpError(400, "BAD_ID", "Invalid course id");

      const progress = await UserProgressModel.findOne({ userId, courseId: id });
      if (!progress) {
        res.json(ok(null));
        return;
      }
      res.json(ok(progress));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
