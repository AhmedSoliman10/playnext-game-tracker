import { NextResponse } from "next/server";
import { isCronRequestAuthorized } from "@/lib/server/admin-authorization";
import { sendWeeklyDigestCampaign } from "@/lib/server/email-campaign-service";
import { errorResponse, readJson } from "@/lib/server/http";
import { emailCampaignRequestSchema } from "@/lib/validation/email-campaign";

export const runtime = "nodejs";

async function runDigest(request: Request) {
  if (!isCronRequestAuthorized(request)) {
    return NextResponse.json(
      { error: "Missing or invalid cron authorization." },
      { status: 401 },
    );
  }

  try {
    const input =
      request.method === "POST"
        ? emailCampaignRequestSchema.parse((await readJson(request)) ?? {})
        : emailCampaignRequestSchema.parse({ dryRun: false });
    return NextResponse.json(
      await sendWeeklyDigestCampaign({
        request,
        dryRun: input.dryRun,
        limit: input.limit,
      }),
    );
  } catch (error) {
    return errorResponse(error, "Could not send weekly digest email.");
  }
}

export async function GET(request: Request) {
  return runDigest(request);
}

export async function POST(request: Request) {
  return runDigest(request);
}
