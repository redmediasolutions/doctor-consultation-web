import "server-only";
import { NextResponse } from "next/server";

import { DatabaseNotConfiguredError } from "./db";

export class HttpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);

export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

export function str(v: unknown, max = 500): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Wraps a route handler: HttpError → its status, missing DB → 503, anything else → 500. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return fail(e.message, e.status);
      if (e instanceof DatabaseNotConfiguredError) return fail(e.message, 503);
      console.error(e);
      return fail("Server error", 500);
    }
  };
}
