import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

/**
 * YOUR TURN #3 — Error response envelope.
 *
 * Pick the error shape the whole API returns. Downstream routes conform to it,
 * so this is load-bearing. Options:
 *
 *  1. REST-y envelope:    { success: false, error: { code, message, details? } }
 *  2. Minimal:            { error: "message" }
 *  3. RFC 7807:           { type, title, status, detail, instance }
 *
 * I've scaffolded option (1) to match packages/shared/src/api.ts. If you
 * prefer a different shape, edit `buildError` below and update ApiError
 * in packages/shared/src/api.ts to match.
 */

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function buildError(code: string, message: string, details?: unknown) {
  return {
    success: false as const,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json(buildError("NOT_FOUND", "Route not found"));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res
      .status(400)
      .json(buildError("VALIDATION_ERROR", "Invalid request body", err.flatten().fieldErrors));
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json(buildError(err.code, err.message, err.details));
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json(buildError("INTERNAL_ERROR", "Something went wrong"));
};

export function ok<T>(data: T) {
  return { success: true as const, data };
}
