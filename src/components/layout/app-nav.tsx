"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gamepad2,
  LayoutDashboard,
  Library,
  Search,
  Sparkles,
  User,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discover", label: "Discover", icon: Sparkles },
  { href: "/library", label: "Library", icon: Library },
  { href: "/community", label: "Community", icon: UsersRound },
  { href: "/search", label: "Search", icon: Search },
  { href: "/profile", label: "Profile", icon: User },
];

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden items-center gap-1 md:flex"
      aria-label="Primary navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2",
              active && "bg-zinc-800 text-cyan-100",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t bg-zinc-950/95 backdrop-blur md:hidden"
      aria-label="Mobile navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
              active && "text-cyan-200",
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function BrandMark() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-cyan-300 text-zinc-950">
        <Gamepad2 className="h-5 w-5" />
      </span>
      <span className="text-lg font-bold tracking-normal">PlayNext</span>
    </Link>
  );
}
