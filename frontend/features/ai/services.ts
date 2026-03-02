import { api } from "@/lib/api";
import type { ParsedEventFields, SuggestedTimeSlot } from "@/types";

interface SuggestTimesPayload {
  title?: string;
  durationMinutes: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  timezone?: string;
}

export async function parseEventText(text: string) {
  return api.post<ParsedEventFields>("/api/ai/parse-event", { text });
}

export async function suggestTimes(payload: SuggestTimesPayload) {
  return api.post<SuggestedTimeSlot[]>("/api/ai/suggest-times", payload);
}
