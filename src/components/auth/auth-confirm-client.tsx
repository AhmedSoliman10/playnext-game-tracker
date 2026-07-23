"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function AuthConfirmClient() {
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

      const next = safeNext(searchParams.get("next"));
      const code = searchParams.get("code");
      const signInFallback = next.startsWith("/login")
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
      } else {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
          if (signInFallback) {
            router.replace(signInFallback);
            router.refresh();
            return;
          }

          setError("This authentication link is invalid or expired.");
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
  }, [router, searchParams]);

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
              <Link href="/forgot-password">Request a new link</Link>
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
