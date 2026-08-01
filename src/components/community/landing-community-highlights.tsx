import Link from "next/link";
import {
  ArrowRight,
  Gamepad2,
  Heart,
  MessageCircle,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameArtwork } from "@/components/games/game-artwork";
import { COMMUNITY_POST_MOODS } from "@/lib/community/posts";
import type { LandingCommunityPostHighlight } from "@/lib/server/community-post-service";
import { cn, formatCompactDate } from "@/lib/utils";

const STARTER_PROMPTS = [
  {
    title: "Ask for the next game",
    text: "Tell people what you loved, what you bounced off, and what mood you are chasing next.",
  },
  {
    title: "Post from your playthrough",
    text: "Attach a game, add a quick thought, and let other players react without turning it into a forum essay.",
  },
  {
    title: "Find taste twins",
    text: "Public profiles, ratings, and game posts make it easier to follow players whose taste feels close to yours.",
  },
];

export function LandingCommunityHighlights({
  posts,
}: {
  posts: LandingCommunityPostHighlight[];
}) {
  const featuredPost = posts[0] ?? null;
  const sidePosts = posts.slice(1, 3);

  return (
    <section className="relative overflow-hidden border-y bg-zinc-950">
      <div
        className="absolute inset-0 bg-[linear-gradient(135deg,rgba(53,208,127,0.13),rgba(8,10,12,0)_42%,rgba(34,211,238,0.1))]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl space-y-4">
            <Badge className="w-fit border-lime-300/40 bg-lime-300/10 text-lime-100">
              Community pulse
            </Badge>
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-normal text-zinc-50 sm:text-4xl">
                See what players are saying before you choose tonight&apos;s
                game.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-zinc-300">
                Posts bring the library to life: quick playthrough notes,
                attached games, reactions, and recommendation requests from
                people building their own journeys.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Button asChild>
              <Link href="/signup">
                Join the community <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/community">Open feed</Link>
            </Button>
          </div>
        </div>

        {featuredPost ? (
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <CommunityPostPreview post={featuredPost} featured />
            <div className="grid gap-4">
              {sidePosts.length ? (
                sidePosts.map((post) => (
                  <CommunityPostPreview key={post.id} post={post} />
                ))
              ) : (
                <StarterPromptGrid compact />
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-lg border bg-panel p-6">
              <Sparkles className="mb-5 h-8 w-8 text-cyan-200" />
              <h3 className="text-2xl font-bold">Start the first thread.</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                The public feed is ready for game talk. Share what you are
                playing, ask for a recommendation, or attach a game from search
                so people can respond by vibe.
              </p>
              <Button asChild className="mt-6">
                <Link href="/signup">
                  Write a post <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <StarterPromptGrid />
          </div>
        )}
      </div>
    </section>
  );
}

function CommunityPostPreview({
  post,
  featured = false,
}: {
  post: LandingCommunityPostHighlight;
  featured?: boolean;
}) {
  const visual = getPostVisual(post);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-panel/95 p-4 shadow-xl shadow-black/20 transition duration-200 hover:-translate-y-1 hover:border-cyan-300/70 motion-reduce:hover:translate-y-0",
        featured ? "min-h-full sm:p-6" : "sm:p-5",
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#35d07f,#67e8f9,#fbbf24)] opacity-80"
        aria-hidden
      />
      <div
        className={cn(
          "grid gap-4",
          featured ? "md:grid-cols-[168px_1fr]" : "sm:grid-cols-[96px_1fr]",
        )}
      >
        <PostVisual visual={visual} featured={featured} />
        <div className="min-w-0">
          <header className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <CommunityAvatar
                src={post.author.avatarUrl}
                name={post.author.displayName}
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-100">
                  {post.author.displayName}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatCompactDate(post.createdAt)}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">
              {moodLabel(post.mood)}
            </span>
          </header>

          <p
            className={cn(
              "mt-4 whitespace-pre-wrap text-zinc-100",
              featured
                ? "line-clamp-5 text-lg font-semibold leading-8"
                : "line-clamp-3 text-sm leading-6",
            )}
          >
            {post.body}
          </p>

          {post.game ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-zinc-300">
              <Gamepad2 className="h-4 w-4 text-lime-200" />
              <span className="font-semibold text-zinc-100">
                {post.game.title}
              </span>
              {post.game.genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="rounded-md border px-2 py-0.5 text-xs text-zinc-400"
                >
                  {genre}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-4 w-4 text-rose-200" />
              {post.reactionTotal} reactions
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-4 w-4 text-cyan-200" />
              {post.commentCount} comments
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function StarterPromptGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "grid gap-4",
        compact ? "sm:grid-cols-1" : "md:grid-cols-3 lg:grid-cols-1",
      )}
    >
      {STARTER_PROMPTS.map((prompt) => (
        <article key={prompt.title} className="rounded-lg border bg-panel p-5">
          <h3 className="font-bold text-zinc-100">{prompt.title}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{prompt.text}</p>
        </article>
      ))}
    </div>
  );
}

function PostVisual({
  visual,
  featured,
}: {
  visual: { src?: string | null; alt: string; isGameArtwork: boolean };
  featured: boolean;
}) {
  const className = cn(
    "aspect-[3/4] w-full rounded-md border bg-zinc-950 object-cover",
    featured ? "md:h-full md:min-h-64" : "sm:h-32",
  );

  if (visual.isGameArtwork) {
    return (
      <GameArtwork src={visual.src} alt={visual.alt} className={className} />
    );
  }

  if (visual.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={visual.src}
        alt={visual.alt}
        className={className}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={cn(
        className,
        "flex items-center justify-center text-zinc-500",
      )}
      role="img"
      aria-label={visual.alt}
    >
      <MessageCircle className="h-10 w-10" />
    </div>
  );
}

function CommunityAvatar({ src, name }: { src?: string | null; name: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name} avatar`}
        className="h-10 w-10 shrink-0 rounded-md border object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <span
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-zinc-900 text-zinc-500"
      role="img"
      aria-label={`${name} avatar placeholder`}
    >
      <UserRound className="h-5 w-5" />
    </span>
  );
}

function getPostVisual(post: LandingCommunityPostHighlight) {
  if (post.game?.coverImageUrl) {
    return {
      src: post.game.coverImageUrl,
      alt: `${post.game.title} cover`,
      isGameArtwork: true,
    };
  }

  if (post.imageUrl && isSafeHttpsUrl(post.imageUrl)) {
    return {
      src: post.imageUrl,
      alt: "Community post attachment",
      isGameArtwork: false,
    };
  }

  return {
    src: null,
    alt: "Community post artwork placeholder",
    isGameArtwork: false,
  };
}

function isSafeHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function moodLabel(mood: LandingCommunityPostHighlight["mood"]) {
  return (
    COMMUNITY_POST_MOODS.find((candidate) => candidate.value === mood)?.label ??
    "Discussion"
  );
}
