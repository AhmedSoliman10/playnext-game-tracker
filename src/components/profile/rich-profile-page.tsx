import Link from "next/link";
import {
  CalendarDays,
  LibraryBig,
  Lock,
  Search,
  UserRound,
} from "lucide-react";
import { BarList } from "@/components/charts/bar-list";
import { GameArtwork } from "@/components/games/game-artwork";
import { ProfileFollowButton } from "@/components/profile/profile-follow-button";
import { StatCard } from "@/components/profile/stat-card";
import { RatingDetails } from "@/components/ratings/rating-details";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getProfileLibraryEntries,
  getProfileLibraryTabs,
  getRatingCategoryAverages,
  PROFILE_LIBRARY_LABELS,
  PROFILE_LIBRARY_SORT_LABELS,
  PROFILE_LIBRARY_SORTS,
  type ProfileLibraryQuery,
  type ProfileLibrarySort,
  type ProfileLibraryView,
} from "@/lib/profile/library";
import type { LibraryEntry, PublicProfile } from "@/lib/types";
import { cn, formatCompactDate, getReleaseYear } from "@/lib/utils";
import { assignGamingPersonality, calculateUserStats } from "@/lib/stats/stats";

interface RichProfile {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  isCurrentUser: boolean;
  isPrivate?: boolean;
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
  createdAt?: string;
}

