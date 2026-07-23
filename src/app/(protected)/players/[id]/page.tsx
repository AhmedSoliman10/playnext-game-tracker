import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, UserRound } from "lucide-react";
import { BarList } from "@/components/charts/bar-list";
import { GameArtwork } from "@/components/games/game-artwork";
import { StatCard } from "@/components/profile/stat-card";
import { Button } from "@/components/ui/button";
import { getPublicProfileDetails } from "@/lib/server/community-service";
import { getCurrentUser } from "@/lib/server/current-user";
import { assignGamingPersonality, calculateUserStats } from "@/lib/stats/stats";

export const metadata = {
  title: "Player Profile",
};

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;

  if (!user) {
    notFound();
  }

  const details = await getPublicProfileDetails(user, id);
  if (!details) {
    notFound();
  }

  const { profile, entries } = details;
  const stats = calculateUserStats(entries);
  const personality = assignGamingPersonality(entries);
  const favoriteGames = entries
    .filter((entry) => entry.userGame.isFavorite)
    .slice(0, 6);
  const recentActivity = entries.slice(0, 8);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <ProfileAvatar src={profile.avatarUrl} name={profile.displayName} />
          <div>
            <p className="text-sm font-medium text-cyan-200">
              Public player profile
            </p>
            <h1 className="text-3xl font-bold">{profile.displayName}</h1>
            <p className="mt-2 text-zinc-400">
              {personality.label}: {personality.explanation}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {profile.followersCount} followers · {profile.followingCount}{" "}
              following
            </p>
          </div>
        </div>

        {profile.isCurrentUser ? (
          <Button asChild variant="secondary">
            <Link href="/settings">
              {profile.isPrivate ? (
                <Lock className="h-4 w-4" aria-hidden />
              ) : null}
              Edit profile
            </Link>
          </Button>
        ) : null}
      </div>

      {profile.isCurrentUser && profile.isPrivate ? (
        <p
          role="status"
          className="rounded-md border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm text-amber-100"
        >
          Your profile is private. Other players cannot view this page until you
          make it public in settings.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Played" value={stats.totalGamesPlayed} />
        <StatCard label="Completed" value={stats.totalCompleted} />
        <StatCard label="Dropped" value={stats.totalDropped} />
        <StatCard
          label="Average rating"
          value={stats.averageOverallRating || "N/A"}
        />
        <StatCard label="Backlog" value={stats.backlogCount} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatCard label="Favorite genres">
          {stats.favoriteGenres.length ? (
            <BarList items={stats.favoriteGenres} label="Favorite genres" />
          ) : (
            <p className="text-sm text-zinc-400">No high ratings yet.</p>
          )}
        </StatCard>
        <StatCard label="Most-played platforms">
          {stats.mostPlayedPlatforms.length ? (
            <BarList
              items={stats.mostPlayedPlatforms}
              label="Most-played platforms"
            />
          ) : (
            <p className="text-sm text-zinc-400">No platform history yet.</p>
          )}
        </StatCard>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Favorite games</h2>
        {favoriteGames.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteGames.map((entry) => (
              <Link
                key={entry.game.slug}
                href={`/games/${entry.game.slug}`}
                className="rounded-lg border bg-panel p-3 transition hover:border-cyan-300 focus-visible:outline-2"
              >
                <GameArtwork
                  src={entry.game.coverImageUrl}
                  alt={`${entry.game.title} cover`}
                  className="aspect-[3/4] w-full"
                />
                <p className="mt-3 font-semibold">{entry.game.title}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border bg-panel p-5 text-zinc-400">
            No favorite games shared yet.
          </p>
        )}
      </section>

      <section className="rounded-lg border bg-panel p-5">
        <h2 className="mb-4 text-2xl font-bold">Recent activity</h2>
        {recentActivity.length ? (
          <ul className="space-y-3">
            {recentActivity.map((entry) => (
              <li
                key={entry.game.slug}
                className="border-b pb-3 last:border-b-0 last:pb-0"
              >
                <Link
                  href={`/games/${entry.game.slug}`}
                  className="flex items-center justify-between gap-4 rounded-md hover:text-cyan-200 focus-visible:outline-2"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <GameArtwork
                      src={entry.game.coverImageUrl}
                      alt={`${entry.game.title} cover`}
                      className="h-20 w-14 shrink-0 rounded-sm"
                    />
                    <span className="line-clamp-2 font-semibold">
                      {entry.game.title}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-zinc-400">
                    {entry.rating
                      ? `Rated ${entry.rating.overallRating}/10`
                      : entry.userGame.status.replaceAll("_", " ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-zinc-400">No public activity yet.</p>
        )}
      </section>
    </section>
  );
}

function ProfileAvatar({ src, name }: { src?: string | null; name: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name} avatar`}
        className="h-24 w-24 rounded-lg border object-cover"
      />
    );
  }

  return (
    <span className="inline-flex h-24 w-24 items-center justify-center rounded-lg border bg-panel text-zinc-400">
      <UserRound className="h-10 w-10" aria-hidden />
    </span>
  );
}
