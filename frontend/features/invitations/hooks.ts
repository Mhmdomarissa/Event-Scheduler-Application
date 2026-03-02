import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RespondPayload } from "@/types";
import { listInvitations, respondToInvitation } from "./services";

export const invitationKeys = {
  all: () => ["invitations"] as const,
};

export function useInvitations() {
  return useQuery({
    queryKey: invitationKeys.all(),
    queryFn: listInvitations,
  });
}

export function useRespondToInvitation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RespondPayload }) =>
      respondToInvitation(id, payload),
    onMutate: async ({ id, payload }) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: invitationKeys.all() });
      const prev = qc.getQueryData(invitationKeys.all());

      qc.setQueryData(invitationKeys.all(), (old: unknown) => {
        if (!old || typeof old !== "object" || !("data" in old)) return old;
        const data = old as { data: Array<{ id: string; status: string }> };
        return {
          ...data,
          data: data.data.map((inv) => (inv.id === id ? { ...inv, status: payload.status } : inv)),
        };
      });

      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(invitationKeys.all(), ctx.prev);
      toast.error(err instanceof Error ? err.message : "Failed to respond");
    },
    onSuccess: (_data, { payload }) => {
      qc.invalidateQueries({ queryKey: invitationKeys.all() });
      const labels: Record<string, string> = {
        attending: "You're attending!",
        maybe:     "Marked as maybe",
        declined:  "Declined successfully",
      };
      toast.success(labels[payload.status] ?? "Response saved");
    },
  });
}
