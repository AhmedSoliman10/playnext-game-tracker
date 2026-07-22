import { NextRequest, NextResponse } from "next/server";
import { getGameProvider } from "@/lib/games/provider";
import { searchParamsSchema } from "@/lib/validation/search";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { clientRateLimitKey, errorResponse } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(clientRateLimitKey(request, "game-search"), {
    limit: 45,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Search is moving too fast. Please try again in a minute." },
      { status: 429 },
    );
  }

  try {
    const input = searchParamsSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    const result = await getGameProvider().searchGames(input.q, {
      genres: input.genre ? [input.genre] : undefined,
      platforms: input.platform ? [input.platform] : undefined,
      releaseYear: input.year,
      page: input.page,
      pageSize: input.pageSize,
      ordering:
        input.sort === "release-date"
          ? "release-date"
          : input.sort === "external-rating"
            ? "external-rating"
            : "relevance",
    });

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Could not search games.");
  }
}
