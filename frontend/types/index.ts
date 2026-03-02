// ─── Domain types ───────────────────────────────────────────────────────────

export type UserRole = "member" | "admin";

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EventVisibility = "private" | "shared";
export type EventStatus = "upcoming" | "ongoing" | "past";

export interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  createdBy: User | string;
  visibility: EventVisibility;
  isDeleted: boolean;
  lifecycle?: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export type RsvpStatus = "invited" | "attending" | "maybe" | "declined";

export interface Invitation {
  id: string;
  eventId: Event | string;
  email: string;
  invitedBy: User | string;
  inviteeUserId?: User | string;
  status: RsvpStatus;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  code?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Form payloads ────────────────────────────────────────────────────────────

export interface CreateEventPayload {
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  visibility?: EventVisibility;
  ignoreConflicts?: boolean;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {}

export interface InvitePayload {
  emails: string[];
}

export interface RespondPayload {
  status: "attending" | "maybe" | "declined";
}

// ─── AI types ─────────────────────────────────────────────────────────────────

export interface ParsedEventFields {
  title?: string;
  description?: string;
  location?: string;
  startAt?: string;
  endAt?: string;
  [key: string]: string | undefined;
}

export interface SuggestedTimeSlot {
  startAt: string;
  endAt: string;
  explanation?: string;
}

// ─── Filter types ────────────────────────────────────────────────────────────

export interface EventFilters {
  search?: string;
  location?: string;
  status?: EventStatus;
  startFrom?: string;
  startTo?: string;
  page?: number;
  limit?: number;
}
