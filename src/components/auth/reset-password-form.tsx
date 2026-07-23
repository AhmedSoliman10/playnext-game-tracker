"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validation/auth";

export function ResetPasswordForm() {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    setServerMessage(null);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      message?: string;
    };

    if (!response.ok || payload.error) {
      setServerError(
        payload.error ??
          "This reset session is no longer valid. Request a fresh link.",
      );
      return;
    }

    setServerMessage(payload.message ?? "Your password has been updated.");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-md space-y-5 rounded-lg border bg-panel p-5"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <p className="text-sm text-zinc-400">
          Enter a new password for your PlayNext account.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-rose-300">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p className="text-sm text-rose-300">
            {errors.confirmPassword.message}
          </p>
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
      {serverMessage ? (
        <div
          role="status"
          className="space-y-3 rounded-md border border-lime-400/40 bg-lime-400/10 px-3 py-3 text-sm text-lime-100"
        >
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {serverMessage}
          </p>
          <Button asChild variant="secondary" size="sm">
            <Link href="/login">Sign in with the new password</Link>
          </Button>
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        Update password
      </Button>
    </form>
  );
}
