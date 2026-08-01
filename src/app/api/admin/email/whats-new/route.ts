import { NextResponse } from "next/server";
import {
  isAdminUser,
  isCronRequestAuthorized,
} from "@/lib/server/admin-authorization";
import { sendWhatsNewCampaign } from "@/lib/server/email-campaign-service";
import { getCurrentUser } from "@/lib/server/current-user";
import { errorResponse, readJson } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { emailCampaignRequestSchema } from "@/lib/validation/email-campaign";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const isTrustedCron = isCronRequestAuthorized(request);
  if (!isTrustedCron && !isAdminUser(user)) {
    return NextResponse.json(
      { error: "Only a Playnira admin can send product emails." },
      { status: 403 },
    );
  }

  const limit = checkRateLimit(
    `email-whats-new:${isTrustedCron ? "cron" : user!.userId}`,
    {
      limit: 2,
      windowMs: 60 * 60 * 1000,
    },
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Product emails are rate-limited. Try again later." },
      { status: 429 },
    );
  }

  try {
    const input = emailCampaignRequestSchema.parse(
      (await readJson(request)) ?? {},
    );
    return NextResponse.json(
      await sendWhatsNewCampaign({
        request,
        dryRun: input.dryRun,
        limit: input.limit,
      }),
    );
  } catch (error) {
    return errorResponse(error, "Could not send the product update email.");
  }
}
