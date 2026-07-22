import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function readJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

export function errorResponse(
  error: unknown,
  fallback = "Something went wrong.",
) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error:
          error.issues[0]?.message ?? "Please check the form and try again.",
      },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: fallback }, { status: 400 });
}

export function clientRateLimitKey(request: Request, scope: string) {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const userAgent = request.headers.get("user-agent") ?? "unknown-agent";
  return `${scope}:${forwardedFor ?? userAgent}`;
}
