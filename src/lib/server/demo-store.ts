import { promises as fs } from "node:fs";
import path from "node:path";
import type { GameSummary } from "@/lib/games/types";
import { getCachedGameBySlug } from "@/lib/games/cached-provider";
import type { LibraryEntry, UserContext } from "@/lib/types";
import type { RatingFormValues } from "@/lib/validation/rating";
import type {
  FavoriteUpdateInput,
  RemoveUserGameInput,
  StatusUpdateInput,
  UnhideUserGameInput,
} from "@/lib/validation/status";
import {
  applyFavoriteUpdate,
  applyLibraryRemoval,
  applyLibraryUnhide,
  applyRatingSave,
  applyStatusUpdate,
  createEmptyLibraryState,
  type LibraryState,
  toLibraryEntries,
} from "@/lib/server/library-core";

interface DemoStoreFile {
  users: Record<string, LibraryState>;
}

const storePath = path.join(process.cwd(), ".playnext-data", "demo-store.json");

async function readStore(): Promise<DemoStoreFile> {
  try {
    const content = await fs.readFile(storePath, "utf8");
    return JSON.parse(content) as DemoStoreFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    return { users: {} };
  }
}

async function writeStore(store: DemoStoreFile) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

async function getUserState(userId: string) {
  const store = await readStore();
  const state = store.users[userId] ?? createEmptyLibraryState();
  state.discoveryInteractions ??= {};
  store.users[userId] = state;
  return { store, state };
}

async function getGame(slug: string): Promise<GameSummary> {
  const game = await getCachedGameBySlug(slug);

  if (!game) {
    throw new Error("We could not find that game.");
  }

  return game;
}

export async function demoGetLibraryEntries(
  user: UserContext,
): Promise<LibraryEntry[]> {
  const { state } = await getUserState(user.userId);
  const slugs = Object.keys(state.userGames);
  const games = await Promise.all(slugs.map((slug) => getGame(slug)));
  return toLibraryEntries(
    state,
    new Map(games.map((game) => [game.slug, game])),
  );
}

export async function demoGetDiscoveryInteractionSlugs(
  user: UserContext,
): Promise<string[]> {
  const { state } = await getUserState(user.userId);
  const slugs = new Set(Object.keys(state.discoveryInteractions));
  for (const [slug, userGame] of Object.entries(state.userGames)) {
    if (userGame.status === "skipped") {
      slugs.add(slug);
    }
  }
  return [...slugs];
}

export async function demoUpdateStatus(
  user: UserContext,
  input: StatusUpdateInput,
): Promise<LibraryEntry | null> {
  const { store, state } = await getUserState(user.userId);
  const game = await getGame(input.gameSlug);
  const userGame = applyStatusUpdate(state, game, input);
  await writeStore(store);

  if (!userGame) {
    return null;
  }

  return {
    game,
    userGame,
    rating: state.ratings[input.gameSlug] ?? null,
  };
}

export async function demoUpdateFavorite(
  user: UserContext,
  input: FavoriteUpdateInput,
): Promise<LibraryEntry> {
  const { store, state } = await getUserState(user.userId);
  const game = await getGame(input.gameSlug);
  const userGame = applyFavoriteUpdate(state, game, input);
  await writeStore(store);

  return {
    game,
    userGame,
    rating: state.ratings[input.gameSlug] ?? null,
  };
}

export async function demoSaveRating(
  user: UserContext,
  input: RatingFormValues,
): Promise<LibraryEntry> {
  const { store, state } = await getUserState(user.userId);
  const game = await getGame(input.gameSlug);
  const rating = applyRatingSave(state, game, input);
  await writeStore(store);

  return {
    game,
    userGame: state.userGames[input.gameSlug],
    rating,
  };
}

export async function demoRemoveFromLibrary(
  user: UserContext,
  input: RemoveUserGameInput,
) {
  const { store, state } = await getUserState(user.userId);
  applyLibraryRemoval(state, input);
  await writeStore(store);
}

export async function demoUnhideGame(
  user: UserContext,
  input: UnhideUserGameInput,
): Promise<LibraryEntry | null> {
  const { store, state } = await getUserState(user.userId);
  const game = await getGame(input.gameSlug);
  const userGame = applyLibraryUnhide(state, game, input);
  await writeStore(store);

  return userGame
    ? {
        game,
        userGame,
        rating: state.ratings[input.gameSlug] ?? null,
      }
    : null;
}
