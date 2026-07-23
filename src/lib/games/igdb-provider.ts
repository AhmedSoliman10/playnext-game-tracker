import { z } from "zod";
import type {
  GameDetails,
  GameProvider,
  GameSearchOptions,
  GameSearchResult,
  GameSummary,
  PopularGamesOptions,
} from "@/lib/games/types";
import { slugify } from "@/lib/utils";

const igdbNamedEntitySchema = z.object({
  name: z.string(),
});

const igdbImageSchema = z.object({
  image_id: z.string().optional(),
  url: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const igdbInvolvedCompanySchema = z.object({
  developer: z.boolean().optional().default(false),
  publisher: z.boolean().optional().default(false),
  company: igdbNamedEntitySchema.optional(),
});

const igdbGameCoreSchema = z.object({
  id: z.number().int(),
  slug: z.string().optional(),
  name: z.string(),
  summary: z.string().nullable().optional(),
  storyline: z.string().nullable().optional(),
  cover: igdbImageSchema.nullable().optional(),
  first_release_date: z.number().int().nullable().optional(),
  game_type: z.number().int().nullable().optional(),
  genres: z.array(igdbNamedEntitySchema).optional().default([]),
  platforms: z.array(igdbNamedEntitySchema).optional().default([]),
  themes: z.array(igdbNamedEntitySchema).optional().default([]),
  keywords: z.array(igdbNamedEntitySchema).optional().default([]),
  game_modes: z.array(igdbNamedEntitySchema).optional().default([]),
  involved_companies: z.array(igdbInvolvedCompanySchema).optional().default([]),
  total_rating: z.number().nullable().optional(),
  aggregated_rating: z.number().nullable().optional(),
  rating: z.number().nullable().optional(),
  total_rating_count: z.number().nullable().optional(),
  screenshots: z.array(igdbImageSchema).optional().default([]),
  artworks: z.array(igdbImageSchema).optional().default([]),
});

export const igdbGameSchema = igdbGameCoreSchema.extend({
  similar_games: z.array(igdbGameCoreSchema).optional().default([]),
});

const igdbGamesResponseSchema = z.array(igdbGameSchema);

const igdbPopularityPrimitiveSchema = z.object({
  game_id: z.number().int(),
  popularity_type: z.number().int(),
  value: z.coerce.number(),
});

const igdbPopularityPrimitivesResponseSchema = z.array(
  igdbPopularityPrimitiveSchema,
);

const twitchTokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
});

type IgdbGame = z.infer<typeof igdbGameSchema>;
type IgdbPopularityPrimitive = z.infer<typeof igdbPopularityPrimitiveSchema>;

type IgdbImageSize =
  "cover_big_2x" | "screenshot_big" | "screenshot_huge" | "1080p";

type CacheValue = {
  expiresAt: number;
  value: unknown;
};

const GAME_FIELDS = [
  "id",
  "slug",
  "name",
  "summary",
  "storyline",
  "cover.image_id",
  "first_release_date",
  "game_type",
  "genres.name",
  "platforms.name",
  "themes.name",
  "keywords.name",
  "game_modes.name",
  "involved_companies.developer",
  "involved_companies.publisher",
  "involved_companies.company.name",
  "total_rating",
  "aggregated_rating",
  "rating",
  "total_rating_count",
  "screenshots.image_id",
  "screenshots.width",
  "screenshots.height",
  "artworks.image_id",
  "artworks.width",
  "artworks.height",
].join(",");

const SIMILAR_GAME_FIELDS = [
  ...GAME_FIELDS.split(","),
  ...GAME_FIELDS.split(",").map((field) => `similar_games.${field}`),
].join(",");

const REQUEST_TIMEOUT_MS = 7000;
const CACHE_TTL_MS = 1000 * 60 * 20;
const cache = new Map<string, CacheValue>();
let tokenCache: { accessToken: string; expiresAt: number } | null = null;

const commonSearchCorrections: Record<string, string> = {
  dinner: "diner",
};

