"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock,
  EyeOff,
  Heart,
  PauseCircle,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LibraryEntry } from "@/lib/types";
import { STATUS_PROMPTS, type GameStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusActions: Array<{
  status: GameStatus;
  icon: React.ComponentType<{ className?: string }>;
  variant: "default" | "secondary" | "outline" | "ghost" | "danger";
  compactLabel: string;
}> = [
  { status: "played", icon: Check, variant: "default", compactLabel: "Played" },
  {
    status: "playing",
    icon: Clock,
    variant: "secondary",
    compactLabel: "Playing",
  },
  {
    status: "want_to_play",
    icon: Plus,
    variant: "outline",
    compactLabel: "Backlog",
  },
  {
    status: "dropped",
    icon: PauseCircle,
    variant: "ghost",
    compactLabel: "Dropped",
  },
  {
    status: "not_interested",
    icon: EyeOff,
    variant: "danger",
    compactLabel: "Hide",
  },
  {
    status: "skipped",
    icon: RotateCcw,
    variant: "ghost",
    compactLabel: "Skip",
  },
];

export function StatusButtons({
  gameSlug,
  currentStatus,
  favorite,
  compact = false,
  removable = false,
  onChanged,
  onRemoved,
  onPlayed,
}: {
  gameSlug: string;
  currentStatus?: GameStatus | null;
  favorite?: boolean;
  compact?: boolean;
  removable?: boolean;
  onChanged?: (entry: LibraryEntry) => void;
  onRemoved?: (gameSlug: string) => void;
  onPlayed?: () => void;
}) {
  const router = useRouter();
  const [busyStatus, setBusyStatus] = useState<
    GameStatus | "favorite" | "remove" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [localFavorite, setLocalFavorite] = useState(Boolean(favorite));

  async function updateStatus(status: GameStatus) {
    setBusyStatus(status);
    setError(null);
    try {
      const response = await fetch("/api/user-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug, status }),
      });
      const payload = (await response.json()) as {
        entry?: LibraryEntry | null;
        skipped?: boolean;
        gameSlug?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not update status.");
      }
      if (payload.entry) {
        onChanged?.(payload.entry);
      } else if (payload.skipped) {
        onRemoved?.(payload.gameSlug ?? gameSlug);
      } else {
        throw new Error(payload.error ?? "Could not update status.");
      }
      if (!onChanged && !onRemoved) {
        router.refresh();
      }
      if (status === "played" && payload.entry) {
        onPlayed?.();
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not update status.",
      );
    } finally {
      setBusyStatus(null);
    }
  }

  async function toggleFavorite() {
    setBusyStatus("favorite");
    setError(null);
    const nextFavorite = !localFavorite;
    try {
      const response = await fetch("/api/user-games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug, isFavorite: nextFavorite }),
      });
      const payload = (await response.json()) as {
        entry?: LibraryEntry;
        error?: string;
      };
      if (!response.ok || !payload.entry) {
        throw new Error(payload.error ?? "Could not update favorite.");
      }
      setLocalFavorite(nextFavorite);
      onChanged?.(payload.entry);
      if (!onChanged) {
        router.refresh();
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not update favorite.",
      );
    } finally {
      setBusyStatus(null);
    }
  }

  async function removeGame() {
    const confirmed = window.confirm(
      "Remove this game from your library? Your saved status and rating will be deleted.",
    );
    if (!confirmed) {
      return;
    }

    setBusyStatus("remove");
    setError(null);
    try {
      const response = await fetch("/api/user-games", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        gameSlug?: string;
        error?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not remove this game.");
      }
      onRemoved?.(payload.gameSlug ?? gameSlug);
      if (!onRemoved) {
        router.refresh();
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not remove this game.",
      );
    } finally {
      setBusyStatus(null);
    }
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-2">
          <Button
            type="button"
            variant={localFavorite ? "default" : "outline"}
            size="icon"
            onClick={toggleFavorite}
            disabled={busyStatus !== null}
            aria-label={
              localFavorite ? "Remove from favorites" : "Add to favorites"
            }
            aria-pressed={localFavorite}
            title={localFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={cn("h-4 w-4", localFavorite && "fill-zinc-950")}
            />
          </Button>
          {statusActions.map((action) => {
            const Icon = action.icon;
            const active = currentStatus === action.status;
            return (
              <Button
                key={action.status}
                type="button"
                variant={active ? "default" : action.variant}
                size="icon"
                onClick={() => updateStatus(action.status)}
                disabled={busyStatus !== null}
                aria-label={STATUS_PROMPTS[action.status]}
                aria-pressed={active}
                title={action.compactLabel}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
          {removable ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={removeGame}
              disabled={busyStatus !== null}
              aria-label="Remove from library"
              title="Remove from library"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        <Button
          type="button"
          variant={localFavorite ? "default" : "outline"}
          onClick={toggleFavorite}
          disabled={busyStatus !== null}
          aria-pressed={localFavorite}
          className="h-auto min-h-11 whitespace-normal px-3 py-2 text-center leading-tight"
        >
          <Heart className={cn("h-4 w-4", localFavorite && "fill-zinc-950")} />
          Favorite
        </Button>
        {statusActions.map((action) => {
          const Icon = action.icon;
          const active = currentStatus === action.status;
          return (
            <Button
              key={action.status}
              type="button"
              variant={active ? "default" : action.variant}
              onClick={() => updateStatus(action.status)}
              disabled={busyStatus !== null}
              aria-label={STATUS_PROMPTS[action.status]}
              aria-pressed={active}
              className="h-auto min-h-11 whitespace-normal px-3 py-2 text-center leading-tight"
            >
              <Icon className="h-4 w-4" />
              {action.compactLabel}
            </Button>
          );
        })}
        {removable ? (
          <Button
            type="button"
            variant="ghost"
            onClick={removeGame}
            disabled={busyStatus !== null}
            className="h-auto min-h-11 whitespace-normal px-3 py-2 text-center leading-tight"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
