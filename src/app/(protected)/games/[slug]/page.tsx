import { notFound } from "next/navigation";
import { GameDetailsClient } from "@/components/games/game-details-client";
import { fallbackGameProvider, getGameProvider } from "@/lib/games/provider";
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
  const game =
    (await getGameProvider().getGameBySlug(slug)) ??
    (await fallbackGameProvider.getGameBySlug(slug));
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
  const provider = getGameProvider();
  const game =
    (await provider.getGameBySlug(slug)) ??
    (await fallbackGameProvider.getGameBySlug(slug));

  if (!game) {
    notFound();
  }

  const user = await getCurrentUser();
  const [entry, similarGames, ratingBreakdown] = await Promise.all([
    user ? getLibraryEntryBySlug(user, slug) : Promise.resolve(null),
    provider.getSimilarGames(game.id),
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
