import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const DEMO_SESSION_COOKIE = "playnext_demo_user";

const protectedPrefixes = [
  "/dashboard",
  "/discover",
  "/community",
  "/library",
  "/search",
  "/games",
  "/profile",
  "/settings",
];

function isSupabaseConfigured() {
  if (process.env.PLAYNEXT_FORCE_DEMO === "true") {
    return false;
  }

  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function hasDemoSession(value?: string | null) {
  if (!value) {
    return false;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as {
      userId?: string;
    };
    return Boolean(parsed.userId?.startsWith("demo:"));
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const isProtected = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  if (hasDemoSession(request.cookies.get(DEMO_SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  if (!isSupabaseConfigured()) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/discover/:path*",
    "/library/:path*",
    "/search/:path*",
    "/games/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
