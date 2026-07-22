import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getReleaseYear(releaseDate?: string | null) {
  if (!releaseDate) {
    return "TBA";
  }

  const year = new Date(releaseDate).getFullYear();
  return Number.isNaN(year) ? "TBA" : String(year);
}

export function formatCompactDate(releaseDate?: string | null) {
  if (!releaseDate) {
    return "Unknown";
  }

  const date = new Date(releaseDate);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function roundTo(value: number, places = 1) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
