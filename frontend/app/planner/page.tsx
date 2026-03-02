"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Clock4, CalendarPlus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EventFormDialog } from "@/features/events/components/EventFormDialog";
import { useSuggestTimes } from "@/features/ai/hooks";
import type { SuggestedTimeSlot } from "@/types";

const schema = z.object({
  title: z.string().min(3, "Event title is required"),
  duration: z.string().min(1, "Required"),
  dateRangeStart: z.string().min(1, "Start date is required"),
  dateRangeEnd: z.string().min(1, "End date is required"),
  timezone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function PlannerPage() {
  const suggestTimes = useSuggestTimes();
  const [slots, setSlots] = useState<SuggestedTimeSlot[]>([]);
  const [prefillSlot, setPrefillSlot] = useState<SuggestedTimeSlot | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      duration: "60",
      dateRangeStart: new Date().toISOString().slice(0, 10),
      dateRangeEnd: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    },
  });

  const onSubmit = async (data: FormValues) => {
    const duration = parseInt(data.duration, 10);
    if (isNaN(duration) || duration < 15 || duration > 480) {
      return;
    }
    const result = await suggestTimes.mutateAsync({
      title: data.title,
      durationMinutes: duration,
      dateRangeStart: new Date(data.dateRangeStart).toISOString(),
      dateRangeEnd: new Date(data.dateRangeEnd + "T23:59:59").toISOString(),
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    if (result?.data) setSlots(result.data);
  };

  const openCreateFromSlot = (slot: SuggestedTimeSlot) => {
    setPrefillSlot(slot);
    setDialogOpen(true);
  };

  return (
    <AppShell>
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
        <PageHeader
          icon={<Sparkles className="size-5 text-primary" />}
          title="AI Planner"
          description="Describe your event and get AI-suggested time slots"
        />

        {/* Input form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tell us about your event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Event title</Label>
                <Input
                  placeholder='e.g. "Team sync" or "Client demo"'
                  {...register("title")}
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min={15}
                    max={480}
                    {...register("duration")}
                    className={errors.duration ? "border-destructive" : ""}
                  />
                  {errors.duration && (
                    <p className="text-xs text-destructive">{errors.duration.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Range start</Label>
                  <Input type="date" {...register("dateRangeStart")} />
                </div>

                <div className="space-y-1.5">
                  <Label>Range end</Label>
                  <Input type="date" {...register("dateRangeEnd")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Timezone (optional)</Label>
                <Input placeholder="America/New_York" {...register("timezone")} />
              </div>

              <Button
                type="submit"
                disabled={suggestTimes.isPending}
                className="w-full sm:w-auto"
              >
                {suggestTimes.isPending ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="size-4 mr-2" /> Suggest Times</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {slots.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock4 className="size-4" />
              Suggested time slots
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {slots.map((slot, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4 space-y-3">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">
                        {format(new Date(slot.startAt), "EEEE, MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock4 className="size-3" />
                        {format(new Date(slot.startAt), "h:mm a")} –{" "}
                        {format(new Date(slot.endAt), "h:mm a")}
                      </p>
                    </div>

                    {slot.explanation && (
                      <p className="text-xs text-muted-foreground">
                        {slot.explanation}
                      </p>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => openCreateFromSlot(slot)}
                    >
                      <CalendarPlus className="size-3.5 mr-1.5" />
                      Create event from this slot
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pre-filled event dialog */}
      <EventFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setPrefillSlot(null);
        }}
        defaultValues={
          prefillSlot
            ? {
                startAt: prefillSlot.startAt,
                endAt: prefillSlot.endAt,
              }
            : undefined
        }
      />
    </AppShell>
  );
}
