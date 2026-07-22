import { DiscoveryClient } from "@/components/discover/discovery-client";
import type { GameSummary } from "@/lib/games/types";
import { getGameProvider } from "@/lib/games/provider";
import { getRecommendations } from "@/lib/recommendations/scoring";
import { getCurrentUser } from "@/lib/server/current-user";
import { getLibraryEntries } from "@/lib/server/library-service";

export const metadata = {
  title: "Discover",
};

export default async function DiscoverPage() {
  const user = await getCurrentUser();
  const entries = user ? await getLibraryEntries(user) : [];
  const games = await getDiscoveryGames(entries);

  return <DiscoveryClient games={games} initialEntries={entries} />;
}

async function getDiscoveryGames(
  entries: Awaited<ReturnType<typeof getLibraryEntries>>,
) {
  const provider = getGameProvider();
  const hasTasteSignal = entries.some(
    (entry) =>
      (entry.rating?.overallRating ?? 0) > 0 || entry.userGame.isFavorite,
  );
  const exploratoryPage = hasTasteSignal
    ? 1
    : Math.floor(Math.random() * 6) + 1;
  const candidates = await loadPopularGames(exploratoryPage);
  const answeredSlugs = new Set(entries.map((entry) => entry.game.slug));
  const unansweredCandidates = candidates.filter(
    (game) => !answeredSlugs.has(game.slug),
  );

  if (!hasTasteSignal) {
    return shuffleGames(unansweredCandidates).slice(0, 50);
  }

  const recommendedGames = getRecommendations(
    unansweredCandidates,
    entries,
    50,
  ).map((recommendation) => recommendation.game);
  const recommendedSlugs = new Set(recommendedGames.map((game) => game.slug));
  const exploratoryFill = shuffleGames(
    unansweredCandidates.filter((game) => !recommendedSlugs.has(game.slug)),
  );

  return [...recommendedGames, ...exploratoryFill].slice(0, 50);

  async function loadPopularGames(page: number): Promise<GameSummary[]> {
    const games = await provider.getPopularGames({ page, pageSize: 75 });
    if (games.length > 0 || page === 1) {
      return games;
    }

    return provider.getPopularGames({ page: 1, pageSize: 75 });
  }
}

function shuffleGames(games: GameSummary[]) {
  return [...games].sort(() => Math.random() - 0.5);
}
