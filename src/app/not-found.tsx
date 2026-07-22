import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg rounded-lg border bg-panel p-6 text-center">
        <h1 className="text-2xl font-bold">We could not find that page.</h1>
        <p className="mt-2 text-zinc-400">The game or page may have moved.</p>
        <Button asChild className="mt-5">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
