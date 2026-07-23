"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotificationCenter, NotificationItem } from "@/lib/types";

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function NotificationsMenu({
  initialCenter,
}: {
  initialCenter: NotificationCenter;
}) {
  const [center, setCenter] = useState(initialCenter);
  const [isLoading, setIsLoading] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadIds = useMemo(
    () =>
      center.notifications
        .filter((notification) => !notification.readAt)
        .map((notification) => notification.id),
    [center.notifications],
  );

  async function loadNotifications() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/notifications");
      const payload = (await response.json()) as NotificationCenter & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load notifications.");
      }
      setCenter({
        notifications: payload.notifications ?? [],
        unreadCount: payload.unreadCount ?? 0,
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load notifications.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function markRead(notificationIds: string[]) {
    if (!notificationIds.length) {
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds }),
      });
      if (!response.ok) {
        throw new Error("Could not update notifications.");
      }
      setCenter((current) => ({
        unreadCount: Math.max(0, current.unreadCount - notificationIds.length),
        notifications: current.notifications.map((notification) =>
          notificationIds.includes(notification.id)
            ? { ...notification, readAt: new Date().toISOString() }
            : notification,
        ),
      }));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not update notifications.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function markAllRead() {
    if (!unreadIds.length) {
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (!response.ok) {
        throw new Error("Could not update notifications.");
      }
      const now = new Date().toISOString();
      setCenter((current) => ({
        unreadCount: 0,
        notifications: current.notifications.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? now,
        })),
      }));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not update notifications.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteNotification(notification: NotificationItem) {
    setIsBusy(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.id }),
      });
      if (!response.ok) {
        throw new Error("Could not delete notification.");
      }
      setCenter((current) => ({
        unreadCount:
          notification.readAt || current.unreadCount === 0
            ? current.unreadCount
            : current.unreadCount - 1,
        notifications: current.notifications.filter(
          (candidate) => candidate.id !== notification.id,
        ),
      }));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not delete notification.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          void loadNotifications();
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          aria-label={
            center.unreadCount
              ? `Open notifications, ${center.unreadCount} unread`
              : "Open notifications"
          }
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {center.unreadCount ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-300 px-1 text-[10px] font-black text-zinc-950">
              {center.unreadCount > 9 ? "9+" : center.unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <p className="font-bold text-zinc-50">Notifications</p>
            <p className="text-xs text-zinc-400">
              {center.unreadCount
                ? `${center.unreadCount} unread`
                : "All caught up"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            disabled={!unreadIds.length || isBusy}
          >
            <CheckCheck className="h-4 w-4" />
            Mark read
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto p-1">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading
            </div>
          ) : error ? (
            <div
              role="alert"
              className="m-2 rounded-md border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100"
            >
              {error}
            </div>
          ) : center.notifications.length ? (
            center.notifications.map((notification) => (
              <div
                key={notification.id}
                className="group grid grid-cols-[1fr_auto] items-start gap-1 rounded-md hover:bg-zinc-800"
              >
                <DropdownMenuItem asChild className="min-w-0">
                  <Link
                    href={notification.linkHref ?? "/community"}
                    onClick={() => markRead([notification.id])}
                    className="flex min-w-0 items-start gap-3"
                  >
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        notification.readAt ? "bg-zinc-700" : "bg-lime-300"
                      }`}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold text-zinc-100">
                        {notification.title}
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-zinc-300">
                        {notification.body}
                      </span>
                      <span className="mt-1 block text-xs text-zinc-500">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
                <button
                  type="button"
                  onClick={() => deleteNotification(notification)}
                  disabled={isBusy}
                  className="mr-1 mt-2 rounded-md p-2 text-zinc-500 opacity-0 transition hover:bg-zinc-900 hover:text-rose-200 focus:opacity-100 focus-visible:outline-2 group-hover:opacity-100"
                  aria-label={`Delete notification: ${notification.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="px-4 py-8 text-center text-sm text-zinc-400">
              No notifications yet.
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
