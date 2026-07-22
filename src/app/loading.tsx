export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border bg-panel p-6 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-md bg-cyan-300" />
        <p className="font-semibold">Loading PlayNext...</p>
        <p className="mt-2 text-sm text-zinc-400">Getting your games ready.</p>
      </div>
    </main>
  );
}
