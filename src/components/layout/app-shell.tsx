import type { ReactNode } from "react";
import { BrandMark, DesktopNav, MobileNav } from "@/components/layout/app-nav";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { UserMenu } from "@/components/layout/user-menu";
import type { NotificationCenter, UserContext } from "@/lib/types";

export function AppShell({
  user,
  notificationCenter,
  children,
}: {
  user: UserContext;
  notificationCenter: NotificationCenter;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#14181c,#101418_42%,#14181c)]">
      <header className="sticky top-0 z-30 border-b bg-[#14181c]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandMark />
          <DesktopNav />
          <div className="flex items-center gap-2">
            <NotificationsMenu initialCenter={notificationCenter} />
            <UserMenu user={user} />
          </div>
        </div>
      </header>
      <main className="animate-page-in mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
