import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import type { CreateEventPayload, UpdateEventPayload, InvitePayload, EventFilters } from "@/types";
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getAttendees,
  inviteToEvent,
} from "./services";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const eventKeys = {
  all:       () => ["events"] as const,
  list:      (filters: EventFilters) => ["events", "list", filters] as const,
  detail:    (id: string) => ["events", "detail", id] as const,
  attendees: (id: string) => ["events", id, "attendees"] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useEvents(filters: EventFilters = {}) {
  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: () => listEvents(filters),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => getEvent(id),
    enabled: !!id,
  });
}

export function useAttendees(eventId: string) {
  return useQuery({
    queryKey: eventKeys.attendees(eventId),
    queryFn: () => getAttendees(eventId),
    enabled: !!eventId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEventPayload) => createEvent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all() });
      toast.success("Event created!");
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      if (!apiErr.isConflict) {
        toast.error(err instanceof Error ? err.message : "Failed to create event");
      }
    },
  });
}

export function useUpdateEvent(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateEventPayload) => updateEvent(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(id) });
      qc.invalidateQueries({ queryKey: eventKeys.all() });
      toast.success("Event updated!");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update event");
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all() });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete event");
    },
  });
}

export function useInviteToEvent(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: InvitePayload) => inviteToEvent(eventId, payload),
    onSuccess: (res) => {
      const results = res.data.results ?? [];
      const sent = results.length;
      qc.invalidateQueries({ queryKey: eventKeys.attendees(eventId) });
      toast.success(`Invitation${sent !== 1 ? "s" : ""} sent to ${sent} recipient${sent !== 1 ? "s" : ""}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to send invitations");
    },
  });
}
