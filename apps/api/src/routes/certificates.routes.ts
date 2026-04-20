import { Router } from "express";
import mongoose from "mongoose";
import { CertificateModel } from "../models/Certificate.js";
import { CourseModel } from "../models/Course.js";
import { UserModel } from "../models/User.js";
import { UserProgressModel } from "../models/UserProgress.js";
import { ModuleModel } from "../models/Module.js";
import { LessonModel } from "../models/Lesson.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError, ok } from "../middleware/error.js";
import type { AppDeps } from "../app.js";

async function computeProgressPct(userId: string, courseId: string): Promise<number> {
  const progress = await UserProgressModel.findOne({ userId, courseId });
  if (!progress) return 0;
  const moduleIds = (await ModuleModel.find({ courseId }).select("_id").lean()).map((m) => m._id);
  const total = await LessonModel.countDocuments({ moduleId: { $in: moduleIds } });
  if (total === 0) return 0;
  return Math.round(((progress.completedLessons?.length ?? 0) / total) * 100);
}

export function buildCertificatesRouter(deps: AppDeps): Router {
  const router = Router();

  // Public — verify a certificate by its slug, no auth required.
  router.get("/verify/:slug", async (req, res, next) => {
    try {
      const slug = req.params.slug ?? "";
      const cert = await CertificateModel.findOne({ slug }).lean();
      if (!cert) throw new HttpError(404, "CERT_NOT_FOUND", "Certificate not found");
      res.json(
        ok({
          _id: String(cert._id),
          slug: cert.slug,
          courseTitle: cert.courseTitle,
          userFullName: cert.userFullName,
          issuedAt: cert.issuedAt,
          valid: true,
        }),
      );
    } catch (err) {
      next(err);
    }
  });

  router.use(requireAuth(deps.jwtSecret));

  // GET /api/certificates — list current user's certificates
  router.get("/", async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      const certs = await CertificateModel.find({ userId }).sort({ issuedAt: -1 }).lean();
      res.json(ok(certs));
    } catch (err) {
      next(err);
    }
  });

  // GET /api/certificates/:id — fetch one of the user's certificates
  router.get("/:id", async (req, res, next) => {
    try {
      const id = req.params.id ?? "";
      if (!mongoose.isValidObjectId(id))
        throw new HttpError(400, "BAD_ID", "Invalid certificate id");
      const userId = req.user!.userId;
      const cert = await CertificateModel.findOne({ _id: id, userId }).lean();
      if (!cert) throw new HttpError(404, "CERT_NOT_FOUND", "Certificate not found");
      res.json(ok(cert));
    } catch (err) {
      next(err);
    }
  });

  // POST /api/certificates/generate — award a certificate if the course is 100% complete
  router.post("/generate", async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      const courseId = typeof req.body?.courseId === "string" ? req.body.courseId : "";
      if (!mongoose.isValidObjectId(courseId))
        throw new HttpError(400, "BAD_ID", "Invalid courseId");

      const pct = await computeProgressPct(userId, courseId);
      if (pct < 100) {
        throw new HttpError(
          400,
          "COURSE_NOT_COMPLETE",
          `Course is ${pct}% complete — finish every lesson first.`,
        );
      }

      const course = await CourseModel.findById(courseId).lean();
      if (!course) throw new HttpError(404, "COURSE_NOT_FOUND", "Course not found");
      const user = await UserModel.findById(userId).lean();
      if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");

      // Idempotent — if a cert already exists for this pair, return it.
      const existing = await CertificateModel.findOne({ userId, courseId }).lean();
      if (existing) {
        res.json(ok(existing));
        return;
      }

      const cert = await CertificateModel.create({
        userId,
        courseId,
        courseTitle: course.title,
        userFullName: `${user.firstName} ${user.lastName}`,
      });

      // Flag the progress row as certified
      await UserProgressModel.findOneAndUpdate(
        { userId, courseId },
        { $set: { certificateIssued: true, certificateUrl: `/certificates/${cert._id}` } },
      );

      res.status(201).json(ok(cert));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
