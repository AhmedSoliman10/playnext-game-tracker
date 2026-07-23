import type { LibraryEntry, LibraryFilter } from "@/lib/types";

export function filterLibraryEntries(
  entries: LibraryEntry[],
  filter: LibraryFilter,
) {
  if (filter === "favorites") {
    return entries.filter(
      (entry) =>
        entry.userGame.isFavorite && entry.userGame.status !== "not_interested",
    );
  }

  if (filter === "unrated") {
    return entries.filter(
      (entry) => entry.userGame.status === "played" && !entry.rating,
    );
  }

  if (filter === "all") {
    return entries.filter(
      (entry) => entry.userGame.status !== "not_interested",
    );
  }

  if (filter === "hidden") {
    return entries.filter(
      (entry) => entry.userGame.status === "not_interested",
    );
  }

  return entries.filter((entry) => entry.userGame.status === filter);
}
