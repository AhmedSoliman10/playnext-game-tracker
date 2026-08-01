import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Gamepad2,
  Heart,
  MessageCircle,
  PenLine,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { GameArtwork } from "@/components/games/game-artwork";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  COMMUNITY_POST_MOODS,
  getCommunityFeedStats,
} from "@/lib/community/posts";
import type { CommunityPost } from "@/lib/types";
import { cn, formatCompactDate } from "@/lib/utils";

const STARTER_IDEAS = [
  "What game surprised you this week?",
  "What should people play after finishing your favorite RPG?",
  "Which backlog game deserves another chance?",
];

export function DashboardCommunitySpotlight({
  posts,
  unavailable = false,
}: {
  posts: CommunityPost[];
  unavailable?: boolean;
}) {
  const stats = getCommunityFeedStats(posts);
  const featuredPost = posts[0] ?? null;
  const sidePosts = posts.slice(1, 4);

  return (
    <section className="relative overflow-hidden rounded-lg border bg-zinc-950 shadow-2xl shadow-black/20">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(103,232,249,0.16),transparent_28%),linear-gradient(135deg,rgba(53,208,127,0.12),transparent_44%,rgba(251,191,36,0.08))]"
        aria-hidden
      />
      <div className="relative grid gap-0 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="border-b p-5 sm:p-6 xl:border-b-0 xl:border-r">
          <Badge className="border-cyan-300/40 bg-cyan-300/10 text-cyan-100">
            Community live
          </Badge>
          <div className="mt-5 space-y-3">
            <h2 className="text-3xl font-black tracking-normal sm:text-4xl">
              The feed is part of your game night now.
            </h2>
            <p className="max-w-xl text-sm leading-6 text-zinc-300 sm:text-base sm:leading-7">
              Catch quick posts from players, see attached games, and jump into
              recommendation threads without leaving your dashboard.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <CommunityStat value={stats.postCount} label="posts" />
            <CommunityStat value={stats.gamePostCount} label="game talk" />
            <CommunityStat value={stats.playerCount} label="players" />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/community">
                Open community <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/community">
                <PenLine className="h-4 w-4" />
                Write a post
              </Link>
            </Button>
          </div>

          <div className="mt-6 rounded-lg border bg-panel/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-normal text-zinc-500">
              Good first posts
            </p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              {STARTER_IDEAS.map((idea) => (
                <li key={idea} className="flex gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-lime-200" />
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {unavailable ? (
            <CommunityUnavailable />
          ) : featuredPost ? (
            <div className="grid gap-3">
              <DashboardPostCard post={featuredPost} featured />
              {sidePosts.length ? (
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                  {sidePosts.map((post) => (
                    <DashboardPostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <CommunityEmptyState />
          )}
        </div>
      </div>
    </section>
  );
}

function DashboardPostCard({
  post,
  featured = false,
}: {
  post: CommunityPost;
  featured?: boolean;
}) {
  const visual = getPostVisual(post);

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-lg border bg-panel/95 transition duration-200 hover:border-cyan-300/70",
        featured ? "p-4 sm:p-5" : "p-3",
      )}
    >
      <div
        className={cn(
          "grid gap-4",
          featured ? "md:grid-cols-[132px_1fr]" : "grid-cols-[72px_1fr]",
        )}
      >
        <PostVisual visual={visual} featured={featured} />
        <div className="min-w-0">
          <header className="flex items-start justify-between gap-3">
            <Link
              href={`/players/${post.author.id}`}
              className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-cyan-300"
            >
              <CommunityAvatar
                src={post.author.avatarUrl}
                name={post.author.displayName}
              />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-zinc-100">
                  {post.author.displayName}
                </span>
                <span className="block text-xs text-zinc-500">
                  {formatCompactDate(post.createdAt)}
                </span>
              </span>
            </Link>
            <span className="shrink-0 rounded-full border border-lime-300/30 bg-lime-300/10 px-2 py-1 text-xs font-semibold text-lime-100">
              {moodLabel(post.mood)}
            </span>
          </header>

          <p
            className={cn(
              "mt-3 whitespace-pre-wrap text-zinc-100",
              featured
                ? "line-clamp-4 text-base font-semibold leading-7"
                : "line-clamp-2 text-sm leading-5",
            )}
          >
            {post.body}
          </p>

          {post.game ? (
            <Link
              href={`/games/${post.game.slug}`}
              className="mt-3 inline-flex max-w-full items-center gap-2 rounded-md border bg-zinc-950/50 px-2 py-1 text-xs font-semibold text-zinc-200 transition hover:border-cyan-300 hover:text-cyan-100 focus-visible:outline-2 focus-visible:outline-cyan-300"
            >
              <Gamepad2 className="h-3.5 w-3.5 shrink-0 text-cyan-200" />
              <span className="truncate">{post.game.title}</span>
            </Link>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-4 w-4 text-rose-200" />
              {post.reactionTotal}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-4 w-4 text-cyan-200" />
              {post.commentCount}
            </span>
            {post.viewerBookmarked ? (
              <span className="inline-flex items-center gap-1 text-lime-100">
                <Bookmark className="h-4 w-4 fill-lime-100" />
                saved
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function CommunityStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border bg-zinc-950/45 p-3">
      <p className="text-2xl font-black text-zinc-50">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function CommunityUnavailable() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border bg-panel p-6 text-center">
      <UsersRound className="h-9 w-9 text-cyan-200" />
      <h3 className="mt-4 text-xl font-bold">Community is warming up.</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">
        The dashboard could not load posts right now. The full feed is still
        available when the connection settles.
      </p>
      <Button asChild className="mt-5">
        <Link href="/community">Open community</Link>
      </Button>
    </div>
  );
}

function CommunityEmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border bg-panel p-6 text-center">
      <PenLine className="h-9 w-9 text-lime-200" />
      <h3 className="mt-4 text-xl font-bold">No posts in your feed yet.</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">
        Write the first one, attach a game, and give other players something to
        react to.
      </p>
      <Button asChild className="mt-5">
        <Link href="/community">Create a post</Link>
      </Button>
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
    featured ? "h-44 md:h-full" : "h-24",
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
      <MessageCircle className="h-8 w-8" />
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
        className="h-9 w-9 shrink-0 rounded-md border object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <span
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-zinc-900 text-zinc-500"
      role="img"
      aria-label={`${name} avatar placeholder`}
    >
      <UserRound className="h-5 w-5" />
    </span>
  );
}

function getPostVisual(post: CommunityPost) {
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

function moodLabel(mood: CommunityPost["mood"]) {
  return (
    COMMUNITY_POST_MOODS.find((candidate) => candidate.value === mood)?.label ??
    "Discussion"
  );
}
