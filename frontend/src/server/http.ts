import { NextRequest, NextResponse } from "next/server";
import { AppError, InvalidInputError, isRecordNotFound } from "./errors";

export type IdParams = { params: Promise<{ id: string }> };

/**
 * Wraps a route handler so services can signal expected failures by throwing
 * `AppError`s instead of every route repeating its own try/catch and status
 * mapping.
 */
export function apiRoute<Context>(
  handler: (request: NextRequest, context: Context) => Promise<Response>
) {
  return async (request: NextRequest, context: Context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  if (isRecordNotFound(error)) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new InvalidInputError("The request body must be valid JSON.");
  }
}

export function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new InvalidInputError("Invalid ID format.");
  }
  return id;
}
