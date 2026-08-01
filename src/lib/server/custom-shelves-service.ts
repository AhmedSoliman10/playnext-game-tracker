import { isSupabaseConfigured } from "@/lib/auth/env";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import type { CustomShelf, LibraryEntry, UserContext } from "@/lib/types";
import type {
  CustomShelfInput,
  ShelfGameInput,
} from "@/lib/validation/custom-shelves";

function missingShelfTable(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "42703";
}

export async function getCustomShelves(
  viewer: UserContext,
  ownerId: string,
  entries: LibraryEntry[],
): Promise<CustomShelf[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return [];
  }

  const query = admin
    .from("custom_shelves")
    .select("*")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: false });
  const { data: shelves, error } =
    viewer.userId === ownerId
      ? await query
      : await query.eq("visibility", "public");

  if (missingShelfTable(error)) {
    return [];
  }

  if (error) {
    throw new Error("Could not load profile shelves.");
  }

  const shelfRows = shelves ?? [];
  if (!shelfRows.length) {
    return [];
  }

  const shelfIds = shelfRows.map((shelf) => shelf.id);
  const { data: shelfGames, error: shelfGamesError } = await admin
    .from("custom_shelf_games")
    .select("shelf_id, game_id, position")
    .in("shelf_id", shelfIds)
    .order("position", { ascending: true });

  if (shelfGamesError) {
    throw new Error("Could not load shelf games.");
  }

  const gameIds = [...new Set((shelfGames ?? []).map((row) => row.game_id))];
  const { data: games, error: gamesError } = gameIds.length
    ? await admin.from("games").select("id, slug").in("id", gameIds)
    : { data: [], error: null };

  if (gamesError) {
    throw new Error("Could not load shelf game metadata.");
  }

  const slugByGameId = new Map(
    (games ?? []).map((game) => [game.id, game.slug]),
  );
  const entryBySlug = new Map(entries.map((entry) => [entry.game.slug, entry]));
  const rowsByShelfId = new Map<string, NonNullable<typeof shelfGames>>();
  for (const row of shelfGames ?? []) {
    rowsByShelfId.set(row.shelf_id, [
      ...(rowsByShelfId.get(row.shelf_id) ?? []),
      row,
    ]);
  }

  return shelfRows.map((shelf) => ({
    id: shelf.id,
    ownerId: shelf.user_id,
    title: shelf.title,
    description: shelf.description,
    isPublic: shelf.visibility === "public",
    createdAt: shelf.created_at,
    updatedAt: shelf.updated_at,
    entries: (rowsByShelfId.get(shelf.id) ?? [])
      .map((row) => {
        const slug = slugByGameId.get(row.game_id);
        return slug ? entryBySlug.get(slug) : null;
      })
      .filter((entry): entry is LibraryEntry => Boolean(entry)),
  }));
}

async function requireClient(user: UserContext) {
  if (user.isDemo || !isSupabaseConfigured()) {
    throw new Error("Custom shelves need Supabase authentication.");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

export async function createCustomShelf(
  user: UserContext,
  input: CustomShelfInput,
) {
  const supabase = await requireClient(user);
  const { data, error } = await supabase
    .from("custom_shelves")
    .insert({
      user_id: user.userId,
      title: input.title,
      description: input.description ?? null,
      visibility: input.isPublic ? "public" : "private",
    })
    .select("*")
    .single();

  if (missingShelfTable(error)) {
    throw new Error("Custom shelves need the latest Supabase migration.");
  }

  if (error || !data) {
    throw new Error("Could not create that shelf.");
  }

  return data;
}

export async function addGameToCustomShelf(
  user: UserContext,
  input: ShelfGameInput,
) {
  const supabase = await requireClient(user);
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase admin access is required for shelf metadata.");
  }

  const { data: shelf, error: shelfError } = await supabase
    .from("custom_shelves")
    .select("id")
    .eq("id", input.shelfId)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (missingShelfTable(shelfError)) {
    throw new Error("Custom shelves need the latest Supabase migration.");
  }

  if (shelfError || !shelf) {
    throw new Error("Could not find that shelf.");
  }

  const { data: game, error: gameError } = await admin
    .from("games")
    .select("id")
    .eq("slug", input.gameSlug)
    .maybeSingle();

  if (gameError || !game) {
    throw new Error("Could not find that game in the catalog yet.");
  }

  const { error } = await supabase.from("custom_shelf_games").upsert(
    {
      shelf_id: input.shelfId,
      game_id: game.id,
    },
    { onConflict: "shelf_id,game_id" },
  );

  if (error) {
    throw new Error("Could not add that game to the shelf.");
  }
}

export async function removeGameFromCustomShelf(
  user: UserContext,
  input: ShelfGameInput,
) {
  const supabase = await requireClient(user);
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase admin access is required for shelf metadata.");
  }

  const { data: game, error: gameError } = await admin
    .from("games")
    .select("id")
    .eq("slug", input.gameSlug)
    .maybeSingle();

  if (gameError || !game) {
    throw new Error("Could not find that game in the catalog yet.");
  }

  const { error } = await supabase
    .from("custom_shelf_games")
    .delete()
    .eq("shelf_id", input.shelfId)
    .eq("game_id", game.id);

  if (missingShelfTable(error)) {
    throw new Error("Custom shelves need the latest Supabase migration.");
  }

  if (error) {
    throw new Error("Could not remove that game from the shelf.");
  }
}
