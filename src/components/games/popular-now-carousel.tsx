"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameArtwork } from "@/components/games/game-artwork";
import type { GameSummary } from "@/lib/games/types";
import { getReleaseYear } from "@/lib/utils";

const AUTO_SCROLL_PX_PER_SECOND = 92;
const WATCHDOG_INTERVAL_MS = 300;
const WATCHDOG_STALL_MS = 450;

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
  const watchdogRef = useRef<number | null>(null);
  const previousFrameTimeRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const loopPointRef = useRef(0);
  const visibleGames = games.slice(0, 12);
  const shouldAutoScroll = visibleGames.length > 1;

  const measureLoopPoint = useCallback(() => {
    const firstGroup = firstGroupRef.current;
    const track = trackRef.current;

    if (!firstGroup || !track) {
      return 0;
    }

    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap);
    const groupWidth =
      firstGroup.getBoundingClientRect().width || firstGroup.scrollWidth;
    const loopPoint = groupWidth + (Number.isFinite(gap) ? gap : 0);
    loopPointRef.current = loopPoint;
    return loopPoint;
  }, []);

  const applyOffset = useCallback(
    (nextOffset: number) => {
      const track = trackRef.current;
      const loopPoint = loopPointRef.current || measureLoopPoint();
      if (!track || loopPoint <= 0) {
        return;
      }

      const normalizedOffset =
        ((nextOffset % loopPoint) + loopPoint) % loopPoint;
      offsetRef.current = normalizedOffset;
      track.style.transform = `translate3d(${-normalizedOffset}px, 0, 0)`;
    },
    [measureLoopPoint],
  );

  const moveCarouselBy = useCallback(
    (delta: number) => {
      applyOffset(offsetRef.current + delta);
    },
    [applyOffset],
  );

  function scrollRail(direction: 1 | -1) {
    const rail = railRef.current;
    const card = trackRef.current?.querySelector<HTMLElement>(
      "[data-carousel-card]",
    );
    const step = card
      ? card.offsetWidth + 16
      : (rail?.clientWidth ?? 320) * 0.82;
    moveCarouselBy(direction * step);
  }

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const rail = railRef.current;
    const track = trackRef.current;

    if (!rail || !track || !shouldAutoScroll) {
      return;
    }

    function keepCurrentProgressAfterResize() {
      const previousLoopPoint = loopPointRef.current;
      const progress =
        previousLoopPoint > 0 ? offsetRef.current / previousLoopPoint : 0;
      const nextLoopPoint = measureLoopPoint();
      applyOffset(progress * nextLoopPoint);
    }

    keepCurrentProgressAfterResize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(keepCurrentProgressAfterResize);
      resizeObserver.observe(rail);
      if (firstGroupRef.current) {
        resizeObserver.observe(firstGroupRef.current);
      }
    } else {
      window.addEventListener("resize", keepCurrentProgressAfterResize);
    }

    if (reducedMotion) {
      return () => {
        resizeObserver?.disconnect();
        window.removeEventListener("resize", keepCurrentProgressAfterResize);
      };
    }

    function tick(timestamp: number) {
      if (previousFrameTimeRef.current === null) {
        previousFrameTimeRef.current = timestamp;
      }

      const deltaMs = timestamp - previousFrameTimeRef.current;
      previousFrameTimeRef.current = timestamp;

      if (
        !pausedRef.current &&
        (loopPointRef.current || measureLoopPoint()) > 0
      ) {
        moveCarouselBy((AUTO_SCROLL_PX_PER_SECOND * deltaMs) / 1000);
      }

      frameRef.current = window.requestAnimationFrame(tick);
    }

    frameRef.current = window.requestAnimationFrame(tick);
    watchdogRef.current = window.setInterval(() => {
      if (
        document.visibilityState !== "visible" ||
        pausedRef.current ||
        previousFrameTimeRef.current === null
      ) {
        return;
      }

      const now = performance.now();
      const stalledFor = now - previousFrameTimeRef.current;
      if (stalledFor > WATCHDOG_STALL_MS) {
        if ((loopPointRef.current || measureLoopPoint()) <= 0) {
          return;
        }

        moveCarouselBy(
          (AUTO_SCROLL_PX_PER_SECOND *
            Math.min(stalledFor, WATCHDOG_STALL_MS)) /
            1000,
        );
        previousFrameTimeRef.current = now;
      }
    }, WATCHDOG_INTERVAL_MS);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      if (watchdogRef.current !== null) {
        window.clearInterval(watchdogRef.current);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("resize", keepCurrentProgressAfterResize);
      previousFrameTimeRef.current = null;
    };
  }, [applyOffset, measureLoopPoint, moveCarouselBy, shouldAutoScroll]);

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
        className="scrollbar-hidden -mx-4 overflow-hidden px-4 pb-2 [mask-image:linear-gradient(90deg,transparent,black_4%,black_96%,transparent)] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
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
          className="flex w-max gap-4 will-change-transform"
        >
          <div
            ref={firstGroupRef}
            data-testid="popular-carousel-primary-group"
            className="flex shrink-0 gap-4"
          >
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
