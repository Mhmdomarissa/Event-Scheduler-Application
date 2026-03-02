import { api } from "@/lib/api";
import type { Invitation, RespondPayload } from "@/types";

export async function listInvitations() {
  return api.get<Invitation[]>("/api/invitations");
}

export async function respondToInvitation(id: string, payload: RespondPayload) {
  return api.post<Invitation>(`/api/invitations/${id}/respond`, payload);
}
