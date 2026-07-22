import type {
  GameDetails,
  GameProvider,
  GameSearchOptions,
  GameSearchResult,
  GameSummary,
  PopularGamesOptions,
} from "@/lib/games/types";
import { seedGames } from "@/lib/games/seed-data";

function matchesFilters(
  game: GameSummary,
  options?: GameSearchOptions | PopularGamesOptions,
) {
  if (!options) {
    return true;
  }

  const genreMatch =
    !options.genres?.length ||
    options.genres.some((genre) =>
      game.genres.some(
        (candidate) => candidate.toLowerCase() === genre.toLowerCase(),
      ),
    );

  const platformMatch =
    !options.platforms?.length ||
    options.platforms.some((platform) =>
      game.platforms.some(
        (candidate) => candidate.toLowerCase() === platform.toLowerCase(),
      ),
    );

  const requestedReleaseYear = isSearchOptions(options)
    ? options.releaseYear
    : undefined;
  const releaseYear = requestedReleaseYear
    ? new Date(game.releaseDate ?? "").getFullYear()
    : null;

  return (
    genreMatch &&
    platformMatch &&
    (!releaseYear || releaseYear === requestedReleaseYear)
  );
}

function isSearchOptions(
  options?: GameSearchOptions | PopularGamesOptions,
): options is GameSearchOptions {
  return Boolean(options && "releaseYear" in options);
}

function sortGames(
  games: GameSummary[],
  ordering?: GameSearchOptions["ordering"],
) {
  const sorted = [...games];

  if (ordering === "release-date") {
    return sorted.sort(
      (a, b) =>
        new Date(b.releaseDate ?? "1900-01-01").getTime() -
        new Date(a.releaseDate ?? "1900-01-01").getTime(),
    );
  }

  if (ordering === "external-rating") {
    return sorted.sort(
      (a, b) => (b.externalRating ?? 0) - (a.externalRating ?? 0),
    );
  }

  return sorted.sort(
    (a, b) => (b.externalRating ?? 0) - (a.externalRating ?? 0),
  );
}

function paginate(games: GameSummary[], page = 1, pageSize = 25) {
  const start = (page - 1) * pageSize;
  return games.slice(start, start + pageSize);
}

export class SeedGameProvider implements GameProvider {
  async searchGames(
    query: string,
    options?: GameSearchOptions,
  ): Promise<GameSearchResult> {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = seedGames.filter((game) => {
      const queryMatch =
        normalizedQuery.length === 0 ||
        game.title.toLowerCase().includes(normalizedQuery) ||
        game.genres.some((genre) =>
          genre.toLowerCase().includes(normalizedQuery),
        ) ||
        game.platforms.some((platform) =>
          platform.toLowerCase().includes(normalizedQuery),
        );

      return queryMatch && matchesFilters(game, options);
    });

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 25;
    const games = paginate(
      sortGames(filtered, options?.ordering),
      page,
      pageSize,
    );

    return {
      games,
      total: filtered.length,
      page,
      pageSize,
      hasNextPage: page * pageSize < filtered.length,
      attribution: "Seeded demo catalog maintained by PlayNext.",
    };
  }

  async getGameBySlug(slug: string): Promise<GameDetails | null> {
    return seedGames.find((game) => game.slug === slug) ?? null;
  }

  async getPopularGames(options?: PopularGamesOptions): Promise<GameSummary[]> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 30;
    return paginate(
      sortGames(seedGames.filter((game) => matchesFilters(game, options))),
      page,
      pageSize,
    );
  }

  async getSimilarGames(gameId: string): Promise<GameSummary[]> {
    const game = seedGames.find(
      (candidate) => candidate.id === gameId || candidate.slug === gameId,
    );
    if (!game) {
      return [];
    }

    return seedGames
      .filter((candidate) => candidate.id !== game.id)
      .map((candidate) => ({
        candidate,
        score:
          candidate.genres.filter((genre) => game.genres.includes(genre))
            .length *
            3 +
          candidate.platforms.filter((platform) =>
            game.platforms.includes(platform),
          ).length +
          (candidate.externalRating ?? 0) / 2,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ candidate }) => candidate);
  }
}
