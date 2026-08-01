import {
  getLibraryEntries,
  saveRating,
  updateUserGameStatus,
} from "@/lib/server/library-service";
import type { LibraryEntry, UserContext } from "@/lib/types";
import {
  libraryImportRowSchema,
  type LibraryImportInput,
} from "@/lib/validation/library-import";

const EXPORT_HEADERS = [
  "title",
  "slug",
  "status",
  "isFavorite",
  "overallRating",
  "storyRating",
  "gameplayRating",
  "visualsRating",
  "soundtrackRating",
  "difficultyRating",
  "wouldRecommend",
  "review",
] as const;

function escapeCsvValue(value: string | number | boolean | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];
    if (character === '"' && inQuotes && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += character;
  }

  values.push(current);
  return values;
}

function parseBoolean(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "1";
}

function parseNumber(value: string) {
  if (!value.trim()) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function rowToCsv(entry: LibraryEntry) {
  const rating = entry.rating;
  return [
    entry.game.title,
    entry.game.slug,
    entry.userGame.status,
    entry.userGame.isFavorite,
    rating?.overallRating,
    rating?.storyRating,
    rating?.gameplayRating,
    rating?.visualsRating,
    rating?.soundtrackRating,
    rating?.difficultyRating,
    rating?.wouldRecommend,
    rating?.review,
  ]
    .map(escapeCsvValue)
    .join(",");
}

export async function exportLibraryCsv(user: UserContext) {
  const entries = await getLibraryEntries(user);
  return [EXPORT_HEADERS.join(","), ...entries.map(rowToCsv)].join("\n");
}

export async function importLibraryCsv(
  user: UserContext,
  input: LibraryImportInput,
) {
  const lines = input.csv
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("The CSV needs a header row and at least one game row.");
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const [lineIndex, line] of lines.slice(1).entries()) {
    const values = parseCsvLine(line);
    const rawRow = Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );

    const parsed = libraryImportRowSchema.safeParse({
      slug: rawRow.slug,
      status: rawRow.status,
      isFavorite: parseBoolean(rawRow.isFavorite ?? ""),
      overallRating: parseNumber(rawRow.overallRating ?? ""),
      review: rawRow.review?.trim() ? rawRow.review : null,
    });

    if (!parsed.success) {
      results.skipped += 1;
      results.errors.push(
        `Line ${lineIndex + 2}: ${parsed.error.issues[0]?.message ?? "Invalid row."}`,
      );
      continue;
    }

    try {
      await updateUserGameStatus(user, {
        gameSlug: parsed.data.slug,
        status: parsed.data.status,
        isFavorite: parsed.data.isFavorite,
      });

      if (parsed.data.overallRating) {
        await saveRating(user, {
          gameSlug: parsed.data.slug,
          overallRating: parsed.data.overallRating,
          review: parsed.data.review ?? null,
        });
      }

      results.imported += 1;
    } catch (error) {
      results.skipped += 1;
      results.errors.push(
        `Line ${lineIndex + 2}: ${
          error instanceof Error ? error.message : "Could not import row."
        }`,
      );
    }
  }

  return results;
}
