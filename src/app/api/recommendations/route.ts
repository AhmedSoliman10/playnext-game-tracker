import { NextResponse } from "next/server";
import type { GameSummary } from "@/lib/games/types";
import { getGameProvider } from "@/lib/games/provider";
import {
  getGameIdentityKeys,
  getGameSlugIdentityKey,
  getRecommendations,
  isGameInIdentitySet,
  type Recommendation,
} from "@/lib/recommendations/scoring";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse } from "@/lib/server/http";
import {
  getDiscoveryInteractionSlugs,
  getLibraryEntries,
} from "@/lib/server/library-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  try {
    const entries = await getLibraryEntries(user);
    const discoverySlugs = await getDiscoveryInteractionSlugs(user);
    const hasTasteSignal = entries.some(
      (entry) =>
        (entry.rating?.overallRating ?? 0) > 0 || entry.userGame.isFavorite,
    );
    const page = hasTasteSignal ? 1 : Math.floor(Math.random() * 6) + 1;
    let games = await getGameProvider().getPopularGames({ page, pageSize: 75 });
    if (games.length === 0 && page !== 1) {
      games = await getGameProvider().getPopularGames({
        page: 1,
        pageSize: 75,
      });
    }

    const answeredGameKeys = new Set(
      discoverySlugs.map((slug) => getGameSlugIdentityKey(slug)),
    );
    for (const entry of entries) {
      for (const key of getGameIdentityKeys(entry.game)) {
        answeredGameKeys.add(key);
      }
    }
    games = games.filter(
      (game) => !isGameInIdentitySet(game, answeredGameKeys),
    );

    return NextResponse.json({
      recommendations: hasTasteSignal
        ? getRecommendations(games, entries, 8)
        : getExploratoryRecommendations(games, answeredGameKeys, 8),
    });
  } catch (error) {
    return errorResponse(error, "Could not load recommendations.");
  }
}

function getExploratoryRecommendations(
  games: GameSummary[],
  answeredGameKeys: Set<string>,
  limit: number,
): Recommendation[] {
  return shuffleGames(games)
    .filter((game) => !isGameInIdentitySet(game, answeredGameKeys))
    .slice(0, limit)
    .map((game) => ({
      game,
      score: 0,
      reasons: ["A fresh discovery pick while PlayNext learns your taste."],
    }));
}

function shuffleGames(games: GameSummary[]) {
  return [...games].sort(() => Math.random() - 0.5);
}
