import type { GameProvider } from "@/lib/games/types";
import { SeedGameProvider } from "@/lib/games/mock-provider";
import { IgdbGameProvider } from "@/lib/games/igdb-provider";

let provider: GameProvider | null = null;

class CascadingGameProvider implements GameProvider {
  constructor(private readonly providers: GameProvider[]) {}

  async searchGames(...args: Parameters<GameProvider["searchGames"]>) {
    return this.firstSuccessful((candidate) => candidate.searchGames(...args));
  }

  async getGameBySlug(...args: Parameters<GameProvider["getGameBySlug"]>) {
    for (const candidate of this.providers) {
      try {
        const game = await candidate.getGameBySlug(...args);
        if (game) {
          return game;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  async getPopularGames(...args: Parameters<GameProvider["getPopularGames"]>) {
    return this.firstSuccessful((candidate) =>
      candidate.getPopularGames(...args),
    );
  }

  async getSimilarGames(...args: Parameters<GameProvider["getSimilarGames"]>) {
    return this.firstSuccessful((candidate) =>
      candidate.getSimilarGames(...args),
    );
  }

  private async firstSuccessful<T>(
    operation: (candidate: GameProvider) => Promise<T>,
  ) {
    let lastError: unknown = null;

    for (const candidate of this.providers) {
      try {
        return await operation(candidate);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("No game provider is available.");
  }
}

export function getGameProvider(): GameProvider {
  if (provider) {
    return provider;
  }

  if (process.env.PLAYNEXT_FORCE_DEMO === "true") {
    provider = fallbackGameProvider;
    return provider;
  }

  const providers: GameProvider[] = [];

  if (process.env.IGDB_CLIENT_ID && process.env.IGDB_CLIENT_SECRET) {
    providers.push(
      new IgdbGameProvider(
        process.env.IGDB_CLIENT_ID,
        process.env.IGDB_CLIENT_SECRET,
      ),
    );
  }

  providers.push(fallbackGameProvider);
  provider = new CascadingGameProvider(providers);

  return provider;
}

export const fallbackGameProvider = new SeedGameProvider();
