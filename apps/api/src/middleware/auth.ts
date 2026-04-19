import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "./error.js";
import type { Role } from "@lms/shared";

export interface AuthPayload {
  userId: string;
  role: Role;
}

export function signToken(payload: AuthPayload, secret: string, expiresIn: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, secret, { expiresIn } as any);
}

export function verifyToken(token: string, secret: string): AuthPayload {
  const decoded = jwt.verify(token, secret);
  if (typeof decoded === "string" || !decoded) {
    throw new HttpError(401, "INVALID_TOKEN", "Malformed token");
  }
  const { userId, role } = decoded as jwt.JwtPayload;
  if (typeof userId !== "string" || (role !== "student" && role !== "admin")) {
    throw new HttpError(401, "INVALID_TOKEN", "Malformed token payload");
  }
  return { userId, role };
}

export function requireAuth(secret: string): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return next(new HttpError(401, "UNAUTHORIZED", "Missing bearer token"));
    }
    const token = header.slice("Bearer ".length);
    try {
      req.user = verifyToken(token, secret);
      next();
    } catch (err) {
      if (err instanceof HttpError) return next(err);
      next(new HttpError(401, "INVALID_TOKEN", "Invalid or expired token"));
    }
  };
}

export function requireAdmin(): RequestHandler {
  return (req, _res, next) => {
    if (req.user?.role !== "admin") {
      return next(new HttpError(403, "FORBIDDEN", "Admin role required"));
    }
    next();
  };
}