export function RichProfilePage({
  profile,
  entries,
  query,
  basePath,
}: {
  profile: RichProfile | PublicProfile;
  entries: LibraryEntry[];
  query: ProfileLibraryQuery;
  basePath: string;
}) {
  const includeHidden = profile.isCurrentUser;
  const stats = calculateUserStats(entries);
  const personality = assignGamingPersonality(entries);
  const tabs = getProfileLibraryTabs(entries, { includeHidden });
  const libraryEntries = getProfileLibraryEntries(entries, query, {
    includeHidden,
  });
  const categoryAverages = getRatingCategoryAverages(entries);
  const favoriteGames = entries
    .filter((entry) => entry.userGame.isFavorite)
    .slice(0, 5);
  const recentReviews = entries
    .filter((entry) => entry.rating)
    .sort(
      (a, b) =>
        new Date(b.rating?.updatedAt ?? b.userGame.updatedAt).getTime() -
        new Date(a.rating?.updatedAt ?? a.userGame.updatedAt).getTime(),
    )
    .slice(0, 4);
  const shelves = [
    {
      label: "Currently playing",
      description: "The games in rotation now.",
      entries: entries
        .filter((entry) => entry.userGame.status === "playing")
        .slice(0, 5),
    },
    {
      label: "Backlog",
      description: "Saved for later.",
      entries: entries
        .filter((entry) => entry.userGame.status === "want_to_play")
        .slice(0, 5),
    },
    {
      label: "Dropped",
      description: "Tried, then moved on.",
      entries: entries
        .filter((entry) => entry.userGame.status === "dropped")
        .slice(0, 5),
    },
  ];

  return (
    <section className="space-y-8">
      <section className="overflow-hidden rounded-lg border bg-panel">
        <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_360px] md:p-6">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row">
            <ProfileAvatar src={profile.avatarUrl} name={profile.displayName} />
            <div className="min-w-0 space-y-4">
              <div>
                <p className="text-sm font-medium text-cyan-200">
                  {profile.isCurrentUser
                    ? "Your PlayNext profile"
                    : "Public player profile"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h1 className="break-words text-3xl font-black sm:text-4xl">
                    {profile.displayName}
                  </h1>
                  {profile.isPrivate ? (
                    <Badge className="border-amber-300/30 bg-amber-300/10 text-amber-100">
                      <Lock className="h-3.5 w-3.5" aria-hidden />
                      Private
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 max-w-2xl text-zinc-400">
                  {personality.label}: {personality.explanation}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-zinc-300">
                {profile.createdAt ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950/60 px-2.5 py-1">
                    <CalendarDays className="h-4 w-4" aria-hidden />
                    Joined {formatCompactDate(profile.createdAt)}
                  </span>
                ) : null}
                {typeof profile.followersCount === "number" ? (
                  <span className="rounded-md border border-zinc-800 bg-zinc-950/60 px-2.5 py-1">
                    {profile.followersCount} followers
                  </span>
                ) : null}
                {typeof profile.followingCount === "number" ? (
                  <span className="rounded-md border border-zinc-800 bg-zinc-950/60 px-2.5 py-1">
                    {profile.followingCount} following
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                {profile.isCurrentUser ? (
                  <>
                    <Button asChild>
                      <Link href="/settings">Edit profile</Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href="/library">Manage library</Link>
                    </Button>
                  </>
                ) : typeof profile.followersCount === "number" ? (
                  <ProfileFollowButton
                    profileId={profile.id}
                    initialFollowing={Boolean(profile.isFollowing)}
                    initialFollowers={profile.followersCount}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <PosterStrip
            entries={favoriteGames.length ? favoriteGames : entries}
          />
        </div>
      </section>

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

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border bg-panel p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-cyan-200">Shelves</p>
              <h2 className="text-2xl font-bold">Library at a glance</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {shelves.map((shelf) => (
              <section key={shelf.label} className="min-w-0">
                <h3 className="font-bold">{shelf.label}</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {shelf.description}
                </p>
                {shelf.entries.length ? (
                  <div className="mt-3 flex gap-2 overflow-hidden">
                    {shelf.entries.map((entry) => (
                      <Link
                        key={entry.game.slug}
                        href={`/games/${entry.game.slug}`}
                        className="w-16 shrink-0 rounded-sm focus-visible:outline-2"
                        title={entry.game.title}
                      >
                        <GameArtwork
                          src={entry.game.coverImageUrl}
                          alt={`${entry.game.title} cover`}
                          className="aspect-[2/3] w-full rounded-sm"
                        />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-md border border-zinc-800 bg-zinc-950/50 p-3 text-sm text-zinc-400">
                    Nothing here yet.
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-panel p-5">
          <p className="text-sm font-medium text-cyan-200">Taste breakdown</p>
          <h2 className="text-2xl font-bold">Detailed ratings</h2>
          {categoryAverages.length ? (
            <div className="mt-5">
              <BarList
                items={categoryAverages}
                label={`${profile.displayName} category rating averages`}
                maxValue={10}
              />
            </div>
          ) : (
            <p className="mt-5 text-sm text-zinc-400">
              Category ratings will appear here after rating story, gameplay,
              visuals, soundtrack, or difficulty.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border bg-panel p-5">
          <h2 className="text-2xl font-bold">Favorite games</h2>
          {favoriteGames.length ? (
            <div className="mt-5 grid grid-cols-5 gap-2">
              {favoriteGames.map((entry) => (
                <Link
                  key={entry.game.slug}
                  href={`/games/${entry.game.slug}`}
                  className="rounded-sm focus-visible:outline-2"
                  title={entry.game.title}
                >
                  <GameArtwork
                    src={entry.game.coverImageUrl}
                    alt={`${entry.game.title} cover`}
                    className="aspect-[2/3] w-full rounded-sm"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-zinc-400">
              Favorite games will appear as a poster row here.
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-panel p-5">
          <h2 className="text-2xl font-bold">Recent reviews</h2>
          {recentReviews.length ? (
            <ul className="mt-4 space-y-4">
              {recentReviews.map((entry) => (
                <li
                  key={entry.game.slug}
                  className="border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex gap-3">
                    <Link
                      href={`/games/${entry.game.slug}`}
                      className="shrink-0 rounded-sm focus-visible:outline-2"
                    >
                      <GameArtwork
                        src={entry.game.coverImageUrl}
                        alt={`${entry.game.title} cover`}
                        className="h-24 w-16 rounded-sm"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/games/${entry.game.slug}`}
                        className="font-bold hover:text-cyan-200 focus-visible:outline-2"
                      >
                        {entry.game.title}
                      </Link>
                      {entry.rating ? (
                        <RatingDetails
                          rating={entry.rating}
                          compact
                          className="mt-2"
                        />
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-zinc-400">
              Reviews will appear here after games are rated.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium text-cyan-200">Library</p>
            <h2 className="text-3xl font-black">
              {PROFILE_LIBRARY_LABELS[query.view]} games
            </h2>
            <p className="mt-2 text-zinc-400">
              Browse this profile by status, rating, title, genre, platform, or
              review text.
            </p>
          </div>
          <p className="text-sm text-zinc-500">
            {libraryEntries.length} of {entries.length} visible games
          </p>
        </div>

        <nav
          className="flex gap-2 overflow-x-auto pb-1"
          aria-label={`${profile.displayName} library filters`}
        >
          {tabs.map((tab) => (
            <Link
              key={tab.view}
              href={profileLibraryHref(basePath, query, { view: tab.view })}
              className={cn(
                "shrink-0 rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline-2",
                tab.view === query.view
                  ? "border-cyan-300 bg-cyan-300 text-zinc-950"
                  : "bg-panel text-zinc-300 hover:border-cyan-300",
              )}
            >
              {tab.label}{" "}
              <span className="ml-1 text-xs opacity-80">{tab.count}</span>
            </Link>
          ))}
        </nav>

        <form
          action={basePath}
          className="grid gap-3 rounded-lg border bg-panel p-4 md:grid-cols-[1fr_220px_auto]"
        >
          <input type="hidden" name="view" value={query.view} />
          <label className="space-y-2">
            <span className="text-sm font-semibold text-zinc-200">
              Search this library
            </span>
            <span className="relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                aria-hidden
              />
              <input
                name="q"
                defaultValue={query.q}
                placeholder="Title, genre, platform, review..."
                className="h-11 w-full rounded-md border bg-zinc-950 pl-9 pr-3 text-sm outline-none focus:border-cyan-300"
              />
            </span>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-zinc-200">Sort</span>
            <select
              name="sort"
              defaultValue={query.sort}
              className="h-11 w-full rounded-md border bg-zinc-950 px-3 text-sm outline-none focus:border-cyan-300"
            >
              {PROFILE_LIBRARY_SORTS.map((sort) => (
                <option key={sort} value={sort}>
                  {PROFILE_LIBRARY_SORT_LABELS[sort]}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" className="self-end">
            Apply
          </Button>
        </form>

        {libraryEntries.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {libraryEntries.map((entry, index) => (
              <ProfileLibraryCard
                key={entry.game.slug}
                entry={entry}
                priority={index < 3}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={LibraryBig}
            title="No games match this view."
            description="Try another status, clear the search text, or change the sort."
            actionHref={profileLibraryHref(basePath, query, {
              view: "all",
              q: "",
              sort: "recent",
            })}
            actionLabel="Reset library view"
          />
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
        className="h-28 w-28 rounded-lg border object-cover"
      />
    );
  }

  return (
    <span className="inline-flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border bg-zinc-950 text-zinc-400">
      <UserRound className="h-12 w-12" aria-hidden />
    </span>
  );
}

function PosterStrip({ entries }: { entries: LibraryEntry[] }) {
  const posters = entries.slice(0, 5);

  if (!posters.length) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 text-sm text-zinc-500">
        Posters appear here as the library grows.
      </div>
    );
  }

  return (
    <div className="relative min-h-52">
      <div className="absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_50%_50%,rgba(103,232,249,0.16),transparent_58%)]" />
      <div className="relative flex h-full items-center justify-center">
        {posters.map((entry, index) => (
          <Link
            key={entry.game.slug}
            href={`/games/${entry.game.slug}`}
            className={cn(
              "absolute w-28 rounded-sm border bg-zinc-950 shadow-[0_18px_48px_rgba(0,0,0,0.45)] transition hover:-translate-y-2 hover:z-20 focus-visible:outline-2",
              index === 0 && "-translate-x-28 -rotate-6",
              index === 1 && "-translate-x-14 rotate-3",
              index === 2 && "z-10 scale-110",
              index === 3 && "translate-x-14 -rotate-3",
              index === 4 && "translate-x-28 rotate-6",
            )}
            title={entry.game.title}
          >
            <GameArtwork
              src={entry.game.coverImageUrl}
              alt={`${entry.game.title} cover`}
              className="aspect-[2/3] w-full rounded-sm"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

function ProfileLibraryCard({
  entry,
  priority,
}: {
  entry: LibraryEntry;
  priority: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-lg border bg-panel transition hover:-translate-y-1 hover:border-cyan-300/70 motion-reduce:hover:translate-y-0">
      <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 p-3">
        <Link
          href={`/games/${entry.game.slug}`}
          className="rounded-sm focus-visible:outline-2"
        >
          <GameArtwork
            src={entry.game.coverImageUrl}
            alt={`${entry.game.title} cover`}
            priority={priority}
            className="aspect-[2/3] w-full rounded-sm"
          />
        </Link>
        <div className="min-w-0 space-y-3">
          <div>
            <Link
              href={`/games/${entry.game.slug}`}
              className="line-clamp-2 text-lg font-bold hover:text-cyan-200 focus-visible:outline-2"
            >
              {entry.game.title}
            </Link>
            <p className="mt-1 text-sm text-zinc-500">
              {getReleaseYear(entry.game.releaseDate)} ·{" "}
              {entry.userGame.status.replaceAll("_", " ")}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entry.game.genres.slice(0, 2).map((genre) => (
              <Badge key={genre} className="px-1.5 py-0.5 text-[11px]">
                {genre}
              </Badge>
            ))}
            {entry.userGame.isFavorite ? (
              <Badge className="border-lime-300/30 bg-lime-300/10 px-1.5 py-0.5 text-[11px] text-lime-100">
                Favorite
              </Badge>
            ) : null}
          </div>
          {entry.rating ? (
            <RatingDetails rating={entry.rating} compact />
          ) : (
            <p className="text-sm text-zinc-400">Not rated yet.</p>
          )}
        </div>
      </div>
    </article>
  );
}

function profileLibraryHref(
  basePath: string,
  current: ProfileLibraryQuery,
  overrides: Partial<ProfileLibraryQuery>,
) {
  const next: ProfileLibraryQuery = { ...current, ...overrides };
  const params = new URLSearchParams();
  appendQueryValue(params, "view", next.view, "all");
  appendQueryValue(params, "q", next.q, "");
  appendQueryValue(params, "sort", next.sort, "recent");
  const queryString = params.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
}

function appendQueryValue(
  params: URLSearchParams,
  key: string,
  value: ProfileLibraryView | ProfileLibrarySort | string,
  defaultValue: string,
) {
  if (value !== defaultValue) {
    params.set(key, value);
  }
}
