import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/current-user";
import { exportLibraryCsv } from "@/lib/server/library-transfer-service";
import { errorResponse } from "@/lib/server/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  try {
    const csv = await exportLibraryCsv(user);
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="playnext-library.csv"',
      },
    });
  } catch (error) {
    return errorResponse(error, "Could not export your library.");
  }
}
