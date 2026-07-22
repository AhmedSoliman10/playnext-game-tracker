import { LibraryClient } from "@/components/library/library-client";
import { getCurrentUser } from "@/lib/server/current-user";
import { getLibraryEntries } from "@/lib/server/library-service";

export const metadata = {
  title: "Dropped",
};

export default async function DroppedLibraryPage() {
  const user = await getCurrentUser();
  const entries = user ? await getLibraryEntries(user) : [];
  return <LibraryClient entries={entries} activeFilter="dropped" />;
}
