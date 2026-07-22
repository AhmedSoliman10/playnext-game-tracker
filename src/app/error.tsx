"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg rounded-lg border bg-panel p-6 text-center">
        <h1 className="text-2xl font-bold">PlayNext hit a snag.</h1>
        <p className="mt-2 text-zinc-400">
          {error.message ||
            "Something unexpected happened while loading this page."}
        </p>
        <Button type="button" className="mt-5" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