const genreIdsByFilter: Record<string, number[]> = {
  "Action RPG": [12, 25],
  Adventure: [31],
  "Card Game": [35],
  Indie: [32],
  JRPG: [12],
  Platformer: [8],
  Puzzle: [9],
  Racing: [10],
  RPG: [12],
  Shooter: [5],
  Simulation: [13],
  Sports: [14],
  Strategy: [11, 15, 16, 24],
  Tactics: [16, 24],
};

const themeIdsByFilter: Record<string, number[]> = {
  "4X": [41],
  Action: [1],
  Comedy: [27],
  Creative: [33],
  Horror: [19],
  Narrative: [31],
  "Open World": [38],
  Sandbox: [33],
  "Sci-Fi": [18],
  Survival: [21],
};

const gameModeIdsByFilter: Record<string, number[]> = {
  "Battle Royale": [6],
  Multiplayer: [2, 3],
};

const keywordIdsByFilter: Record<string, number[]> = {
  Casual: [101],
  Competitive: [286],
  Creative: [531],
  Exploration: [72],
  JRPG: [521],
  Metroidvania: [477],
  Roguelike: [416, 17292],
};

const platformIdsByFilter: Record<string, number[]> = {
  Mobile: [34, 39],
  "Nintendo Switch": [130, 508],
  PC: [6],
  PlayStation: [7, 8, 9, 48, 167],
  Xbox: [11, 12, 49, 169],
};

const preferredHeroArtworkIdsBySlug: Record<string, string[]> = {
  "red-dead-redemption-2": ["ar3qmt"],
};

const trendingPopularityTypes = [5, 3, 2, 1, 4] as const;
const trendingPopularityWeights: Record<number, number> = {
  5: 1.35, // Steam 24hr peak players
  3: 1.2, // IGDB Playing
  2: 0.95, // IGDB Want to Play
  1: 0.8, // IGDB Visits
  4: 0.45, // IGDB Played
};

function cacheKey(endpoint: string, body: string) {
  return `${endpoint}:${body}`;
}

export function igdbImageUrl(
  imageId: string | null | undefined,
  size: IgdbImageSize,
) {
  return imageId
    ? `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`
    : null;
}

function dateFromUnixSeconds(value: number | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value * 1000).toISOString().slice(0, 10);
}

function normalizeRating(game: IgdbGame) {
  const score = game.total_rating ?? game.aggregated_rating ?? game.rating;
  return typeof score === "number" ? Math.round(score) / 10 : null;
}

function firstCompany(
  companies: IgdbGame["involved_companies"],
  role: "developer" | "publisher",
) {
  return (
    companies.find((company) => company[role] && company.company?.name)?.company
      ?.name ?? null
  );
}

function preferredArtworkImageId(game: IgdbGame, slug: string) {
  const preferredIds = preferredHeroArtworkIdsBySlug[slug] ?? [];
  const preferredArtwork = game.artworks.find(
    (artwork) =>
      artwork.image_id !== undefined && preferredIds.includes(artwork.image_id),
  );

  if (preferredArtwork?.image_id) {
    return preferredArtwork.image_id;
  }

  const landscapeArtwork = game.artworks.find(
    (artwork) =>
      artwork.image_id &&
      artwork.width !== undefined &&
      artwork.height !== undefined &&
      artwork.width / artwork.height >= 1.6,
  );

  return landscapeArtwork?.image_id ?? game.artworks[0]?.image_id;
}

