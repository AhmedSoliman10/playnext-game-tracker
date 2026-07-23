import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Library,
  MessageSquareText,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PopularNowCarousel } from "@/components/games/popular-now-carousel";
import { getGameProvider } from "@/lib/games/provider";

export const revalidate = 21600;

async function getLandingExampleGame() {
  try {
    return await getGameProvider().getGameBySlug("red-dead-redemption-2");
  } catch {
    return null;
  }
}

function getIgdbArtworkUrl(url?: string | null) {
  return url?.startsWith("https://images.igdb.com/") ? url : null;
}

function getIgdbHeroUrl(url?: string | null) {
  const igdbUrl = getIgdbArtworkUrl(url);
  return igdbUrl?.replace("/t_screenshot_big/", "/t_screenshot_huge/") ?? null;
}

function formatRating(value?: number | null) {
  return typeof value === "number"
    ? value.toFixed(1).replace(/\.0$/, "")
    : null;
}

export default async function Home() {
  const [exampleGame, popularGames] = await Promise.all([
    getLandingExampleGame(),
    getGameProvider().getPopularGames({ pageSize: 12 }),
  ]);
  const exampleTitle = exampleGame?.title ?? "Red Dead Redemption 2";
  const exampleCover =
    exampleGame?.provider === "igdb"
      ? (getIgdbArtworkUrl(exampleGame.coverImageUrl) ??
        "/landing-card-cover.svg")
      : "/landing-card-cover.svg";
  const exampleBackground =
    exampleGame?.provider === "igdb"
      ? (getIgdbArtworkUrl(exampleGame.backgroundImageUrl) ??
        getIgdbHeroUrl(exampleGame.screenshots[0]) ??
        "/social-preview.svg")
      : "/social-preview.svg";
  const exampleRating = formatRating(exampleGame?.externalRating) ?? "9.4";

  return (
    <main className="min-h-screen bg-background">
      <section className="relative flex min-h-[78vh] items-center overflow-hidden border-b bg-zinc-950">
        <Image
          src={exampleBackground}
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.96),rgba(9,9,11,0.78),rgba(9,9,11,0.42))]" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="flex max-w-2xl flex-col justify-center gap-7">
            <Badge className="w-fit border-cyan-300/40 bg-cyan-300/10 text-cyan-100">
              Conversational game tracking
            </Badge>
            <div className="space-y-5">
              <h1 className="text-5xl font-black tracking-normal text-zinc-50 sm:text-6xl lg:text-7xl">
                PlayNext
              </h1>
              <p className="max-w-xl text-xl font-medium leading-8 text-zinc-100">
                Rate what you played. Organize your backlog. Discover what comes
                next.
              </p>
              <p className="max-w-2xl text-base leading-7 text-zinc-300">
                A friendly gaming assistant that asks one clear question at a
                time, learns from your ratings, and keeps your next game choice
                from turning into another spreadsheet.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start tracking <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
          <div className="hidden items-end justify-center lg:flex">
            <div className="w-full max-w-sm rounded-lg border bg-zinc-950/88 p-4 shadow-xl">
              <Image
                src={exampleCover}
                alt={`Example PlayNext game card cover for ${exampleTitle}`}
                width={600}
                height={900}
                priority
                sizes="384px"
                className="aspect-[3/4] rounded-md object-cover"
              />
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold">{exampleTitle}</h2>
                  <span className="inline-flex items-center gap-1 text-sm text-lime-200">
                    <Star className="h-4 w-4 fill-lime-200" /> {exampleRating}
                  </span>
                </div>
                <p className="text-sm text-zinc-300">
                  Have you played this game?
                </p>
                {exampleGame?.provider === "igdb" ? (
                  <p className="text-xs text-zinc-500">
                    Game metadata and artwork powered by IGDB.
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm">Played</Button>
                  <Button size="sm" variant="secondary">
                    Want to play
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <PopularNowCarousel
          games={popularGames}
          title="What players are circling now"
          description="A cinematic scroll of highly rated games to start exploring before PlayNext learns your own taste."
        />
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        {[
          {
            icon: Sparkles,
            title: "Swipe and answer",
            text: "Move through one game at a time with gestures or accessible buttons.",
          },
          {
            icon: MessageSquareText,
            title: "Rate conversationally",
            text: "When you played something, PlayNext walks through the useful details without making every field mandatory.",
          },
          {
            icon: Library,
            title: "Organize automatically",
            text: "Played, playing, backlog, dropped, favorites, and unrated lists update as you answer.",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="rounded-lg border bg-panel p-5"
            >
              <Icon className="mb-4 h-7 w-7 text-cyan-200" />
              <h2 className="mb-2 text-lg font-bold">{item.title}</h2>
              <p className="text-sm leading-6 text-zinc-400">{item.text}</p>
            </article>
          );
        })}
      </section>

      <section className="border-y bg-zinc-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="space-y-4">
            <Wand2 className="h-8 w-8 text-lime-200" />
            <h2 className="text-3xl font-bold">
              Personalized recommendations with rules you can understand.
            </h2>
            <p className="text-zinc-300">
              The first version scores recommendations deterministically from
              your ratings, favorite genres, platforms, release-year
              preferences, and decisions you already made. No AI API is required
              for the product to work.
            </p>
          </div>
          <div className="rounded-lg border bg-panel p-5">
            <p className="text-sm text-zinc-400">Example assistant response</p>
            <p className="mt-3 text-xl font-semibold leading-8 text-zinc-100">
              You rated Red Dead Redemption 2 an 8.5/10. Because you enjoyed its
              story and open world, here is another game you may like.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center lg:px-8">
        <div>
          <h2 className="text-3xl font-bold">Ready to find your next game?</h2>
          <p className="mt-2 text-zinc-400">
            Start with the seeded catalog, then connect IGDB when you want live
            metadata and full artwork search.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/signup">
            Create account <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <footer className="border-t px-4 py-8 text-center text-sm text-zinc-500">
        PlayNext is an original swipe-based game discovery experience.
      </footer>
    </main>
  );
}
