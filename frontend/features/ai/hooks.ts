import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { parseEventText, suggestTimes } from "./services";

export function useParseEvent() {
  return useMutation({
    mutationFn: (text: string) => parseEventText(text),
    onError: (err) => {
      if (err instanceof ApiError && err.isUnavailable) {
        toast.error("AI service is temporarily unavailable. Please try again later.");
      } else {
        toast.error(err instanceof Error ? err.message : "AI parse failed");
      }
    },
  });
}

export function useSuggestTimes() {
  return useMutation({
    mutationFn: suggestTimes,
    onError: (err) => {
      if (err instanceof ApiError && err.isUnavailable) {
        toast.error("AI service is temporarily unavailable. Please try again later.");
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to get suggestions");
      }
    },
  });
}
