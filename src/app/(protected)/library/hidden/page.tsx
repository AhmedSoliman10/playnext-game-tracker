import { LibraryClient } from "@/components/library/library-client";
import { getCurrentUser } from "@/lib/server/current-user";
import { getLibraryEntries } from "@/lib/server/library-service";

export const metadata = {
  title: "Hidden Library",
};

export default async function HiddenLibraryPage() {
  const user = await getCurrentUser();
  const entries = user ? await getLibraryEntries(user) : [];
  return <LibraryClient entries={entries} activeFilter="hidden" />;
}
