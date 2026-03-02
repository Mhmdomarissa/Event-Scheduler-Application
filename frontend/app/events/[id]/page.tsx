"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Globe,
  Lock,
  Pencil,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { EventFormDialog } from "@/features/events/components/EventFormDialog";
import { InviteDialog } from "@/features/events/components/InviteDialog";
import { useEvent, useAttendees, useDeleteEvent } from "@/features/events/hooks";
import { useAuth } from "@/features/auth/AuthProvider";
import { statusConfig, rsvpConfig } from "@/lib/utils";
import { toast } from "sonner";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const { data: eventData, isLoading: eventLoading, isError: eventError } = useEvent(id);
  const { data: attendeesData, isLoading: attendeesLoading } = useAttendees(id);
  const deleteEvent = useDeleteEvent();

  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const event = eventData?.data;
  const attendees = attendeesData?.data ?? [];
  const isOwner = user?.id === (typeof event?.createdBy === "string" ? event.createdBy : event?.createdBy?.id);

  const handleDelete = async () => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    try {
      await deleteEvent.mutateAsync(id);
      toast.success("Event deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete event");
    }
  };

  if (eventLoading) return <AppShell><div className="p-8"><LoadingSkeleton variant="page" /></div></AppShell>;
  if (eventError || !event) return <AppShell><ErrorMessage error={new Error("Event not found")} /></AppShell>;

  const { label: statusLabel, color: statusColor } = statusConfig[
    (event.lifecycle ?? "upcoming") as keyof typeof statusConfig
  ] ?? statusConfig.upcoming;

  return (
    <AppShell>
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="size-4 mr-1" /> Back
            </Link>
          </Button>

          {isOwner && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus className="size-4 mr-1.5" /> Invite
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4 mr-1.5" /> Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteEvent.isPending}
              >
                <Trash2 className="size-4 mr-1.5" /> Delete
              </Button>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={statusColor}>{statusLabel}</Badge>
            <Badge variant="outline" className="gap-1">
              {event.visibility === "shared" ? (
                <><Globe className="size-3" /> Shared</>
              ) : (
                <><Lock className="size-3" /> Private</>
              )}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          {event.description && (
            <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
              {event.description}
            </p>
          )}
        </div>

        <Separator />

        {/* Meta */}
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <CalendarDays className="size-4 shrink-0" />
            <span>{format(new Date(event.startAt), "EEEE, MMMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Clock className="size-4 shrink-0" />
            <span>
              {format(new Date(event.startAt), "h:mm a")} –{" "}
              {format(new Date(event.endAt), "h:mm a")}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Attendees */}
        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="size-4" /> Attendees ({attendees.length})
          </h2>

          {attendeesLoading && <LoadingSkeleton variant="row" rows={3} />}

          {!attendeesLoading && attendees.length === 0 && (
            <p className="text-sm text-muted-foreground">No attendees yet.</p>
          )}

          {!attendeesLoading && attendees.length > 0 && (
            <div className="space-y-2">
              {attendees.map((a) => {
                const rsvp = rsvpConfig[(a.status ?? "invited") as keyof typeof rsvpConfig] ??
                  rsvpConfig.invited;
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {(a.email ?? "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs text-muted-foreground">{a.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs ${rsvp.color}`}>
                      {rsvp.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isOwner && (
        <>
          <EventFormDialog
            editEvent={event}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <InviteDialog
            eventId={id}
            eventTitle={event.title}
            open={inviteOpen}
            onOpenChange={setInviteOpen}
          />
        </>
      )}
    </AppShell>
  );
}
