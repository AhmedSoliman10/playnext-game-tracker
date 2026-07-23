"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  Star,
} from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { GameArtwork } from "@/components/games/game-artwork";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GameSummary } from "@/lib/games/types";
import { recommendationMessage } from "@/lib/recommendations/scoring";
import type { LibraryEntry } from "@/lib/types";
import {
  ratingFormSchema,
  type RatingFormInput,
} from "@/lib/validation/rating";

const overallOptions = Array.from(
  { length: 19 },
  (_, index) => 1 + index * 0.5,
);
const wholeOptions = Array.from({ length: 10 }, (_, index) => index + 1);

type RatingKey =
  | "finished"
  | "overallRating"
  | "storyRating"
  | "gameplayRating"
  | "visualsRating"
  | "soundtrackRating"
  | "difficultyRating"
  | "wouldRecommend"
  | "review";

const steps: Array<{ key: RatingKey; title: string; optional?: boolean }> = [
  { key: "finished", title: "Did you finish the game?", optional: true },
  { key: "overallRating", title: "What overall rating would you give it?" },
  {
    key: "storyRating",
    title: "What did you think about the story?",
    optional: true,
  },
  {
    key: "gameplayRating",
    title: "What did you think about the gameplay?",
    optional: true,
  },
  {
    key: "visualsRating",
    title: "What did you think about the visuals?",
    optional: true,
  },
  {
    key: "soundtrackRating",
    title: "What did you think about the soundtrack?",
    optional: true,
  },
  {
    key: "difficultyRating",
    title: "How difficult did you find it?",
    optional: true,
  },
  {
    key: "wouldRecommend",
    title: "Would you recommend it to someone else?",
    optional: true,
  },
  { key: "review", title: "Add an optional short review.", optional: true },
];

type CategoryRatingKey =
  | "storyRating"
  | "gameplayRating"
  | "visualsRating"
  | "soundtrackRating"
  | "difficultyRating";

