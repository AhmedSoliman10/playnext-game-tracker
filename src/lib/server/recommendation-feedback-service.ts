import { isSupabaseConfigured } from "@/lib/auth/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RecommendationFeedback, UserContext } from "@/lib/types";
import type { RecommendationFeedbackInput } from "@/lib/validation/recommendation-feedback";

function missingFeedbackTable(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "42703";
}

export async function getRecommendationFeedback(
  user: UserContext,
): Promise<RecommendationFeedback[]> {
  if (user.isDemo || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("recommendation_feedback")
    .select("game_slug, feedback_type, metadata")
    .eq("user_id", user.userId);

  if (missingFeedbackTable(error)) {
    return [];
  }

  if (error) {
    throw new Error("Could not load recommendation feedback.");
  }

  const feedback: RecommendationFeedback[] = [];
  for (const row of data ?? []) {
    const metadata =
      row.metadata &&
      typeof row.metadata === "object" &&
      !Array.isArray(row.metadata)
        ? row.metadata
        : {};
    const platform =
      typeof metadata.platform === "string" ? metadata.platform : null;

    feedback.push({
      gameSlug: row.game_slug,
      action: row.feedback_type,
      platform,
    });
  }

  return feedback;
}

export async function saveRecommendationFeedback(
  user: UserContext,
  input: RecommendationFeedbackInput,
) {
  if (user.isDemo || !isSupabaseConfigured()) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.from("recommendation_feedback").upsert(
    {
      user_id: user.userId,
      game_slug: input.gameSlug,
      feedback_type: input.action,
      metadata: {
        platform: input.platform ?? null,
      },
    },
    { onConflict: "user_id,game_slug,feedback_type" },
  );

  if (missingFeedbackTable(error)) {
    throw new Error(
      "Recommendation feedback needs the latest Supabase migration.",
    );
  }

  if (error) {
    throw new Error("Could not save recommendation feedback.");
  }
}
