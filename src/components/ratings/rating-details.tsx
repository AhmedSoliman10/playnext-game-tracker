import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface RatingDetailsData {
  overallRating?: number | null;
  storyRating?: number | null;
  gameplayRating?: number | null;
  visualsRating?: number | null;
  soundtrackRating?: number | null;
  difficultyRating?: number | null;
  wouldRecommend?: boolean | null;
  review?: string | null;
}

type RatingCategoryKey = keyof Pick<
  RatingDetailsData,
  | "storyRating"
  | "gameplayRating"
  | "visualsRating"
  | "soundtrackRating"
  | "difficultyRating"
>;

const categoryLabels: Array<{ key: RatingCategoryKey; label: string }> = [
  { key: "storyRating", label: "Story" },
  { key: "gameplayRating", label: "Gameplay" },
  { key: "visualsRating", label: "Visuals" },
  { key: "soundtrackRating", label: "Soundtrack" },
  { key: "difficultyRating", label: "Difficulty" },
];

export function RatingDetails({
  rating,
  compact = false,
  showReview = true,
  className,
}: {
  rating: RatingDetailsData;
  compact?: boolean;
  showReview?: boolean;
  className?: string;
}) {
  const categories = categoryLabels.reduce<
    Array<{ key: RatingCategoryKey; label: string; value: number }>
  >((currentCategories, category) => {
    const value = rating[category.key];
    if (typeof value === "number") {
      currentCategories.push({ ...category, value });
    }

    return currentCategories;
  }, []);
  const review = rating.review?.trim();
  const hasRecommendation = typeof rating.wouldRecommend === "boolean";

  if (
    typeof rating.overallRating !== "number" &&
    categories.length === 0 &&
    !review &&
    !hasRecommendation
  ) {
    return null;
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {typeof rating.overallRating === "number" ? (
          <Badge className="border-lime-300/30 bg-lime-300/10 text-lime-100">
            <Star className="h-3.5 w-3.5 fill-lime-100" aria-hidden />
            {rating.overallRating}/10 overall
          </Badge>
        ) : null}
        {hasRecommendation ? (
          <Badge
            className={cn(
              rating.wouldRecommend
                ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                : "border-zinc-600 bg-zinc-900 text-zinc-300",
            )}
          >
            {rating.wouldRecommend ? "Would recommend" : "Would not recommend"}
          </Badge>
        ) : null}
      </div>

      {categories.length ? (
        <dl className={cn("grid gap-2", !compact && "sm:grid-cols-2")}>
          {categories.map((category) => (
            <div
              key={category.key}
              className="rounded-md border border-zinc-800 bg-zinc-950/55 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase text-zinc-400">
                <dt>{category.label}</dt>
                <dd className="text-zinc-100">{category.value}/10</dd>
              </div>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800"
                aria-hidden
              >
                <div
                  className="h-full rounded-full bg-cyan-300"
                  style={{ width: `${category.value * 10}%` }}
                />
              </div>
            </div>
          ))}
        </dl>
      ) : null}

      {showReview && review ? (
        <blockquote className="rounded-md border-l-2 border-cyan-300 bg-zinc-950/55 px-3 py-2 text-sm leading-6 text-zinc-300">
          {review}
        </blockquote>
      ) : null}
    </div>
  );
}
