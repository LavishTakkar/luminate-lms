import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { CourseModel } from "../models/Course.js";
import { ModuleModel } from "../models/Module.js";
import { UserModel } from "../models/User.js";
import { UserProgressModel } from "../models/UserProgress.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { HttpError, ok } from "../middleware/error.js";
import type { AppDeps } from "../app.js";

const courseCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  category: z.string().max(80).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  thumbnail: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

const courseUpdateSchema = courseCreateSchema.partial();

const queryStr = z.union([z.string(), z.undefined()]).optional();

const listQuerySchema = z.object({
  category: queryStr,
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  published: queryStr.transform((v) => (v === undefined ? undefined : v === "true")),
  q: queryStr,
});

function isObjectId(id: unknown): id is string {
  return typeof id === "string" && mongoose.isValidObjectId(id);
}

export function buildCoursesRouter(deps: AppDeps): Router {
  const router = Router();

  // GET /api/courses — public listing with filters
  router.get("/", async (req, res, next) => {
    try {
      const query = listQuerySchema.parse(req.query);
      const filter: Record<string, unknown> = {};
      if (query.category) filter.category = query.category;
      if (query.difficulty) filter.difficulty = query.difficulty;
      if (query.published !== undefined) filter.isPublished = query.published;
      if (query.q) filter.title = { $regex: query.q, $options: "i" };

      const courses = await CourseModel.find(filter).sort({ createdAt: -1 }).limit(100);
      res.json(ok(courses));
    } catch (err) {
      next(err);
    }
  });

  // GET /api/courses/my-courses — must come before /:id
  router.get("/my-courses", requireAuth(deps.jwtSecret), async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.user!.userId).populate("enrolledCourses");
      res.json(ok(user?.enrolledCourses ?? []));
    } catch (err) {
      next(err);
    }
  });

  // GET /api/courses/:id
  router.get("/:id", async (req, res, next) => {
    try {
      const id = req.params.id ?? "";
      if (!isObjectId(id)) throw new HttpError(400, "BAD_ID", "Invalid course id");
      const course = await CourseModel.findById(id).populate("modules");
      if (!course) throw new HttpError(404, "COURSE_NOT_FOUND", "Course not found");
      res.json(ok(course));
    } catch (err) {
      next(err);
    }
  });

  // GET /api/courses/:id/modules
  router.get("/:id/modules", async (req, res, next) => {
    try {
      const id = req.params.id ?? "";
      if (!isObjectId(id)) throw new HttpError(400, "BAD_ID", "Invalid course id");
      const modules = await ModuleModel.find({ courseId: id }).sort({ order: 1 });
      res.json(ok(modules));
    } catch (err) {
      next(err);
    }
  });

  // POST /api/courses — admin only
  router.post(
    "/",
    requireAuth(deps.jwtSecret),
    requireAdmin(),
    async (req, res, next) => {
      try {
        const body = courseCreateSchema.parse(req.body);
        const course = await CourseModel.create({
          ...body,
          instructor: req.user!.userId,
        });
        res.status(201).json(ok(course));
      } catch (err) {
        next(err);
      }
    },
  );

  // PUT /api/courses/:id — admin only
  router.put(
    "/:id",
    requireAuth(deps.jwtSecret),
    requireAdmin(),
    async (req, res, next) => {
      try {
        const id = req.params.id ?? "";
        if (!isObjectId(id)) throw new HttpError(400, "BAD_ID", "Invalid course id");
        const body = courseUpdateSchema.parse(req.body);
        const course = await CourseModel.findByIdAndUpdate(id, body, { new: true });
        if (!course) throw new HttpError(404, "COURSE_NOT_FOUND", "Course not found");
        res.json(ok(course));
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/courses/:id — admin only
  router.delete(
    "/:id",
    requireAuth(deps.jwtSecret),
    requireAdmin(),
    async (req, res, next) => {
      try {
        const id = req.params.id ?? "";
        if (!isObjectId(id)) throw new HttpError(400, "BAD_ID", "Invalid course id");
        const course = await CourseModel.findByIdAndDelete(id);
        if (!course) throw new HttpError(404, "COURSE_NOT_FOUND", "Course not found");
        res.json(ok({ deleted: true }));
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * ═══════════════════════════════════════════════════════════════════
   *  YOUR TURN #2 — Enrollment idempotency semantics
   * ═══════════════════════════════════════════════════════════════════
   *
   * Default (shipped): IDEMPOTENT. Duplicate enrollment silently returns
   * the existing UserProgress record with HTTP 200. Friendliest for a
   * hobby LMS — clicking "Enroll" twice isn't an error.
   *
   * Alternatives:
   *  - 409 CONFLICT on duplicate — stricter, matches REST conventions
   *  - 200 with { alreadyEnrolled: true } flag — informative hybrid
   *
   * To switch: uncomment the `throw` below and remove the early-return.
   * ═══════════════════════════════════════════════════════════════════
   */
  router.post(
    "/:id/enroll",
    requireAuth(deps.jwtSecret),
    async (req, res, next) => {
      try {
        const id = req.params.id ?? "";
        if (!isObjectId(id)) throw new HttpError(400, "BAD_ID", "Invalid course id");

        const course = await CourseModel.findById(id);
        if (!course) throw new HttpError(404, "COURSE_NOT_FOUND", "Course not found");

        const userId = req.user!.userId;
        const existing = await UserProgressModel.findOne({ userId, courseId: course._id });
        if (existing) {
          // throw new HttpError(409, "ALREADY_ENROLLED", "You are already enrolled");
          res.json(ok(existing));
          return;
        }

        const progress = await UserProgressModel.create({
          userId,
          courseId: course._id,
        });
        await UserModel.findByIdAndUpdate(userId, {
          $addToSet: { enrolledCourses: course._id },
        });
        await CourseModel.findByIdAndUpdate(course._id, { $inc: { enrollmentCount: 1 } });
        res.status(201).json(ok(progress));
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
