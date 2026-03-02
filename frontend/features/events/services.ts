import { api } from "@/lib/api";
import type {
  Event,
  CreateEventPayload,
  UpdateEventPayload,
  InvitePayload,
  Invitation,
  EventFilters,
} from "@/types";

// ─── Events ───────────────────────────────────────────────────────────────────

export async function listEvents(filters: EventFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search)    params.set("search",    filters.search);
  if (filters.location)  params.set("location",  filters.location);
  if (filters.status)    params.set("status",    filters.status);
  if (filters.startFrom) params.set("startFrom", filters.startFrom);
  if (filters.startTo)   params.set("startTo",   filters.startTo);
  if (filters.page)      params.set("page",      String(filters.page));
  if (filters.limit)     params.set("limit",     String(filters.limit));

  const qs = params.toString();
  return api.get<Event[]>(`/api/events${qs ? `?${qs}` : ""}`);
}

export async function getEvent(id: string) {
  return api.get<Event>(`/api/events/${id}`);
}

export async function createEvent(payload: CreateEventPayload) {
  return api.post<Event>("/api/events", payload);
}

export async function updateEvent(id: string, payload: UpdateEventPayload) {
  return api.patch<Event>(`/api/events/${id}`, payload);
}

export async function deleteEvent(id: string) {
  return api.delete<null>(`/api/events/${id}`);
}

// ─── Attendees / invite ───────────────────────────────────────────────────────

export async function getAttendees(eventId: string) {
  return api.get<Invitation[]>(`/api/events/${eventId}/attendees`);
}

export async function inviteToEvent(eventId: string, payload: InvitePayload) {
  return api.post<{ results: Invitation[] }>(`/api/events/${eventId}/invite`, payload);
}
