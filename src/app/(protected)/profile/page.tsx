import { RichProfilePage } from "@/components/profile/rich-profile-page";
import { parseProfileLibraryQuery } from "@/lib/profile/library";
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
  const query = parseProfileLibraryQuery(await searchParams, {
    allowHidden: true,
  });

  return (
    <RichProfilePage
      profile={{
        id: user?.userId ?? "profile",
        displayName: user?.displayName ?? "Player",
        avatarUrl: user?.avatarUrl ?? null,
        isCurrentUser: true,
      }}
      entries={entries}
      query={query}
      basePath="/profile"
    />
  );
}