function RatingGrid({
  values,
  current,
  onSelect,
  onSkip,
  ariaLabel,
  allowSkip = true,
}: {
  values: number[];
  current?: number | null;
  onSelect: (value: number | null) => void;
  onSkip?: () => void;
  ariaLabel: string;
  allowSkip?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div
        className="grid grid-cols-3 gap-2 sm:grid-cols-5"
        role="radiogroup"
        aria-label={ariaLabel}
      >
        {values.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={current === value}
            onClick={() => onSelect(value)}
            className={`h-12 rounded-md border text-sm font-semibold transition focus-visible:outline-2 ${
              current === value
                ? "border-lime-300 bg-lime-300 text-zinc-950"
                : "bg-zinc-950 text-zinc-200 hover:border-lime-300"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      {allowSkip ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onSelect(null);
            onSkip?.();
          }}
        >
          Skip this detail
        </Button>
      ) : null}
    </div>
  );
}

function isStepAnswered(
  key: RatingKey,
  values: Partial<RatingFormInput>,
  overallRating?: number | null,
) {
  if (key === "overallRating") {
    return typeof overallRating === "number";
  }

  if (key === "finished" || key === "wouldRecommend") {
    return typeof values[key] === "boolean";
  }

  if (key === "review") {
    return typeof values.review === "string" && values.review.trim().length > 0;
  }

  return typeof values[key as CategoryRatingKey] === "number";
}

export function RatingDialog({
  game,
  open,
  onOpenChange,
  onSaved,
}: {
  game: GameSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (
    entry: LibraryEntry,
    message: string,
    recommendation?: GameSummary,
  ) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedOverallRating, setSelectedOverallRating] = useState<
    number | null
  >(null);
  const form = useForm<RatingFormInput>({
    defaultValues: {
      gameSlug: game.slug,
      finished: null,
      review: "",
    },
  });
  const values = useWatch({ control: form.control });
  const watchedOverallRating = useWatch({
    control: form.control,
    name: "overallRating",
  });
  const overallRating = selectedOverallRating ?? watchedOverallRating;
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const hasOverallRating = typeof overallRating === "number";
  const canContinue = step.key !== "overallRating" || hasOverallRating;

  function resetDialog() {
    form.reset({
      gameSlug: game.slug,
      finished: null,
      review: "",
    });
    setSelectedOverallRating(null);
    setStepIndex(0);
    setServerError(null);
  }

  function setCategoryValue(key: CategoryRatingKey, value: number | null) {
    form.setValue(key, value, { shouldValidate: true, shouldDirty: true });
  }

  function setBooleanValue(
    key: "finished" | "wouldRecommend",
    value: boolean | null,
  ) {
    form.setValue(key, value, { shouldValidate: true, shouldDirty: true });
  }

  function setOverallValue(value: number) {
    setSelectedOverallRating(value);
    form.setValue("overallRating", value, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  function goNext() {
    setStepIndex((index) => Math.min(steps.length - 1, index + 1));
  }

  function clearCurrentOptionalStep() {
    if (step.key === "finished" || step.key === "wouldRecommend") {
      setBooleanValue(step.key, null);
      return;
    }

    if (step.key === "review") {
      form.setValue("review", "", { shouldValidate: true, shouldDirty: true });
      return;
    }

    if (step.key !== "overallRating") {
      setCategoryValue(step.key, null);
    }
  }

  function skipCurrentStep() {
    if (!step.optional) {
      return;
    }

    clearCurrentOptionalStep();
    if (isLastStep) {
      void form.handleSubmit(submit)();
      return;
    }
    goNext();
  }

  async function submit(rawValues: RatingFormInput) {
    const parsed = ratingFormSchema.safeParse({
      ...rawValues,
      overallRating: selectedOverallRating ?? rawValues.overallRating,
    });
    if (!parsed.success) {
      setServerError(
        parsed.error.issues[0]?.message ?? "Please check your rating.",
      );
      return;
    }

    setIsSaving(true);
    setServerError(null);
    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as {
        entry?: LibraryEntry;
        error?: string;
      };
      if (!response.ok || !payload.entry?.rating) {
        throw new Error(payload.error ?? "Could not save rating.");
      }

      const source = await getFirstRecommendation(game.slug);
      onSaved?.(
        payload.entry,
        recommendationMessage(game.title, payload.entry.rating, source),
        source,
      );
      resetDialog();
      onOpenChange(false);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Could not save rating.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function renderStep() {
    if (step.key === "finished") {
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          <Button
            type="button"
            onClick={() => setBooleanValue("finished", true)}
            variant={values.finished === true ? "default" : "outline"}
          >
            Yes
          </Button>
          <Button
            type="button"
            onClick={() => setBooleanValue("finished", false)}
            variant={values.finished === false ? "default" : "outline"}
          >
            Not yet
          </Button>
          <Button type="button" onClick={skipCurrentStep} variant="ghost">
            Skip
          </Button>
        </div>
      );
    }

    if (step.key === "overallRating") {
      return (
        <RatingGrid
          values={overallOptions}
          current={overallRating}
          onSelect={(value) => {
            if (value !== null) {
              setOverallValue(value);
              goNext();
            }
          }}
          ariaLabel="Overall rating from 1 to 10"
          allowSkip={false}
        />
      );
    }

    if (step.key === "wouldRecommend") {
      return (
        <div className="grid grid-cols-3 gap-3">
          <Button
            type="button"
            onClick={() => setBooleanValue("wouldRecommend", true)}
            variant={values.wouldRecommend === true ? "default" : "outline"}
          >
            Yes
          </Button>
          <Button
            type="button"
            onClick={() => setBooleanValue("wouldRecommend", false)}
            variant={values.wouldRecommend === false ? "default" : "outline"}
          >
            No
          </Button>
          <Button type="button" onClick={skipCurrentStep} variant="ghost">
            Skip
          </Button>
        </div>
      );
    }

    if (step.key === "review") {
      return (
        <div className="space-y-2">
          <Label htmlFor="review">Short review</Label>
          <Textarea
            id="review"
            maxLength={800}
            placeholder="What stood out, good or bad?"
            {...form.register("review")}
          />
        </div>
      );
    }

    const categoryKey = step.key as CategoryRatingKey;
    return (
      <RatingGrid
        values={wholeOptions}
        current={values[categoryKey] as number | null | undefined}
        onSelect={(value) => {
          setCategoryValue(categoryKey, value);
          if (value !== null) {
            goNext();
          }
        }}
        onSkip={skipCurrentStep}
        ariaLabel={`${step.title} Rating from 1 to 10`}
      />
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetDialog();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        <div className="grid md:grid-cols-[190px_1fr]">
          <div className="hidden border-r bg-zinc-950 md:block">
            <GameArtwork
              src={game.coverImageUrl}
              alt={`${game.title} cover artwork`}
              className="h-full min-h-[520px] w-full rounded-none"
            />
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex gap-4 pr-10 md:block md:pr-0">
              <GameArtwork
                src={game.coverImageUrl}
                alt={`${game.title} cover artwork`}
                className="h-24 w-16 shrink-0 md:hidden"
              />
              <div className="min-w-0">
                <DialogTitle className="line-clamp-2 text-2xl font-bold">
                  Rate {game.title}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-zinc-400">
                  Step {stepIndex + 1} of {steps.length}. Only the overall
                  rating is required.
                </DialogDescription>
              </div>
            </div>

            <div className="mt-5 h-1.5 rounded-full bg-zinc-800" aria-hidden>
              <div
                className="h-full rounded-full bg-lime-300 transition-all"
                style={{
                  width: `${((stepIndex + 1) / steps.length) * 100}%`,
                }}
              />
            </div>

            <div
              className="mt-3 flex gap-2 overflow-x-auto pb-1"
              aria-label="Rating steps"
            >
              {steps.map((item, index) => {
                const active = index === stepIndex;
                const answered = isStepAnswered(
                  item.key,
                  values,
                  overallRating,
                );
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStepIndex(index)}
                    aria-current={active ? "step" : undefined}
                    aria-label={`Go to rating step ${index + 1}${
                      answered ? ", answered" : ""
                    }`}
                    title={item.title}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-full border text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      active
                        ? "border-cyan-300 bg-cyan-300 text-zinc-950"
                        : answered
                          ? "border-lime-300/50 bg-lime-300/15 text-lime-100 hover:border-lime-300"
                          : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100"
                    }`}
                  >
                    {answered && !active ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={form.handleSubmit(submit)}
              className="mt-5 space-y-5"
            >
              <div className="rounded-lg border bg-zinc-950/80 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <p className="text-lg font-semibold">{step.title}</p>
                  {step.key === "overallRating" && hasOverallRating ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-lime-300 px-2 py-1 text-sm font-bold text-zinc-950">
                      <Star className="h-4 w-4 fill-zinc-950" />
                      {overallRating}/10
                    </span>
                  ) : step.optional ? (
                    <span className="rounded-md border border-zinc-700 px-2 py-1 text-xs font-semibold uppercase text-zinc-400">
                      Optional
                    </span>
                  ) : null}
                </div>
                {renderStep()}
              </div>
              {serverError ? (
                <p role="alert" className="text-sm text-rose-300">
                  {serverError}
                </p>
              ) : null}
              {form.formState.errors.overallRating ? (
                <p className="text-sm text-rose-300">
                  {form.formState.errors.overallRating.message}
                </p>
              ) : null}
              <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setStepIndex((index) => Math.max(0, index - 1))
                  }
                  disabled={stepIndex === 0 || isSaving}
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {step.optional ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={skipCurrentStep}
                      disabled={isSaving}
                    >
                      {isLastStep ? "Skip and save" : "Skip question"}
                    </Button>
                  ) : null}
                  {isLastStep ? (
                    <Button key="save-rating" type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Save rating
                    </Button>
                  ) : (
                    <Button
                      key={`continue-rating-${stepIndex}`}
                      type="button"
                      onClick={goNext}
                      disabled={!canContinue || isSaving}
                    >
                      {step.optional ? "Continue" : "Next"}{" "}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

async function getFirstRecommendation(currentGameSlug: string) {
  try {
    const recommendationsResponse = await fetch("/api/recommendations");
    if (!recommendationsResponse.ok) {
      return undefined;
    }

    const recommendationsPayload = (await recommendationsResponse.json()) as {
      recommendations?: Array<{ game: GameSummary }>;
    };
    return recommendationsPayload.recommendations?.find(
      (recommendation) => recommendation.game.slug !== currentGameSlug,
    )?.game;
  } catch {
    return undefined;
  }
}
