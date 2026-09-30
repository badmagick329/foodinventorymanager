import type { ZodType } from "zod";
import { formatZodError } from "@/lib/validators";

/**
 * Failures whose message is written for the caller. Every transport (HTTP
 * routes, the assistant, MCP) shows these messages as-is; any other error is
 * treated as unexpected and reported generically.
 */
export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidInputError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export function parseInput<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new InvalidInputError(formatZodError(result.error));
  }
  return result.data;
}

export function isRecordNotFound(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2025"
  );
}
