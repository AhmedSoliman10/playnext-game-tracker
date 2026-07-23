import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/server/current-user";
import { getNotifications } from "@/lib/server/notification-service";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const notificationCenter = await getNotifications(user);

  return (
    <AppShell user={user} notificationCenter={notificationCenter}>
      {children}
    </AppShell>
  );
}
