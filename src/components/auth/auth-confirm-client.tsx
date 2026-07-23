"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthConfirmFlow = "signup" | "reset" | "generic";

const EMAIL_OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

function nextForFlow(flow: AuthConfirmFlow, queryNext: string | null) {
  if (flow === "signup") {
    return "/login?verified=1";
  }

  if (flow === "reset") {
    return "/reset-password";
  }

  return safeNext(queryNext);
}

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return Boolean(value && EMAIL_OTP_TYPES.has(value));
}

function hashParams() {
  if (typeof window === "undefined" || !window.location.hash) {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

function missingTokenMessage(flow: AuthConfirmFlow) {
  if (flow === "reset") {
    return "This reset link did not include a valid Supabase token. Request a fresh reset email, and make sure the Supabase email template button uses {{ .ConfirmationURL }}.";
  }

  if (flow === "signup") {
    return "This verification link did not include a valid Supabase token. Try signing in if you already verified, or request a fresh confirmation email.";
  }

  return "This authentication link is invalid or expired.";
}

export function AuthConfirmClient({
  flow = "generic",
}: {
  flow?: AuthConfirmFlow;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function confirm() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setError("Supabase is not configured for this deployment.");
        return;
      }

      const next = nextForFlow(flow, searchParams.get("next"));
      const code = searchParams.get("code");
      const tokenHash =
        searchParams.get("token_hash") ?? searchParams.get("token");
      const tokenType = searchParams.get("type");
      const currentHashParams = hashParams();
      const accessToken = currentHashParams.get("access_token");
      const refreshToken = currentHashParams.get("refresh_token");
      const signInFallback =
        flow === "signup" || next.startsWith("/login")
          ? "/login?verified=maybe"
          : null;

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (signInFallback) {
            router.replace(signInFallback);
            router.refresh();
            return;
          }

          setError("This authentication link is invalid or expired.");
          return;
        }
      } else if (tokenHash && isEmailOtpType(tokenType)) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: tokenType,
        });

        if (verifyError) {
          if (signInFallback) {
            router.replace(signInFallback);
            router.refresh();
            return;
          }

          setError("This authentication link is invalid or expired.");
          return;
        }
      } else if (accessToken && refreshToken) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (setSessionError) {
          setError("This authentication link is invalid or expired.");
          return;
        }
      } else {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
          if (signInFallback) {
            router.replace(signInFallback);
            router.refresh();
            return;
          }

          setError(missingTokenMessage(flow));
          return;
        }
      }

      if (!mounted) {
        return;
      }

      if (next.startsWith("/login")) {
        await supabase.auth.signOut();
      }

      router.replace(next);
      router.refresh();
    }

    void confirm();

    return () => {
      mounted = false;
    };
  }, [flow, router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border bg-panel p-6 text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-bold">Link expired</h1>
            <p role="alert" className="mt-3 text-sm text-zinc-400">
              {error}
            </p>
            <Button asChild className="mt-5">
              <Link href={flow === "signup" ? "/login" : "/forgot-password"}>
                {flow === "signup" ? "Go to sign in" : "Request a new link"}
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Loader2
              className="mx-auto h-8 w-8 animate-spin text-cyan-200"
              aria-hidden
            />
            <h1 className="mt-4 text-2xl font-bold">Confirming your account</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Securely finishing the Supabase authentication flow.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
