import type { LibraryEntry, TasteCompatibility } from "@/lib/types";

function positiveGenres(entries: LibraryEntry[]) {
  const genres = new Set<string>();
  for (const entry of entries) {
    if ((entry.rating?.overallRating ?? 0) >= 8 || entry.userGame.isFavorite) {
      for (const genre of entry.game.genres) {
        genres.add(genre);
      }
    }
  }
  return genres;
}

function commonCount(left: Set<string>, right: Set<string>) {
  let count = 0;
  for (const value of left) {
    if (right.has(value)) {
      count += 1;
    }
  }
  return count;
}

function favoritePlatforms(entries: LibraryEntry[]) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const platform of entry.game.platforms) {
      counts.set(platform, (counts.get(platform) ?? 0) + 1);
    }
  }
  return new Set(
    Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([platform]) => platform),
  );
}

function playedSlugs(entries: LibraryEntry[]) {
  return new Set(
    entries
      .filter((entry) =>
        ["played", "playing", "want_to_play"].includes(entry.userGame.status),
      )
      .map((entry) => entry.game.slug),
  );
}

export function calculateTasteCompatibility(
  viewerEntries: LibraryEntry[],
  profileEntries: LibraryEntry[],
): TasteCompatibility | null {
  if (!viewerEntries.length || !profileEntries.length) {
    return null;
  }

  const viewerGenres = positiveGenres(viewerEntries);
  const profileGenres = positiveGenres(profileEntries);
  const viewerPlatforms = favoritePlatforms(viewerEntries);
  const profilePlatforms = favoritePlatforms(profileEntries);
  const viewerGames = playedSlugs(viewerEntries);
  const profileGames = playedSlugs(profileEntries);

  const sharedGenreCount = commonCount(viewerGenres, profileGenres);
  const sharedPlatformCount = commonCount(viewerPlatforms, profilePlatforms);
  const sharedGameCount = commonCount(viewerGames, profileGames);

  const score = Math.min(
    100,
    Math.round(
      sharedGenreCount * 14 + sharedPlatformCount * 10 + sharedGameCount * 7,
    ),
  );

  const reasons: string[] = [];
  if (sharedGenreCount) {
    reasons.push(`You share ${sharedGenreCount} highly rated genre signal.`);
  }
  if (sharedPlatformCount) {
    reasons.push(`You play on ${sharedPlatformCount} similar platform lane.`);
  }
  if (sharedGameCount) {
    reasons.push(`You overlap on ${sharedGameCount} game decision.`);
  }
  if (!reasons.length) {
    reasons.push("Your libraries are still too different to compare deeply.");
  }

  return {
    score,
    label:
      score >= 75
        ? "Excellent match"
        : score >= 45
          ? "Good match"
          : score >= 20
            ? "Light overlap"
            : "Fresh perspective",
    reasons,
  };
}
