"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-4 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-2xl -translate-x-1/2 overflow-y-auto overscroll-contain rounded-lg border bg-panel-strong p-5 shadow-xl focus-visible:outline-2 sm:top-1/2 sm:w-[calc(100vw-2rem)] sm:-translate-y-1/2",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-3 top-3 rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 focus-visible:outline-2">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
