import { notFound } from "next/navigation";
import { RichProfilePage } from "@/components/profile/rich-profile-page";
import { calculateTasteCompatibility } from "@/lib/community/compatibility";
import { parseProfileLibraryQuery } from "@/lib/profile/library";
import { getPublicProfileDetails } from "@/lib/server/community-service";
import { getCustomShelves } from "@/lib/server/custom-shelves-service";
import { getCurrentUser } from "@/lib/server/current-user";
import { getLibraryEntries } from "@/lib/server/library-service";

export const metadata = {
  title: "Player Profile",
};

export default async function PlayerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;

  if (!user) {
    notFound();
  }

  const details = await getPublicProfileDetails(user, id);
  if (!details) {
    notFound();
  }

  const query = parseProfileLibraryQuery(await searchParams, {
    allowHidden: details.profile.isCurrentUser,
  });
  const viewerEntries = details.profile.isCurrentUser
    ? details.entries
    : await getLibraryEntries(user);
  const compatibility = details.profile.isCurrentUser
    ? null
    : calculateTasteCompatibility(viewerEntries, details.entries);
  const customShelves = await getCustomShelves(
    user,
    details.profile.id,
    details.entries,
  );

  return (
    <div className="space-y-4">
      {details.profile.isCurrentUser && details.profile.isPrivate ? (
        <p
          role="status"
          className="rounded-md border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm text-amber-100"
        >
          Your profile is private. Other players cannot view this page until you
          make it public in settings.
        </p>
      ) : null}
      <RichProfilePage
        profile={details.profile}
        entries={details.entries}
        query={query}
        basePath={`/players/${details.profile.id}`}
        compatibility={compatibility}
        customShelves={customShelves}
      />
    </div>
  );
}
