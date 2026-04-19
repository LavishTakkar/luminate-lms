import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../src/app.js";

const JWT_SECRET = "test-secret-at-least-16-chars-please";
const JWT_EXPIRES_IN = "1h";

describe("smoke: auth + courses + enrollment", () => {
  let mongod: MongoMemoryServer;
  const app = createApp({ jwtSecret: JWT_SECRET, jwtExpiresIn: JWT_EXPIRES_IN });

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
});
