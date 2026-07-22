export interface GameSearchOptions {
  genres?: string[];
  platforms?: string[];
  releaseYear?: number;
  page?: number;
  pageSize?: number;
  ordering?: "relevance" | "release-date" | "external-rating";
}

export interface PopularGamesOptions {
  page?: number;
  pageSize?: number;
  genres?: string[];
  platforms?: string[];
}

export interface GameSearchResult {
  games: GameSummary[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage?: boolean;
  queryUsed?: string;
  attribution?: string;
}

export interface GameSummary {
  id: string;
  provider: "seed" | "igdb";
  providerGameId: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl?: string | null;
  backgroundImageUrl?: string | null;
  releaseDate?: string | null;
  genres: string[];
  platforms: string[];
  developer?: string | null;
  publisher?: string | null;
  externalRating?: number | null;
  estimatedPlaytime?: number | null;
  screenshots: string[];
  metadata: Record<string, string | number | boolean | string[] | null>;
}

export type GameDetails = GameSummary;

export interface GameProvider {
  searchGames(
    query: string,
    options?: GameSearchOptions,
  ): Promise<GameSearchResult>;
  getGameBySlug(slug: string): Promise<GameDetails | null>;
  getPopularGames(options?: PopularGamesOptions): Promise<GameSummary[]>;
  getSimilarGames(gameId: string): Promise<GameSummary[]>;
}
