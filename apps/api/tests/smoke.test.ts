import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../src/app.js";

const JWT_SECRET = "test-secret-at-least-16-chars-please";
const JWT_EXPIRES_IN = "1h";

describe("smoke: auth + courses + enrollment", () => {
  let mongod: MongoMemoryServer;
  const app = createApp({
    jwtSecret: JWT_SECRET,
    jwtExpiresIn: JWT_EXPIRES_IN,
    env: "test",
  });

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it("health endpoint responds", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
  });

  it("first user becomes admin, second becomes student", async () => {
    const first = await request(app).post("/api/auth/register").send({
      email: "admin@example.com",
      password: "hunter2xyz",
      firstName: "Ada",
      lastName: "Lovelace",
    });
    expect(first.status).toBe(201);
    expect(first.body.data.user.role).toBe("admin");

    const second = await request(app).post("/api/auth/register").send({
      email: "student@example.com",
      password: "hunter2xyz",
      firstName: "Grace",
      lastName: "Hopper",
    });
    expect(second.status).toBe(201);
    expect(second.body.data.user.role).toBe("student");
  });

  it("rejects weak passwords", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "weak@example.com",
      password: "short",
      firstName: "Tim",
      lastName: "Test",
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "admin@example.com",
      password: "hunter2xyz",
      firstName: "Dup",
      lastName: "Licate",
    });
    expect(res.status).toBe(409);
  });

  it("login returns a JWT and /me echoes the user", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "hunter2xyz" });
    expect(login.status).toBe(200);
    const token = login.body.data.token;

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe("admin@example.com");
  });

  it("admin creates a course; student enrolls (idempotent)", async () => {
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "hunter2xyz" });
    const adminToken = adminLogin.body.data.token;

    const created = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Intro to AI",
        description: "A short course",
        difficulty: "beginner",
        isPublished: true,
      });
    expect(created.status).toBe(201);
    const courseId = created.body.data._id;

    const studentLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "student@example.com", password: "hunter2xyz" });
    const studentToken = studentLogin.body.data.token;

    const enroll1 = await request(app)
      .post(`/api/courses/${courseId}/enroll`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(enroll1.status).toBe(201);

    const enroll2 = await request(app)
      .post(`/api/courses/${courseId}/enroll`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(enroll2.status).toBe(200);
    expect(enroll2.body.data.courseId).toBe(courseId);
  });

  it("student cannot create a course (403)", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "student@example.com", password: "hunter2xyz" });
    const token = login.body.data.token;

    const res = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Forbidden" });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("AI summarize returns a stub response", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "hunter2xyz" });
    const token = login.body.data.token;

    const res = await request(app)
      .post("/api/ai/summarize")
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "This is a long piece of educational content about testing.", summaryType: "brief" });
    expect(res.status).toBe(200);
    expect(res.body.data.summary).toMatch(/STUB/);
  });

  it("AI status reports stubbed when no key is configured", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "hunter2xyz" });
    const token = login.body.data.token;

    const res = await request(app)
      .get("/api/ai/status")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ provider: "gemini", stubbed: true });
  });

  it("AI chat persists conversation and returns a stable conversationId", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "hunter2xyz" });
    const token = login.body.data.token;

    const first = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Hello, tutor." });
    expect(first.status).toBe(200);
    const conversationId = first.body.data.conversationId;
    expect(conversationId).toMatch(/^[a-f0-9]{24}$/);

    const second = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "What did I just say?", conversationId });
    expect(second.status).toBe(200);
    expect(second.body.data.conversationId).toBe(conversationId);
  });

  it("quiz flow: admin saves, student takes it without answers, submits, and is graded", async () => {
    // Admin creates course + module + lesson
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "hunter2xyz" });
    const adminToken = adminLogin.body.data.token;

    const course = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Quiz Host", isPublished: true });
    const courseId = course.body.data._id;

    const mod = await request(app)
      .post("/api/modules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ courseId, title: "Mod" });
    const moduleId = mod.body.data._id;

    const lesson = await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ moduleId, title: "Lesson 1", content: "Content here" });
    const lessonId = lesson.body.data._id;

    // Admin saves a quiz
    const quiz = await request(app)
      .post("/api/quizzes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        lessonId,
        title: "Check your knowledge",
        questions: [
          {
            questionText: "2 + 2 = ?",
            questionType: "multiple-choice",
            options: ["3", "4", "5", "22"],
            correctAnswer: "4",
            explanation: "Simple arithmetic.",
            points: 10,
          },
          {
            questionText: "The sky is blue.",
            questionType: "true-false",
            correctAnswer: "True",
            points: 10,
          },
        ],
      });
    expect(quiz.status).toBe(201);
    const quizId = quiz.body.data._id;

    // Student fetches the quiz — correctAnswer + explanation are stripped
    const studentLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "student@example.com", password: "hunter2xyz" });
    const studentToken = studentLogin.body.data.token;

    const taken = await request(app)
      .get(`/api/quizzes/${quizId}`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(taken.status).toBe(200);
    expect(taken.body.data.questions[0].correctAnswer).toBe("");
    expect(taken.body.data.questions[0].explanation).toBeUndefined();

    // Student submits: gets Q1 right, Q2 wrong
    const submit = await request(app)
      .post(`/api/quizzes/${quizId}/submit`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        answers: [
          { questionIndex: 0, answer: "4" },
          { questionIndex: 1, answer: "False" },
        ],
      });
    expect(submit.status).toBe(200);
    expect(submit.body.data.scorePercent).toBe(50);
    expect(submit.body.data.passed).toBe(false);
    expect(submit.body.data.graded[0].isCorrect).toBe(true);
    expect(submit.body.data.graded[1].isCorrect).toBe(false);
    expect(submit.body.data.graded[1].correctAnswer).toBe("True");

    // Admin fetching the same quiz sees the correct answers
    const asAdmin = await request(app)
      .get(`/api/quizzes/${quizId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(asAdmin.body.data.questions[0].correctAnswer).toBe("4");
  });
});
