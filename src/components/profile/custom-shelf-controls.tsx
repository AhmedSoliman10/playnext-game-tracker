"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ShelfOption {
  id: string;
  title: string;
}

export function CustomShelfCreator() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createShelf() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/custom-shelves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description.trim() ? description : null,
          isPublic,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not create shelf.");
      }
      setTitle("");
      setDescription("");
      setMessage("Shelf created. Reloading...");
      window.location.reload();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create shelf.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border bg-zinc-950/40 p-4">
      <h3 className="font-bold">Create a custom shelf</h3>
      <div className="mt-3 grid gap-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-zinc-300">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
            className="h-10 w-full rounded-md border bg-zinc-950 px-3 text-sm outline-none focus:border-cyan-300"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-zinc-300">
            Description
          </span>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={240}
            className="h-10 w-full rounded-md border bg-zinc-950 px-3 text-sm outline-none focus:border-cyan-300"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
            className="h-4 w-4 accent-cyan-300"
          />
          Public shelf
        </label>
      </div>
      {message ? <p className="mt-2 text-sm text-lime-200">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-rose-200">{error}</p> : null}
      <Button
        type="button"
        className="mt-3 w-full"
        disabled={busy || title.trim().length < 2}
        onClick={createShelf}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Create shelf
      </Button>
    </div>
  );
}

export function AddToShelfControl({
  gameSlug,
  shelves,
}: {
  gameSlug: string;
  shelves: ShelfOption[];
}) {
  const [selectedShelfId, setSelectedShelfId] = useState(shelves[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!shelves.length) {
    return null;
  }

  async function addToShelf() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/custom-shelves/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shelfId: selectedShelfId, gameSlug }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not add to shelf.");
      }
      setMessage("Added to shelf.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not add to shelf.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <label className="sr-only" htmlFor={`shelf-${gameSlug}`}>
          Add to shelf
        </label>
        <select
          id={`shelf-${gameSlug}`}
          value={selectedShelfId}
          onChange={(event) => setSelectedShelfId(event.target.value)}
          className="h-9 min-w-0 rounded-md border bg-zinc-950 px-2 text-xs outline-none focus:border-cyan-300"
        >
          {shelves.map((shelf) => (
            <option key={shelf.id} value={shelf.id}>
              {shelf.title}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          disabled={busy || !selectedShelfId}
          onClick={addToShelf}
          aria-label="Add game to selected shelf"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
      {message ? <p className="text-xs text-lime-200">{message}</p> : null}
      {error ? <p className="text-xs text-rose-200">{error}</p> : null}
    </div>
  );
}
