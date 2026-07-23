"use client";

import { Lightbulb, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FEATURE_EMAIL = "playnext.app.mail@gmail.com";
const FEATURE_MAILTO = `mailto:${FEATURE_EMAIL}?subject=${encodeURIComponent(
  "PlayNext feature suggestion",
)}&body=${encodeURIComponent(
  "Hi PlayNext team,\n\nI want to suggest this feature:\n\n",
)}`;

export function FeatureSuggestionMenu() {
  return (
    <div className="fixed bottom-24 right-4 z-50 md:bottom-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 border border-cyan-300/20 bg-panel-strong/95 px-3 shadow-[0_12px_36px_rgba(0,0,0,0.35)] backdrop-blur hover:border-cyan-300/60"
            aria-label="Suggest a PlayNext feature"
          >
            <Lightbulb className="h-4 w-4 text-cyan-200" />
            <span className="hidden sm:inline">Suggest feature</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          className="w-[min(21rem,calc(100vw-2rem))] p-0"
        >
          <div className="border-b px-4 py-3">
            <p className="font-bold text-zinc-50">Suggest a feature</p>
            <p className="mt-1 text-sm leading-5 text-zinc-400">
              Tell us what would make PlayNext better for your game tracking.
            </p>
          </div>
          <div className="space-y-3 p-3">
            <p className="rounded-md border bg-zinc-950 px-3 py-2 font-mono text-xs text-cyan-100">
              {FEATURE_EMAIL}
            </p>
            <DropdownMenuItem asChild>
              <a href={FEATURE_MAILTO} className="justify-center font-semibold">
                <Mail className="h-4 w-4" />
                Email suggestion
              </a>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
