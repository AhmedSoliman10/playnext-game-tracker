import { SearchClient } from "@/components/search/search-client";
import { seedGenres, seedPlatforms } from "@/lib/games/seed-data";
import { getCurrentUser } from "@/lib/server/current-user";
import { getLibraryEntries } from "@/lib/server/library-service";
import { searchParamsSchema } from "@/lib/validation/search";

export const metadata = {
  title: "Search",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const params = searchParamsSchema.parse(
    Object.fromEntries(
      Object.entries(rawParams).map(([key, value]) => [
        key,
        Array.isArray(value) ? value[0] : value,
      ]),
    ),
  );
  const user = await getCurrentUser();
  const entries = user ? await getLibraryEntries(user) : [];

  return (
    <SearchClient
      genres={seedGenres}
      platforms={seedPlatforms}
      initialParams={params}
      initialEntries={entries}
    />
  );
}
