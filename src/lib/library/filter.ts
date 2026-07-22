import type { LibraryEntry, LibraryFilter } from "@/lib/types";

export function filterLibraryEntries(
  entries: LibraryEntry[],
  filter: LibraryFilter,
) {
  if (filter === "favorites") {
    return entries.filter((entry) => entry.userGame.isFavorite);
  }

  if (filter === "unrated") {
    return entries.filter(
      (entry) => entry.userGame.status === "played" && !entry.rating,
    );
  }

  if (filter === "all") {
    return entries;
  }

  return entries.filter((entry) => entry.userGame.status === filter);
}
