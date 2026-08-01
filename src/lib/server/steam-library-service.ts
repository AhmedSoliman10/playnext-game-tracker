import { searchCachedGames } from "@/lib/games/cached-provider";
import { updateUserGameStatus } from "@/lib/server/library-service";
import type { UserContext } from "@/lib/types";
import type { SteamLibraryImportInput } from "@/lib/validation/library-import";

const STEAM_IMPORT_LIMIT = 25;
const STEAM_TIMEOUT_MS = 8_000;

interface SteamGame {
  appId: string;
  name: string;
}

function parseSteamProfile(input: string) {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(
    /steamcommunity\.com\/(id|profiles)\/([^/?#]+)/i,
  );
  if (urlMatch) {
    return { kind: urlMatch[1].toLowerCase(), value: urlMatch[2] };
  }

  if (/^\d{15,20}$/.test(trimmed)) {
    return { kind: "profiles", value: trimmed };
  }

  return { kind: "id", value: trimmed.replace(/^@/, "") };
}

function decodeXml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function extractTag(block: string, tag: string) {
  const cdata = block.match(
    new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`),
  );
  if (cdata?.[1]) {
    return cdata[1].trim();
  }

  const plain = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return plain?.[1] ? decodeXml(plain[1].trim()) : null;
}

function parseSteamGames(xml: string): SteamGame[] {
  const games: SteamGame[] = [];
  for (const match of xml.matchAll(/<game>([\s\S]*?)<\/game>/g)) {
    const block = match[1];
    const appId = extractTag(block, "appID");
    const name = extractTag(block, "name");
    if (appId && name) {
      games.push({ appId, name });
    }
  }
  return games;
}

async function fetchPublicSteamLibrary(profile: string) {
  const { kind, value } = parseSteamProfile(profile);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STEAM_TIMEOUT_MS);
  const url = `https://steamcommunity.com/${kind}/${encodeURIComponent(
    value,
  )}/games?tab=all&xml=1`;

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "PlayNext game tracker import",
      },
    });
    if (!response.ok) {
      throw new Error(
        "Steam did not return a public library for that profile.",
      );
    }
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function importSteamLibrary(
  user: UserContext,
  input: SteamLibraryImportInput,
) {
  const xml = await fetchPublicSteamLibrary(input.profile);
  const steamGames = parseSteamGames(xml).slice(0, STEAM_IMPORT_LIMIT);
  if (!steamGames.length) {
    throw new Error(
      "No public Steam games were found. Check that the profile and game details are public.",
    );
  }

  const result = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const steamGame of steamGames) {
    try {
      const searchResult = await searchCachedGames(steamGame.name, {
        pageSize: 1,
      });
      const match = searchResult.games[0];
      if (!match) {
        result.skipped += 1;
        result.errors.push(`No catalog match for ${steamGame.name}.`);
        continue;
      }

      await updateUserGameStatus(user, {
        gameSlug: match.slug,
        status: "want_to_play",
      });
      result.imported += 1;
    } catch (error) {
      result.skipped += 1;
      result.errors.push(
        `${steamGame.name}: ${
          error instanceof Error ? error.message : "Could not import game."
        }`,
      );
    }
  }

  return result;
}
