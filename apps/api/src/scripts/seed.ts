/**
 * Seed script — populates the database with a small set of sample
 * courses/modules/lessons so the UI has something to render on first run.
 *
 * Usage:
 *   pnpm --filter api exec tsx src/scripts/seed.ts
 *
 * Requires MONGODB_URI in .env. Safe to re-run — uses upserts keyed on title.
 */

import mongoose from "mongoose";
import { loadEnv } from "../config/env.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { UserModel } from "../models/User.js";
import { CourseModel } from "../models/Course.js";
import { ModuleModel } from "../models/Module.js";
import { LessonModel } from "../models/Lesson.js";
import bcrypt from "bcryptjs";

type ObjectId = mongoose.Types.ObjectId;

interface SeedLesson {
  title: string;
  content: string;
  order: number;
}

interface SeedModule {
  title: string;
  description: string;
  order: number;
  lessons: SeedLesson[];
}

interface SeedCourse {
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  modules: SeedModule[];
}

const COURSES: SeedCourse[] = [
  {
    title: "Intro to Machine Learning",
    description: "A gentle tour of supervised learning, bias/variance, and model evaluation.",
    category: "ai",
    difficulty: "beginner",
    tags: ["ml", "stats", "python"],
    modules: [
      {
        title: "Foundations",
        description: "What ML is, when to use it, and what it isn't.",
        order: 0,
        lessons: [
          {
            title: "What is Machine Learning?",
            order: 0,
            content:
              "Machine learning is the practice of building systems that improve with data. " +
              "Instead of writing rules by hand, you expose the algorithm to examples and it " +
              "infers the rule. Supervised learning pairs inputs with labels; unsupervised " +
              "learning finds structure without labels; reinforcement learning learns from rewards.",
          },
          {
            title: "Bias and Variance",
            order: 1,
            content:
              "Bias is the error from wrong assumptions (too-simple model). Variance is the error " +
              "from sensitivity to noise in the training set (too-complex model). Good models " +
              "trade one off against the other. Cross-validation helps diagnose which regime you're in.",
          },
        ],
      },
      {
        title: "Evaluation",
        description: "How to tell whether a model is actually good.",
        order: 1,
        lessons: [
          {
            title: "Train / Val / Test Splits",
            order: 0,
            content:
              "Never evaluate on data you trained on. Hold out a test set you touch once, and " +
              "use a validation set for tuning. For small datasets, k-fold cross-validation gives " +
              "a more robust estimate.",
          },
        ],
      },
    ],
  },
  {
    title: "Modern React Patterns",
    description: "Hooks, server state, suspense, and the practical stuff that matters in 2026.",
    category: "web",
    difficulty: "intermediate",
    tags: ["react", "typescript", "hooks"],
    modules: [
      {
        title: "Server State",
        description: "When to reach for TanStack Query.",
        order: 0,
        lessons: [
          {
            title: "Server vs Client State",
            order: 0,
            content:
              "Server state is data that lives on the server: users, posts, settings. Client " +
              "state is UI concerns: modal open/closed, form input, theme. They need different " +
              "tools — don't stuff server data into Redux.",
          },
        ],
      },
    ],
  },
];

async function main(): Promise<void> {
  const env = loadEnv();
  await connectDb(env.MONGODB_URI);
  console.log("[seed] connected");

  // Ensure at least one admin exists so admin-only routes are testable
  let admin = await UserModel.findOne({ email: "admin@lms.local" });
  if (!admin) {
    admin = await UserModel.create({
      email: "admin@lms.local",
      password: await bcrypt.hash("admin1234", 10),
      firstName: "Seed",
      lastName: "Admin",
      role: "admin",
    });
    console.log("[seed] created admin@lms.local / admin1234");
  }

  for (const c of COURSES) {
    const course = await CourseModel.findOneAndUpdate(
      { title: c.title },
      {
        title: c.title,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty,
        tags: c.tags,
        isPublished: true,
        instructor: admin._id,
      },
      { upsert: true, new: true },
    );
    if (!course) throw new Error(`Failed to upsert course: ${c.title}`);

    const moduleIds: ObjectId[] = [];
    for (const m of c.modules) {
      const mod = await ModuleModel.findOneAndUpdate(
        { courseId: course._id, title: m.title },
        {
          courseId: course._id,
          title: m.title,
          description: m.description,
          order: m.order,
        },
        { upsert: true, new: true },
      );
      if (!mod) throw new Error(`Failed to upsert module: ${m.title}`);

      const lessonIds: ObjectId[] = [];
      for (const l of m.lessons) {
        const lesson = await LessonModel.findOneAndUpdate(
          { moduleId: mod._id, title: l.title },
          {
            moduleId: mod._id,
            title: l.title,
            content: l.content,
            order: l.order,
            contentType: "text",
          },
          { upsert: true, new: true },
        );
        if (!lesson) throw new Error(`Failed to upsert lesson: ${l.title}`);
        lessonIds.push(lesson._id);
      }
      mod.lessons = lessonIds;
      await mod.save();
      moduleIds.push(mod._id);
    }
    course.modules = moduleIds;
    await course.save();
    console.log(`[seed] upserted course: ${course.title}`);
  }

  await disconnectDb();
  console.log("[seed] done");
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
