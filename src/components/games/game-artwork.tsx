import Image from "next/image";
import { Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function GameArtwork({
  src,
  alt,
  className,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-zinc-900 text-zinc-500",
          className,
        )}
        role="img"
        aria-label={`${alt} artwork unavailable`}
      >
        <Gamepad2 className="h-12 w-12" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={720}
      height={960}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      className={cn("rounded-md object-cover", className)}
    />
  );
}
