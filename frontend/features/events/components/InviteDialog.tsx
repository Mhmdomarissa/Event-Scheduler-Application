"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInviteToEvent } from "@/features/events/hooks";

const schema = z.object({
  emails: z
    .array(z.object({ value: z.string().email("Invalid email") }))
    .min(1, "Add at least one email"),
});

type FormValues = z.infer<typeof schema>;

interface InviteDialogProps {
  eventId: string;
  eventTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({
  eventId,
  eventTitle,
  open,
  onOpenChange,
}: InviteDialogProps) {
  const invite = useInviteToEvent(eventId);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { emails: [{ value: "" }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "emails" });

  const onSubmit = async (data: FormValues) => {
    const emails = data.emails.map((e) => e.value.trim()).filter(Boolean);
    try {
      await invite.mutateAsync({ emails });
      reset();
      onOpenChange(false);
    } catch {
      // error toasts handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4" />
            Invite to "{eventTitle}"
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Email addresses</Label>
            {fields.map((field, i) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  {...register(`emails.${i}.value`)}
                  className={errors.emails?.[i]?.value ? "border-destructive" : ""}
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => remove(i)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            {errors.emails && (
              <p className="text-xs text-destructive">
                {errors.emails.message ?? errors.emails.root?.message}
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ value: "" })}
            className="gap-1.5"
          >
            <Plus className="size-3.5" /> Add another email
          </Button>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending ? "Sending…" : "Send Invites"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
