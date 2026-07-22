import Link from "next/link";
import { GameCard } from "@/components/games/game-card";
import { GameArtwork } from "@/components/games/game-artwork";
import { BarList } from "@/components/charts/bar-list";
import { StatCard } from "@/components/profile/stat-card";
import { Button } from "@/components/ui/button";
import { getGameProvider } from "@/lib/games/provider";
import { getRecommendations } from "@/lib/recommendations/scoring";
import { getCurrentUser } from "@/lib/server/current-user";
import { getLibraryEntries } from "@/lib/server/library-service";
import { calculateUserStats } from "@/lib/stats/stats";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const entries = user ? await getLibraryEntries(user) : [];
  const stats = calculateUserStats(entries);
  const games = await getGameProvider().getPopularGames({ pageSize: 30 });
  const recommendations = getRecommendations(games, entries, 4);
  const currentlyPlaying = entries
    .filter((entry) => entry.userGame.status === "playing")
    .slice(0, 3);
  const recentlyRated = entries.filter((entry) => entry.rating).slice(0, 3);
  const backlog = entries
    .filter((entry) => entry.userGame.status === "want_to_play")
    .slice(0, 3);

  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-cyan-200">Dashboard</p>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.displayName ?? "player"}.
          </h1>
          <p className="mt-2 text-zinc-400">
            Your backlog, ratings, and next-game suggestions in one place.
          </p>
        </div>
        <Button asChild>
          <Link href="/discover">Open discovery</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total games played" value={stats.totalGamesPlayed} />
        <StatCard
          label="Average user rating"
          value={stats.averageOverallRating || "N/A"}
        />
        <StatCard label="Completed this year" value={stats.completedThisYear} />
        <StatCard label="Backlog" value={stats.backlogCount} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Recommended next games</h2>
            <Link
              href="/search"
              className="text-sm font-medium text-cyan-200 hover:text-cyan-100"
            >
              Search catalog
            </Link>
          </div>
          {recommendations.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {recommendations.map((recommendation, index) => (
                <div key={recommendation.game.slug} className="space-y-2">
                  <GameCard game={recommendation.game} priority={index < 2} />
                  <p className="rounded-md border bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
                    {recommendation.reasons[0]}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel text="Rate a few games and recommendations will sharpen up." />
          )}
        </section>

        <aside className="space-y-4">
          <StatCard label="Favorite genres">
            {stats.favoriteGenres.length ? (
              <BarList items={stats.favoriteGenres} label="Favorite genres" />
            ) : (
              <p className="text-sm text-zinc-400">No rated genres yet.</p>
            )}
          </StatCard>
          <StatCard label="Most-used platforms">
            {stats.mostPlayedPlatforms.length ? (
              <BarList
                items={stats.mostPlayedPlatforms}
                label="Most-used platforms"
              />
            ) : (
              <p className="text-sm text-zinc-400">No platform history yet.</p>
            )}
          </StatCard>
          <StatCard label="Rating distribution">
            <BarList
              items={stats.ratingDistribution}
              label="Rating distribution"
              maxValue={Math.max(
                1,
                ...stats.ratingDistribution.map((item) => item.value),
              )}
            />
          </StatCard>
        </aside>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardList
          title="Currently playing"
          entries={currentlyPlaying}
          empty="Nothing active right now."
        />
        <DashboardList
          title="Recently rated"
          entries={recentlyRated}
          empty="No ratings saved yet."
        />
        <DashboardList
          title="Want-to-play backlog"
          entries={backlog}
          empty="Your backlog is clear."
        />
      </div>
    </section>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-lg border bg-panel p-6 text-center text-zinc-400">
      {text}
    </div>
  );
}

function DashboardList({
  title,
  entries,
  empty,
}: {
  title: string;
  entries: Awaited<ReturnType<typeof getLibraryEntries>>;
  empty: string;
}) {
  return (
    <section className="rounded-lg border bg-panel p-5">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {entries.length ? (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.game.slug}
              className="border-b pb-3 last:border-b-0 last:pb-0"
            >
              <div className="min-w-0">
                <Link
                  href={`/games/${entry.game.slug}`}
                  className="flex gap-3 rounded-md hover:text-cyan-200 focus-visible:outline-2"
                >
                  <GameArtwork
                    src={entry.game.coverImageUrl}
                    alt={`${entry.game.title} cover`}
                    className="h-20 w-14 shrink-0 rounded-sm"
                  />
                  <span className="min-w-0">
                    <span className="line-clamp-2 font-semibold leading-tight">
                      {entry.game.title}
                    </span>
                    <span className="mt-1 block text-sm text-zinc-500">
                      {entry.rating
                        ? `${entry.rating.overallRating}/10`
                        : entry.userGame.status.replaceAll("_", " ")}
                    </span>
                  </span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-400">{empty}</p>
      )}
    </section>
  );
}
