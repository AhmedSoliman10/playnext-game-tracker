"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName,
      avatarUrl: avatarUrl ?? "",
    },
  });

  async function onSubmit(values: ProfileInput) {
    setMessage(null);
    setServerError(null);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok || payload.error) {
      setServerError(payload.error ?? "Could not update profile.");
      return;
    }
    setMessage("Profile updated.");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xl space-y-5 rounded-lg border bg-panel p-5"
    >
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Update your PlayNext profile. Authentication is handled by Supabase
          when credentials are configured.
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
        {errors.displayName ? (
          <p className="text-sm text-rose-300">{errors.displayName.message}</p>
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
        <p role="alert" className="text-sm text-rose-300">
          {serverError}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-sm text-lime-200">
          {message}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save settings
      </Button>
    </form>
  );
}
