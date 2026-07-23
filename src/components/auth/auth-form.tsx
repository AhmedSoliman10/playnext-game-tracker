"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordSchema,
  signInSchema,
  signUpSchema,
  type ForgotPasswordInput,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validation/auth";

type AuthMode = "sign-in" | "sign-up" | "forgot-password";

interface AuthFormProps {
  mode: AuthMode;
  demoMode: boolean;
}

type FormValues = SignInInput &
  Partial<SignUpInput> &
  Partial<ForgotPasswordInput>;

function schemaForMode(mode: AuthMode) {
  if (mode === "sign-up") {
    return signUpSchema;
  }
  if (mode === "forgot-password") {
    return forgotPasswordSchema;
  }
  return signInSchema;
}

function endpointForMode(mode: AuthMode) {
  return `/api/auth/${mode}`;
}

function safeRedirectPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

export function AuthForm({ mode, demoMode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifiedState = searchParams.get("verified");
  const oauthError = searchParams.get("oauth_error");
  const discordHref = `/api/auth/discord?next=${encodeURIComponent(
    safeRedirectPath(searchParams.get("next")) ?? "/dashboard",
  )}`;
  const [serverMessage, setServerMessage] = useState<string | null>(
    mode === "sign-in" && verifiedState === "1"
      ? "Your email is verified. You can sign in now."
      : mode === "sign-in" && verifiedState === "maybe"
        ? "That confirmation link was already used or expired. Try signing in now; if Supabase says the email is not verified, request a fresh confirmation email."
        : mode === "sign-in" && searchParams.get("created") === "1"
          ? "Account created. Check your email to verify it, then sign in. If you do not see it, check your junk or spam folder."
          : null,
  );
  const [serverError, setServerError] = useState<string | null>(
    mode !== "forgot-password" && oauthError === "supabase"
      ? "Supabase authentication is not configured for this deployment."
      : mode !== "forgot-password" && oauthError === "discord"
        ? "Discord sign-in could not be completed. Check that Discord's redirect URL is the Supabase OAuth callback URL, then try again."
        : mode !== "forgot-password" && oauthError === "missing-code"
          ? "Discord did not return a valid sign-in code. Please try again."
          : null,
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(
      schemaForMode(mode),
    ) as unknown as Resolver<FormValues>,
    defaultValues: {
      email: demoMode ? "demo@playnext.local" : "",
      password: demoMode && mode !== "forgot-password" ? "playnext-demo" : "",
      displayName: "Demo player",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setServerMessage(null);

    const response = await fetch(endpointForMode(mode), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      message?: string;
      redirectTo?: string;
    };

    if (!response.ok || payload.error) {
      setServerError(payload.error ?? "Please check the form and try again.");
      return;
    }

    if (mode === "forgot-password") {
      setServerMessage(
        payload.message ??
          "If that email exists, a reset link is on the way. Check your junk or spam folder if it is not in your inbox.",
      );
      return;
    }

    if (mode === "sign-up" && payload.message && !payload.redirectTo) {
      setServerMessage(payload.message);
      return;
    }

    router.push(
      safeRedirectPath(searchParams.get("next")) ??
        safeRedirectPath(payload.redirectTo) ??
        "/dashboard",
    );
    router.refresh();
  }

  const title =
    mode === "sign-up"
      ? "Create your PlayNext account"
      : mode === "forgot-password"
        ? "Reset your password"
        : "Welcome back";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-md space-y-5 rounded-lg border bg-panel p-5"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-zinc-400">
          {mode === "forgot-password"
            ? "Enter your email and we will start a secure reset flow."
            : "Sign in to rate games, organize your lists, and get smarter recommendations."}
        </p>
        {demoMode ? (
          <p className="rounded-md border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
            Supabase credentials are not configured, so local demo mode is
            active.
          </p>
        ) : null}
      </div>

      {mode === "sign-up" ? (
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            autoComplete="name"
            {...register("displayName")}
          />
          {errors.displayName ? (
            <p className="text-sm text-rose-300">
              {errors.displayName.message}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-sm text-rose-300">{errors.email.message}</p>
        ) : null}
      </div>

      {mode !== "forgot-password" ? (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={
              mode === "sign-up" ? "new-password" : "current-password"
            }
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-sm text-rose-300">{errors.password.message}</p>
          ) : null}
        </div>
      ) : null}

      {serverError ? (
        <p
          role="alert"
          className="rounded-md border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-100"
        >
          {serverError}
        </p>
      ) : null}
      {serverMessage ? (
        <p
          role="status"
          className="rounded-md border border-lime-400/40 bg-lime-400/10 px-3 py-2 text-sm text-lime-100"
        >
          {serverMessage}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        {mode === "sign-up"
          ? "Create account"
          : mode === "forgot-password"
            ? "Send reset link"
            : "Sign in"}
      </Button>

      {mode !== "forgot-password" ? (
        <>
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-zinc-500">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          {demoMode ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled
              title="Discord sign-in needs Supabase authentication to be configured."
            >
              <DiscordLogo />
              Continue with Discord
            </Button>
          ) : (
            <Button asChild variant="secondary" className="w-full">
              <Link href={discordHref}>
                <DiscordLogo />
                Continue with Discord
              </Link>
            </Button>
          )}
        </>
      ) : null}

      <div className="flex flex-wrap justify-between gap-3 text-sm text-zinc-400">
        {mode !== "sign-in" ? (
          <Link href="/login">Sign in</Link>
        ) : (
          <Link href="/signup">Create account</Link>
        )}
        {mode !== "forgot-password" ? (
          <Link href="/forgot-password">Forgot password?</Link>
        ) : null}
      </div>
    </form>
  );
}

function DiscordLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M18.9 5.2A15.3 15.3 0 0 0 15.1 4l-.2.4c1.4.4 2 .9 2.7 1.4a12.9 12.9 0 0 0-11.2 0A8.7 8.7 0 0 1 9.1 4L8.9 4a15.3 15.3 0 0 0-3.8 1.2C2.7 8.8 2 12.3 2.3 15.8A15.5 15.5 0 0 0 7 18.2c.4-.5.7-1 1-1.6-.6-.2-1.1-.5-1.6-.8l.4-.3a10.7 10.7 0 0 0 10.4 0l.4.3c-.5.3-1 .6-1.6.8.3.6.6 1.1 1 1.6a15.5 15.5 0 0 0 4.7-2.4c.4-4.1-.7-7.5-2.8-10.6ZM8.7 14.2c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8Zm6.6 0c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8Z"
      />
    </svg>
  );
}
