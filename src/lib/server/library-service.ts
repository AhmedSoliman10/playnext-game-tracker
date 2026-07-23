import type { PostgrestError } from "@supabase/supabase-js";
import type { GameSummary } from "@/lib/games/types";
import { fallbackGameProvider, getGameProvider } from "@/lib/games/provider";
import { isSupabaseConfigured } from "@/lib/auth/env";
import {
  demoGetLibraryEntries,
  demoGetDiscoveryInteractionSlugs,
  demoRemoveFromLibrary,
  demoSaveRating,
  demoUpdateFavorite,
  demoUpdateStatus,
} from "@/lib/server/demo-store";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { LibraryEntry, Rating, UserContext, UserGame } from "@/lib/types";
import type { RatingFormValues } from "@/lib/validation/rating";
import type {
  FavoriteUpdateInput,
  RemoveUserGameInput,
  StatusUpdateInput,
} from "@/lib/validation/status";
import { canTransitionStatus } from "@/lib/validation/status";
import { slugify } from "@/lib/utils";
export { filterLibraryEntries } from "@/lib/library/filter";

type GameRow = Database["public"]["Tables"]["games"]["Row"];
type UserGameRow = Database["public"]["Tables"]["user_games"]["Row"];
type RatingRow = Database["public"]["Tables"]["ratings"]["Row"];
type SupabaseClient = NonNullable<
  Awaited<ReturnType<typeof createSupabaseServerClient>>
>;

function throwDbError(error: PostgrestError | null, fallback: string): never {
  throw new Error(error?.message || fallback);
}

function jsonArray(value: Json | undefined, key: string): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const candidate = value[key];
  return Array.isArray(candidate)
    ? candidate.filter((item): item is string => typeof item === "string")
    : [];
}

function mapGameRow(row: GameRow): GameSummary {
  return {
    id: row.provider_game_id,
    provider: row.provider === "igdb" ? "igdb" : "seed",
    providerGameId: row.provider_game_id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "No description is available yet.",
    coverImageUrl: row.cover_image_url,
    backgroundImageUrl: row.background_image_url,
    releaseDate: row.release_date,
    genres: jsonArray(row.metadata, "genres"),
    platforms: jsonArray(row.metadata, "platforms"),
    developer: row.developer,
    publisher: row.publisher,
    externalRating: row.external_rating,
    estimatedPlaytime: row.estimated_playtime,
    screenshots: jsonArray(row.metadata, "screenshots"),
    metadata: {
      provider: row.provider,
      sourceSlug: row.slug,
    },
  };
}

