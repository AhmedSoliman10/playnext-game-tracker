"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameArtwork } from "@/components/games/game-artwork";
import type { GameSummary } from "@/lib/games/types";
import { getReleaseYear } from "@/lib/utils";

const AUTO_SCROLL_PX_PER_SECOND = 92;

export function PopularNowCarousel({
  games,
  title = "Popular right now",
  description = "Live IGDB PopScore signals from visits, list activity, and Steam 24h peak players when available.",
}: {
  games: GameSummary[];
  title?: string;
  description?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstGroupRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const previousFrameTimeRef = useRef<number | null>(null);
  const visibleGames = games.slice(0, 12);
  const shouldAutoScroll = visibleGames.length > 1;

  function getLoopPoint(rail: HTMLDivElement) {
    const firstGroup = firstGroupRef.current;
    const track = trackRef.current;

    if (!firstGroup || !track) {
      return rail.scrollWidth / 2;
    }

    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap);
    return firstGroup.scrollWidth + (Number.isFinite(gap) ? gap : 0);
  }

  function scrollRail(direction: 1 | -1) {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    const card = rail.querySelector<HTMLElement>("[data-carousel-card]");
    const step = card ? card.offsetWidth + 16 : rail.clientWidth * 0.82;
    const loopPoint = getLoopPoint(rail);
    const atEnd = rail.scrollLeft + step >= loopPoint - 8;
    const atStart = rail.scrollLeft <= 8;

    if (direction === 1 && atEnd) {
      rail.scrollLeft = Math.max(0, rail.scrollLeft - loopPoint);
      rail.scrollBy({ left: step, behavior: "smooth" });
      return;
    }

    if (direction === -1 && atStart) {
      rail.scrollLeft = loopPoint;
      rail.scrollBy({ left: -step, behavior: "smooth" });
      return;
    }

    rail.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const rail = railRef.current;

    if (reducedMotion || !rail || !shouldAutoScroll) {
      return;
    }

    const railElement = rail;

    function tick(timestamp: number) {
      if (previousFrameTimeRef.current === null) {
        previousFrameTimeRef.current = timestamp;
      }

      const deltaMs = timestamp - previousFrameTimeRef.current;
      previousFrameTimeRef.current = timestamp;

      if (
        !pausedRef.current &&
        railElement.scrollWidth > railElement.clientWidth
      ) {
        railElement.scrollLeft += (AUTO_SCROLL_PX_PER_SECOND * deltaMs) / 1000;

        const loopPoint = getLoopPoint(railElement);
        if (loopPoint > 0 && railElement.scrollLeft >= loopPoint) {
          railElement.scrollLeft -= loopPoint;
        }
      }

      frameRef.current = window.requestAnimationFrame(tick);
    }

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      previousFrameTimeRef.current = null;
    };
  }, [shouldAutoScroll]);

  if (!visibleGames.length) {
    return null;
  }

  function renderCard(game: GameSummary, index: number, duplicate = false) {
    return (
      <Link
        key={`${duplicate ? "duplicate" : "primary"}-${game.slug}`}
        href={`/games/${game.slug}`}
        data-carousel-card={duplicate ? undefined : true}
        aria-hidden={duplicate}
        tabIndex={duplicate ? -1 : undefined}
        className="group relative flex min-h-80 w-72 shrink-0 snap-start overflow-hidden rounded-lg border bg-zinc-950 focus-visible:outline-2 sm:w-80"
      >
        <GameArtwork
          src={game.backgroundImageUrl ?? game.coverImageUrl}
          alt={`${game.title} artwork`}
          priority={!duplicate && index < 2}
          className="absolute inset-0 h-full w-full rounded-none opacity-70 transition duration-300 group-hover:scale-105 group-hover:opacity-90"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.08),rgba(9,9,11,0.72)_54%,rgba(9,9,11,0.98))]" />
        <div className="relative mt-auto w-full space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <Badge className="border-zinc-700 bg-zinc-950/80 text-zinc-200">
              {getReleaseYear(game.releaseDate)}
            </Badge>
            {game.externalRating ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-950/88 px-2 py-1 text-xs font-black text-lime-200">
                <Star className="h-3.5 w-3.5 fill-lime-200" />
                {game.externalRating}
              </span>
            ) : null}
          </div>
          <div>
            <h3 className="line-clamp-2 text-xl font-black leading-tight text-zinc-50">
              {game.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-5 text-zinc-300">
              {game.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {game.genres.slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="rounded-sm border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-[11px] font-semibold text-cyan-100"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-lime-200">
            <Flame className="h-4 w-4" />
            Popular right now
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-normal text-zinc-50">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => scrollRail(-1)}
            aria-label="Previous popular game"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => scrollRail(1)}
            aria-label="Next popular game"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={railRef}
        data-testid="popular-carousel-rail"
        className="scrollbar-hidden -mx-4 overflow-hidden scroll-smooth px-4 pb-2 [mask-image:linear-gradient(90deg,transparent,black_4%,black_96%,transparent)] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        onFocusCapture={() => {
          pausedRef.current = true;
        }}
        onBlurCapture={() => {
          pausedRef.current = false;
        }}
      >
        <div
          ref={trackRef}
          data-testid="popular-carousel-track"
          className="flex w-max gap-4"
        >
          <div ref={firstGroupRef} className="flex shrink-0 gap-4">
            {visibleGames.map((game, index) => renderCard(game, index))}
          </div>
          {shouldAutoScroll ? (
            <div className="flex shrink-0 gap-4" aria-hidden>
              {visibleGames.map((game, index) => renderCard(game, index, true))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
