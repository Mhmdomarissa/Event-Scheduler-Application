"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCreateEvent, useUpdateEvent } from "../hooks";
import { useParseEvent } from "@/features/ai/hooks";
import { ApiError } from "@/lib/api";
import { ConflictDialog } from "./ConflictDialog";
import { formatDateTimeLocal, toISOLocal } from "@/lib/utils";
import type { Event } from "@/types";

// ─── Schema ────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    title:       z.string().min(2, "Title must be at least 2 characters").max(200),
    description: z.string().max(5000).optional(),
    location:    z.string().max(500).optional(),
    startAt:     z.string().min(1, "Start date is required"),
    endAt:       z.string().min(1, "End date is required"),
    visibility:  z.enum(["private", "shared"]).default("private"),
  })
  .refine((d) => new Date(d.startAt) < new Date(d.endAt), {
    message: "Start must be before end",
    path: ["startAt"],
  });

type FormValues = z.infer<typeof schema>;

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill data (for editing or AI suggestion pre-fill) */
  defaultValues?: Partial<FormValues>;
  /** When provided – update mode */
  editEvent?: Event;
}

export function EventFormDialog({ open, onOpenChange, defaultValues, editEvent }: EventFormDialogProps) {
  const isEdit = !!editEvent;
  const createMut = useCreateEvent();
  const updateMut = useUpdateEvent(editEvent?.id ?? "");
  const parseMut = useParseEvent();

  const [aiText, setAiText] = useState("");
  const [showAiInput, setShowAiInput] = useState(false);
  const [conflictError, setConflictError] = useState<Error | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      title: "",
      description: "",
      location: "",
      startAt: "",
      endAt: "",
      visibility: "private",
      ...defaultValues,
    },
  });

  // Sync defaultValues if they change externally (AI/suggestion pre-fill)
  useEffect(() => {
    if (defaultValues) form.reset({ ...form.getValues(), ...defaultValues });
  }, [defaultValues]); // eslint-disable-line react-hooks/exhaustive-deps

  // Seed edit form values
  useEffect(() => {
    if (editEvent) {
      form.reset({
        title: editEvent.title,
        description: editEvent.description ?? "",
        location: editEvent.location ?? "",
        startAt: formatDateTimeLocal(editEvent.startAt),
        endAt: formatDateTimeLocal(editEvent.endAt),
        visibility: editEvent.visibility,
      });
    }
  }, [editEvent, form]);

  const submit = async (values: FormValues, ignoreConflicts = false) => {
    const payload = {
      title: values.title,
      description: values.description || undefined,
      location: values.location || undefined,
      startAt: toISOLocal(values.startAt),
      endAt: toISOLocal(values.endAt),
      visibility: values.visibility,
      ...(ignoreConflicts && { ignoreConflicts: true }),
    };

    try {
      if (isEdit) {
        await updateMut.mutateAsync(payload);
      } else {
        await createMut.mutateAsync(payload);
      }
      form.reset();
      setShowAiInput(false);
      setConflictError(null);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.isConflict) {
        setConflictError(err);
      }
    }
  };

  const handleAiFill = async () => {
    if (!aiText.trim()) return;
    const res = await parseMut.mutateAsync(aiText);
    const parsed = res.data;

    const patch: Partial<FormValues> = {};
    if (parsed.title) patch.title = parsed.title;
    if (parsed.description) patch.description = parsed.description;
    if (parsed.location) patch.location = parsed.location;
    if (parsed.startAt) patch.startAt = formatDateTimeLocal(parsed.startAt);
    if (parsed.endAt) patch.endAt = formatDateTimeLocal(parsed.endAt);

    form.reset({ ...form.getValues(), ...patch });
    setShowAiInput(false);
    setAiText("");
    toast.success("Form filled from AI parse");
  };

  const pending = createMut.isPending || updateMut.isPending;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!pending) {
            onOpenChange(v);
            if (!v) { form.reset(); setShowAiInput(false); }
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Event" : "Create Event"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Update your event details below." : "Fill in the details to create a new event."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => submit(v))} className="space-y-4">
              {/* AI fill section */}
              {!isEdit && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                      <Sparkles className="size-3.5" /> AI Fill from text
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-primary"
                      onClick={() => setShowAiInput(!showAiInput)}
                    >
                      {showAiInput ? "Close" : "Open"}
                    </Button>
                  </div>
                  {showAiInput && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder='e.g. "Team standup tomorrow at 9am for 30 minutes in the main office"'
                        value={aiText}
                        onChange={(e) => setAiText(e.target.value)}
                        className="text-sm min-h-16 resize-none"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleAiFill}
                        disabled={parseMut.isPending || !aiText.trim()}
                        className="w-full"
                      >
                        {parseMut.isPending ? (
                          <><Loader2 className="size-3.5 mr-1.5 animate-spin" /> Parsing…</>
                        ) : (
                          <><Sparkles className="size-3.5 mr-1.5" /> Fill form</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl><Input placeholder="Weekly team sync" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="startAt" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start *</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endAt" render={({ field }) => (
                  <FormItem>
                    <FormLabel>End *</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl><Input placeholder="Conference room, Zoom link, …" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add notes or agenda…" className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="visibility" render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="shared">Shared</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <Separator />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending && <Loader2 className="size-4 mr-2 animate-spin" />}
                  {isEdit ? "Save changes" : "Create event"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Conflict dialog */}
      {conflictError && (
        <ConflictDialog
          open={!!conflictError}
          message={conflictError.message}
          onIgnore={() => {
            setConflictError(null);
            submit(form.getValues(), true);
          }}
          onCancel={() => setConflictError(null)}
        />
      )}
    </>
  );
}
