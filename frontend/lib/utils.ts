import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { EventStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function formatDate(iso: string, fmt = "MMM d, yyyy") {
  try {
    return format(parseISO(iso), fmt);
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string) {
  return formatDate(iso, "MMM d, yyyy 'at' h:mm a");
}

export function formatDateTimeLocal(iso: string) {
  // Returns a string suitable for <input type="datetime-local">
  try {
    const d = parseISO(iso);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

export function relativeTime(iso: string) {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function toISOLocal(localDT: string): string {
  // Convert datetime-local string ("2025-06-01T14:00") to ISO-8601 with timezone
  if (!localDT) return "";
  const d = new Date(localDT);
  return d.toISOString();
}

// ─── Event lifecycle ──────────────────────────────────────────────────────────

export function getEventStatus(startAt: string, endAt: string): EventStatus {
  const now = new Date();
  const start = parseISO(startAt);
  const end = parseISO(endAt);
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "ongoing";
}

// ─── Status badge config ──────────────────────────────────────────────────────

export const statusConfig: Record<
  EventStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string }
> = {
  upcoming: { label: "Upcoming", variant: "default",   color: "bg-primary/10 text-primary border-primary/30" },
  ongoing:  { label: "Live",     variant: "secondary", color: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400" },
  past:     { label: "Past",     variant: "outline",   color: "bg-muted text-muted-foreground" },
};

export const rsvpConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string }
> = {
  invited:   { label: "Invited",   variant: "outline",     color: "" },
  attending: { label: "Attending", variant: "default",     color: "text-emerald-600 border-emerald-300" },
  maybe:     { label: "Maybe",     variant: "secondary",   color: "text-amber-600 border-amber-300" },
  declined:  { label: "Declined",  variant: "destructive", color: "text-red-600 border-red-300" },
};
