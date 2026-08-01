"use client";

import type React from "react";
import { useState } from "react";
import { EyeOff, Loader2, Minus, Plus, Timer, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecommendationFeedbackAction } from "@/lib/types";

export function RecommendationFeedbackControls({
  gameSlug,
  platform,
}: {
  gameSlug: string;
  platform?: string | null;
}) {
  const [busyAction, setBusyAction] =
    useState<RecommendationFeedbackAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendFeedback(
    action: RecommendationFeedbackAction,
    options?: { platform?: string | null },
  ) {
    setBusyAction(action);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/recommendation-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameSlug,
          action,
          platform: options?.platform ?? null,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Could not save feedback.");
      }
      setMessage("Recommendation tuning saved.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save feedback.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <FeedbackButton
          label="More like this"
          action="show_more"
          busyAction={busyAction}
          onClick={() => sendFeedback("show_more")}
          icon={Plus}
        />
        <FeedbackButton
          label="Less like this"
          action="show_less"
          busyAction={busyAction}
          onClick={() => sendFeedback("show_less")}
          icon={Minus}
        />
        <FeedbackButton
          label="Hide"
          action="hide_game"
          busyAction={busyAction}
          onClick={() => sendFeedback("hide_game")}
          icon={EyeOff}
        />
        <FeedbackButton
          label="Shorter picks"
          action="prefer_shorter"
          busyAction={busyAction}
          onClick={() => sendFeedback("prefer_shorter")}
          icon={Timer}
        />
        {platform ? (
          <FeedbackButton
            label={`More on ${platform}`}
            action="prefer_platform"
            busyAction={busyAction}
            onClick={() =>
              sendFeedback("prefer_platform", {
                platform,
              })
            }
            icon={Monitor}
          />
        ) : null}
      </div>
      {message ? (
        <p className="text-xs font-medium text-lime-200" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs font-medium text-rose-200" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FeedbackButton({
  label,
  action,
  busyAction,
  onClick,
  icon: Icon,
}: {
  label: string;
  action: RecommendationFeedbackAction;
  busyAction: RecommendationFeedbackAction | null;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const isBusy = busyAction === action;
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={busyAction !== null}
      onClick={onClick}
    >
      {isBusy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
