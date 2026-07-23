import { notFound } from "next/navigation";
import { GameDetailsClient } from "@/components/games/game-details-client";
import {
  getCachedGameBySlug,
  getCachedSimilarGames,
} from "@/lib/games/cached-provider";
import { getCurrentUser } from "@/lib/server/current-user";
import {
  getGameRatingBreakdown,
  getLibraryEntryBySlug,
} from "@/lib/server/library-service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = await getCachedGameBySlug(slug);
  return {
    title: game ? game.title : "Game",
  };
}

export default async function GameDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = await getCachedGameBySlug(slug);

  if (!game) {
    notFound();
  }

  const user = await getCurrentUser();
  const [entry, similarGames, ratingBreakdown] = await Promise.all([
    user ? getLibraryEntryBySlug(user, slug) : Promise.resolve(null),
    getCachedSimilarGames(game.id),
    getGameRatingBreakdown(slug),
  ]);

  return (
    <GameDetailsClient
      game={game}
      initialEntry={entry}
      similarGames={similarGames}
      ratingBreakdown={ratingBreakdown}
    />
  );
}
