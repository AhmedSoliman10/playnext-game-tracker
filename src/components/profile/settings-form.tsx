"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileSchema, type ProfileInput } from "@/lib/validation/auth";

export function SettingsForm({
  displayName,
  avatarUrl,
  demoMode,
}: {
  displayName: string;
  avatarUrl?: string | null;
  demoMode: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName,
      avatarUrl: avatarUrl ?? "",
    },
  });
  const watchedAvatarUrl = useWatch({ control, name: "avatarUrl" });

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
            <AvatarPreview src={watchedAvatarUrl} name={displayName} />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{displayName}</p>
              <p className="text-sm text-zinc-400">Visible in Community</p>
            </div>
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
