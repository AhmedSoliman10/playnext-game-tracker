import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-panel p-6", className)}>
      <Icon className="h-8 w-8 text-cyan-200" aria-hidden />
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
          {secondaryHref && secondaryLabel ? (
            <Button asChild variant="secondary">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