function sanitizeSearchText(query: string) {
  return query
    .replace(/[;"\\]/g, " ")
    .trim()
    .slice(0, 120);
}

export function getIgdbSearchQueries(query: string) {
  const sanitized = sanitizeSearchText(query);
  if (!sanitized) {
    return [""];
  }

  const lowerCaseWords = sanitized.toLowerCase().split(/\s+/);
  const correctedWords = lowerCaseWords.map(
    (word) => commonSearchCorrections[word] ?? word,
  );
  const collapsedWords = lowerCaseWords.map((word) =>
    word.replace(/([a-z])\1+/g, "$1"),
  );

  return Array.from(
    new Set([sanitized, correctedWords.join(" "), collapsedWords.join(" ")]),
  ).filter(Boolean);
}

function shouldUseNameContainsSearch(query: string) {
  const normalized = query.trim();
  return normalized.length > 0 && normalized.length <= 3;
}

function matchesClientFilters(
  game: GameSummary,
  options?: GameSearchOptions | PopularGamesOptions,
) {
  if (!options) {
    return true;
  }

  const genreMatch =
    !options.genres?.length ||
    options.genres.some((genre) =>
      gameFilterTerms(game).some((candidate) => textMatches(candidate, genre)),
    );

  const platformMatch =
    !options.platforms?.length ||
    options.platforms.some((platform) =>
      game.platforms.some((candidate) => textMatches(candidate, platform)),
    );

  return genreMatch && platformMatch;
}

function gameFilterTerms(game: GameSummary) {
  return [
    ...game.genres,
    ...metadataStringArray(game.metadata.igdbThemes),
    ...metadataStringArray(game.metadata.igdbKeywords),
    ...metadataStringArray(game.metadata.igdbGameModes),
  ];
}

function metadataStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function textMatches(candidate: string, requested: string) {
  const normalizedCandidate = candidate.toLowerCase();
  const normalizedRequested = requested.toLowerCase();
  return (
    normalizedCandidate === normalizedRequested ||
    normalizedCandidate.includes(normalizedRequested) ||
    normalizedRequested.includes(normalizedCandidate)
  );
}

export function normalizeIgdbGame(game: IgdbGame): GameSummary {
  const slug = game.slug ?? `${slugify(game.name)}-${game.id}`;
  const coverUrl = igdbImageUrl(game.cover?.image_id, "cover_big_2x");
  const artworkUrl = igdbImageUrl(preferredArtworkImageId(game, slug), "1080p");
  const screenshotUrls = game.screenshots
    .map((screenshot) => igdbImageUrl(screenshot.image_id, "screenshot_big"))
    .filter((url): url is string => Boolean(url));
  const backgroundUrl =
    artworkUrl ??
    igdbImageUrl(game.screenshots[0]?.image_id, "screenshot_huge") ??
    coverUrl;

  return {
    id: String(game.id),
    provider: "igdb",
    providerGameId: String(game.id),
    slug,
    title: game.name,
    description:
      game.summary?.trim() ||
      game.storyline?.trim() ||
      "No description is available yet, but PlayNext can still track your status and rating.",
    coverImageUrl: coverUrl,
    backgroundImageUrl: backgroundUrl,
    releaseDate: dateFromUnixSeconds(game.first_release_date),
    genres: game.genres.map((genre) => genre.name),
    platforms: game.platforms.map((platform) => platform.name),
    developer: firstCompany(game.involved_companies, "developer"),
    publisher: firstCompany(game.involved_companies, "publisher"),
    externalRating: normalizeRating(game),
    estimatedPlaytime: null,
    screenshots: screenshotUrls,
    metadata: {
      igdbId: game.id,
      igdbSlug: slug,
      igdbRatingCount: game.total_rating_count ?? null,
      igdbThemes: game.themes.map((theme) => theme.name),
      igdbKeywords: game.keywords.map((keyword) => keyword.name),
      igdbGameModes: game.game_modes.map((mode) => mode.name),
    },
  };
}

export function rankPopularityPrimitiveGameIds(
  primitives: IgdbPopularityPrimitive[],
  limit: number,
) {
  const maxValueByType = new Map<number, number>();
  for (const primitive of primitives) {
    maxValueByType.set(
      primitive.popularity_type,
      Math.max(
        maxValueByType.get(primitive.popularity_type) ?? 0,
        primitive.value,
      ),
    );
  }

  const scoreByGameId = new Map<number, number>();
  for (const primitive of primitives) {
    const maxValue = maxValueByType.get(primitive.popularity_type) ?? 0;
    if (maxValue <= 0) {
      continue;
    }

    const weight = trendingPopularityWeights[primitive.popularity_type] ?? 0;
    const normalizedValue = primitive.value / maxValue;
    scoreByGameId.set(
      primitive.game_id,
      (scoreByGameId.get(primitive.game_id) ?? 0) + normalizedValue * weight,
    );
  }

  return Array.from(scoreByGameId.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([gameId]) => gameId);
}

export class IgdbGameProvider implements GameProvider {
  private readonly baseUrl = "https://api.igdb.com/v4";

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  async searchGames(
    query: string,
    options?: GameSearchOptions,
  ): Promise<GameSearchResult> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 25;
    const limit = Math.min(pageSize + 1, 50);
    const offset = (page - 1) * pageSize;
    const searchQueries = getIgdbSearchQueries(query);

    for (const searchQuery of searchQueries) {
      const body = this.buildGamesQuery({
        query: searchQuery,
        options,
        limit,
        offset,
        useNameContainsSearch: shouldUseNameContainsSearch(searchQuery),
      });
      const games = await this.getValidatedGames(body);
      const rawHasNextPage = games.length > pageSize;
      const rankedGames = dedupeExactTitles(
        games
          .map(normalizeIgdbGame)
          .filter((game) => matchesClientFilters(game, options))
          .sort(
            (a, b) =>
              searchQualityScore(b, searchQuery) -
              searchQualityScore(a, searchQuery),
          ),
        searchQuery,
      );

      if (rankedGames.length > 0 || searchQuery === searchQueries.at(-1)) {
        const hasNextPage = rawHasNextPage || rankedGames.length > pageSize;
        const pageGames = rankedGames.slice(0, pageSize);

        return {
          games: pageGames,
          total: offset + pageGames.length + (hasNextPage ? 1 : 0),
          page,
          pageSize,
          hasNextPage,
          queryUsed:
            searchQuery !== sanitizeSearchText(query) ? searchQuery : undefined,
          attribution: "Game metadata and artwork powered by IGDB.",
        };
      }
    }

    return {
      games: [],
      total: 0,
      page,
      pageSize,
      hasNextPage: false,
      attribution: "Game metadata and artwork powered by IGDB.",
    };
  }

  async getGameBySlug(slug: string): Promise<GameDetails | null> {
    const body = [
      `fields ${GAME_FIELDS};`,
      `where slug = "${sanitizeSearchText(slug)}";`,
      "limit 1;",
    ].join("\n");
    const games = await this.getValidatedGames(body);
    return games[0] ? normalizeIgdbGame(games[0]) : null;
  }

  async getPopularGames(options?: PopularGamesOptions): Promise<GameSummary[]> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 30;

    try {
      const trendingGames = await this.getTrendingPopularGames(
        options,
        page,
        pageSize,
      );
      if (trendingGames.length) {
        return trendingGames;
      }
    } catch {
      // Fall back to the stable games endpoint when PopScore is unavailable.
    }

    const body = this.buildGamesQuery({
      query: "",
      options,
      limit: Math.min(pageSize + 10, 100),
      offset: (page - 1) * pageSize,
      popular: true,
    });
    return (await this.getValidatedGames(body))
      .map(normalizeIgdbGame)
      .filter((game) => matchesClientFilters(game, options))
      .slice(0, pageSize);
  }

  async getSimilarGames(gameId: string): Promise<GameSummary[]> {
    const id = Number(gameId);
    if (!Number.isInteger(id) || id <= 0) {
      return [];
    }

    const body = [
      `fields ${SIMILAR_GAME_FIELDS};`,
      `where id = ${id};`,
      "limit 1;",
    ].join("\n");
    const games = await this.getValidatedGames(body);
    return (games[0]?.similar_games ?? [])
      .map((game) => normalizeIgdbGame({ ...game, similar_games: [] }))
      .slice(0, 8);
  }

  private async getAccessToken() {
    if (tokenCache && tokenCache.expiresAt > Date.now()) {
      return tokenCache.accessToken;
    }

    const response = await this.fetchWithTimeout(
      "https://id.twitch.tv/oauth2/token",
      {
        method: "POST",
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: "client_credentials",
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        "IGDB authentication failed. Check Twitch client credentials.",
      );
    }

    const parsed = twitchTokenSchema.parse(await response.json());
    tokenCache = {
      accessToken: parsed.access_token,
      expiresAt: Date.now() + Math.max(parsed.expires_in - 60, 60) * 1000,
    };
    return tokenCache.accessToken;
  }

  private async request(
    endpoint: string,
    body: string,
    retried = false,
  ): Promise<unknown> {
    const key = cacheKey(endpoint, body);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const accessToken = await this.getAccessToken();
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/${endpoint}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Client-ID": this.clientId,
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      },
    );

    if (response.status === 401 && !retried) {
      tokenCache = null;
      return this.request(endpoint, body, true);
    }

    if (!response.ok) {
      throw new Error(`IGDB request failed with ${response.status}.`);
    }

    const json = (await response.json()) as unknown;
    cache.set(key, { value: json, expiresAt: Date.now() + CACHE_TTL_MS });
    return json;
  }

  private async getValidatedGames(body: string) {
    const json = await this.request("games", body);
    return igdbGamesResponseSchema.parse(json);
  }

  private async getValidatedPopularityPrimitives(body: string) {
    const json = await this.request("popularity_primitives", body);
    return igdbPopularityPrimitivesResponseSchema.parse(json);
  }

  private async getTrendingPopularGames(
    options: PopularGamesOptions | undefined,
    page: number,
    pageSize: number,
  ) {
    const offset = (page - 1) * pageSize;
    const requestedCount = Math.min(Math.max(page * pageSize + 48, 80), 180);
    const perTypeLimit = Math.min(Math.max(requestedCount, 80), 200);
    const primitiveGroups = await Promise.all(
      trendingPopularityTypes.map((type) =>
        this.getValidatedPopularityPrimitives(
          [
            "fields game_id,popularity_type,value;",
            `where popularity_type = ${type} & game_id != null;`,
            "sort value desc;",
            `limit ${perTypeLimit};`,
          ].join("\n"),
        ),
      ),
    );
    const rankedIds = rankPopularityPrimitiveGameIds(
      primitiveGroups.flat(),
      requestedCount,
    );
    if (!rankedIds.length) {
      return [];
    }

    const body = [
      `fields ${GAME_FIELDS};`,
      `where id = (${rankedIds.join(",")}) & cover != null & version_parent = null & game_type = 0;`,
      `limit ${rankedIds.length};`,
    ].join("\n");
    const gamesById = new Map(
      (await this.getValidatedGames(body)).map((game) => [game.id, game]),
    );

    return rankedIds
      .map((gameId) => gamesById.get(gameId))
      .filter((game): game is IgdbGame => Boolean(game))
      .map(normalizeIgdbGame)
      .filter((game) => matchesClientFilters(game, options))
      .slice(offset, offset + pageSize);
  }

  private async fetchWithTimeout(url: string, init: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildGamesQuery({
    query,
    options,
    limit,
    offset,
    popular = false,
    useNameContainsSearch = false,
  }: {
    query: string;
    options?: GameSearchOptions | PopularGamesOptions;
    limit: number;
    offset: number;
    popular?: boolean;
    useNameContainsSearch?: boolean;
  }) {
    const normalizedQuery = sanitizeSearchText(query);
    const whereParts = [
      "cover != null",
      "version_parent = null",
      "game_type = 0",
    ];
    const ordering = isSearchOptions(options) ? options.ordering : undefined;
    const genreFilter = buildFieldFilter([
      { field: "genres", ids: idsFor(options?.genres, genreIdsByFilter) },
      { field: "themes", ids: idsFor(options?.genres, themeIdsByFilter) },
      {
        field: "game_modes",
        ids: idsFor(options?.genres, gameModeIdsByFilter),
      },
      { field: "keywords", ids: idsFor(options?.genres, keywordIdsByFilter) },
    ]);
    const platformIds = idsFor(options?.platforms, platformIdsByFilter);

    if (genreFilter) {
      whereParts.push(genreFilter);
    }

    if (platformIds.length) {
      whereParts.push(`platforms = (${platformIds.join(",")})`);
    }

    if (normalizedQuery && useNameContainsSearch) {
      whereParts.push(`name ~ *"${normalizedQuery}"*`);
    }

    if (isSearchOptions(options) && options.releaseYear) {
      const start = Math.floor(
        Date.UTC(options.releaseYear, 0, 1, 0, 0, 0) / 1000,
      );
      const end = Math.floor(
        Date.UTC(options.releaseYear, 11, 31, 23, 59, 59) / 1000,
      );
      whereParts.push(`first_release_date >= ${start}`);
      whereParts.push(`first_release_date <= ${end}`);
    }

    const sort =
      ordering === "release-date"
        ? "first_release_date desc"
        : ordering === "external-rating"
          ? "total_rating desc"
          : popular || !normalizedQuery || useNameContainsSearch
            ? "total_rating_count desc"
            : null;

    if (sort === "total_rating desc") {
      whereParts.push("total_rating != null");
    }

    if (sort === "total_rating_count desc") {
      whereParts.push("total_rating_count != null");
    }

    return [
      normalizedQuery && !useNameContainsSearch
        ? `search "${normalizedQuery}";`
        : null,
      `fields ${GAME_FIELDS};`,
      `where ${whereParts.join(" & ")};`,
      sort ? `sort ${sort};` : null,
      `limit ${limit};`,
      `offset ${offset};`,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n");
  }
}

function idsFor(filters: string[] | undefined, map: Record<string, number[]>) {
  return Array.from(
    new Set((filters ?? []).flatMap((filter) => map[filter] ?? [])),
  );
}

function buildFieldFilter(filters: Array<{ field: string; ids: number[] }>) {
  const parts = filters
    .filter((filter) => filter.ids.length > 0)
    .map((filter) => `${filter.field} = (${filter.ids.join(",")})`);

  return parts.length ? `(${parts.join(" | ")})` : null;
}

function searchQualityScore(game: GameSummary, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return 0;
  }

  const title = game.title.toLowerCase();
  const ratingCount =
    typeof game.metadata.igdbRatingCount === "number"
      ? game.metadata.igdbRatingCount
      : 0;
  const isShortQuery = normalizedQuery.length <= 3;
  const popularity = Math.log10(ratingCount + 1);
  const weightedPopularity = popularity * (isShortQuery ? 8 : 1);
  const rating = game.externalRating ?? 0;

  if (title === normalizedQuery) {
    return (isShortQuery ? 8 : 100) + weightedPopularity + rating;
  }

  if (title.startsWith(normalizedQuery)) {
    return (isShortQuery ? 5 : 60) + weightedPopularity + rating;
  }

  if (title.includes(normalizedQuery)) {
    return (isShortQuery ? 5 : 35) + weightedPopularity + rating;
  }

  return weightedPopularity + rating;
}

function dedupeExactTitles(games: GameSummary[], query: string) {
  if (!query.trim()) {
    return games;
  }

  const byTitle = new Map<string, GameSummary>();

  for (const game of games) {
    const titleKey = game.title.trim().toLowerCase();
    const existing = byTitle.get(titleKey);
    if (
      !existing ||
      searchQualityScore(game, query) > searchQualityScore(existing, query)
    ) {
      byTitle.set(titleKey, game);
    }
  }

  return Array.from(byTitle.values()).sort(
    (a, b) => searchQualityScore(b, query) - searchQualityScore(a, query),
  );
}

function isSearchOptions(
  options?: GameSearchOptions | PopularGamesOptions,
): options is GameSearchOptions {
  return Boolean(
    options && ("releaseYear" in options || "ordering" in options),
  );
}
