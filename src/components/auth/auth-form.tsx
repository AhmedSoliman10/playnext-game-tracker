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

export function AuthForm({ mode, demoMode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
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
        payload.message ?? "If that email exists, a reset link is on the way.",
      );
      return;
    }

    router.push(searchParams.get("next") ?? payload.redirectTo ?? "/dashboard");
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
