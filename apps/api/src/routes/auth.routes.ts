import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserModel } from "../models/User.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { HttpError, ok } from "../middleware/error.js";
import type { AppDeps } from "../app.js";

const BCRYPT_ROUNDS = 10;

/**
 * ═════════════════════════════════════════════════════════════════════
 *  YOUR TURN #1 — Password policy
 * ═════════════════════════════════════════════════════════════════════
 *
 * I've set a sensible baseline: 8+ chars, must include at least one letter
 * and one digit. Edit the `passwordSchema` below to make it stricter or
 * looser.
 *
 * Trade-offs:
 *  - Stricter (symbols required, min 12) → fewer weak passwords, worse UX
 *  - Looser (min 6, no requirements)    → better UX, more weak passwords
 *  - Add a denylist?                     → blocks common passwords, adds
 *                                          a dependency (e.g. zxcvbn)
 *
 * For a personal/hobby LMS with just you as the initial user, the current
 * baseline is probably fine. Revisit when you open registration publicly.
 * ═════════════════════════════════════════════════════════════════════
 */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((p) => /[A-Za-z]/.test(p), "Password must contain at least one letter")
  .refine((p) => /\d/.test(p), "Password must contain at least one digit");

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  bio: z.string().max(2000).optional(),
  avatar: z.string().url().optional(),
  learningPreferences: z
    .object({
      topics: z.array(z.string()).optional(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      learningStyle: z.string().optional(),
    })
    .optional(),
});

function publicUser(user: {
  _id: unknown;
  email: string;
  firstName: string;
  lastName: string;
  role: "student" | "admin";
  bio?: string | null;
  avatar?: string | null;
  enrolledCourses?: unknown[];
}) {
  return {
    _id: String(user._id),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    bio: user.bio ?? undefined,
    avatar: user.avatar ?? undefined,
    enrolledCourses: (user.enrolledCourses ?? []).map(String),
  };
}

export function buildAuthRouter(deps: AppDeps): Router {
  const router = Router();

  router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = registerSchema.parse(req.body);
      const existing = await UserModel.findOne({ email: body.email });
      if (existing) {
        throw new HttpError(409, "EMAIL_TAKEN", "An account with this email already exists");
      }

      // First registered user becomes admin (personal LMS convention).
      const userCount = await UserModel.estimatedDocumentCount();
      const role = userCount === 0 ? "admin" : "student";

      const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
      const user = await UserModel.create({
        email: body.email,
        password: passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
        role,
      });

      const token = signToken(
        { userId: String(user._id), role: user.role },
        deps.jwtSecret,
        deps.jwtExpiresIn,
      );
      res.status(201).json(ok({ token, user: publicUser(user) }));
    } catch (err) {
      next(err);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const body = loginSchema.parse(req.body);
      const user = await UserModel.findOne({ email: body.email });
      if (!user) throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");

      const matches = await bcrypt.compare(body.password, user.password);
      if (!matches) throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");

      const token = signToken(
        { userId: String(user._id), role: user.role },
        deps.jwtSecret,
        deps.jwtExpiresIn,
      );
      res.json(ok({ token, user: publicUser(user) }));
    } catch (err) {
      next(err);
    }
  });

  router.get("/me", requireAuth(deps.jwtSecret), async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.user!.userId);
      if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");
      res.json(ok(publicUser(user)));
    } catch (err) {
      next(err);
    }
  });

  router.put("/update-profile", requireAuth(deps.jwtSecret), async (req, res, next) => {
    try {
      const body = updateProfileSchema.parse(req.body);
      const user = await UserModel.findByIdAndUpdate(req.user!.userId, body, {
        new: true,
        runValidators: true,
      });
      if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");
      res.json(ok(publicUser(user)));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