function mapUserGame(row: UserGameRow, providerGameId: string): UserGame {
  return {
    gameId: providerGameId,
    status: row.status,
    isFavorite: row.is_favorite,
    finished: row.finished,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRating(row: RatingRow, providerGameId: string): Rating {
  return {
    gameId: providerGameId,
    overallRating: row.overall_rating,
    storyRating: row.story_rating,
    gameplayRating: row.gameplay_rating,
    visualsRating: row.visuals_rating,
    soundtrackRating: row.soundtrack_rating,
    difficultyRating: row.difficulty_rating,
    wouldRecommend: row.would_recommend,
    review: row.review,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function gameMetadata(game: GameSummary): Json {
  return {
    ...game.metadata,
    genres: game.genres,
    platforms: game.platforms,
    screenshots: game.screenshots,
  };
}

async function getProviderGame(slug: string) {
  const provider = getGameProvider();
  return (
    (await provider.getGameBySlug(slug)) ??
    (await fallbackGameProvider.getGameBySlug(slug))
  );
}

async function getGameRowBySlug(client: SupabaseClient, slug: string) {
  const { data, error } = await client
    .from("games")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    throwDbError(error, "Could not load game metadata.");
  }
  return data;
}

async function ensureGameInSupabase(game: GameSummary, client: SupabaseClient) {
  const existing = await getGameRowBySlug(client, game.slug);
  if (existing) {
    return existing;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error(
      "Game metadata is not seeded yet. Add SUPABASE_SERVICE_ROLE_KEY or run the seed script.",
    );
  }

  const { data, error } = await admin
    .from("games")
    .upsert(
      {
        provider: game.provider,
        provider_game_id: game.providerGameId,
        slug: game.slug,
        title: game.title,
        description: game.description,
        cover_image_url: game.coverImageUrl ?? null,
        background_image_url: game.backgroundImageUrl ?? null,
        release_date: game.releaseDate ?? null,
        developer: game.developer ?? null,
        publisher: game.publisher ?? null,
        external_rating: game.externalRating ?? null,
        estimated_playtime: game.estimatedPlaytime ?? null,
        metadata: gameMetadata(game),
      },
      { onConflict: "provider,provider_game_id" },
    )
    .select("*")
    .single();

  if (error || !data) {
    throwDbError(error, "Could not save game metadata.");
  }

  await syncGameTaxonomy(data.id, game);
  return data;
}

async function syncGameTaxonomy(gameId: string, game: GameSummary) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  for (const genre of game.genres) {
    const { data: genreRow, error } = await admin
      .from("genres")
      .upsert({ name: genre, slug: slugify(genre) }, { onConflict: "slug" })
      .select("id")
      .single();

    if (error || !genreRow) {
      throwDbError(error, "Could not sync genre metadata.");
    }

    await admin
      .from("game_genres")
      .upsert(
        { game_id: gameId, genre_id: genreRow.id },
        { onConflict: "game_id,genre_id" },
      );
  }

  for (const platform of game.platforms) {
    const { data: platformRow, error } = await admin
      .from("platforms")
      .upsert(
        { name: platform, slug: slugify(platform) },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error || !platformRow) {
      throwDbError(error, "Could not sync platform metadata.");
    }

    await admin
      .from("game_platforms")
      .upsert(
        { game_id: gameId, platform_id: platformRow.id },
        { onConflict: "game_id,platform_id" },
      );
  }
}

async function getSupabaseClient() {
  const client = await createSupabaseServerClient();
  if (!client) {
    throw new Error("Supabase is not configured.");
  }
  return client;
}

export async function getLibraryEntries(
  user: UserContext,
): Promise<LibraryEntry[]> {
  if (user.isDemo || !isSupabaseConfigured()) {
    return demoGetLibraryEntries(user);
  }

  const supabase = await getSupabaseClient();
  const { data: userGames, error: userGamesError } = await supabase
    .from("user_games")
    .select("*")
    .eq("user_id", user.userId)
    .neq("status", "skipped")
    .order("updated_at", { ascending: false });

  if (userGamesError) {
    throwDbError(userGamesError, "Could not load your library.");
  }

  if (!userGames?.length) {
    return [];
  }

  const gameIds = userGames.map((row) => row.game_id);
  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("*")
    .in("id", gameIds);

  if (gamesError) {
    throwDbError(gamesError, "Could not load game details.");
  }

  const { data: ratings, error: ratingsError } = await supabase
    .from("ratings")
    .select("*")
    .eq("user_id", user.userId)
    .in("game_id", gameIds);

  if (ratingsError) {
    throwDbError(ratingsError, "Could not load your ratings.");
  }

  const gamesById = new Map((games ?? []).map((game) => [game.id, game]));
  const ratingsByGameId = new Map(
    (ratings ?? []).map((rating) => [rating.game_id, rating]),
  );

  const entries: Array<LibraryEntry | null> = userGames.map((userGameRow) => {
    const gameRow = gamesById.get(userGameRow.game_id);
    if (!gameRow) {
      return null;
    }

    const game = mapGameRow(gameRow);
    const ratingRow = ratingsByGameId.get(userGameRow.game_id);

    return {
      game,
      userGame: mapUserGame(userGameRow, game.providerGameId),
      rating: ratingRow ? mapRating(ratingRow, game.providerGameId) : null,
    };
  });

  return entries.filter((entry): entry is LibraryEntry => Boolean(entry));
}

export async function getDiscoveryInteractionSlugs(
  user: UserContext,
): Promise<string[]> {
  if (user.isDemo || !isSupabaseConfigured()) {
    return demoGetDiscoveryInteractionSlugs(user);
  }

  const supabase = await getSupabaseClient();
  const { data: interactions, error: interactionsError } = await supabase
    .from("discovery_interactions")
    .select("game_id")
    .eq("user_id", user.userId);

  if (interactionsError) {
    throwDbError(interactionsError, "Could not load your discovery history.");
  }

  const gameIds = [
    ...new Set((interactions ?? []).map((interaction) => interaction.game_id)),
  ];
  if (!gameIds.length) {
    return [];
  }

  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("slug")
    .in("id", gameIds);

  if (gamesError) {
    throwDbError(gamesError, "Could not load discovery games.");
  }

  return (games ?? []).map((game) => game.slug);
}

export async function getLibraryEntryBySlug(
  user: UserContext,
  slug: string,
): Promise<LibraryEntry | null> {
  const entries = await getLibraryEntries(user);
  return entries.find((entry) => entry.game.slug === slug) ?? null;
}

export async function updateUserGameStatus(
  user: UserContext,
  input: StatusUpdateInput,
): Promise<LibraryEntry | null> {
  if (user.isDemo || !isSupabaseConfigured()) {
    return demoUpdateStatus(user, input);
  }

  const supabase = await getSupabaseClient();
  const providerGame = await getProviderGame(input.gameSlug);
  if (!providerGame) {
    throw new Error("We could not find that game.");
  }

  const gameRow = await ensureGameInSupabase(providerGame, supabase);
  const { data: existing, error: existingError } = await supabase
    .from("user_games")
    .select("*")
    .eq("user_id", user.userId)
    .eq("game_id", gameRow.id)
    .maybeSingle();

  if (existingError) {
    throwDbError(existingError, "Could not check your current game status.");
  }

  if (!canTransitionStatus(existing?.status, input.status)) {
    throw new Error("That status change is not available.");
  }

  if (input.status === "skipped") {
    const { error: discoveryError } = await supabase
      .from("discovery_interactions")
      .insert({
        user_id: user.userId,
        game_id: gameRow.id,
        action: input.status,
      });

    if (discoveryError) {
      throwDbError(
        discoveryError,
        "Could not save that game to your discovery history.",
      );
    }

    if (existing) {
      const { error: deleteError } = await supabase
        .from("user_games")
        .delete()
        .eq("user_id", user.userId)
        .eq("game_id", gameRow.id);

      if (deleteError) {
        throwDbError(
          deleteError,
          "Could not remove the skipped game from your library.",
        );
      }
    }

    return null;
  }

  const timestamp = new Date().toISOString();
  const { error } = await supabase.from("user_games").upsert(
    {
      user_id: user.userId,
      game_id: gameRow.id,
      status: input.status,
      is_favorite: input.isFavorite ?? existing?.is_favorite ?? false,
      finished: input.finished ?? existing?.finished ?? null,
      started_at:
        input.status === "playing" && !existing?.started_at
          ? timestamp
          : (existing?.started_at ?? null),
      completed_at:
        input.status === "played" && input.finished
          ? timestamp
          : (existing?.completed_at ?? null),
      updated_at: timestamp,
    },
    { onConflict: "user_id,game_id" },
  );

  if (error) {
    throwDbError(error, "Could not update your library.");
  }

  await supabase.from("discovery_interactions").insert({
    user_id: user.userId,
    game_id: gameRow.id,
    action: input.status,
  });
  await supabase.from("activity_log").insert({
    user_id: user.userId,
    game_id: gameRow.id,
    activity_type: "status_changed",
    metadata: { status: input.status },
  });

  const entry = await getLibraryEntryBySlug(user, input.gameSlug);
  if (!entry) {
    throw new Error(
      "Your status was saved, but the library entry could not be reloaded.",
    );
  }

  return entry;
}

export async function updateFavorite(
  user: UserContext,
  input: FavoriteUpdateInput,
): Promise<LibraryEntry> {
  if (user.isDemo || !isSupabaseConfigured()) {
    return demoUpdateFavorite(user, input);
  }

  const supabase = await getSupabaseClient();
  const providerGame = await getProviderGame(input.gameSlug);
  if (!providerGame) {
    throw new Error("We could not find that game.");
  }

  const gameRow = await ensureGameInSupabase(providerGame, supabase);
  const { data: existing, error: existingError } = await supabase
    .from("user_games")
    .select("*")
    .eq("user_id", user.userId)
    .eq("game_id", gameRow.id)
    .maybeSingle();

  if (existingError) {
    throwDbError(
      existingError,
      "Could not check your current favorite status.",
    );
  }

  const timestamp = new Date().toISOString();
  const { error } = await supabase.from("user_games").upsert(
    {
      user_id: user.userId,
      game_id: gameRow.id,
      status: existing?.status ?? "want_to_play",
      is_favorite: input.isFavorite,
      finished: existing?.finished ?? null,
      started_at: existing?.started_at ?? null,
      completed_at: existing?.completed_at ?? null,
      updated_at: timestamp,
    },
    { onConflict: "user_id,game_id", ignoreDuplicates: false },
  );

  if (error) {
    throwDbError(error, "Could not update the favorite flag.");
  }

  await supabase.from("activity_log").insert({
    user_id: user.userId,
    game_id: gameRow.id,
    activity_type: "favorite_changed",
    metadata: { isFavorite: input.isFavorite },
  });

  const entry = await getLibraryEntryBySlug(user, input.gameSlug);
  if (!entry) {
    throw new Error(
      "The favorite update was saved, but the library entry could not be reloaded.",
    );
  }
  return entry;
}

export async function saveRating(
  user: UserContext,
  input: RatingFormValues,
): Promise<LibraryEntry> {
  if (user.isDemo || !isSupabaseConfigured()) {
    return demoSaveRating(user, input);
  }

  const supabase = await getSupabaseClient();
  const providerGame = await getProviderGame(input.gameSlug);
  if (!providerGame) {
    throw new Error("We could not find that game.");
  }

  const gameRow = await ensureGameInSupabase(providerGame, supabase);
  const { error: userGameError } = await supabase.from("user_games").upsert(
    {
      user_id: user.userId,
      game_id: gameRow.id,
      status: "played",
      finished: input.finished ?? null,
      completed_at: input.finished ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,game_id" },
  );

  if (userGameError) {
    throwDbError(
      userGameError,
      "Could not update played status before rating.",
    );
  }

  const { error } = await supabase.from("ratings").upsert(
    {
      user_id: user.userId,
      game_id: gameRow.id,
      overall_rating: input.overallRating,
      story_rating: input.storyRating ?? null,
      gameplay_rating: input.gameplayRating ?? null,
      visuals_rating: input.visualsRating ?? null,
      soundtrack_rating: input.soundtrackRating ?? null,
      difficulty_rating: input.difficultyRating ?? null,
      would_recommend: input.wouldRecommend ?? null,
      review: input.review ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,game_id" },
  );

  if (error) {
    throwDbError(error, "Could not save your rating.");
  }

  await supabase.from("activity_log").insert({
    user_id: user.userId,
    game_id: gameRow.id,
    activity_type: "rating_saved",
    metadata: { overallRating: input.overallRating },
  });

  const entry = await getLibraryEntryBySlug(user, input.gameSlug);
  if (!entry) {
    throw new Error(
      "Your rating was saved, but the library entry could not be reloaded.",
    );
  }

  return entry;
}

export async function removeFromLibrary(
  user: UserContext,
  input: RemoveUserGameInput,
) {
  if (user.isDemo || !isSupabaseConfigured()) {
    await demoRemoveFromLibrary(user, input);
    return;
  }

  const supabase = await getSupabaseClient();
  const gameRow = await getGameRowBySlug(supabase, input.gameSlug);
  if (!gameRow) {
    return;
  }

  const { error: ratingError } = await supabase
    .from("ratings")
    .delete()
    .eq("user_id", user.userId)
    .eq("game_id", gameRow.id);

  if (ratingError) {
    throwDbError(ratingError, "Could not remove your rating.");
  }

  const { error: userGameError } = await supabase
    .from("user_games")
    .delete()
    .eq("user_id", user.userId)
    .eq("game_id", gameRow.id);

  if (userGameError) {
    throwDbError(userGameError, "Could not remove the game from your library.");
  }
}
