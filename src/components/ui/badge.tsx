import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-zinc-700 bg-[#10161c] px-2 py-1 text-xs font-medium text-zinc-200",
        className,
      )}
      {...props}
    />
  );
}
