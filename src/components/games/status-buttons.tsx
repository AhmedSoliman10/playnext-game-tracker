"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock,
  Eye,
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
  { status: "played", icon: Check, variant: "outline", compactLabel: "Played" },
  {
    status: "playing",
    icon: Clock,
    variant: "outline",
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
    variant: "outline",
    compactLabel: "Hide",
  },
  {
    status: "skipped",
    icon: RotateCcw,
    variant: "ghost",
    compactLabel: "Skip",
  },
];

const activeStatusLabels: Record<
  GameStatus,
  {
    label: string;
    ariaLabel: string;
    title: string;
    icon?: React.ComponentType<{ className?: string }>;
  }
> = {
  played: {
    label: "Clear played",
    ariaLabel: "Remove played status",
    title: "Remove played status",
  },
  playing: {
    label: "Stop playing",
    ariaLabel: "Remove currently playing status",
    title: "Remove currently playing status",
  },
  want_to_play: {
    label: "Clear backlog",
    ariaLabel: "Remove from want to play",
    title: "Remove from want to play",
  },
  dropped: {
    label: "Clear dropped",
    ariaLabel: "Remove dropped status",
    title: "Remove dropped status",
  },
  not_interested: {
    label: "Unhide",
    ariaLabel: "Unhide from library",
    title: "Unhide from library",
    icon: Eye,
  },
  skipped: {
    label: "Clear skip",
    ariaLabel: "Clear skipped status",
    title: "Clear skipped status",
  },
};

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
    GameStatus | "favorite" | "remove" | "unhide" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [localFavorite, setLocalFavorite] = useState(Boolean(favorite));

  async function updateStatus(status: GameStatus) {
    if (currentStatus === status) {
      if (status === "not_interested") {
        await unhideGame();
        return;
      }

      await deleteLibraryEntry(status, false);
      return;
    }

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

  async function deleteLibraryEntry(
    busyKey: GameStatus | "remove",
    shouldConfirm: boolean,
  ) {
    if (shouldConfirm) {
      const confirmed = window.confirm(
        "Remove this game from your library? Your saved status and rating will be deleted.",
      );
      if (!confirmed) {
        return;
      }
    }

    setBusyStatus(busyKey);
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

  async function removeGame() {
    await deleteLibraryEntry("remove", true);
  }

  async function unhideGame() {
    setBusyStatus("unhide");
    setError(null);
    try {
      const response = await fetch("/api/user-games", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        entry?: LibraryEntry | null;
        gameSlug?: string;
        error?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Could not unhide this game.");
      }
      if (payload.entry) {
        onChanged?.(payload.entry);
      } else {
        onRemoved?.(payload.gameSlug ?? gameSlug);
      }
      if (!onChanged && !onRemoved) {
        router.refresh();
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not unhide this game.",
      );
    } finally {
      setBusyStatus(null);
    }
  }

  function getActionContent(
    action: (typeof statusActions)[number],
    active: boolean,
  ) {
    if (!active) {
      return {
        Icon: action.icon,
        label: action.compactLabel,
        ariaLabel: STATUS_PROMPTS[action.status],
        title: action.compactLabel,
        variant: action.variant,
      };
    }

    const activeLabel = activeStatusLabels[action.status];
    return {
      Icon: activeLabel.icon ?? action.icon,
      label: activeLabel.label,
      ariaLabel: activeLabel.ariaLabel,
      title: activeLabel.title,
      variant:
        action.status === "not_interested"
          ? ("danger" as const)
          : ("default" as const),
    };
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
            const active = currentStatus === action.status;
            const { Icon, ariaLabel, title, variant } = getActionContent(
              action,
              active,
            );
            return (
              <Button
                key={action.status}
                type="button"
                variant={variant}
                size="icon"
                onClick={() => updateStatus(action.status)}
                disabled={busyStatus !== null}
                aria-label={ariaLabel}
                aria-pressed={active}
                title={title}
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
          const active = currentStatus === action.status;
          const { Icon, label, ariaLabel, title, variant } = getActionContent(
            action,
            active,
          );
          return (
            <Button
              key={action.status}
              type="button"
              variant={variant}
              onClick={() => updateStatus(action.status)}
              disabled={busyStatus !== null}
              aria-label={ariaLabel}
              aria-pressed={active}
              title={title}
              className="h-auto min-h-11 whitespace-normal px-3 py-2 text-center leading-tight"
            >
              <Icon className="h-4 w-4" />
              {label}
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
