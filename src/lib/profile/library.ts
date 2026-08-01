import { z } from "zod";
import type { LibraryEntry, LibraryFilter } from "@/lib/types";

export const PROFILE_LIBRARY_VIEWS = [
  "all",
  "played",
  "playing",
  "want_to_play",
  "dropped",
  "favorites",
  "unrated",
  "hidden",
] as const;

export type ProfileLibraryView = (typeof PROFILE_LIBRARY_VIEWS)[number];

export const PROFILE_LIBRARY_LABELS: Record<ProfileLibraryView, string> = {
  all: "All",
  played: "Played",
  playing: "Playing",
  want_to_play: "Backlog",
  dropped: "Dropped",
  favorites: "Favorites",
  unrated: "Unrated",
  hidden: "Hidden",
};

export const PROFILE_LIBRARY_SORTS = [
  "recent",
  "rating",
  "title",
  "release",
] as const;

export type ProfileLibrarySort = (typeof PROFILE_LIBRARY_SORTS)[number];

export const PROFILE_LIBRARY_SORT_LABELS: Record<ProfileLibrarySort, string> = {
  recent: "Recently updated",
  rating: "Highest rated",
  title: "Title",
  release: "Newest release",
};

const profileLibraryQuerySchema = z.object({
  view: z.enum(PROFILE_LIBRARY_VIEWS).catch("all"),
  q: z.string().trim().max(80).catch(""),
  sort: z.enum(PROFILE_LIBRARY_SORTS).catch("recent"),
});

export interface ProfileLibraryQuery {
  view: ProfileLibraryView;
  q: string;
  sort: ProfileLibrarySort;
}

export function parseProfileLibraryQuery(
  rawParams: Record<string, string | string[] | undefined>,
  options: { allowHidden: boolean },
): ProfileLibraryQuery {
  const normalized = Object.fromEntries(
    Object.entries(rawParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  const parsed = profileLibraryQuerySchema.parse(normalized);

  return {
    ...parsed,
    view:
      parsed.view === "hidden" && !options.allowHidden ? "all" : parsed.view,
  };
}

export function getProfileLibraryTabs(
  entries: LibraryEntry[],
  options: { includeHidden: boolean },
) {
  return PROFILE_LIBRARY_VIEWS.filter(
    (view) => view !== "hidden" || options.includeHidden,
  ).map((view) => ({
    view,
    label: PROFILE_LIBRARY_LABELS[view],
    count: filterByView(entries, view).length,
  }));
}

export function getProfileLibraryEntries(
  entries: LibraryEntry[],
  query: ProfileLibraryQuery,
  options: { includeHidden: boolean },
) {
  const visibleEntries = options.includeHidden
    ? entries
    : entries.filter((entry) => entry.userGame.status !== "not_interested");
  const filtered = filterBySearch(
    filterByView(visibleEntries, query.view),
    query.q,
  );

  return sortProfileEntries(filtered, query.sort);
}

export function getRatingCategoryAverages(entries: LibraryEntry[]) {
  const categories = [
    { key: "storyRating", label: "Story" },
    { key: "gameplayRating", label: "Gameplay" },
    { key: "visualsRating", label: "Visuals" },
    { key: "soundtrackRating", label: "Soundtrack" },
    { key: "difficultyRating", label: "Difficulty" },
  ] as const;

  return categories
    .map((category) => {
      const values = entries
        .map((entry) => entry.rating?.[category.key])
        .filter((value): value is number => typeof value === "number");

      if (!values.length) {
        return { label: category.label, value: 0 };
      }

      const average =
        values.reduce((sum, value) => sum + value, 0) / values.length;

      return {
        label: category.label,
        value: Math.round(average * 10) / 10,
      };
    })
    .filter((item) => item.value > 0);
}

function filterByView(entries: LibraryEntry[], view: ProfileLibraryView) {
  if (view === "favorites") {
    return entries.filter(
      (entry) =>
        entry.userGame.isFavorite && entry.userGame.status !== "not_interested",
    );
  }

  if (view === "unrated") {
    return entries.filter(
      (entry) => entry.userGame.status === "played" && !entry.rating,
    );
  }

  if (view === "all") {
    return entries.filter(
      (entry) => entry.userGame.status !== "not_interested",
    );
  }

  if (view === "hidden") {
    return entries.filter(
      (entry) => entry.userGame.status === "not_interested",
    );
  }

  return entries.filter(
    (entry) => entry.userGame.status === (view as LibraryFilter),
  );
}

function filterBySearch(entries: LibraryEntry[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return entries;
  }

  return entries.filter((entry) => {
    const haystack = [
      entry.game.title,
      entry.game.developer,
      entry.game.publisher,
      ...entry.game.genres,
      ...entry.game.platforms,
      entry.rating?.review,
    ]
      .filter((value): value is string => Boolean(value))
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  });
}

function sortProfileEntries(entries: LibraryEntry[], sort: ProfileLibrarySort) {
  return [...entries].sort((a, b) => {
    if (sort === "rating") {
      return (b.rating?.overallRating ?? 0) - (a.rating?.overallRating ?? 0);
    }

    if (sort === "title") {
      return a.game.title.localeCompare(b.game.title);
    }

    if (sort === "release") {
      return (
        dateValue(b.game.releaseDate) - dateValue(a.game.releaseDate) ||
        a.game.title.localeCompare(b.game.title)
      );
    }

    return (
      dateValue(b.rating?.updatedAt ?? b.userGame.updatedAt) -
        dateValue(a.rating?.updatedAt ?? a.userGame.updatedAt) ||
      a.game.title.localeCompare(b.game.title)
    );
  });
}

function dateValue(value?: string | null) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}
