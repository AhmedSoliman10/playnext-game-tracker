import { RichProfilePage } from "@/components/profile/rich-profile-page";
import { parseProfileLibraryQuery } from "@/lib/profile/library";
import { getCustomShelves } from "@/lib/server/custom-shelves-service";
import { getCurrentUser } from "@/lib/server/current-user";
import { getLibraryEntries } from "@/lib/server/library-service";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  const entries = user ? await getLibraryEntries(user) : [];
  const customShelves = user
    ? await getCustomShelves(user, user.userId, entries)
    : [];
  const query = parseProfileLibraryQuery(await searchParams, {
    allowHidden: true,
  });

  return (
    <RichProfilePage
      profile={{
        id: user?.userId ?? "profile",
        displayName: user?.displayName ?? "Player",
        avatarUrl: user?.avatarUrl ?? null,
        discord: user?.discord ?? null,
        isCurrentUser: true,
      }}
      entries={entries}
      query={query}
      basePath="/profile"
      customShelves={customShelves}
    />
  );
}
