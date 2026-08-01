"use client";

import type React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Bell,
  Loader2,
  MessageCircle,
  Moon,
  Upload,
  Trash2,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileSchema, type ProfileInput } from "@/lib/validation/auth";
import type { DiscordProfile, NotificationPreferences } from "@/lib/types";

export function SettingsForm({
  displayName,
  avatarUrl,
  isPrivate,
  discord,
  notificationPreferences,
  demoMode,
}: {
  displayName: string;
  avatarUrl?: string | null;
  isPrivate: boolean;
  discord?: DiscordProfile | null;
  notificationPreferences: NotificationPreferences;
  demoMode: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(
    null,
  );
  const [notificationError, setNotificationError] = useState<string | null>(
    null,
  );
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [preferences, setPreferences] = useState(notificationPreferences);
  const [importCsv, setImportCsv] = useState("");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [steamProfile, setSteamProfile] = useState("");
  const [steamMessage, setSteamMessage] = useState<string | null>(null);
  const [steamError, setSteamError] = useState<string | null>(null);
  const [isImportingSteam, setIsImportingSteam] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema) as unknown as Resolver<ProfileInput>,
    defaultValues: {
      displayName,
      avatarUrl: avatarUrl ?? "",
      isPrivate,
    },
  });
  const watchedAvatarUrl = useWatch({ control, name: "avatarUrl" });
  const watchedDisplayName = useWatch({ control, name: "displayName" });
  const watchedIsPrivate = useWatch({ control, name: "isPrivate" });

  async function onSubmit(values: ProfileInput) {
    setMessage(null);
    setServerError(null);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as {
      error?: string;
      message?: string;
    };
    if (!response.ok || payload.error) {
      setServerError(payload.error ?? "Could not update profile.");
      return;
    }
    setMessage(payload.message ?? "Profile updated.");
    router.refresh();
  }

  async function deleteAccount() {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });
      const payload = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok || payload.error) {
        setDeleteError(payload.error ?? "Could not delete your account.");
        return;
      }

      router.push(payload.redirectTo ?? "/");
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  async function saveNotificationPreferences() {
    setNotificationError(null);
    setNotificationMessage(null);
    setIsSavingNotifications(true);
    try {
      const response = await fetch("/api/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const payload = (await response.json()) as {
        preferences?: NotificationPreferences;
        error?: string;
      };

      if (!response.ok || payload.error || !payload.preferences) {
        throw new Error(
          payload.error ?? "Could not update notification preferences.",
        );
      }

      setPreferences(payload.preferences);
      setNotificationMessage("Notification preferences saved.");
      router.refresh();
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : "Could not update notification preferences.",
      );
    } finally {
      setIsSavingNotifications(false);
    }
  }

  function updatePreference(
    key: keyof NotificationPreferences,
    value: boolean,
  ) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  async function importLibrary() {
    setImportMessage(null);
    setImportError(null);
    setIsImporting(true);
    try {
      const response = await fetch("/api/library/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: importCsv }),
      });
      const payload = (await response.json()) as {
        imported?: number;
        skipped?: number;
        errors?: string[];
        error?: string;
      };

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not import library.");
      }

      setImportMessage(
        `Imported ${payload.imported ?? 0} row${
          payload.imported === 1 ? "" : "s"
        }. Skipped ${payload.skipped ?? 0}.`,
      );
      if (payload.errors?.length) {
        setImportError(payload.errors.slice(0, 3).join(" "));
      }
      router.refresh();
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Could not import library.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  async function importSteam() {
    setSteamMessage(null);
    setSteamError(null);
    setIsImportingSteam(true);
    try {
      const response = await fetch("/api/library/import/steam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: steamProfile }),
      });
      const payload = (await response.json()) as {
        imported?: number;
        skipped?: number;
        errors?: string[];
        error?: string;
      };

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not import Steam library.");
      }

      setSteamMessage(
        `Imported ${payload.imported ?? 0} Steam match${
          payload.imported === 1 ? "" : "es"
        } to Backlog. Skipped ${payload.skipped ?? 0}.`,
      );
      if (payload.errors?.length) {
        setSteamError(payload.errors.slice(0, 3).join(" "));
      }
      router.refresh();
    } catch (error) {
      setSteamError(
        error instanceof Error
          ? error.message
          : "Could not import Steam library.",
      );
    } finally {
      setIsImportingSteam(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,640px)_minmax(280px,360px)]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 rounded-lg border bg-panel p-5"
      >
        <div>
          <p className="text-sm font-medium text-cyan-200">Account</p>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Shape how other PlayNext players see you. Display names are unique
            and can be changed once every 5 days.
          </p>
          {demoMode ? (
            <p className="mt-3 rounded-md border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
              Local demo mode is active, so profile changes are stored in your
              session cookie.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input id="displayName" {...register("displayName")} />
          <p className="text-xs text-zinc-500">
            Letters, numbers, spaces, dots, dashes, and underscores only.
          </p>
          {errors.displayName ? (
            <p className="text-sm text-rose-300">
              {errors.displayName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatarUrl">Avatar URL</Label>
          <Input
            id="avatarUrl"
            {...register("avatarUrl")}
            placeholder="https://example.com/avatar.png"
          />
          {errors.avatarUrl ? (
            <p className="text-sm text-rose-300">{errors.avatarUrl.message}</p>
          ) : null}
        </div>

        <label className="flex items-start gap-3 rounded-md border bg-zinc-950/30 p-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-cyan-300"
            {...register("isPrivate")}
          />
          <span>
            <span className="block text-sm font-semibold">
              Make my profile private
            </span>
            <span className="mt-1 block text-sm text-zinc-400">
              Private profiles are hidden from Community and cannot be viewed by
              other players.
            </span>
          </span>
        </label>

        {serverError ? (
          <p
            role="alert"
            className="rounded-md border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-100"
          >
            {serverError}
          </p>
        ) : null}
        {message ? (
          <p
            role="status"
            className="rounded-md border border-lime-400/40 bg-lime-400/10 px-3 py-2 text-sm text-lime-100"
          >
            {message}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save settings
        </Button>
      </form>

      <aside className="space-y-5">
        <div className="rounded-lg border bg-panel p-5">
          <h2 className="text-lg font-bold">Profile preview</h2>
          <div className="mt-4 flex items-center gap-4">
            <AvatarPreview
              src={watchedAvatarUrl}
              name={watchedDisplayName || displayName}
            />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">
                {watchedDisplayName || displayName}
              </p>
              <p className="text-sm text-zinc-400">
                {watchedIsPrivate
                  ? "Hidden from Community"
                  : "Visible in Community"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-panel p-5">
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-md bg-indigo-400/15 text-indigo-100">
              <MessageCircle className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-bold">Discord</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Connect Discord so it appears on your public profile and future
                community features can recognize both sign-in methods.
              </p>
            </div>
          </div>
          {discord?.connected ? (
            <div className="mt-4 flex items-center gap-3 rounded-md border bg-zinc-950/40 p-3">
              <AvatarPreview
                src={discord.avatarUrl}
                name={discord.username ?? watchedDisplayName ?? displayName}
              />
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {discord.username ?? "Discord connected"}
                </p>
                <p className="text-sm text-zinc-400">Connected to PlayNext</p>
              </div>
            </div>
          ) : (
            <Button asChild className="mt-4 w-full" variant="secondary">
              <a href="/api/auth/discord/link">
                <MessageCircle className="h-4 w-4" />
                Connect Discord
              </a>
            </Button>
          )}
        </div>

        <div className="rounded-lg border bg-panel p-5">
          <div className="flex items-start gap-3">
            <Bell className="mt-1 h-5 w-5 text-cyan-200" aria-hidden />
            <div>
              <h2 className="text-lg font-bold">Notifications</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Choose which community events show up in your PlayNext inbox.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <PreferenceToggle
              label="New followers"
              checked={preferences.inAppFollowedYou}
              onChange={(checked) =>
                updatePreference("inAppFollowedYou", checked)
              }
            />
            <PreferenceToggle
              label="Activity reactions"
              checked={preferences.inAppReaction}
              onChange={(checked) => updatePreference("inAppReaction", checked)}
            />
            <PreferenceToggle
              label="Activity comments"
              checked={preferences.inAppComment}
              onChange={(checked) => updatePreference("inAppComment", checked)}
            />
            <PreferenceToggle
              label="System updates"
              checked={preferences.inAppSystem}
              onChange={(checked) => updatePreference("inAppSystem", checked)}
            />
            <PreferenceToggle
              label="Weekly email digest"
              checked={preferences.emailDigestEnabled}
              onChange={(checked) =>
                updatePreference("emailDigestEnabled", checked)
              }
            />
            <PreferenceToggle
              label="Quiet mode"
              icon={Moon}
              checked={preferences.quietModeEnabled}
              onChange={(checked) =>
                updatePreference("quietModeEnabled", checked)
              }
            />
          </div>
          {notificationError ? (
            <p role="alert" className="mt-3 text-sm text-rose-200">
              {notificationError}
            </p>
          ) : null}
          {notificationMessage ? (
            <p role="status" className="mt-3 text-sm text-lime-200">
              {notificationMessage}
            </p>
          ) : null}
          <Button
            type="button"
            className="mt-4 w-full"
            disabled={isSavingNotifications}
            onClick={saveNotificationPreferences}
          >
            {isSavingNotifications ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Save notifications
          </Button>
        </div>

        <div className="rounded-lg border bg-panel p-5">
          <div className="flex items-start gap-3">
            <Upload className="mt-1 h-5 w-5 text-cyan-200" aria-hidden />
            <div>
              <h2 className="text-lg font-bold">Library transfer</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Export your PlayNext library or paste a CSV with slug, status,
                isFavorite, overallRating, and review columns.
              </p>
            </div>
          </div>
          <Button asChild variant="secondary" className="mt-4 w-full">
            <a href="/api/library/export">Export CSV</a>
          </Button>
          <div className="mt-4 space-y-2">
            <Label htmlFor="libraryImportCsv">Import CSV</Label>
            <textarea
              id="libraryImportCsv"
              value={importCsv}
              onChange={(event) => setImportCsv(event.target.value)}
              rows={5}
              placeholder="slug,status,isFavorite,overallRating,review"
              className="w-full resize-y rounded-md border bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300"
            />
          </div>
          {importMessage ? (
            <p role="status" className="mt-3 text-sm text-lime-200">
              {importMessage}
            </p>
          ) : null}
          {importError ? (
            <p role="alert" className="mt-3 text-sm text-rose-200">
              {importError}
            </p>
          ) : null}
          <Button
            type="button"
            className="mt-4 w-full"
            disabled={isImporting || !importCsv.trim()}
            onClick={importLibrary}
          >
            {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Import CSV
          </Button>
          <div className="mt-5 border-t pt-4">
            <Label htmlFor="steamProfile">Steam public profile</Label>
            <Input
              id="steamProfile"
              value={steamProfile}
              onChange={(event) => setSteamProfile(event.target.value)}
              placeholder="steamcommunity.com/id/yourname"
              className="mt-2"
            />
            <p className="mt-2 text-xs text-zinc-500">
              Steam games import into Backlog after matching titles in the
              catalog. Your Steam profile and game details must be public.
            </p>
            {steamMessage ? (
              <p role="status" className="mt-3 text-sm text-lime-200">
                {steamMessage}
              </p>
            ) : null}
            {steamError ? (
              <p role="alert" className="mt-3 text-sm text-rose-200">
                {steamError}
              </p>
            ) : null}
            <Button
              type="button"
              className="mt-4 w-full"
              variant="secondary"
              disabled={isImportingSteam || !steamProfile.trim()}
              onClick={importSteam}
            >
              {isImportingSteam ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Import Steam library
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-rose-400/40 bg-rose-950/20 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 text-rose-200" />
            <div>
              <h2 className="text-lg font-bold text-rose-100">Danger zone</h2>
              <p className="mt-1 text-sm text-rose-100/80">
                Delete your account and all library, rating, follow, and
                activity data. This cannot be undone.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="deleteConfirmation">Type DELETE to confirm</Label>
            <Input
              id="deleteConfirmation"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
            />
          </div>
          {deleteError ? (
            <p role="alert" className="mt-3 text-sm text-rose-200">
              {deleteError}
            </p>
          ) : null}
          <Button
            type="button"
            variant="danger"
            className="mt-4"
            disabled={isDeleting || deleteConfirmation !== "DELETE"}
            onClick={deleteAccount}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete account
          </Button>
        </div>
      </aside>
    </section>
  );
}

function PreferenceToggle({
  label,
  checked,
  onChange,
  icon: Icon,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border bg-zinc-950/30 px-3 py-2">
      <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold">
        {Icon ? <Icon className="h-4 w-4 text-zinc-400" aria-hidden /> : null}
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-cyan-300"
      />
    </label>
  );
}

function AvatarPreview({ src, name }: { src?: string | null; name: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name} avatar preview`}
        className="h-20 w-20 rounded-md border object-cover"
      />
    );
  }

  return (
    <span className="inline-flex h-20 w-20 items-center justify-center rounded-md border bg-zinc-900 text-zinc-400">
      <UserRound className="h-8 w-8" aria-hidden />
    </span>
  );
}
